import re

# Update main.py
with open('/root/financial-system/services/info_control/main.py', 'r') as f:
    content = f.read()

new_routes = """
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
"""

pattern = re.compile(r'@app\.post\("/sessions"\).*?(?=\nif __name__ == "__main__":)', re.DOTALL)
content = pattern.sub(new_routes.strip() + '\n\n', content)

with open('/root/financial-system/services/info_control/main.py', 'w') as f:
    f.write(content)

# Update ingress.yaml
with open('/root/financial-system/k8s/ingress.yaml', 'r') as f:
    ingress_content = f.read()

ingress_addition = """      - path: /should_collect
        pathType: Prefix
        backend:
          service:
            name: info-control
            port:
              number: 8005
      - path: /mark_collected
        pathType: Prefix
        backend:
          service:
            name: info-control
            port:
              number: 8005
      - path: /reset_intent
        pathType: Prefix
        backend:
          service:
            name: info-control
            port:
              number: 8005
"""

if "/should_collect" not in ingress_content:
    ingress_content = ingress_content.replace('      - path: /evaluate_output', ingress_addition + '      - path: /evaluate_output')
    with open('/root/financial-system/k8s/ingress.yaml', 'w') as f:
        f.write(ingress_content)
