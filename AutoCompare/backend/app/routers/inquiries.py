from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter()


@router.post("/", response_model=schemas.InquiryOut)
def create_inquiry(
    payload: schemas.InquiryCreate,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(auth.get_current_user_optional),
):
    row = models.Inquiry(
        user_id=current_user.id if current_user else None,
        customer_name=payload.customer_name.strip(),
        phone=payload.phone.strip(),
        email=(payload.email or "").strip() or None,
        message=(payload.message or "").strip() or None,
        inquiry_type=payload.inquiry_type or "info",
        vehicle_key=payload.vehicle_key,
        vehicle_name=payload.vehicle_name,
        source=payload.source or "site",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{inquiry_id}/status", response_model=schemas.InquiryOut)
def update_inquiry_status(
    inquiry_id: int,
    payload: schemas.StatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    row = db.query(models.Inquiry).filter(models.Inquiry.id == inquiry_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    row.status = payload.status.strip()
    db.commit()
    db.refresh(row)
    return row
