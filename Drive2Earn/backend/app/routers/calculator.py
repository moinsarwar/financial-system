from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import calc, models, schemas
from ..database import get_db

router = APIRouter()


def _assumptions(db: Session) -> models.ModelAssumption:
    row = db.query(models.ModelAssumption).first()
    if not row:
        raise HTTPException(status_code=500, detail="Assumptions not seeded")
    return row


def _vehicle(db: Session, key: str) -> models.Vehicle:
    row = db.query(models.Vehicle).filter(models.Vehicle.key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return row


def _maintenance(db: Session, vehicle_key: str, fleet_vehicle_type: str) -> int:
    key = fleet_vehicle_type if vehicle_key == "fleet" else vehicle_key
    vehicle = _vehicle(db, key)
    return vehicle.maintenance_reserve


@router.post("/drive", response_model=schemas.CalcOut)
def calc_drive(payload: schemas.DriveCalcIn, db: Session = Depends(get_db)):
    assumptions = _assumptions(db)
    deposit = calc.clamp_deposit(payload.deposit, payload.price)
    maintenance = _maintenance(db, payload.vehicle_key, assumptions.fleet_vehicle_type)
    result = calc.drive_economics(
        days=payload.days,
        daily=payload.daily,
        fuel_pct=payload.fuel_pct,
        price=payload.price,
        deposit=deposit,
        maintenance=maintenance,
        insurance_rate=assumptions.insurance_rate,
        apr=assumptions.financing_rate,
        term=assumptions.term_months,
        scenario=payload.scenario,
    )
    db.add(models.CalculatorSnapshot(mode="drive", payload=payload.model_dump(), result=result))
    db.commit()
    return schemas.CalcOut(result=result)


@router.post("/fleet", response_model=schemas.CalcOut)
def calc_fleet(payload: schemas.FleetCalcIn, db: Session = Depends(get_db)):
    assumptions = _assumptions(db)
    deposit = calc.clamp_deposit(payload.deposit, payload.price)
    maintenance = _maintenance(db, "fleet", assumptions.fleet_vehicle_type)
    result = calc.fleet_economics(
        fleet_size=payload.fleet_size,
        rental=payload.rental,
        rental_days=payload.rental_days,
        management=payload.management,
        price=payload.price,
        deposit=deposit,
        payout_pct=payload.payout_pct,
        maintenance=maintenance,
        insurance_rate=assumptions.insurance_rate,
        apr=assumptions.financing_rate,
        term=assumptions.term_months,
        downtime_reserve=assumptions.downtime_reserve,
        scenario=payload.scenario,
    )
    db.add(models.CalculatorSnapshot(mode="fleet", payload=payload.model_dump(), result=result))
    db.commit()
    return schemas.CalcOut(result=result)
