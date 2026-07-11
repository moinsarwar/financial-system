from decimal import Decimal, ROUND_HALF_UP  
from datetime import datetime, timedelta, timezone  
import uuid  
from sqlalchemy.orm import Session  
from app.models.application import Application  
from app.models.policy import Policy  
from app.models.holding import Holding  
from app.models.client import Client  
from app.models.user import User  
  
def create_product_from_application(db: Session, app: Application):  
    client = db.query(Client).filter(Client.id == app.client_id).first()  
    if not client: return  
    existing_policy = db.query(Policy).filter(Policy.application_id == app.id).first()  
    existing_holding = db.query(Holding).filter(Holding.application_id == app.id).first()  
    if existing_policy or existing_holding: return  
  
    if app.product_type in ["motor", "health", "life", "travel", "business"]:  
        premium = (app.amount * Decimal("0.05")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)  
        policy = Policy(  
            id=f"POL-{uuid.uuid4().hex[:8].upper()}",  
            client_id=client.id,  
            product_type=app.product_type,  
            product_label=app.product_label,  
            application_id=app.id,  
            policy_number=f"POL-{uuid.uuid4().hex[:6].upper()}",  
            start_date=datetime.now(timezone.utc),  
            end_date=datetime.now(timezone.utc)+timedelta(days=365),  
            premium=premium,  
            sum_assured=app.amount * Decimal("10"),  
            status="active",  
        )  
        db.add(policy)  
    else:  
        holding = Holding(  
            id=f"HLD-{uuid.uuid4().hex[:8].upper()}",  
            client_id=client.id,  
            application_id=app.id,  
            product_type=app.product_type,  
            product_label=app.product_label,  
            holding_type=app.product_type + "-account",  
            status="active",  
            details={"balance": float(app.amount), "opened": datetime.now(timezone.utc).isoformat()},  # JSON-safe  
        )  
        db.add(holding)  
  
def get_products(db: Session, current_user, search: str = None, product_type: str = None,  
                 status: str = None, department: str = None):  
    from app.models.user import UserRole  
    policies_query = db.query(Policy).join(Client, Client.id == Policy.client_id)  
    if current_user.role == UserRole.CLIENT:  
        policies_query = policies_query.filter(Policy.client_id == current_user.client_id)  
    if search:  
        policies_query = policies_query.filter(Policy.product_label.ilike(f"%{search}%") | Policy.policy_number.ilike(f"%{search}%"))  
    if product_type:  
        policies_query = policies_query.filter(Policy.product_type == product_type)  
    if status:  
        policies_query = policies_query.filter(Policy.status == status)  
    if department:  
        policies_query = policies_query.filter(Client.assigned_department == department)  
    policies = policies_query.all()  
  
    holdings_query = db.query(Holding).join(Client, Client.id == Holding.client_id)  
    if current_user.role == UserRole.CLIENT:  
        holdings_query = holdings_query.filter(Holding.client_id == current_user.client_id)  
    if search:  
        holdings_query = holdings_query.filter(Holding.product_label.ilike(f"%{search}%") | Holding.id.ilike(f"%{search}%"))  
    if product_type:  
        holdings_query = holdings_query.filter(Holding.product_type == product_type)  
    if status:  
        holdings_query = holdings_query.filter(Holding.status == status)  
    if department:  
        holdings_query = holdings_query.filter(Client.assigned_department == department)  
    holdings = holdings_query.all()  
  
    result = []  
    for p in policies:  
        client = db.query(Client).filter(Client.id == p.client_id).first()  
        result.append({  
            "id": p.id,  
            "client_id": p.client_id,  
            "client_name": client.name if client else "",  
            "product_type": p.product_type,  
            "product_label": p.product_label,  
            "status": p.status,  
            "policy_number": p.policy_number,  
            "start_date": p.start_date,  
            "end_date": p.end_date,  
            "premium": p.premium,  
            "sum_assured": p.sum_assured,  
            "holding_type": None,  
            "opened_at": None,  
            "details": None,  
        })  
    for h in holdings:  
        client = db.query(Client).filter(Client.id == h.client_id).first()  
        result.append({  
            "id": h.id,  
            "client_id": h.client_id,  
            "client_name": client.name if client else "",  
            "product_type": h.product_type,  
            "product_label": h.product_label,  
            "status": h.status,  
            "policy_number": None,  
            "start_date": None,  
            "end_date": None,  
            "premium": None,  
            "sum_assured": None,  
            "holding_type": h.holding_type,  
            "opened_at": h.opened_at,  
            "details": h.details,  
        })  
    return result  
  
def get_product(db: Session, product_id: str, current_user):  
    from app.models.user import UserRole  
    policy = db.query(Policy).filter(Policy.id == product_id).first()  
    if policy:  
        if current_user.role == UserRole.CLIENT and policy.client_id != current_user.client_id:  
            return None  
        client = db.query(Client).filter(Client.id == policy.client_id).first()  
        return {  
            "id": policy.id,  
            "client_id": policy.client_id,  
            "client_name": client.name if client else "",  
            "product_type": policy.product_type,  
            "product_label": policy.product_label,  
            "status": policy.status,  
            "policy_number": policy.policy_number,  
            "start_date": policy.start_date,  
            "end_date": policy.end_date,  
            "premium": policy.premium,  
            "sum_assured": policy.sum_assured,  
            "holding_type": None,  
            "opened_at": None,  
            "details": None,  
        }  
    holding = db.query(Holding).filter(Holding.id == product_id).first()  
    if holding:  
        if current_user.role == UserRole.CLIENT and holding.client_id != current_user.client_id:  
            return None  
        client = db.query(Client).filter(Client.id == holding.client_id).first()  
        return {  
            "id": holding.id,  
            "client_id": holding.client_id,  
            "client_name": client.name if client else "",  
            "product_type": holding.product_type,  
            "product_label": holding.product_label,  
            "status": holding.status,  
            "policy_number": None,  
            "start_date": None,  
            "end_date": None,  
            "premium": None,  
            "sum_assured": None,  
            "holding_type": holding.holding_type,  
            "opened_at": holding.opened_at,  
            "details": holding.details,  
        }  
    return None
