from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta

from .. import schemas, models
from ..database import get_db
from ..auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(login_req: LoginRequest, db: Session = Depends(get_db)):
    # In OAuth2, the email is sent as "username"
    user = db.query(models.User).filter(models.User.email == login_req.username).first()
    if not user or not verify_password(login_req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Store minimal info in JWT
    token_data = {"sub": user.email, "role": user.role}
    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    
    # We can also pass user dict to frontend for easy reading
    user_info = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "reseller_id": user.reseller_id
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}
