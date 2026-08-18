from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter()


@router.get("/stats", response_model=schemas.DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    is_admin = current_user.role == models.UserRole.ADMIN
    inquiries_q = db.query(models.Inquiry)
    apps_q = db.query(models.Application)
    if not is_admin:
        inquiries_q = inquiries_q.filter(models.Inquiry.user_id == current_user.id)
        apps_q = apps_q.filter(models.Application.user_id == current_user.id)

    inquiries = inquiries_q.count()
    applications = apps_q.count()
    pending = apps_q.filter(models.Application.status == "pending").count()
    new_inq = inquiries_q.filter(models.Inquiry.status == "new").count()

    return schemas.DashboardStats(
        vehicles=db.query(models.Vehicle).count(),
        inquiries=inquiries,
        applications=applications,
        pending_applications=pending,
        new_inquiries=new_inq,
    )


@router.get("/inquiries", response_model=list[schemas.InquiryOut])
def list_inquiries(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Inquiry).order_by(models.Inquiry.created_at.desc())
    if current_user.role != models.UserRole.ADMIN:
        q = q.filter(models.Inquiry.user_id == current_user.id)
    return q.limit(200).all()


@router.get("/applications", response_model=list[schemas.ApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Application).order_by(models.Application.created_at.desc())
    if current_user.role != models.UserRole.ADMIN:
        q = q.filter(models.Application.user_id == current_user.id)
    return q.limit(200).all()
