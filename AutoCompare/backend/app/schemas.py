from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class VehicleOut(BaseModel):
    id: int
    key: str
    name: str
    price: str
    engine: Optional[str] = None
    power: Optional[str] = None
    fuel: Optional[str] = None
    transmission: Optional[str] = None
    dimensions: Optional[str] = None
    safety: Optional[str] = None
    features: Optional[str] = None
    warranty: Optional[str] = None
    service: Optional[str] = None
    ownership: Optional[str] = None
    category: Optional[str] = None
    mfg: Optional[str] = None
    origin: Optional[str] = None
    variant: Optional[str] = None
    model_year: Optional[str] = None
    source: Optional[str] = None
    source_date: Optional[str] = None
    powertrain: Optional[str] = None
    condition: Optional[str] = None
    logo: Optional[str] = None
    price_source: Optional[str] = None
    spec_source: Optional[str] = None
    fuel_efficiency: Optional[float] = None
    annual_maint: Optional[float] = None
    insurance_pct: Optional[float] = None
    battery_kwh: Optional[str] = None
    range_km: Optional[str] = None
    ac_charge_kw: Optional[str] = None
    dc_charge_kw: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class CostCalculation(BaseModel):
    annual_fuel: float
    annual_maint: float
    annual_insurance: float
    annual_registration: float
    annual_depreciation: float
    total_annual: float
    monthly_cost: float
    daily_cost: float
    cost_per_km: float
    fuel_type: str
    fuel_price: float
    is_ev: bool
    efficiency: str
    insurance_pct: float
    annual_km: int
    registration_pct: float
    depreciation_pct: float


class ComparisonResult(BaseModel):
    vehicle_a: VehicleOut
    vehicle_b: VehicleOut
    fields: list[dict[str, Any]]
    cost_a: CostCalculation
    cost_b: CostCalculation


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str


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
    city: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


class InquiryCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    message: Optional[str] = None
    inquiry_type: str = "info"
    vehicle_key: Optional[str] = None
    vehicle_name: Optional[str] = None
    source: str = "site"


class StatusUpdate(BaseModel):
    status: str


class InquiryOut(InquiryCreate):
    id: int
    status: str
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    application_type: str = "testdrive"
    customer_name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    notes: Optional[str] = None
    vehicle_key: Optional[str] = None
    vehicle_name: Optional[str] = None
    source: str = "site"


class ApplicationOut(ApplicationCreate):
    id: int
    status: str
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    vehicles: int
    inquiries: int
    applications: int
    pending_applications: int
    new_inquiries: int
