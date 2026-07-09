import re
with open('/root/financial-system/services/journey/main.py', 'r') as f:
    content = f.read()

new_routes = """
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
"""

# Replace the existing create_session with the new full implementation
pattern = re.compile(r'@app\.post\("/sessions"\).*?(?=\nif __name__ == "__main__":)', re.DOTALL)
content = pattern.sub(new_routes.strip() + '\n\n', content)

with open('/root/financial-system/services/journey/main.py', 'w') as f:
    f.write(content)
