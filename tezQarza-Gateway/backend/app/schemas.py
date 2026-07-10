from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from .models import ApplicationStatus, LfeDecision

class ProductBase(BaseModel):
    id: str
    name: str
    icon: str
    type: str
    group_name: str
    max_amount: float
    min_tenure: int
    max_tenure: int
    tag: str
    ideal: str
    processing: str
    lfe_product_id: str

class Product(ProductBase):
    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    product_id: str
    full_name: str
    cnic: str
    mobile: str
    income: float
    liabilities: Optional[float] = 0.0
    amount: float
    tenure: int

    @field_validator('cnic')
    @classmethod
    def validate_cnic(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 13:
            raise ValueError('CNIC must be 13 digits')
        return v

    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 11 or not v.startswith('03'):
            raise ValueError('Mobile must be 11 digits starting with 03')
        return v

class ApplicationResponse(BaseModel):
    id: int
    ref: str
    product_id: str
    full_name: str
    cnic_masked: str
    mobile_masked: str
    income: float
    liabilities: float
    amount: float
    tenure: int
    status: ApplicationStatus
    decision: Optional[LfeDecision]
    score: Optional[int]
    risk_band: Optional[str]
    route: Optional[str]
    matched_lenders: List[str]
    reason_codes: List[str]
    policy_version: Optional[str]
    audit_id: Optional[str]
    lfe_application_id: Optional[str]
    lfe_decision_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class EligibilityCheck(BaseModel):
    age: int
    income: float
    employment: str

class EligibilityResult(BaseModel):
    matches: List[str]

class DashboardStats(BaseModel):
    total_submitted: int
    lfe_accepted: int
    decisions_returned: int
    routed_to_lender: int
    approved_in_principle: int
    rejected: int
    manual_review: int
    avg_lfe_response_time: float
    top_rejection_reasons: List[dict]
    top_product_routes: List[dict]
    lender_match_rate: float
    channel_failed: int
    channel_pending_lfe: int
