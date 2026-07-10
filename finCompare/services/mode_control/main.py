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
    return {"status": "ok", "service": "mode_control-service", "version": "5.2", "timestamp": time.time()}

@app.get("/mode/{session_id}")
async def get_current_mode(session_id: str):
    data = redis_client.get(f"session:{session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    session = json.loads(data)
    
    return {
        "session_id": session_id,
        "current_mode": session.get("mode", "unknown"),
        "locked": session.get("mode_locked", False)
    }

class ValidateTransitionRequest(BaseModel):
    session_id: str
    requested_mode: str
    transition_reason: str = None
    user_consent: bool = False
    approver_id: str = None

@app.post("/mode/validate_transition")
async def validate_transition(req: ValidateTransitionRequest):
    data = redis_client.get(f"session:{req.session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    session = json.loads(data)
    
    if session.get("mode_locked"):
        return {"status": "rejected", "reason": "mode_locked"}
        
    session["mode"] = req.requested_mode
    redis_client.setex(f"session:{req.session_id}", 3600, json.dumps(session))
    
    return {
        "status": "approved",
        "new_mode": req.requested_mode,
        "reason": req.transition_reason
    }

class LockModeRequest(BaseModel):
    session_id: str

@app.post("/mode/lock")
async def lock_mode(req: LockModeRequest):
    data = redis_client.get(f"session:{req.session_id}")
    if not data:
        raise HTTPException(status_code=404, detail="Not Found")
    session = json.loads(data)
    
    session["mode_locked"] = True
    redis_client.setex(f"session:{req.session_id}", 3600, json.dumps(session))
    
    return {"status": "locked", "mode": session.get("mode")}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
