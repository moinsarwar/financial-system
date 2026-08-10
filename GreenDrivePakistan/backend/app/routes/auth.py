from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db
from ..config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_cnic = db.query(models.User).filter(models.User.cnic == user.cnic).first()
    if existing_cnic:
        raise HTTPException(status_code=400, detail="CNIC already registered")

    db_user = models.User(
        email=user.email,
        name=user.name,
        password_hash=auth.get_password_hash(user.password),
        cnic=user.cnic,
        phone=user.phone,
        address=user.address,
        salary=user.salary,
        role=models.UserRole.USER,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if user and auth.verify_password(form_data.password, user.password_hash):
        token = auth.create_access_token(data={"sub": user.email, "role": "user"})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": schemas.UserResponse.model_validate(user).model_dump(mode="json"),
        }

    vendor = db.query(models.Vendor).filter(models.Vendor.email == form_data.username).first()
    if vendor and auth.verify_password(form_data.password, vendor.password_hash):
        token = auth.create_access_token(data={"sub": vendor.email, "role": "vendor"})
        payload = schemas.VendorResponse.model_validate(vendor).model_dump(mode="json")
        payload["role"] = "vendor"
        return {"access_token": token, "token_type": "bearer", "user": payload}

    if form_data.username == "admin@demo.com" and form_data.password == "admin123":
        token = auth.create_access_token(data={"sub": "admin@demo.com", "role": "admin"})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": 0,
                "email": "admin@demo.com",
                "name": "Super Admin",
                "role": "admin",
                "cnic": None,
                "is_active": True,
                "salary": 0,
            },
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/register-vendor", response_model=schemas.VendorResponse)
def register_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Vendor).filter(models.Vendor.email == vendor.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_vendor = models.Vendor(
        name=vendor.name,
        email=vendor.email,
        password_hash=auth.get_password_hash(vendor.password),
        description=vendor.description,
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor
