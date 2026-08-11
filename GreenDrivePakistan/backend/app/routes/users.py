from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
def get_me(current_user=Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    if current_user["role"] == "vendor":
        vendor = db.query(models.Vendor).filter(models.Vendor.id == current_user["id"]).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        data = schemas.VendorResponse.model_validate(vendor).model_dump(mode="json")
        data["role"] = "vendor"
        return data
    user = db.query(models.User).filter(models.User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserResponse.model_validate(user)


@router.get("/", response_model=List[schemas.UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return (
        db.query(models.User)
        .filter(models.User.role == models.UserRole.USER)
        .order_by(models.User.id)
        .all()
    )
