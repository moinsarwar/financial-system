from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(current_user=Depends(auth.get_current_active_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


@router.get("/stats", response_model=schemas.AdminStats)
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_users = db.query(models.User).count()
    total_vendors = db.query(models.Vendor).count()
    total_applications = db.query(models.Application).count()
    financed_volume = (
        db.query(func.coalesce(func.sum(models.Application.total_deferred), 0.0)).scalar() or 0
    )
    cash_volume = db.query(func.coalesce(func.sum(models.CashSale.amount), 0.0)).scalar() or 0
    pending = (
        db.query(models.Application)
        .filter(models.Application.status == models.ApplicationStatus.PENDING_REVIEW)
        .count()
    )
    active = (
        db.query(models.Application)
        .filter(
            models.Application.status.in_(
                [models.ApplicationStatus.ACTIVE, models.ApplicationStatus.APPROVED]
            )
        )
        .count()
    )
    completed = (
        db.query(models.Application)
        .filter(models.Application.status == models.ApplicationStatus.COMPLETED)
        .count()
    )
    return schemas.AdminStats(
        total_users=total_users,
        total_vendors=total_vendors,
        total_applications=total_applications,
        financed_volume=float(financed_volume),
        cash_volume=float(cash_volume),
        total_revenue=float(financed_volume) + float(cash_volume),
        pending_applications=pending,
        active_loans=active,
        completed_loans=completed,
    )


@router.get("/cash-sales", response_model=List[schemas.CashSaleResponse])
def list_cash_sales(db: Session = Depends(get_db), _=Depends(require_admin)):
    return (
        db.query(models.CashSale)
        .options(joinedload(models.CashSale.product))
        .order_by(models.CashSale.id.desc())
        .all()
    )


@router.get("/lenders", response_model=List[schemas.LenderResponse])
def list_lenders(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.Lender).order_by(models.Lender.id).all()


@router.post("/lenders", response_model=schemas.LenderResponse)
def create_lender(
    payload: schemas.LenderCreate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    lender = models.Lender(
        name=payload.name,
        profit_rate=payload.profit_rate,
        max_tenure=payload.max_tenure,
        is_active=False,
    )
    db.add(lender)
    db.commit()
    db.refresh(lender)
    return lender


@router.put("/lenders/{lender_id}", response_model=schemas.LenderResponse)
def update_lender(
    lender_id: int,
    payload: schemas.LenderUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    lender = db.query(models.Lender).filter(models.Lender.id == lender_id).first()
    if not lender:
        raise HTTPException(status_code=404, detail="Lender not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(lender, k, v)
    db.commit()
    db.refresh(lender)
    return lender


@router.delete("/lenders/{lender_id}")
def delete_lender(lender_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    lender = db.query(models.Lender).filter(models.Lender.id == lender_id).first()
    if not lender:
        raise HTTPException(status_code=404, detail="Lender not found")
    db.delete(lender)
    db.commit()
    return {"ok": True}


@router.post("/lenders/{lender_id}/activate", response_model=schemas.LenderResponse)
def activate_lender(lender_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    lender = db.query(models.Lender).filter(models.Lender.id == lender_id).first()
    if not lender:
        raise HTTPException(status_code=404, detail="Lender not found")
    db.query(models.Lender).update({models.Lender.is_active: False})
    lender.is_active = True
    db.commit()
    db.refresh(lender)
    return lender
