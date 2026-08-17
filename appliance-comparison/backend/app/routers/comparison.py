from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Appliance
from ..schemas import ComparisonResult
from .costs import compute_costs

router = APIRouter()


def _warranty_years(text: str) -> float:
    import re

    m = re.search(r"(\d+)", text or "")
    return float(m.group(1)) if m else 0.0


@router.get("/{key_a}/{key_b}", response_model=ComparisonResult)
def compare_appliances(key_a: str, key_b: str, db: Session = Depends(get_db)):
    appliance_a = db.query(Appliance).filter(Appliance.key == key_a).first()
    appliance_b = db.query(Appliance).filter(Appliance.key == key_b).first()

    if not appliance_a or not appliance_b:
        raise HTTPException(status_code=404, detail="Appliance not found")

    cost_a = compute_costs(appliance_a)
    cost_b = compute_costs(appliance_b)

    fields = [
        {"label": "Price", "a": appliance_a.price, "b": appliance_b.price},
        {"label": "Brand", "a": appliance_a.brand, "b": appliance_b.brand},
        {"label": "Type", "a": appliance_a.category, "b": appliance_b.category},
        {"label": "Capacity", "a": appliance_a.capacity, "b": appliance_b.capacity},
        {"label": "Energy", "a": appliance_a.energy, "b": appliance_b.energy},
        {"label": "Warranty", "a": appliance_a.warranty, "b": appliance_b.warranty},
        {"label": "Noise Level", "a": appliance_a.noise, "b": appliance_b.noise},
        {
            "label": "Variant",
            "a": appliance_a.variant or "Standard",
            "b": appliance_b.variant or "Standard",
        },
        {
            "label": "Annual Running Cost",
            "a": f"PKR {cost_a.total_annual:,}/yr",
            "b": f"PKR {cost_b.total_annual:,}/yr",
        },
    ]

    lower_cost = "a" if cost_a.total_annual < cost_b.total_annual else "b"
    if cost_a.total_annual == cost_b.total_annual:
        lower_cost = "similar"

    cap_a = appliance_a.capacity_num or 0
    cap_b = appliance_b.capacity_num or 0
    if appliance_a.category == appliance_b.category and cap_a and cap_b:
        larger_capacity = "a" if cap_a > cap_b else "b" if cap_b > cap_a else "similar"
    else:
        larger_capacity = "n/a"

    w_a = _warranty_years(appliance_a.warranty)
    w_b = _warranty_years(appliance_b.warranty)
    longer_warranty = "a" if w_a > w_b else "b" if w_b > w_a else "similar"

    summary = {
        "lower_cost": lower_cost,
        "lower_cost_a": cost_a.total_annual,
        "lower_cost_b": cost_b.total_annual,
        "larger_capacity": larger_capacity,
        "longer_warranty": longer_warranty,
    }

    return ComparisonResult(
        appliance_a=appliance_a,
        appliance_b=appliance_b,
        fields=fields,
        summary=summary,
    )
