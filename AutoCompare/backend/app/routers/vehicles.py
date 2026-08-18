from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Vehicle
from ..schemas import VehicleOut

router = APIRouter()

CHINESE_MFGS = {"byd", "changan", "haval", "mg", "chery", "gwm"}


@router.get("/", response_model=list[VehicleOut])
def get_vehicles(
    db: Session = Depends(get_db),
    origin: str | None = None,
    mfg: str | None = None,
    powertrain: str | None = None,
    condition: str | None = None,
    search: str | None = None,
    limit: int = 200,
):
    query = db.query(Vehicle)

    if origin and origin not in ("all", ""):
        if origin == "chinese":
            query = query.filter(Vehicle.mfg.in_(CHINESE_MFGS))
        else:
            query = query.filter(Vehicle.origin == origin)

    if mfg and mfg not in ("all", ""):
        query = query.filter(Vehicle.mfg == mfg.lower())

    if powertrain:
        query = query.filter(Vehicle.powertrain == powertrain)

    if condition:
        query = query.filter(Vehicle.condition == condition)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            (Vehicle.name.ilike(term))
            | (Vehicle.mfg.ilike(term))
            | (Vehicle.category.ilike(term))
            | (Vehicle.variant.ilike(term))
        )

    rows = query.order_by(Vehicle.id).all()
    return rows[:limit]


@router.get("/{key}", response_model=VehicleOut)
def get_vehicle(key: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.key == key).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle
