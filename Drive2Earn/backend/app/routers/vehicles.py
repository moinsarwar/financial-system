from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.get("/", response_model=list[schemas.VehicleOut])
def list_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehicle).order_by(models.Vehicle.sort_order).all()


@router.get("/{key}", response_model=schemas.VehicleOut)
def get_vehicle(key: str, db: Session = Depends(get_db)):
    row = db.query(models.Vehicle).filter(models.Vehicle.key == key).first()
    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return row
