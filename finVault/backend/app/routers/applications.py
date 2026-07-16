from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import *
from ..schemas import *
from ..security import current_user
from .. import services as svc
r=APIRouter(prefix='/api/applications',tags=['applications'])
@r.get('',response_model=list[ApplicationSummary])
def list_apps(product_type:ProductType|None=None,status:ApplicationStatus|None=None,db:Session=Depends(get_db),u:User=Depends(current_user)):
 q=svc.query_for(u).order_by(Application.created_at.desc())
 if product_type:q=q.where(Application.product_type==product_type)
 if status:q=q.where(Application.status==status)
 return [svc.summary(x) for x in db.scalars(q).unique().all()]
@r.post('',response_model=ApplicationDetail,status_code=201)
def create(data:ApplicationCreate,db:Session=Depends(get_db),u:User=Depends(current_user)): return svc.detail(svc.create_application(db,data,u))
@r.get('/{number}',response_model=ApplicationDetail)
def get(number:str,db:Session=Depends(get_db),u:User=Depends(current_user)): return svc.detail(svc.get_app(db,number,u))
@r.post('/{number}/status',response_model=ApplicationDetail)
def status(number:str,data:StatusUpdate,db:Session=Depends(get_db),u:User=Depends(current_user)): return svc.detail(svc.transition(db,svc.get_app(db,number,u),data.status,u,data.reason,data.expected_version))
@r.post('/{number}/submit',response_model=ApplicationDetail)
def submit(number:str,db:Session=Depends(get_db),u:User=Depends(current_user)): return svc.detail(svc.transition(db,svc.get_app(db,number,u),ApplicationStatus.SUBMITTED,u,'Submitted by applicant'))
@r.post('/{number}/information-requests',response_model=ApplicationDetail)
def request_info(number:str,data:InfoRequestCreate,db:Session=Depends(get_db),u:User=Depends(current_user)): return svc.detail(svc.request_info(db,svc.get_app(db,number,u),data,u))
@r.post('/{number}/information-requests/{request_id}/response',response_model=ApplicationDetail)
def respond(number:str,request_id:str,data:InfoResponse,db:Session=Depends(get_db),u:User=Depends(current_user)):
 a=svc.get_app(db,number,u); req=next((x for x in a.info_requests if x.public_id==request_id),None)
 if not req or req.kind!=RequestKind.TEXT: raise HTTPException(404,'Text request not found')
 if u.id!=a.applicant_id: raise HTTPException(403,'Not permitted')
 req.response_text=data.response_text; svc.audit(db,u,'text_information_responded',{'request_id':request_id},a); db.commit(); return svc.detail(svc.get_app(db,number,u))
@r.post('/{number}/information-requests/submit',response_model=ApplicationDetail)
def submit_info(number:str,db:Session=Depends(get_db),u:User=Depends(current_user)): return svc.detail(svc.submit_info(db,svc.get_app(db,number,u),u))
@r.post('/{number}/information-requests/resolve',response_model=ApplicationDetail)
def resolve_info(number:str,db:Session=Depends(get_db),u:User=Depends(current_user)): return svc.detail(svc.resolve_info(db,svc.get_app(db,number,u),u))
