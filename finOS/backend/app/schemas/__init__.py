from decimal import Decimal  
from pydantic import BaseModel, EmailStr, ConfigDict, Field  
from datetime import datetime  
from typing import Optional, List, Dict, Any, Literal  
  
# ---------- Auth ----------  
class LoginRequest(BaseModel):  
    email: str  
    password: str  
  
class TokenResponse(BaseModel):  
    access_token: str  
    token_type: str = "bearer"  
    user_id: str  
    full_name: str  
    role: str  
    client_id: Optional[str] = None  
  
# ---------- Client ----------  
class ClientBase(BaseModel):  
    name: str  
    email: EmailStr  
    phone: Optional[str] = None  
    assigned_department: Optional[str] = None  
  
class ClientCreate(ClientBase): pass  
  
class ClientResponse(ClientBase):  
    id: str  
    lifecycle_stage: str  
    has_open_claim: bool  
    created_at: datetime  
    last_activity: datetime  
    engagement_score: int  
    model_config = ConfigDict(from_attributes=True)  
  
# ---------- Application ----------  
class ApplicationBase(BaseModel):  
    client_id: str  
    product_type: str  
    amount: Decimal = Field(gt=Decimal("0"))  
  
class ApplicationCreate(ApplicationBase): pass  
  
class ApplicationResponse(ApplicationBase):  
    id: str  
    product_label: str  
    department: Optional[str] = None  
    steps: List[str]  
    step_index: int  
    current_step: str  
    status: str  
    created_at: datetime  
    updated_at: datetime  
    timeline: List[Dict[str, Any]]  
    currency: str  
    decision_reason_code: Optional[str] = None  
    decision_notes: Optional[str] = None  
    decided_at: Optional[datetime] = None  
    decided_by_user_id: Optional[str] = None  
    model_config = ConfigDict(from_attributes=True)  
  
class ApplicationDecisionRequest(BaseModel):  
    outcome: Literal["approved", "declined", "withdrawn"]  
    reason_code: str  
    notes: Optional[str] = None  
  
# ---------- Claim ----------  
class ClaimBase(BaseModel):  
    client_id: str  
    policy_id: str  
    type: str  
    amount: Decimal = Field(gt=Decimal("0"))  
    description: str  
  
class ClaimCreate(ClaimBase): pass  
  
class ClaimResponse(ClaimBase):  
    id: str  
    client_name: str  
    product_type: str  
    product_label: str  
    current_step: str  
    step_index: int  
    steps: List[str]  
    outcome: Optional[str]  
    incident_date: datetime  
    created_at: datetime  
    updated_at: datetime  
    severity: str  
    reserve_amount: Decimal  
    approved_amount: Decimal  
    fraud_indicator: bool  
    payment_ref: Optional[str]  
    insurer_ref: Optional[str]  
    timeline: List[Dict[str, Any]]  
    currency: str  
    resolution_reason_code: Optional[str] = None  
    resolution_notes: Optional[str] = None  
    resolved_at: Optional[datetime] = None  
    resolved_by_user_id: Optional[str] = None  
    model_config = ConfigDict(from_attributes=True)  
  
class ClaimResolutionRequest(BaseModel):  
    outcome: Literal["Payment Confirmed", "Authorization Denied", "Partially Approved", "Fraud Review"]  
    reason_code: str  
    notes: Optional[str] = None  
  
# ---------- Product ----------  
class ProductResponse(BaseModel):  
    id: str  
    client_id: str  
    client_name: str  
    product_type: str  
    product_label: str  
    status: str  
    policy_number: Optional[str] = None  
    start_date: Optional[datetime] = None  
    end_date: Optional[datetime] = None  
    premium: Optional[Decimal] = None  
    sum_assured: Optional[Decimal] = None  
    holding_type: Optional[str] = None  
    opened_at: Optional[datetime] = None  
    details: Optional[Dict[str, Any]] = None  
    model_config = ConfigDict(from_attributes=True)  
  
# ---------- Document ----------  
class DocumentResponse(BaseModel):  
    id: str  
    client_id: str  
    client_name: str  
    type: str  
    name: str  
    original_filename: str  
    ref_id: Optional[str] = None  
    ref_type: Optional[str] = None  
    uploaded_at: datetime  
    status: str  
    mime_type: str  
    size_bytes: int  
    checksum: str  
    storage_key: str  
    uploaded_by_user: Optional[str] = None  
    model_config = ConfigDict(from_attributes=True)  
  
# ---------- Activity ----------  
class ActivityResponse(BaseModel):  
    id: str  
    time: datetime  
    actor_user_id: Optional[str]  
    client_id: Optional[str]  
    subject_type: Optional[str]  
    subject_id: Optional[str]  
    event: str  
    details: str  
    department: Optional[str]  
    ip_address: Optional[str]  
    request_id: Optional[str]  
    extra_data: Dict[str, Any]  
    model_config = ConfigDict(from_attributes=True)  
  
# ---------- Dashboard ----------  
class FunnelStats(BaseModel):  
    leads: int  
    applicants: int  
    customers: int  
    openClaims: int  
  
class DashboardStats(BaseModel):  
    totalClients: int  
    activeProducts: int  
    openClaims: int  
    applications: int
