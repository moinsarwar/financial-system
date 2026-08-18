from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db
from ..models import UserRole

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = auth.create_access_token({"sub": user.email, "role": role})
    return schemas.Token(
        access_token=token,
        role=role,
        name=user.name,
        email=user.email,
    )


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=payload.email.strip().lower(),
        password_hash=auth.get_password_hash(payload.password),
        name=payload.name.strip(),
        phone=(payload.phone or "").strip() or None,
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": user.email, "role": user.role.value})
    return schemas.Token(
        access_token=token,
        role=user.role.value,
        name=user.name,
        email=user.email,
    )


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    return schemas.UserOut(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        phone=current_user.phone,
        role=role,
    )
