import re

# Update main.py
with open('/root/financial-system/services/mode_control/main.py', 'r') as f:
    content = f.read()

new_routes = """
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
"""

pattern = re.compile(r'@app\.post\("/sessions"\).*?(?=\nif __name__ == "__main__":)', re.DOTALL)
content = pattern.sub(new_routes.strip() + '\n\n', content)

with open('/root/financial-system/services/mode_control/main.py', 'w') as f:
    f.write(content)

# Update ingress.yaml
with open('/root/financial-system/k8s/ingress.yaml', 'r') as f:
    ingress_content = f.read()

ingress_addition = """      - path: /mode
        pathType: Prefix
        backend:
          service:
            name: mode-control
            port:
              number: 8006
"""

if "/mode" not in ingress_content:
    ingress_content = ingress_content.replace('      - path: /reset_intent', ingress_addition + '      - path: /reset_intent')
    with open('/root/financial-system/k8s/ingress.yaml', 'w') as f:
        f.write(ingress_content)
