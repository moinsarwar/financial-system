from fastapi import APIRouter,Depends,HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import Token,UserOut
from ..security import verify_password,create_token,current_user
r=APIRouter(prefix='/api/auth',tags=['auth'])
@r.post('/login',response_model=Token)
def login(form:OAuth2PasswordRequestForm=Depends(),db:Session=Depends(get_db)):
 u=db.scalar(select(User).where(User.username==form.username,User.is_active.is_(True)))
 if not u or not verify_password(form.password,u.password_hash): raise HTTPException(401,'Invalid credentials')
 return Token(access_token=create_token(u.id))
@r.get('/me',response_model=UserOut)
def me(u:User=Depends(current_user)): return u
