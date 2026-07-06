from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis
import json
import logging
import os
from kafka import KafkaProducer
import uuid
from typing import List, Dict, Optional
import time
import re

app = FastAPI(title="PIL Service", version="5.2")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ FIX: Parse Redis URL properly
def get_redis_connection():
    redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
    # If REDIS_URL is set, use it directly
    if redis_url.startswith('redis://'):
        return redis.Redis.from_url(redis_url, decode_responses=True)
    
    # Otherwise construct from individual env vars
    redis_host = os.getenv('REDIS_HOST', 'redis')
    redis_port = int(os.getenv('REDIS_PORT', 6379))
    redis_password = os.getenv('REDIS_PASSWORD', 'redis123')
    
    return redis.Redis(
        host=redis_host,
        port=redis_port,
        password=redis_password,
        decode_responses=True
    )

# Initialize Redis
redis_client = get_redis_connection()

# Kafka producer
producer = KafkaProducer(
    bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092'),
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

class Product(BaseModel):
    product_id: str
    provider_id: str
    product_type: str
    jurisdiction: List[str]
    status: str
    version: str
    last_updated: str
    pricing: dict
    eligibility_rules: dict
    features: List[dict]
    compliance: dict

class ProductFeed(BaseModel):
    provider_id: str
    schema_hash: str
    products: List[Product]

class SessionCreate(BaseModel):
    mode: str
    primary_jurisdiction: str

class ExecuteRequest(BaseModel):
    session_id: str
    mode: str
    steps: List[dict]

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "pil-service", 
        "version": "5.2",
        "timestamp": time.time()
    }

@app.post("/provider/ingest")
async def ingest_product_feed(feed: ProductFeed):
    try:
        event_id = str(uuid.uuid4())
        
        producer.send('provider-feeds', {
            'event_id': event_id,
            'provider_id': feed.provider_id,
            'schema_hash': feed.schema_hash,
            'product_count': len(feed.products)
        })
        
        return {
            "status": "success",
            "event_id": event_id,
            "products_ingested": len(feed.products)
        }
    except Exception as e:
        logger.error(f"Error ingesting feed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute_tools")
async def execute_tools(request: ExecuteRequest):
    try:
        result = {
            "session_id": request.session_id,
            "mode": request.mode,
            "results": [{"step": step, "status": "completed"} for step in request.steps],
            "disclaimer": "This is a marketplace comparison. No recommendation is provided."
        }
        
        audit_event = {
            "event_type": "execution",
            "session_id": request.session_id,
            "mode": request.mode,
            "timestamp": str(uuid.uuid4())
        }
        producer.send('audit-events', audit_event)
        
        return result
    except Exception as e:
        logger.error(f"Error executing tools: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sessions")
async def create_session(session: SessionCreate):
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    
    session_data = {
        "session_id": session_id,
        "mode": session.mode,
        "primary_jurisdiction": session.primary_jurisdiction,
        "stage": "entry",
        "created_at": str(uuid.uuid4())
    }
    
    redis_client.setex(
        f"session:{session_id}",
        3600,
        json.dumps(session_data)
    )
    
    return {
        "session_id": session_id,
        "stage": "entry",
        "mode": session.mode
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
