from typing import Any

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    action: str | None = None
    params: dict[str, Any] | None = None
    stream: bool = False


class ChatResponse(BaseModel):
    reply: str
    action: str | None = None
    data_ok: bool | None = None
    data_preview: Any | None = None


class ActionRequest(BaseModel):
    action: str
    params: dict[str, Any] | None = None
