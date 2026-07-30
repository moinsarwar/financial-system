from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.schemas import ActionRequest, ChatRequest, ChatResponse
from app.services.data import QUICK_ACTIONS, data_service, format_context_block
from app.services.ollama import ollama_service

router = APIRouter(prefix="/api")


@router.get("/actions")
async def list_actions() -> dict[str, Any]:
    return {"actions": QUICK_ACTIONS, "mode": "read_only"}


@router.post("/data")
async def fetch_data(body: ActionRequest) -> dict[str, Any]:
    """Fetch read-only data without calling the LLM (for UI tables/previews)."""
    result = await data_service.run_action(body.action, body.params)
    return {"action": body.action, **result}


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    context = None
    data_ok = None
    data_preview = None
    action = body.action

    if action:
        result = await data_service.run_action(action, body.params)
        data_ok = bool(result.get("ok"))
        data_preview = result.get("data") if data_ok else {"error": result.get("error")}
        context = format_context_block(action, result)

    history = [{"role": m.role, "content": m.content} for m in body.history[-12:]]

    try:
        reply = await ollama_service.chat(body.message, history=history, context=context)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Ollama error: {exc}") from exc

    return ChatResponse(
        reply=reply,
        action=action,
        data_ok=data_ok,
        data_preview=data_preview,
    )


@router.post("/chat/stream")
async def chat_stream(body: ChatRequest):
    context = None
    meta: dict[str, Any] = {"action": body.action}

    if body.action:
        result = await data_service.run_action(body.action, body.params)
        meta["data_ok"] = bool(result.get("ok"))
        meta["data_preview"] = result.get("data") if result.get("ok") else {"error": result.get("error")}
        context = format_context_block(body.action, result)

    history = [{"role": m.role, "content": m.content} for m in body.history[-12:]]

    async def event_gen():
        yield {"event": "meta", "data": json.dumps(meta, default=str)}
        try:
            async for token in ollama_service.chat_stream(
                body.message, history=history, context=context
            ):
                yield {"event": "token", "data": json.dumps({"token": token})}
            yield {"event": "done", "data": "{}"}
        except Exception as exc:  # noqa: BLE001
            yield {"event": "error", "data": json.dumps({"error": str(exc)})}

    return EventSourceResponse(event_gen())
