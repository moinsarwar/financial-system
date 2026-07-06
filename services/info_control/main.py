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

@app.post("/sessions")
async def create_session():
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    return {"session_id": session_id, "stage": "entry"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
