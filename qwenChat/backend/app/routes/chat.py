from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.schemas import ActionRequest, ChatRequest, ChatResponse
from app.services.data import (
    QUICK_ACTIONS,
    build_user_message,
    data_service,
    format_context_block,
)
from app.services.ollama import ollama_service

router = APIRouter(prefix="/api")


def _preview_from_result(result: dict[str, Any]) -> Any:
    if not result.get("ok"):
        return {"error": result.get("error")}
    return {
        "facts": result.get("facts"),
        "facts_markdown": result.get("facts_markdown"),
        "source": result.get("source"),
    }


@router.get("/actions")
async def list_actions() -> dict[str, Any]:
    return {"actions": QUICK_ACTIONS, "mode": "read_only"}


@router.post("/data")
async def fetch_data(body: ActionRequest) -> dict[str, Any]:
    """Fetch read-only data + facts (no LLM)."""
    result = await data_service.run_action(body.action, body.params)
    return {
        "action": body.action,
        "ok": result.get("ok"),
        "source": result.get("source"),
        "error": result.get("error"),
        "facts": result.get("facts"),
        "facts_markdown": result.get("facts_markdown"),
        "data": result.get("data_preview") or result.get("data"),
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    context = None
    data_ok = None
    data_preview = None
    action = body.action

    if action:
        result = await data_service.run_action(action, body.params)
        data_ok = bool(result.get("ok"))
        data_preview = _preview_from_result(result)
        context = format_context_block(action, result)

    history = [{"role": m.role, "content": m.content} for m in body.history[-4:]]
    user_msg = build_user_message(body.message, has_facts=bool(context))

    try:
        reply = await ollama_service.chat(user_msg, history=history, context=context)
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
        meta["data_preview"] = _preview_from_result(result)
        context = format_context_block(body.action, result)

    history = [{"role": m.role, "content": m.content} for m in body.history[-4:]]
    user_msg = build_user_message(body.message, has_facts=bool(context))

    async def event_gen():
        yield {"event": "meta", "data": json.dumps(meta, default=str)}
        try:
            async for token in ollama_service.chat_stream(
                user_msg, history=history, context=context
            ):
                yield {"event": "token", "data": json.dumps({"token": token})}
            yield {"event": "done", "data": json.dumps({"source": "qwen"})}
        except Exception as exc:  # noqa: BLE001
            yield {"event": "error", "data": json.dumps({"error": str(exc)})}

    return EventSourceResponse(event_gen())
