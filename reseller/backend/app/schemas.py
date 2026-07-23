from pydantic import BaseModel, EmailStr, Field  
from datetime import datetime  
from typing import Optional, List  
from .models import ResellerStatus  
  
# ---------- Reseller ----------  
class ResellerBase(BaseModel):  
    name: str  
    business_name: Optional[str] = None  
    subdomain: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-z0-9-]+$")  
    email: EmailStr  
    phone: Optional[str] = None  
    market_focus: Optional[str] = None  
  
class ResellerCreate(ResellerBase):  
    pass  
  
class ResellerUpdate(BaseModel):  
    name: Optional[str] = None  
    business_name: Optional[str] = None  
    status: Optional[ResellerStatus] = None  
    conversions: Optional[int] = None  
    commission: Optional[float] = None  
    market_focus: Optional[str] = None  
  
class Reseller(ResellerBase):  
    id: int  
    status: ResellerStatus  
    conversions: int  
    commission: float  
    created_at: datetime  
    updated_at: datetime  
  
    class Config:  
        from_attributes = True  
  
# ---------- Customer ----------  
class CustomerBase(BaseModel):  
    name: str  
    email: EmailStr  
    product: str  
    status: str  
  
class CustomerCreate(CustomerBase):  
    reseller_id: int  
  
class Customer(CustomerBase):  
    id: int  
    date: datetime  
    reseller_id: int  
  
    class Config:  
        from_attributes = True  
  
# ---------- Activity ----------  
class ActivityBase(BaseModel):  
    product: str  
    conversion_status: str  
    commission: float = 0.0  
  
class ActivityCreate(ActivityBase):  
    reseller_id: int  
  
class Activity(ActivityBase):  
    id: int  
    date: datetime  
    reseller_id: int  
  
    class Config:  
        from_attributes = True  
  
# ---------- Testimonial ----------  
class TestimonialBase(BaseModel):  
    name: str  
    comment: str  
    rating: int = Field(..., ge=1, le=5)  
  
class TestimonialCreate(TestimonialBase):  
    reseller_id: int  
  
class Testimonial(TestimonialBase):  
    id: int  
    date: datetime  
    reseller_id: int  
  
    class Config:  
        from_attributes = True  
  
# ---------- Aggregated Stats ----------  
class ResellerStats(BaseModel):  
    total_resellers: int  
    active_resellers: int  
    pending_resellers: int  
    total_conversions: int  
    total_commission: float

# ---------- Auth & User ----------
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    role: str = "reseller"
    reseller_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
