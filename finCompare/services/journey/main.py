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
    return {"status": "ok", "service": "journey-service", "version": "5.2", "timestamp": time.time()}

class CreateSessionRequest(BaseModel):
    mode: str = "marketplace"
    primary_jurisdiction: str = "PK"
    user_id: str = "anonymous"

@app.post("/sessions")
async def create_session(request: CreateSessionRequest = None):
    req = request or CreateSessionRequest()
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    session_data = {
        "session_id": session_id,
        "mode": req.mode,
        "primary_jurisdiction": req.primary_jurisdiction,
        "user_id": req.user_id,
        "stage": "entry",
        "created_at": time.time()
    }
    redis_client.setex(f"session:{session_id}", 3600, json.dumps(session_data))
    return session_data

@app.get("/sessions/{session_id}/state")
async def get_session_state(session_id: str):
    data = redis_client.get(f"session:{session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    return json.loads(data)

class UpdateStageRequest(BaseModel):
    new_stage: str

@app.patch("/sessions/{session_id}/stage")
async def update_stage(session_id: str, request: UpdateStageRequest):
    data = redis_client.get(f"session:{session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    session = json.loads(data)
    session['stage'] = request.new_stage
    redis_client.setex(f"session:{session_id}", 3600, json.dumps(session))
    return session

class EscalateRequest(BaseModel):
    reason: str

@app.post("/sessions/{session_id}/escalate")
async def escalate_session(session_id: str, request: EscalateRequest):
    data = redis_client.get(f"session:{session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    session = json.loads(data)
    session['escalated'] = True
    session['escalation_reason'] = request.reason
    session['stage'] = "human_handoff"
    redis_client.setex(f"session:{session_id}", 3600, json.dumps(session))
    return {"status": "escalated", "session_id": session_id, "reason": request.reason}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
