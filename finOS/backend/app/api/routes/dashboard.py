from fastapi import APIRouter, Depends  
from sqlalchemy.orm import Session  
from app.api.dependencies import get_current_user  
from app.core.database import get_db  
from app.models.user import User, UserRole  
from app.models.client import Client  
from app.models.application import Application  
from app.models.policy import Policy  
from app.models.holding import Holding  
from app.models.claim import Claim  
from app.schemas import FunnelStats, DashboardStats  
from app.services.workflow_service import is_claim_open  
  
router = APIRouter()  
  
@router.get("/funnel", response_model=FunnelStats)  
def funnel_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):  
    query = db.query(Client)  
    if current_user.role == UserRole.CLIENT:  
        query = query.filter(Client.id == current_user.client_id)  
    clients = query.all()  
    leads = sum(1 for c in clients if c.lifecycle_stage == "lead")  
    applicants = sum(1 for c in clients if c.lifecycle_stage == "applicant")  
    customers = sum(1 for c in clients if c.lifecycle_stage == "customer")  
    claims = db.query(Claim)  
    if current_user.role == UserRole.CLIENT:  
        claims = claims.filter(Claim.client_id == current_user.client_id)  
    open_claims = sum(1 for c in claims.all() if is_claim_open(c))  
    return FunnelStats(leads=leads, applicants=applicants, customers=customers, openClaims=open_claims)  
  
@router.get("/stats", response_model=DashboardStats)  
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):  
    q = db.query(Client)  
    if current_user.role == UserRole.CLIENT:  
        q = q.filter(Client.id == current_user.client_id)  
    total_clients = q.count()  
    policies = db.query(Policy).filter(Policy.status == "active")  
    holdings = db.query(Holding).filter(Holding.status == "active")  
    if current_user.role == UserRole.CLIENT:  
        policies = policies.filter(Policy.client_id == current_user.client_id)  
        holdings = holdings.filter(Holding.client_id == current_user.client_id)  
    active_products = policies.count() + holdings.count()  
    claims = db.query(Claim)  
    if current_user.role == UserRole.CLIENT:  
        claims = claims.filter(Claim.client_id == current_user.client_id)  
    open_claims = sum(1 for c in claims.all() if is_claim_open(c))  
    apps = db.query(Application)  
    if current_user.role == UserRole.CLIENT:  
        apps = apps.filter(Application.client_id == current_user.client_id)  
    applications = apps.count()  
    return DashboardStats(  
        totalClients=total_clients,  
        activeProducts=active_products,  
        openClaims=open_claims,  
        applications=applications  
    )
