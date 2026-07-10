from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis
import json
import logging
import os
import uuid
import time

app = FastAPI(title="Journey Service", version="5.2")
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

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "info_control-service", "version": "5.2", "timestamp": time.time()}

class ShouldCollectRequest(BaseModel):
    session_id: str
    field_name: str

@app.post("/should_collect")
async def should_collect(req: ShouldCollectRequest):
    data = redis_client.get(f"session:{req.session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    session = json.loads(data)
    
    collected_fields = session.get("collected_fields", {})
    if req.field_name in collected_fields:
        return {"should_collect": False, "reason": "already_collected"}
    
    return {"should_collect": True, "reason": "missing"}

class MarkCollectedRequest(BaseModel):
    session_id: str
    field_name: str
    value: str

@app.post("/mark_collected")
async def mark_collected(req: MarkCollectedRequest):
    data = redis_client.get(f"session:{req.session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    session = json.loads(data)
    
    if "collected_fields" not in session:
        session["collected_fields"] = {}
        
    session["collected_fields"][req.field_name] = req.value
    redis_client.setex(f"session:{req.session_id}", 3600, json.dumps(session))
    
    return {"status": "success", "field_name": req.field_name, "value": req.value}

class ResetIntentRequest(BaseModel):
    session_id: str
    new_intent: dict

@app.post("/reset_intent")
async def reset_intent(req: ResetIntentRequest):
    data = redis_client.get(f"session:{req.session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    session = json.loads(data)
    
    session["current_intent"] = req.new_intent
    redis_client.setex(f"session:{req.session_id}", 3600, json.dumps(session))
    
    return {"status": "intent_reset", "new_intent": req.new_intent}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
