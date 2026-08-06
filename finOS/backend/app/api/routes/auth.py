from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.schemas import (
    LoginRequest,
    TokenResponse,
    SetPasswordRequest,
    InvitePreviewResponse,
)
from app.api.dependencies import get_current_user
from app.services.audit_service import log_audit, record_failed_login

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db), req: Request = None):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password) or not user.is_active:
        record_failed_login(request.email, req.client.host if req else None)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.must_set_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please set your password using the invite link emailed to you.",
        )
    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    log_audit(
        db, user.id, user.client_id, "auth", user.id, "login.succeeded",
        f"User {user.email} logged in", "", req.client.host if req else None,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        role=user.role.value,
        client_id=user.client_id,
    )


@router.get("/invite/{token}", response_model=InvitePreviewResponse)
def preview_invite(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.invite_token == token).first()
    if (
        not user
        or not user.invite_expires_at
        or user.invite_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")
    return InvitePreviewResponse(
        email=user.email,
        name=user.full_name,
        valid=True,
    )


@router.post("/set-password", response_model=TokenResponse)
def set_password(body: SetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.invite_token == body.token).first()
    if (
        not user
        or not user.invite_expires_at
        or user.invite_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")

    user.hashed_password = get_password_hash(body.password)
    user.invite_token = None
    user.invite_expires_at = None
    user.must_set_password = False
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        role=user.role.value,
        client_id=user.client_id,
    )


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "client_id": current_user.client_id,
    }
