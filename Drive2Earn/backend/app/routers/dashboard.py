from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter()


def _estimate_out(row: models.AffordabilityEstimate) -> schemas.AffordabilityRecord:
    return schemas.AffordabilityRecord(
        id=row.id,
        user_id=row.user_id,
        vehicle_key=row.vehicle_key,
        income=row.income,
        employment=row.employment,
        deposit=row.deposit,
        vehicle_price=row.vehicle_price,
        monthly_vehicle_cost=row.monthly_vehicle_cost,
        repayment_ratio=row.repayment_ratio,
        status=row.status,
        follow_up=row.follow_up or "new",
        suggested_vehicle=row.suggested_vehicle,
        created_at=row.created_at,
        customer_name=row.user.name if row.user else None,
        customer_email=row.user.email if row.user else None,
    )


@router.get("/stats", response_model=schemas.DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    is_admin = current_user.role == models.UserRole.ADMIN
    apps_q = db.query(models.Application)
    est_q = db.query(models.AffordabilityEstimate)
    if not is_admin:
        apps_q = apps_q.filter(models.Application.user_id == current_user.id)
        est_q = est_q.filter(models.AffordabilityEstimate.user_id == current_user.id)

    applications = apps_q.count()
    pending = apps_q.filter(models.Application.status == "pending").count()
    estimates = est_q.count()
    new_est = est_q.filter(models.AffordabilityEstimate.follow_up == "new").count()

    return schemas.DashboardStats(
        vehicles=db.query(models.Vehicle).count(),
        applications=applications,
        pending_applications=pending,
        estimates=estimates,
        new_estimates=new_est,
    )


@router.get("/applications", response_model=list[schemas.ApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Application).order_by(models.Application.created_at.desc())
    if current_user.role != models.UserRole.ADMIN:
        q = q.filter(models.Application.user_id == current_user.id)
    return q.limit(200).all()


@router.get("/estimates", response_model=list[schemas.AffordabilityRecord])
def list_estimates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.AffordabilityEstimate).order_by(models.AffordabilityEstimate.created_at.desc())
    if current_user.role != models.UserRole.ADMIN:
        q = q.filter(models.AffordabilityEstimate.user_id == current_user.id)
    return [_estimate_out(row) for row in q.limit(200).all()]


@router.patch("/estimates/{estimate_id}/status", response_model=schemas.AffordabilityRecord)
def update_estimate_follow_up(
    estimate_id: int,
    payload: schemas.StatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    row = db.query(models.AffordabilityEstimate).filter(models.AffordabilityEstimate.id == estimate_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Estimate not found")
    row.follow_up = payload.status.strip()
    db.commit()
    db.refresh(row)
    return _estimate_out(row)
