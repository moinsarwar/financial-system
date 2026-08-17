from pydantic import BaseModel
from typing import Optional


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
