from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import schemas, models, crud
from ..database import get_db
from ..auth import (
    verify_password,
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(login_req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_req.username).first()
    if not user or not verify_password(login_req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.must_set_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please set your password using the invite link emailed to you.",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {"sub": user.email, "role": user.role}
    access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

    user_info = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "reseller_id": user.reseller_id,
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}


@router.get("/invite/{token}", response_model=schemas.InvitePreviewResponse)
def preview_invite(token: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_invite_token(db, token)
    if not user or not user.invite_expires_at or user.invite_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")

    reseller = crud.get_reseller(db, user.reseller_id) if user.reseller_id else None
    return {
        "email": user.email,
        "name": reseller.name if reseller else user.email,
        "valid": True,
    }


@router.post("/set-password", response_model=schemas.Token)
def set_password(body: schemas.SetPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_invite_token(db, body.token)
    if not user or not user.invite_expires_at or user.invite_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")

    user.hashed_password = get_password_hash(body.password)
    user.invite_token = None
    user.invite_expires_at = None
    user.must_set_password = False
    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires,
    )
    user_info = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "reseller_id": user.reseller_id,
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}
