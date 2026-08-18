import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Vehicle
from ..schemas import CostCalculation

router = APIRouter()


def parse_price_num(price: str) -> float:
    digits = re.sub(r"[^\d.]", "", price or "")
    return float(digits) if digits else 0.0


def compute_costs(vehicle: Vehicle) -> CostCalculation:
    settings = get_settings()
    price = parse_price_num(vehicle.price)
    fuel_efficiency = vehicle.fuel_efficiency or 0
    annual_maint = vehicle.annual_maint or 40000
    insurance_pct = vehicle.insurance_pct or 0.025
    is_ev = vehicle.powertrain == "ev"
    fuel_type = "diesel" if vehicle.powertrain == "diesel" else ("ev" if is_ev else "petrol")
    fuel_prices = {
        "petrol": settings.PETROL_PRICE,
        "diesel": settings.DIESEL_PRICE,
        "ev": settings.EV_KWH_PRICE,
    }
    fuel_price = fuel_prices.get(fuel_type, settings.PETROL_PRICE)
    annual_km = settings.ANNUAL_KM

    if is_ev:
        kwh_per_100km = 18
        kwh_per_year = (annual_km / 100) * kwh_per_100km
        annual_fuel = kwh_per_year * fuel_price
        efficiency = f"{vehicle.battery_kwh or 'N/A'} kWh"
    else:
        liters_per_year = annual_km / fuel_efficiency if fuel_efficiency else 0
        annual_fuel = liters_per_year * fuel_price
        efficiency = f"{fuel_efficiency} km/L"

    annual_insurance = price * insurance_pct
    annual_registration = price * settings.REGISTRATION_PCT
    annual_depreciation = price * settings.DEPRECIATION_PCT
    total_annual = annual_fuel + annual_maint + annual_insurance + annual_registration + annual_depreciation

    return CostCalculation(
        annual_fuel=round(annual_fuel),
        annual_maint=round(annual_maint),
        annual_insurance=round(annual_insurance),
        annual_registration=round(annual_registration),
        annual_depreciation=round(annual_depreciation),
        total_annual=round(total_annual),
        monthly_cost=round(total_annual / 12),
        daily_cost=round(total_annual / 365),
        cost_per_km=round((total_annual / annual_km) * 10) / 10,
        fuel_type=fuel_type,
        fuel_price=fuel_price,
        is_ev=is_ev,
        efficiency=efficiency,
        insurance_pct=insurance_pct,
        annual_km=annual_km,
        registration_pct=settings.REGISTRATION_PCT,
        depreciation_pct=settings.DEPRECIATION_PCT,
    )


@router.get("/{key}", response_model=CostCalculation)
def calculate_running_costs(key: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.key == key).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return compute_costs(vehicle)
