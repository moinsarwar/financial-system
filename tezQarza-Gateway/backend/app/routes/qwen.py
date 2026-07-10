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
    # Use Ollama base URL, defaulting to the remote server IP
    base_url = os.environ.get("QWEN_BASE_URL", "http://163.245.222.160:11434")
    model = os.environ.get("QWEN_MODEL", "qwen2.5:0.5b")
    
    url = f"{base_url.rstrip('/')}/api/chat"
    payload = {
        "model": model,
        "messages": req.messages,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=20.0)
            resp.raise_for_status()
            data = resp.json()
            
            # Ollama returns {"message": {"role": "assistant", "content": "..."}}
            # Let's map it to OpenAI format so the frontend doesn't break
            return {
                "choices": [{
                    "message": data.get("message", {})
                }]
            }
    except httpx.TimeoutException:
        logger.error("Qwen API Timeout")
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": "Maazrat, server is waqt thora masroof hai aur jawab aane mein dair ho rahi hai. Baraye meharbani thori dair baad dobara koshish karein."
                }
            }]
        }
    except Exception as e:
        logger.error(f"Qwen API error: {e}")
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": "Maazrat, system mein kuch masla pesh aya hai. Hum isay jaldi theek karne ki koshish kar rahe hain."
                }
            }]
        }
