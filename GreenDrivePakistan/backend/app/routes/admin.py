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


def _email_taken(db: Session, email: str, *, exclude_user_id: int | None = None, exclude_vendor_id: int | None = None) -> bool:
    uq = db.query(models.User).filter(models.User.email == email)
    if exclude_user_id is not None:
        uq = uq.filter(models.User.id != exclude_user_id)
    if uq.first():
        return True
    vq = db.query(models.Vendor).filter(models.Vendor.email == email)
    if exclude_vendor_id is not None:
        vq = vq.filter(models.Vendor.id != exclude_vendor_id)
    return vq.first() is not None


@router.get("/vendors", response_model=List[schemas.VendorResponse])
def admin_list_vendors(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.Vendor).order_by(models.Vendor.id).all()


@router.post("/vendors", response_model=schemas.VendorResponse)
def admin_create_vendor(
    payload: schemas.VendorCreate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    if _email_taken(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.Vendor).filter(models.Vendor.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Vendor name already exists")
    vendor = models.Vendor(
        name=payload.name.strip(),
        email=payload.email,
        password_hash=auth.get_password_hash(payload.password),
        description=payload.description,
        is_active=True,
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.put("/vendors/{vendor_id}", response_model=schemas.VendorResponse)
def admin_update_vendor(
    vendor_id: int,
    payload: schemas.VendorUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"] != vendor.email:
        if _email_taken(db, data["email"], exclude_vendor_id=vendor_id):
            raise HTTPException(status_code=400, detail="Email already registered")
    if "name" in data and data["name"] != vendor.name:
        clash = (
            db.query(models.Vendor)
            .filter(models.Vendor.name == data["name"], models.Vendor.id != vendor_id)
            .first()
        )
        if clash:
            raise HTTPException(status_code=400, detail="Vendor name already exists")
    password = data.pop("password", None)
    for k, v in data.items():
        setattr(vendor, k, v.strip() if isinstance(v, str) and k in ("name", "description") else v)
    if password:
        vendor.password_hash = auth.get_password_hash(password)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.post("/users", response_model=schemas.UserResponse)
def admin_create_user(
    payload: schemas.AdminUserCreate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    if payload.role != schemas.UserRole.USER:
        raise HTTPException(status_code=400, detail="Only role=user can be created here")
    if _email_taken(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.cnic == payload.cnic).first():
        raise HTTPException(status_code=400, detail="CNIC already registered")
    user = models.User(
        email=payload.email,
        name=payload.name.strip(),
        password_hash=auth.get_password_hash(payload.password),
        cnic=payload.cnic.strip(),
        phone=payload.phone,
        address=payload.address,
        salary=payload.salary or 0,
        role=models.UserRole.USER,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def admin_update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot edit admin accounts here")
    data = payload.model_dump(exclude_unset=True)
    if "role" in data and data["role"] != schemas.UserRole.USER:
        raise HTTPException(status_code=400, detail="Platform users must keep role=user")
    if "email" in data and data["email"] != user.email:
        if _email_taken(db, data["email"], exclude_user_id=user_id):
            raise HTTPException(status_code=400, detail="Email already registered")
    if "cnic" in data and data["cnic"] != user.cnic:
        clash = (
            db.query(models.User)
            .filter(models.User.cnic == data["cnic"], models.User.id != user_id)
            .first()
        )
        if clash:
            raise HTTPException(status_code=400, detail="CNIC already registered")
    password = data.pop("password", None)
    data.pop("role", None)
    for k, v in data.items():
        setattr(user, k, v.strip() if isinstance(v, str) and k in ("name", "cnic", "phone", "address") else v)
    user.role = models.UserRole.USER
    if password:
        user.password_hash = auth.get_password_hash(password)
    db.commit()
    db.refresh(user)
    return user
