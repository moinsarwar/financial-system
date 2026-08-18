from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter()


@router.post("/", response_model=schemas.ApplicationOut)
def create_application(
    payload: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.key == payload.vehicle_key).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    row = models.Application(
        user_id=current_user.id,
        pathway=payload.pathway if payload.pathway in ("drive", "fleet") else "drive",
        vehicle_key=vehicle.key,
        vehicle_label=vehicle.label,
        vehicle_price=payload.vehicle_price or vehicle.price,
        deposit=max(0, payload.deposit),
        customer_name=payload.customer_name.strip(),
        phone=payload.phone.strip(),
        email=(payload.email or current_user.email).strip() or None,
        city=(payload.city or "").strip() or None,
        income=payload.income or 0,
        employment=payload.employment or "salaried",
        notes=(payload.notes or "").strip() or None,
        status="pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{application_id}/status", response_model=schemas.ApplicationOut)
def update_application_status(
    application_id: int,
    payload: schemas.StatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    row = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    row.status = payload.status.strip()
    db.commit()
    db.refresh(row)
    return row
