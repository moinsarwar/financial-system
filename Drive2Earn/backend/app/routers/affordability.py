from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, calc, models, schemas
from ..database import get_db

router = APIRouter()

ORDER = ["car", "rickshaw", "motorbike"]


@router.post("/", response_model=schemas.AffordabilityOut)
def estimate_affordability(
    payload: schemas.AffordabilityIn,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(auth.get_current_user_optional),
):
    if not payload.income or payload.income < 10000:
        return schemas.AffordabilityOut(status="validation", message="Enter your approximate monthly income to continue.")
    if not payload.consent:
        return schemas.AffordabilityOut(status="validation", message="Confirm you understand this is a simulation.")

    assumptions = db.query(models.ModelAssumption).first()
    if not assumptions:
        return schemas.AffordabilityOut(status="validation", message="Model assumptions are not available.")
    vehicles = {v.key: v for v in db.query(models.Vehicle).all()}
    vehicle = vehicles.get(payload.vehicle_key)
    if not vehicle:
        return schemas.AffordabilityOut(status="validation", message="Select a vehicle to continue.")

    cost_vehicle = vehicle
    if payload.vehicle_key == "fleet":
        cost_vehicle = vehicles.get(assumptions.fleet_vehicle_type) or vehicle

    price = payload.vehicle_price or cost_vehicle.price
    deposit = calc.clamp_deposit(payload.deposit, price)
    costs = calc.calc_modeled_vehicle_cost(
        price,
        deposit,
        cost_vehicle.maintenance_reserve,
        assumptions.insurance_rate,
        assumptions.financing_rate,
        assumptions.term_months,
    )
    monthly = costs["modeled_cost"]
    ratio = monthly / payload.income if payload.income else 0
    affordability_ok = ratio <= assumptions.max_affordability_ratio
    ratio_pct = round(ratio * 100)

    best_alt = None
    if not affordability_ok and payload.vehicle_key in ORDER:
        start = ORDER.index(payload.vehicle_key) + 1
        for key in ORDER[start:]:
            alt = vehicles.get(key)
            if not alt:
                continue
            alt_cost = calc.calc_modeled_vehicle_cost(
                alt.price,
                deposit,
                alt.maintenance_reserve,
                assumptions.insurance_rate,
                assumptions.financing_rate,
                assumptions.term_months,
            )["modeled_cost"]
            if payload.income and alt_cost / payload.income <= assumptions.max_affordability_ratio:
                best_alt = schemas.AlternativeOut(type=alt.key, label=alt.label, price=alt.price)
                break

    status = "indicative-fit" if affordability_ok else "outside-range"
    if affordability_ok:
        message = (
            f"Based on your income, the modeled monthly vehicle cost of PKR {monthly:,} is approx. "
            f"{ratio_pct}% of your income. This is within the illustrative affordability range."
        )
    else:
        message = (
            f"The modeled monthly vehicle cost of PKR {monthly:,} is approx. {ratio_pct}% of your income. "
            "This is outside the illustrative affordability range."
        )

    db.add(
        models.AffordabilityEstimate(
            user_id=current_user.id if current_user else None,
            vehicle_key=payload.vehicle_key,
            income=payload.income,
            employment=payload.employment,
            deposit=deposit,
            vehicle_price=price,
            monthly_vehicle_cost=monthly,
            repayment_ratio=ratio,
            status=status,
            follow_up="new",
            suggested_vehicle=best_alt.type if best_alt else None,
        )
    )
    db.commit()

    return schemas.AffordabilityOut(
        status=status,
        message=message,
        vehicle=payload.vehicle_key,
        vehicle_price=price,
        deposit=deposit,
        income=payload.income,
        monthly_vehicle_cost=monthly,
        repayment_ratio=ratio,
        best_alternative=best_alt,
    )
