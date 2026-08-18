from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Vehicle
from ..schemas import ComparisonResult
from .costs import compute_costs

router = APIRouter()


def _range_or_fuel(vehicle: Vehicle) -> str:
    if vehicle.powertrain == "ev":
        return f"{vehicle.range_km or 'N/A'} km"
    return vehicle.fuel or "N/A"


@router.get("/{key_a}/{key_b}", response_model=ComparisonResult)
def compare_vehicles(key_a: str, key_b: str, db: Session = Depends(get_db)):
    vehicle_a = db.query(Vehicle).filter(Vehicle.key == key_a).first()
    vehicle_b = db.query(Vehicle).filter(Vehicle.key == key_b).first()
    if not vehicle_a or not vehicle_b:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    cost_a = compute_costs(vehicle_a)
    cost_b = compute_costs(vehicle_b)

    fields = [
        {"label": "Price", "a": vehicle_a.price, "b": vehicle_b.price},
        {"label": "Variant", "a": vehicle_a.variant or "Standard", "b": vehicle_b.variant or "Standard"},
        {"label": "Model Year", "a": vehicle_a.model_year or "2026", "b": vehicle_b.model_year or "2026"},
        {
            "label": "Powertrain",
            "a": (vehicle_a.powertrain or "").upper(),
            "b": (vehicle_b.powertrain or "").upper(),
        },
        {"label": "Engine", "a": vehicle_a.engine, "b": vehicle_b.engine},
        {"label": "Power", "a": vehicle_a.power, "b": vehicle_b.power},
        {
            "label": "Range" if vehicle_a.powertrain == "ev" else "Fuel Economy",
            "a": _range_or_fuel(vehicle_a),
            "b": _range_or_fuel(vehicle_b),
        },
        {"label": "Transmission", "a": vehicle_a.transmission, "b": vehicle_b.transmission},
        {"label": "Dimensions", "a": vehicle_a.dimensions, "b": vehicle_b.dimensions},
        {"label": "Safety", "a": vehicle_a.safety, "b": vehicle_b.safety},
        {"label": "Features", "a": vehicle_a.features, "b": vehicle_b.features},
        {"label": "Warranty", "a": vehicle_a.warranty, "b": vehicle_b.warranty},
        {"label": "Service/parts", "a": vehicle_a.service, "b": vehicle_b.service},
        {
            "label": "Est. Annual Running Cost",
            "a": f"PKR {cost_a.total_annual:,.0f}/yr",
            "b": f"PKR {cost_b.total_annual:,.0f}/yr",
        },
    ]

    if vehicle_a.powertrain == "ev" or vehicle_b.powertrain == "ev":
        fields.extend(
            [
                {"label": "Battery (kWh)", "a": vehicle_a.battery_kwh or "N/A", "b": vehicle_b.battery_kwh or "N/A"},
                {"label": "Range (km)", "a": vehicle_a.range_km or "N/A", "b": vehicle_b.range_km or "N/A"},
                {"label": "DC Charge (kW)", "a": vehicle_a.dc_charge_kw or "N/A", "b": vehicle_b.dc_charge_kw or "N/A"},
            ]
        )

    return ComparisonResult(
        vehicle_a=vehicle_a,
        vehicle_b=vehicle_b,
        fields=fields,
        cost_a=cost_a,
        cost_b=cost_b,
    )
