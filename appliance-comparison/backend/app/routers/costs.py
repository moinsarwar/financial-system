import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Appliance
from ..schemas import CostCalculation

router = APIRouter()

ELECTRIC_RATE = float(os.getenv("ELECTRIC_RATE", "45"))
GAS_CYLINDER_PRICE = float(os.getenv("GAS_CYLINDER_PRICE", "2800"))


def compute_costs(appliance: Appliance) -> CostCalculation:
    annual_energy_cost = 0.0
    annual_gas_cost = 0.0

    if appliance.fuel_type in ("electric", "electric+gas"):
        annual_energy_cost = appliance.annual_energy * ELECTRIC_RATE

    if appliance.fuel_type in ("gas", "electric+gas"):
        annual_gas_cost = appliance.gas_cylinders_per_month * 12 * GAS_CYLINDER_PRICE

    total_annual = annual_energy_cost + annual_gas_cost + appliance.annual_maint

    return CostCalculation(
        annual_energy_cost=round(annual_energy_cost),
        annual_gas_cost=round(annual_gas_cost),
        annual_maint=round(appliance.annual_maint),
        total_annual=round(total_annual),
        monthly_cost=round(total_annual / 12),
        daily_cost=round(total_annual / 365, 1),
        fuel_type=appliance.fuel_type,
        annual_energy=appliance.annual_energy,
        gas_cylinders_per_month=appliance.gas_cylinders_per_month,
    )


@router.get("/{key}", response_model=CostCalculation)
def calculate_running_costs(key: str, db: Session = Depends(get_db)):
    appliance = db.query(Appliance).filter(Appliance.key == key).first()
    if not appliance:
        raise HTTPException(status_code=404, detail="Appliance not found")
    return compute_costs(appliance)
