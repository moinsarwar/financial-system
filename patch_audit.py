import re

# Update main.py
with open('/root/financial-system/services/audit/main.py', 'r') as f:
    content = f.read()

new_routes = """
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
"""

pattern = re.compile(r'@app\.post\("/query_audit"\).*?(?=\nif __name__ == "__main__":)', re.DOTALL)
content = pattern.sub(new_routes.strip() + '\n\n', content)

with open('/root/financial-system/services/audit/main.py', 'w') as f:
    f.write(content)

# Update ingress.yaml
with open('/root/financial-system/k8s/ingress.yaml', 'r') as f:
    ingress_content = f.read()

ingress_addition = """      - path: /log_event
        pathType: Prefix
        backend:
          service:
            name: audit-service
            port:
              number: 8007
      - path: /export_compliance_report
        pathType: Prefix
        backend:
          service:
            name: audit-service
            port:
              number: 8007
      - path: /data/session
        pathType: Prefix
        backend:
          service:
            name: audit-service
            port:
              number: 8007
"""

if "/log_event" not in ingress_content:
    ingress_content = ingress_content.replace('      - path: /provider/ingest', ingress_addition + '      - path: /provider/ingest')
    with open('/root/financial-system/k8s/ingress.yaml', 'w') as f:
        f.write(ingress_content)
