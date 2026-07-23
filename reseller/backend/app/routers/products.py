import os
import httpx
from fastapi import APIRouter
from typing import List, Dict

router = APIRouter()

async def fetch_finos_products():
    finos_url = os.environ.get("FINOS_API_URL")
    if not finos_url:
        return {}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{finos_url}/front_products")
            response.raise_for_status()
            data = response.json()
            products = data.get("products", [])
            
            # Map finOS format to Reseller UI format
            CATEGORY_MAP = {
                "personal_loan": "personal",
                "credit_card": "credit",
                "health_insurance": "health",
                "motor_insurance": "auto",
                "life_insurance": "life"
            }
            mapped_data = {}
            for p in products:
                raw_cat = p.get("product_type", "other").lower()
                cat = CATEGORY_MAP.get(raw_cat, raw_cat)
                
                # Extract pricing/features safely
                pricing = p.get("pricing") or {}
                
                # Try to find a product name in features, else use product_id
                product_name = p.get("product_id", "Product")
                features = p.get("features", [])
                if isinstance(features, list):
                    for f in features:
                        if f.get("name") == "Product Name":
                            product_name = f.get("details", product_name)
                            break
                            
                mapped = {
                    "bank": p.get("provider_id", "Unknown Provider"),
                    "product": product_name,
                    "rate": pricing.get("interest_rate", pricing.get("apr", pricing.get("profit_rate", "N/A"))),
                    "fee": pricing.get("processing_fee", pricing.get("annual_fee", pricing.get("annual_premium", "N/A"))),
                    "tenure": pricing.get("max_tenure", "N/A")
                }
                
                if cat not in mapped_data:
                    mapped_data[cat] = []
                mapped_data[cat].append(mapped)
                
            return mapped_data
    except Exception as e:
        print(f"Failed to fetch finOS products: {e}")
        return {}

@router.get("/categories")  
async def get_categories():
    products = await fetch_finos_products()
    return list(products.keys()) if products else []
  
@router.get("/{category}")  
async def get_products(category: str):
    products = await fetch_finos_products()
    return products.get(category, []) if products else []
