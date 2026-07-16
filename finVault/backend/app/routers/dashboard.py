from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import *
from ..schemas import Dashboard
from ..security import current_user
from .. import services as svc
from ..workflows import successful,terminal
r=APIRouter(prefix='/api/dashboard',tags=['dashboard'])
@r.get('',response_model=Dashboard)
def dashboard(db:Session=Depends(get_db),u:User=Depends(current_user)):
 apps=db.scalars(svc.query_for(u)).unique().all(); unread=0
 from sqlalchemy import select,func
 unread=db.scalar(select(func.count()).select_from(MessageReceipt).where(MessageReceipt.user_id==u.id,MessageReceipt.read_at.is_(None))) or 0
 return Dashboard(total=len(apps),in_progress=sum(not terminal(a.status,a.product_type) for a in apps),successful=sum(a.status==successful(a.product_type) for a in apps),rejected=sum(a.status==ApplicationStatus.REJECTED for a in apps),unread_messages=unread)
