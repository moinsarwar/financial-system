from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas, auth
from ..database import get_db
from ..config import get_settings
from ..services.finance import (
    calculate_down_payment,
    calculate_monthly_installment,
    calculate_product_profit,
    calculate_repayment_schedule,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])
settings = get_settings()


@router.post("/", response_model=schemas.ApplicationResponse)
def create_application(
    payload: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] != "user":
        raise HTTPException(status_code=403, detail="Only users can apply")

    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")

    lender = db.query(models.Lender).filter(models.Lender.is_active == True).first()  # noqa: E712
    profit_rate = lender.profit_rate if lender else settings.LENDER_PROFIT_RATE
    tenure = lender.max_tenure if lender else settings.MAX_TENURE_MONTHS

    profit = calculate_product_profit(product.price, profit_rate)
    down_payment = calculate_down_payment(product.price)
    monthly = calculate_monthly_installment(product.price, profit, tenure)
    total_deferred = product.price + profit

    app_row = models.Application(
        user_id=current_user["id"],
        product_id=product.id,
        vendor_id=product.vendor_id,
        lender_id=lender.id if lender else None,
        status=models.ApplicationStatus.PENDING_REVIEW,
        down_payment=down_payment,
        monthly_installment=monthly,
        tenure=tenure,
        total_deferred=total_deferred,
        paid_amount=0,
        remaining_amount=total_deferred,
        application_details=payload.application_details.model_dump(),
    )
    db.add(app_row)
    db.commit()
    db.refresh(app_row)

    return (
        db.query(models.Application)
        .options(
            joinedload(models.Application.product),
            joinedload(models.Application.vendor),
            joinedload(models.Application.user),
            joinedload(models.Application.repayments),
        )
        .filter(models.Application.id == app_row.id)
        .first()
    )


def _app_query(db: Session):
    return db.query(models.Application).options(
        joinedload(models.Application.product).joinedload(models.Product.vendor),
        joinedload(models.Application.vendor),
        joinedload(models.Application.user),
        joinedload(models.Application.repayments),
    )


def _ensure_repayment_schedule(db: Session, app_row: models.Application, start: datetime) -> None:
    existing = (
        db.query(models.Repayment)
        .filter(models.Repayment.application_id == app_row.id)
        .count()
    )
    if existing > 0:
        return
    schedule = calculate_repayment_schedule(app_row.total_deferred, app_row.tenure, start)
    for item in schedule:
        db.add(
            models.Repayment(
                application_id=app_row.id,
                user_id=app_row.user_id,
                due_date=item["due_date"],
                amount=item["amount"],
                status=models.RepaymentStatus.PENDING,
            )
        )
    if schedule:
        app_row.next_due_date = schedule[0]["due_date"]
        app_row.paid_amount = app_row.paid_amount or 0
        app_row.remaining_amount = round(sum(s["amount"] for s in schedule), 2)
    else:
        app_row.remaining_amount = app_row.total_deferred
        app_row.paid_amount = 0


@router.get("/", response_model=List[schemas.ApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    q = _app_query(db)
    role = current_user["role"]
    if role == "user":
        q = q.filter(models.Application.user_id == current_user["id"])
    elif role == "vendor":
        q = q.filter(models.Application.vendor_id == current_user["id"])
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return q.order_by(models.Application.id.desc()).all()


@router.get("/{application_id}", response_model=schemas.ApplicationResponse)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    app_row = (
        _app_query(db)
        .filter(models.Application.id == application_id)
        .first()
    )
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    role = current_user["role"]
    if role == "user" and app_row.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role == "vendor" and app_row.vendor_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return app_row


@router.patch("/{application_id}/status", response_model=schemas.ApplicationResponse)
def update_status(
    application_id: int,
    payload: schemas.ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Only vendor/admin can update status")

    app_row = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user["role"] == "vendor" and app_row.vendor_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    new_status = models.ApplicationStatus(payload.status.value)
    app_row.status = new_status
    now = datetime.utcnow()
    if new_status in (models.ApplicationStatus.REVIEWED, models.ApplicationStatus.APPROVED):
        app_row.reviewed_date = now
    if new_status in (models.ApplicationStatus.APPROVED, models.ApplicationStatus.ACTIVE):
        app_row.approved_date = now
        _ensure_repayment_schedule(db, app_row, now)
    db.commit()
    return _app_query(db).filter(models.Application.id == application_id).first()


@router.post("/{application_id}/repayments/{repayment_id}/pay", response_model=schemas.ApplicationResponse)
def mark_repayment_paid(
    application_id: int,
    repayment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    app_row = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")

    role = current_user["role"]
    if role == "user" and app_row.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role not in ("user", "admin"):
        raise HTTPException(status_code=403, detail="Only user/admin can mark repayments paid")

    repayment = (
        db.query(models.Repayment)
        .filter(
            models.Repayment.id == repayment_id,
            models.Repayment.application_id == application_id,
        )
        .first()
    )
    if not repayment:
        raise HTTPException(status_code=404, detail="Repayment not found")
    if repayment.status == models.RepaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Repayment already paid")

    now = datetime.utcnow()
    repayment.status = models.RepaymentStatus.PAID
    repayment.paid_date = now

    app_row.paid_amount = round((app_row.paid_amount or 0) + repayment.amount, 2)
    app_row.remaining_amount = round(max(0.0, (app_row.remaining_amount or 0) - repayment.amount), 2)

    next_pending = (
        db.query(models.Repayment)
        .filter(
            models.Repayment.application_id == application_id,
            models.Repayment.status != models.RepaymentStatus.PAID,
            models.Repayment.id != repayment_id,
        )
        .order_by(models.Repayment.due_date.asc())
        .first()
    )
    app_row.next_due_date = next_pending.due_date if next_pending else None
    if not next_pending and (app_row.remaining_amount or 0) <= 0:
        app_row.status = models.ApplicationStatus.COMPLETED

    db.commit()
    return _app_query(db).filter(models.Application.id == application_id).first()
