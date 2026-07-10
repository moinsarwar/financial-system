from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis
import json
import logging
import os
import uuid
import re
from typing import Dict, List
import time
import httpx
import asyncio

app = FastAPI(title="Agent Service", version="5.2")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ FIX: Parse Redis URL properly
def get_redis_connection():
    redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
    if redis_url.startswith('redis://'):
        return redis.Redis.from_url(redis_url, decode_responses=True)
    
    redis_host = os.getenv('REDIS_HOST', 'redis')
    redis_port = int(os.getenv('REDIS_PORT', 6379))
    redis_password = os.getenv('REDIS_PASSWORD', 'redis123')
    
    return redis.Redis(
        host=redis_host,
        port=redis_port,
        password=redis_password,
        decode_responses=True
    )

redis_client = get_redis_connection()

class IntentRequest(BaseModel):
    session_id: str
    user_input: str

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "agent-service", 
        "version": "5.2",
        "timestamp": time.time()
    }

@app.post("/parse_intent")
async def parse_intent(request: IntentRequest):
    try:
        session_data = redis_client.get(f"session:{request.session_id}")
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = json.loads(session_data)
        
        intent = "marketplace_query"
        entities = {}
        
        # Call Qwen via Ollama
        base_url = os.environ.get("OLLAMA_BASE_URL", "http://163.245.222.160:11434")
        url = f"{base_url.rstrip('/')}/api/chat"
        prompt = f"Analyze this text: '{request.user_input}'. Return ONLY a JSON object with 'intent' (one of: health_insurance_query, savings_query, investment_query, marketplace_query) and 'entities' (e.g. {{'type': 'health_insurance', 'max_price': 5000}})."
        
        payload = {
            "model": "qwen2.5:0.5b",
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=payload, timeout=10.0)
                resp.raise_for_status()
                data = resp.json()
                content = data.get("message", {}).get("content", "")
                parsed = json.loads(content)
                intent = parsed.get("intent", "marketplace_query")
                entities = parsed.get("entities", {})
                logger.info(f"Qwen parsed intent: {intent}, entities: {entities}")
        except Exception as e:
            logger.warning(f"Qwen intent parsing failed, falling back to regex: {e}")
            # Fallback logic
            if "health" in request.user_input.lower() and "insurance" in request.user_input.lower():
                intent = "health_insurance_query"
                entities["type"] = "health_insurance"
            elif "saving" in request.user_input.lower() or "savings" in request.user_input.lower():
                intent = "savings_query"
                entities["type"] = "savings"
            elif "invest" in request.user_input.lower():
                intent = "investment_query"
                entities["type"] = "investment"
            
            price_match = re.search(r'(\d+)\s*PKR', request.user_input)
            if price_match:
                entities["max_price"] = int(price_match.group(1))
        
        task_graph = [
            {"step": 1, "action": "validate_session", "params": {}},
            {"step": 2, "action": "query_products", "params": {"intent": intent, **entities}},
            {"step": 3, "action": "apply_filters", "params": entities},
            {"step": 4, "action": "display_results", "params": {"mode": session.get('mode', 'marketplace')}}
        ]
        
        session['stage'] = 'intent_parsed'
        session['intent'] = intent
        session['entities'] = entities
        session['task_graph'] = task_graph
        redis_client.setex(
            f"session:{request.session_id}",
            3600,
            json.dumps(session)
        )
        
        return {
            "session_id": request.session_id,
            "intent": intent,
            "entities": entities,
            "task_graph": task_graph,
            "stage": "intent_parsed"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Intent parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ToolStep(BaseModel):
    tool: str
    params: Dict

class ExecuteToolsRequest(BaseModel):
    session_id: str
    mode: str
    steps: List[ToolStep]

@app.post("/execute_tools")
async def execute_tools(request: ExecuteToolsRequest):
    try:
        session_data = redis_client.get(f"session:{request.session_id}")
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        results = []
        for step in request.steps:
            results.append({
                "tool": step.tool,
                "status": "success",
                "result": f"Executed {step.tool} successfully"
            })
            
        return {
            "session_id": request.session_id,
            "status": "completed",
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Execution error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

@app.post("/chat")
async def chat_with_qwen(req: ChatRequest):
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://163.245.222.160:11434")
    url = f"{base_url.rstrip('/')}/api/chat"
    payload = {
        "model": "qwen2.5:0.5b",
        "messages": req.messages,
        "stream": False
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=20.0)
            resp.raise_for_status()
            data = resp.json()
            return {
                "choices": [{
                    "message": data.get("message", {})
                }]
            }
    except httpx.TimeoutException:
        return {
            "choices": [{"message": {"role": "assistant", "content": "Maazrat, agent timeout ho gaya hai. Dobara koshish karein."}}]
        }
    except Exception as e:
        return {
            "choices": [{"message": {"role": "assistant", "content": "Maazrat, system connection error."}}]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
