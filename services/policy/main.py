from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis
import json
import logging
import os
from kafka import KafkaProducer
import uuid
from typing import Dict, Optional, List
import time

app = FastAPI(title="Policy Service", version="5.2")

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

producer = KafkaProducer(
    bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092'),
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

class PolicyCheck(BaseModel):
    session_id: str
    product_id: str
    mode: str

class ProductQuery(BaseModel):
    session_id: str
    filters: Dict[str, str]
    mode: str

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "policy-service", 
        "version": "5.2",
        "timestamp": time.time()
    }

@app.post("/policy/check")
async def check_policy(request: PolicyCheck):
    try:
        session_data = redis_client.get(f"session:{request.session_id}")
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = json.loads(session_data)
        current_mode = session.get('mode', 'marketplace')
        
        if current_mode == "marketplace":
            return {
                "allowed": True,
                "reason": "Marketplace mode - product available for comparison",
                "constraints": {"no_ranking": True, "no_recommendation": True}
            }
        elif current_mode == "advisory":
            has_license = redis_client.get(f"license:{request.session_id}")
            if has_license and has_license == "advisory":
                return {
                    "allowed": True,
                    "reason": "Advisory mode - recommendation allowed",
                    "constraints": {"can_recommend": True}
                }
            else:
                return {
                    "allowed": False,
                    "reason": "Advisory mode requires license",
                    "constraints": {}
                }
        else:
            return {
                "allowed": False,
                "reason": f"Unknown mode: {current_mode}",
                "constraints": {}
            }
    except Exception as e:
        logger.error(f"Policy check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/products/query")
async def query_products(query: ProductQuery):
    try:
        products = [
            {
                "product_id": f"PROD_{i}",
                "provider_id": f"PROVIDER_{i % 3}",
                "product_type": "savings" if i % 2 == 0 else "insurance",
                "price": 100 + (i * 50),
                "jurisdiction": ["PK"]
            }
            for i in range(5)
        ]
        
        audit_event = {
            "event_type": "product_query",
            "session_id": query.session_id,
            "mode": query.mode,
            "timestamp": str(uuid.uuid4())
        }
        producer.send('audit-events', audit_event)
        
        return {
            "products": products,
            "total": len(products),
            "mode": query.mode,
            "disclaimer": "This is a marketplace comparison. No recommendation is provided."
        }
    except Exception as e:
        logger.error(f"Product query error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

class ModeAction(BaseModel):
    mode: str
    action: str

@app.post("/validate_mode_action")
async def validate_mode_action(request: ModeAction):
    if request.mode == "marketplace":
        if request.action in ["rank", "recommend"]:
            return {"allowed": False, "reason": f"Action '{request.action}' not allowed in marketplace mode."}
        return {"allowed": True}
    elif request.mode == "advisory":
        return {"allowed": True}
    return {"allowed": False, "reason": "Unknown mode"}

class EvaluateOutputRequest(BaseModel):
    mode: str
    output_text: str
    product_list: List[str]

@app.post("/evaluate_output")
async def evaluate_output(request: EvaluateOutputRequest):
    if request.mode == "marketplace":
        forbidden_words = ["best", "recommend", "should buy", "advice"]
        text_lower = request.output_text.lower()
        for word in forbidden_words:
            if word in text_lower:
                return {"is_compliant": False, "reason": "Marketplace mode cannot provide recommendations."}
        return {"is_compliant": True}
    return {"is_compliant": True}
