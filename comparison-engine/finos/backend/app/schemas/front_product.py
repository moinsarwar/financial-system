from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class FrontProductBase(BaseModel):
    product_id: str
    provider_id: Optional[str] = None
    product_type: Optional[str] = None
    jurisdiction: Optional[Any] = None
    status: Optional[str] = None
    version: Optional[str] = None
    pricing: Optional[Any] = None
    eligibility_rules: Optional[Any] = None
    features: Optional[List[Dict[str, Any]]] = None
    compliance: Optional[Dict[str, Any]] = None
    schema_hash: Optional[str] = None
    effective_date: Optional[str] = None
    published_by: Optional[str] = None
    approved_by: Optional[str] = None
    change_request: Optional[str] = None
    previous_version: Optional[str] = None

class FrontProductResponse(FrontProductBase):
    last_updated: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True

class FrontProductList(BaseModel):
    total: int
    products: List[FrontProductResponse]
