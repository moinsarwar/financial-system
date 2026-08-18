from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ApplianceBase(BaseModel):
    key: str
    name: str
    brand: str
    price: str
    capacity: str
    capacity_num: Optional[float] = None
    capacity_unit: str
    energy: str
    warranty: str
    noise: str
    category: str
    mfg: str
    origin: str
    variant: str
    model_year: int
    is_new: bool
    source: str
    logo: str
    annual_energy: float
    annual_maint: float
    fuel_type: str
    gas_cylinders_per_month: float


class ApplianceCreate(ApplianceBase):
    pass


class Appliance(ApplianceBase):
    id: int

    class Config:
        from_attributes = True


class CostCalculation(BaseModel):
    annual_energy_cost: float
    annual_gas_cost: float
    annual_maint: float
    total_annual: float
    monthly_cost: float
    daily_cost: float
    fuel_type: str
    annual_energy: float
    gas_cylinders_per_month: float


class ComparisonResult(BaseModel):
    appliance_a: Appliance
    appliance_b: Appliance
    fields: list
    summary: dict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


class InquiryCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    message: Optional[str] = None
    inquiry_type: str = "info"
    appliance_key: Optional[str] = None
    appliance_name: Optional[str] = None
    source: str = "site"


class InquiryStatusUpdate(BaseModel):
    status: str


class InquiryOut(InquiryCreate):
    id: int
    status: str
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    application_type: str
    customer_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    preferred_date: Optional[str] = None
    notes: Optional[str] = None
    appliance_key: Optional[str] = None
    appliance_name: Optional[str] = None
    source: str = "site"


class ApplicationStatusUpdate(BaseModel):
    status: str


class ApplicationOut(ApplicationCreate):
    id: int
    status: str
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    appliances: int
    inquiries: int
    applications: int
    pending_applications: int
    new_inquiries: int
