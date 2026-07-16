from datetime import datetime,timedelta,timezone
from fastapi import Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError,jwt
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .models import User
pwd=PasswordHash.recommended(); oauth2=OAuth2PasswordBearer(tokenUrl='/api/auth/login')
def hash_password(v): return pwd.hash(v)
def verify_password(p,h): return pwd.verify(p,h)
def create_token(uid:int): return jwt.encode({'sub':str(uid),'exp':datetime.now(timezone.utc)+timedelta(minutes=settings.access_token_expire_minutes)},settings.secret_key,algorithm='HS256')
def current_user(token:str=Depends(oauth2),db:Session=Depends(get_db)):
 try: uid=int(jwt.decode(token,settings.secret_key,algorithms=['HS256'])['sub'])
 except (JWTError,KeyError,ValueError): raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail='Invalid token')
 u=db.scalar(select(User).where(User.id==uid,User.is_active.is_(True)))
 if not u: raise HTTPException(status_code=401,detail='Inactive user')
 return u
