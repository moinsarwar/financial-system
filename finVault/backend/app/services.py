from datetime import datetime,timezone
from decimal import Decimal
from secrets import token_hex
from fastapi import HTTPException
from sqlalchemy import select,func
from sqlalchemy.orm import Session,selectinload
from . import models as M, schemas as S
from .workflows import stages,next_status,successful,terminal,document_requirements

def audit(db,u,action,details,app=None): db.add(M.AuditLog(user_id=u.id,application_id=app.id if app else None,action=action,details=details))
def query_for(user):
 q=select(M.Application).options(selectinload(M.Application.applicant),selectinload(M.Application.documents),selectinload(M.Application.status_events),selectinload(M.Application.info_requests))
 return q if user.role==M.UserRole.ADMIN else q.where(M.Application.applicant_id==user.id)
def get_app(db,num,user):
 a=db.scalar(query_for(user).where(M.Application.application_number==num))
 if not a: raise HTTPException(404,'Application not found')
 return a
def summary(a): return S.ApplicationSummary(application_number=a.application_number,applicant_name=a.applicant.name,applicant_public_id=a.applicant.public_id,product_type=a.product_type,status=a.status,amount=a.amount,version=a.version,created_at=a.created_at,document_count=len(a.documents),uploaded_count=sum(d.status in {M.DocumentStatus.UPLOADED,M.DocumentStatus.VERIFIED} for d in a.documents))
def detail(a): return S.ApplicationDetail(**summary(a).model_dump(),details=a.details,account_data=a.account_data,status_changed_at=a.status_changed_at,status_events=a.status_events,documents=a.documents,info_requests=a.info_requests)
def system_user(db): return db.scalar(select(M.User).where(M.User.role==M.UserRole.SYSTEM))
def add_message(db,a,sender,text):
 m=M.Communication(application_id=a.id,sender_id=sender.id,message=text); db.add(m); db.flush()
 recipients=db.scalars(select(M.User).where(M.User.is_active.is_(True), M.User.role.in_([M.UserRole.ADMIN,M.UserRole.APPLICANT]))).all()
 for u in recipients:
  if u.role==M.UserRole.ADMIN or u.id==a.applicant_id: db.add(M.MessageReceipt(message_id=m.id,user_id=u.id,read_at=datetime.now(timezone.utc) if u.id==sender.id else None))
 return m
def create_application(db,data,actor):
 applicant=actor
 if actor.role==M.UserRole.ADMIN:
  if not data.applicant_cnic: raise HTTPException(422,'applicant_cnic required for admin creation')
  applicant=db.scalar(select(M.User).where(M.User.cnic==data.applicant_cnic,M.User.role==M.UserRole.APPLICANT))
  if not applicant: raise HTTPException(404,'Applicant not found')
 if data.product_type==M.ProductType.BANK_ACCOUNT and not data.account_data: raise HTTPException(422,'account_data required for bank account')
 a=M.Application(application_number=f'APP-{datetime.now().year}-{token_hex(4).upper()}',applicant_id=applicant.id,product_type=data.product_type,amount=data.amount,details=data.details,account_data=data.account_data.model_dump(mode='json') if data.account_data else None,status_changed_at=datetime.now(timezone.utc)); db.add(a); db.flush()
 holder=(data.account_data.account_holder if data.account_data else 'individual')
 for code,name in document_requirements(data.product_type,holder): db.add(M.Document(application_id=a.id,requirement_code=code,display_name=name))
 db.add(M.StatusEvent(application_id=a.id,from_status=None,to_status=M.ApplicationStatus.DRAFT,changed_by_id=actor.id,reason='Application created')); audit(db,actor,'application_created',{'number':a.application_number},a)
 add_message(db,a,system_user(db) or actor,'Application created successfully.'); db.commit(); return get_app(db,a.application_number,actor)
def transition(db,a,target,actor,reason=None,expected=None):
 if expected is not None and a.version!=expected: raise HTTPException(409,'Application changed; refresh and retry')
 if actor.role!=M.UserRole.ADMIN and not (actor.id==a.applicant_id and a.status==M.ApplicationStatus.DRAFT and target==M.ApplicationStatus.SUBMITTED): raise HTTPException(403,'Not permitted')
 old=a.status
 if target==M.ApplicationStatus.REJECTED:
  if terminal(old,a.product_type): raise HTTPException(400,'Application is terminal')
  a.rejected_from_status=a.exception_return_status if old==M.ApplicationStatus.ADDITIONAL_INFO else old
 elif target!=next_status(old,a.product_type): raise HTTPException(400,f'Invalid transition from {old.value} to {target.value}')
 a.status=target; a.status_changed_at=datetime.now(timezone.utc); db.add(M.StatusEvent(application_id=a.id,from_status=old,to_status=target,changed_by_id=actor.id,reason=reason)); audit(db,actor,'status_changed',{'from':old.value,'to':target.value,'reason':reason},a); add_message(db,a,actor,f'Application moved to {target.value}.'); db.commit(); return get_app(db,a.application_number,actor)
def request_info(db,a,data,actor):
 if actor.role!=M.UserRole.ADMIN or terminal(a.status,a.product_type) or a.status==M.ApplicationStatus.ADDITIONAL_INFO: raise HTTPException(400,'Cannot request information now')
 a.exception_return_status=a.status; old=a.status; a.status=M.ApplicationStatus.ADDITIONAL_INFO; a.status_changed_at=datetime.now(timezone.utc)
 for item in data.items:
  if item.kind==M.RequestKind.DOCUMENT:
   doc=next((d for d in a.documents if d.requirement_code==item.document_requirement_code),None)
   if not doc: raise HTTPException(422,f'Unknown document requirement {item.document_requirement_code}')
   duplicate=next((r for r in a.info_requests if r.kind==M.RequestKind.DOCUMENT and r.document_requirement_code==item.document_requirement_code and r.status in {M.RequestStatus.OPEN,M.RequestStatus.SUBMITTED}),None)
   if duplicate: raise HTTPException(409,f'An active request already exists for {doc.display_name}')
   doc.status=M.DocumentStatus.REQUIRED
  db.add(M.InformationRequest(public_id='REQ-'+token_hex(5).upper(),application_id=a.id,kind=item.kind,label=item.label,document_requirement_code=item.document_requirement_code,requested_by_id=actor.id))
 db.add(M.StatusEvent(application_id=a.id,from_status=old,to_status=M.ApplicationStatus.ADDITIONAL_INFO,changed_by_id=actor.id,reason='Additional information requested')); audit(db,actor,'information_requested',{'count':len(data.items)},a); add_message(db,a,actor,'Additional information has been requested.'); db.commit(); return get_app(db,a.application_number,actor)
def submit_info(db,a,actor):
 if actor.id!=a.applicant_id or a.status!=M.ApplicationStatus.ADDITIONAL_INFO: raise HTTPException(400,'Not available')
 open_items=[r for r in a.info_requests if r.status==M.RequestStatus.OPEN]
 unresolved=[]
 for r in open_items:
  if r.kind==M.RequestKind.TEXT and not r.response_text: unresolved.append(r.label)
  if r.kind==M.RequestKind.DOCUMENT:
   d=next((x for x in a.documents if x.requirement_code==r.document_requirement_code),None)
   if not d or d.status not in {M.DocumentStatus.UPLOADED,M.DocumentStatus.VERIFIED}: unresolved.append(r.label)
 if unresolved: raise HTTPException(400,{'message':'Outstanding information','items':unresolved})
 now=datetime.now(timezone.utc)
 for r in open_items: r.status=M.RequestStatus.SUBMITTED; r.submitted_at=now
 add_message(db,a,actor,'Additional information submitted for review.'); audit(db,actor,'information_submitted',{},a); db.commit(); return get_app(db,a.application_number,actor)
def resolve_info(db,a,actor):
 if actor.role!=M.UserRole.ADMIN or a.status!=M.ApplicationStatus.ADDITIONAL_INFO: raise HTTPException(400,'Not available')
 items=[r for r in a.info_requests if r.status==M.RequestStatus.SUBMITTED]
 if not items: raise HTTPException(400,'Applicant has not submitted the requested information')
 now=datetime.now(timezone.utc)
 for r in items: r.status=M.RequestStatus.RESOLVED; r.resolved_by_id=actor.id; r.resolved_at=now
 old=a.status; a.status=a.exception_return_status or M.ApplicationStatus.REVIEW; a.exception_return_status=None; a.status_changed_at=now; db.add(M.StatusEvent(application_id=a.id,from_status=old,to_status=a.status,changed_by_id=actor.id,reason='Information resolved')); add_message(db,a,actor,'Additional information accepted.'); audit(db,actor,'information_resolved',{},a); db.commit(); return get_app(db,a.application_number,actor)
