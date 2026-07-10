from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis
import json
import logging
import os
import uuid
import time

app = FastAPI(title="Audit Service", version="5.2")
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
    return {"status": "ok", "service": "audit-service", "version": "5.2", "timestamp": time.time()}

class LogEventRequest(BaseModel):
    event_type: str
    session_id: str
    mode: str = None
    event_data: dict = {}

@app.post("/log_event")
async def log_event(req: LogEventRequest):
    event_id = f"evt_{uuid.uuid4().hex[:8]}"
    event_record = {
        "event_id": event_id,
        "event_type": req.event_type,
        "session_id": req.session_id,
        "mode": req.mode,
        "event_data": req.event_data,
        "timestamp": time.time()
    }
    # Store in a list in Redis for demo purposes
    redis_client.lpush(f"audit_logs:{req.session_id}", json.dumps(event_record))
    return {"status": "logged", "event_id": event_id}

class QueryAuditRequest(BaseModel):
    session_id: str
    start_time: str = None
    end_time: str = None
    event_types: list = []
    limit: int = 100

@app.post("/query_audit")
async def query_audit(req: QueryAuditRequest):
    logs = redis_client.lrange(f"audit_logs:{req.session_id}", 0, req.limit - 1)
    parsed_logs = [json.loads(log) for log in logs]
    
    if req.event_types:
        parsed_logs = [log for log in parsed_logs if log["event_type"] in req.event_types]
        
    return {"status": "success", "count": len(parsed_logs), "logs": parsed_logs}

class ExportReportRequest(BaseModel):
    date_range: dict
    format: str = "json"

@app.post("/export_compliance_report")
async def export_report(req: ExportReportRequest):
    return {
        "status": "success",
        "report_url": f"https://storage.financial-system.internal/reports/compliance_{int(time.time())}.{req.format}"
    }

@app.delete("/data/session/{session_id}")
async def gdpr_deletion(session_id: str):
    # Delete all session data and audit logs
    redis_client.delete(f"session:{session_id}")
    redis_client.delete(f"audit_logs:{session_id}")
    
    return {
        "status": "deleted", 
        "message": f"GDPR deletion successful for session {session_id}"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
