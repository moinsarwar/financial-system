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
    vehicle_name = payload.vehicle_name
    if payload.vehicle_key:
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.key == payload.vehicle_key).first()
        if vehicle:
            vehicle_name = vehicle.name

    row = models.Application(
        user_id=current_user.id,
        application_type=payload.application_type or "testdrive",
        customer_name=payload.customer_name.strip(),
        phone=payload.phone.strip(),
        email=(payload.email or current_user.email).strip() or None,
        city=(payload.city or "").strip() or None,
        preferred_date=(payload.preferred_date or "").strip() or None,
        preferred_time=(payload.preferred_time or "").strip() or None,
        notes=(payload.notes or "").strip() or None,
        vehicle_key=payload.vehicle_key,
        vehicle_name=vehicle_name,
        source=payload.source or "site",
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
