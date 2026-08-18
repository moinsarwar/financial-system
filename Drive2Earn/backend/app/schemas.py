from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


class VehicleOut(BaseModel):
    id: int
    key: str
    label: str
    icon: str
    price: int
    price_min: int
    price_max: int
    price_step: int
    default_daily_earning: int
    default_fuel_pct: float
    default_rental: int
    maintenance_reserve: int
    description: str
    features: list[str]
    monthly_payment_estimate: str
    sort_order: int

    class Config:
        from_attributes = True


class AssumptionOut(BaseModel):
    financing_rate: float
    term_months: int
    insurance_rate: float
    max_affordability_ratio: float
    downtime_reserve: float
    fleet_vehicle_type: str

    class Config:
        from_attributes = True


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


class AffordabilityIn(BaseModel):
    vehicle_key: str
    income: int = Field(..., ge=0)
    employment: str = "salaried"
    deposit: int = Field(0, ge=0)
    consent: bool = False
    vehicle_price: Optional[int] = None


class AlternativeOut(BaseModel):
    type: str
    label: str
    price: int


class AffordabilityOut(BaseModel):
    status: str
    message: str
    vehicle: Optional[str] = None
    vehicle_price: Optional[int] = None
    deposit: Optional[int] = None
    income: Optional[int] = None
    monthly_vehicle_cost: Optional[int] = None
    repayment_ratio: Optional[float] = None
    best_alternative: Optional[AlternativeOut] = None


class AffordabilityRecord(BaseModel):
    id: int
    user_id: Optional[int] = None
    vehicle_key: str
    income: int
    employment: str
    deposit: int
    vehicle_price: int
    monthly_vehicle_cost: int
    repayment_ratio: float
    status: str
    follow_up: str
    suggested_vehicle: Optional[str] = None
    created_at: datetime
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str


class ApplicationCreate(BaseModel):
    pathway: str = "drive"
    vehicle_key: str
    vehicle_price: Optional[int] = None
    deposit: int = 0
    customer_name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    income: int = 0
    employment: str = "salaried"
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    pathway: str
    vehicle_key: str
    vehicle_label: str
    vehicle_price: int
    deposit: int
    customer_name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    income: int
    employment: str
    notes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DriveCalcIn(BaseModel):
    vehicle_key: str = "car"
    days: int = 25
    daily: int = 7400
    fuel_pct: float = 11.5
    price: int = 1800000
    deposit: int = 0
    scenario: str = "expected"


class FleetCalcIn(BaseModel):
    fleet_size: int = 1
    rental: int = 4500
    rental_days: int = 25
    management: int = 12000
    price: int = 1800000
    deposit: int = 0
    payout_pct: float = 70
    scenario: str = "expected"


class CalcOut(BaseModel):
    result: dict[str, Any]


class DashboardStats(BaseModel):
    vehicles: int
    applications: int
    pending_applications: int
    estimates: int
    new_estimates: int
