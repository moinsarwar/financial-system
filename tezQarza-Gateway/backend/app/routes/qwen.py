from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

@router.post("/qwen-chat")
async def qwen_chat(req: ChatRequest):
    api_key = os.environ.get("QWEN_API_KEY", "dummy_key")
    base_url = os.environ.get("QWEN_BASE_URL", "http://localhost:8000/v1")
    model = os.environ.get("QWEN_MODEL", "Qwen/Qwen2.5-7B-Instruct")
    
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": req.messages,
        "temperature": 0.7,
        "max_tokens": 1200
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=30.0)
            resp.raise_for_status()
            data = resp.json()
            return data
    except Exception as e:
        logger.error(f"Qwen API error: {e}")
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": f"Connection failed: {str(e)} | URL: {url} | payload: {payload}"
                }
            }]
        }
