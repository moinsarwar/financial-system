from __future__ import annotations

import json
from typing import Any, AsyncIterator

import httpx

from app.config import settings
from app.services.data import SYSTEM_PROMPT


class OllamaService:
    def __init__(self) -> None:
        self.base = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.timeout = settings.ollama_timeout

    async def health(self) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base}/api/tags")
                resp.raise_for_status()
                models = [m.get("name") for m in resp.json().get("models", [])]
                return {
                    "ok": True,
                    "base_url": self.base,
                    "configured_model": self.model,
                    "models": models,
                    "model_present": any(self.model in (m or "") for m in models),
                }
        except Exception as exc:  # noqa: BLE001
            return {
                "ok": False,
                "base_url": self.base,
                "configured_model": self.model,
                "error": str(exc),
            }

    def _messages(
        self,
        user_message: str,
        history: list[dict[str, str]] | None = None,
        context: str | None = None,
    ) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if context:
            messages.append({"role": "system", "content": context})
        # Keep history short — 0.5b loses accuracy with long context
        for item in (history or [])[-4:]:
            role = item.get("role")
            content = item.get("content")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content[:1500]})
        messages.append({"role": "user", "content": user_message})
        return messages

    def _options(self) -> dict[str, Any]:
        return {
            "temperature": 0.2,
            "top_p": 0.85,
            "repeat_penalty": 1.15,
            "num_predict": 900,
        }

    async def chat(
        self,
        user_message: str,
        history: list[dict[str, str]] | None = None,
        context: str | None = None,
    ) -> str:
        payload = {
            "model": self.model,
            "messages": self._messages(user_message, history, context),
            "stream": False,
            "options": self._options(),
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(f"{self.base}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content") or data.get("response") or ""

    async def chat_stream(
        self,
        user_message: str,
        history: list[dict[str, str]] | None = None,
        context: str | None = None,
    ) -> AsyncIterator[str]:
        payload = {
            "model": self.model,
            "messages": self._messages(user_message, history, context),
            "stream": True,
            "options": self._options(),
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream("POST", f"{self.base}/api/chat", json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    token = chunk.get("message", {}).get("content") or ""
                    if token:
                        yield token
                    if chunk.get("done"):
                        break


ollama_service = OllamaService()
