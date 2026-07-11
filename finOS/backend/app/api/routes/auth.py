from fastapi import APIRouter, Depends, HTTPException, status, Request  
from sqlalchemy.orm import Session  
from app.core.database import get_db  
from app.core.security import verify_password, create_access_token  
from app.models.user import User  
from app.schemas import LoginRequest, TokenResponse  
from app.api.dependencies import get_current_user  
from app.services.audit_service import log_audit, record_failed_login  
  
router = APIRouter()  
  
@router.post("/login", response_model=TokenResponse)  
def login(request: LoginRequest, db: Session = Depends(get_db), req: Request = None):  
    user = db.query(User).filter(User.email == request.email).first()  
    if not user or not verify_password(request.password, user.hashed_password) or not user.is_active:  
        record_failed_login(request.email, req.client.host if req else None)  
        raise HTTPException(status_code=401, detail="Invalid credentials")  
    token = create_access_token(data={"sub": user.id, "role": user.role.value})  
    log_audit(db, user.id, user.client_id, "auth", user.id, "login.succeeded",  
              f"User {user.email} logged in", "", req.client.host if req else None)  
    return TokenResponse(  
        access_token=token,  
        token_type="bearer",  
        user_id=user.id,  
        full_name=user.full_name,  
        role=user.role.value,  
        client_id=user.client_id  
    )  
  
@router.get("/me")  
def me(current_user: User = Depends(get_current_user)):  
    return {  
        "id": current_user.id,  
        "email": current_user.email,  
        "full_name": current_user.full_name,  
        "role": current_user.role.value,  
        "client_id": current_user.client_id  
    }
