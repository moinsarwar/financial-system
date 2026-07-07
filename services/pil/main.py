from fastapi import FastAPI, HTTPException, Query, Path, Body
from pydantic import BaseModel
import json
import logging
import os
import uuid
import time
from typing import List, Dict, Optional
from kafka import KafkaProducer
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="Product Intelligence Service (PIL)", version="5.2")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kafka producer
try:
    producer = KafkaProducer(
        bootstrap_servers=os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092'),
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
except Exception as e:
    logger.error(f"Failed to connect to Kafka: {e}")
    producer = None

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'postgres'),
        port=5432,
        database=os.getenv('POSTGRES_DB', 'financial_system'),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'postgres')
    )

class ProductFeed(BaseModel):
    provider_id: str
    schema_hash: str
    products: List[dict] 

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "pil-service", "version": "5.2", "timestamp": time.time()}

@app.get("/products")
async def query_products(
    product_type: Optional[str] = None,
    jurisdiction: Optional[str] = None,
    sharia_certified: Optional[bool] = None,
    min_premium: Optional[float] = None,
    max_premium: Optional[float] = None,
    limit: int = 50,
    offset: int = 0
):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = "SELECT * FROM products WHERE status = 'active'"
            params = []
            
            if product_type:
                query += " AND product_type = %s"
                params.append(product_type)
            if jurisdiction:
                query += " AND %s = ANY(jurisdiction_list)"
                params.append(jurisdiction)
            
            query += " LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cur.execute(query, params)
            rows = cur.fetchall()
            
            formatted_products = []
            for row in rows:
                formatted_products.append({
                    "product_id": row["product_id"],
                    "provider_id": row["provider_id"],
                    "product_type": row["product_type"],
                    "jurisdiction": row["jurisdiction_list"],
                    "status": row["status"],
                    "version": row["version"],
                    "last_updated": row["last_updated"].isoformat() if row["last_updated"] else None,
                    "pricing": row["pricing_json"],
                    "eligibility_rules": row["eligibility_rules_json"],
                    "features": row["features_json"],
                    "compliance": row["compliance_json"]
                })
            
            return {"total": len(formatted_products), "products": formatted_products}
    except Exception as e:
        logger.error(f"Error querying products: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/products/{product_id}")
async def get_product(product_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM products WHERE product_id = %s", (product_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Product not found")
                
            return {
                "product_id": row["product_id"],
                "provider_id": row["provider_id"],
                "product_type": row["product_type"],
                "jurisdiction": row["jurisdiction_list"],
                "status": row["status"],
                "version": row["version"],
                "last_updated": row["last_updated"].isoformat() if row["last_updated"] else None,
                "pricing": row["pricing_json"],
                "eligibility_rules": row["eligibility_rules_json"],
                "features": row["features_json"],
                "compliance": row["compliance_json"]
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting product: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/provider/ingest")
async def ingest_product_feed(feed: ProductFeed):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            event_id = str(uuid.uuid4())
            
            for prod in feed.products:
                prod_id = prod.get('product_id', f"{feed.provider_id}_{prod.get('product_type', 'unknown')}_{uuid.uuid4().hex[:6]}")
                
                cur.execute("""
                    INSERT INTO products (
                        product_id, provider_id, product_type, jurisdiction_list, status, 
                        version, last_updated, pricing_json, eligibility_rules_json, features_json, compliance_json
                    ) VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s)
                    ON CONFLICT (product_id) DO UPDATE SET
                        pricing_json = EXCLUDED.pricing_json,
                        eligibility_rules_json = EXCLUDED.eligibility_rules_json,
                        features_json = EXCLUDED.features_json,
                        compliance_json = EXCLUDED.compliance_json,
                        last_updated = NOW()
                """, (
                    prod_id,
                    feed.provider_id,
                    prod.get("product_type", "unknown"),
                    prod.get("jurisdiction", ["PK"]),
                    prod.get("status", "active"),
                    prod.get("version", "1"),
                    json.dumps(prod.get("pricing", {})),
                    json.dumps(prod.get("eligibility_rules", {})),
                    json.dumps(prod.get("features", [])),
                    json.dumps(prod.get("compliance", {}))
                ))
            
            conn.commit()
            
            if producer:
                producer.send('provider-feeds', {
                    'event_id': event_id,
                    'provider_id': feed.provider_id,
                    'schema_hash': feed.schema_hash,
                    'product_count': len(feed.products)
                })
                
            return {"status": "Accepted for processing", "event_id": event_id, "products_ingested": len(feed.products)}
    except Exception as e:
        conn.rollback()
        logger.error(f"Error ingesting feed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/validate/product")
async def validate_product(product: dict):
    return {
        "valid": True,
        "errors": [],
        "warnings": []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
