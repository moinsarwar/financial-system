import uuid  
from decimal import Decimal  
from datetime import datetime, timezone  
from sqlalchemy.orm import Session  
from app.models.claim import Claim  
from app.models.client import Client  
from app.models.policy import Policy  
from app.models.holding import Holding
from app.models.user import User, UserRole  
from app.schemas import ClaimCreate, ClaimResolutionRequest  
from app.services.audit_service import log_audit  
from app.services.workflow_service import (  
    get_workflow, is_claim_open,  
    advance_claim_state, resolve_claim_state,  
    update_client_lifecycle_state  
)  
  
def get_claims(db: Session, current_user: User, search: str = None, step: str = None,  
               department: str = None, open_only: bool = False):  
    query = db.query(Claim).join(Client, Client.id == Claim.client_id)  
    if current_user.role == UserRole.CLIENT:  
        query = query.filter(Claim.client_id == current_user.client_id)  
    if search:  
        query = query.filter(Client.name.ilike(f"%{search}%") | Claim.id.ilike(f"%{search}%") | Claim.product_label.ilike(f"%{search}%"))  
    if step:  
        query = query.filter(Claim.current_step == step)  
    if department:  
        query = query.filter(Claim.product_type == department)  
    if open_only:  
        query = query.filter(Claim.current_step.notin_(["Payment Confirmed","Authorization Denied","Partially Approved","Fraud Review"]))  
    return query.order_by(Claim.updated_at.desc()).all()  
  
def get_claim(db: Session, claim_id: str, current_user: User):  
    claim = db.query(Claim).filter(Claim.id == claim_id).first()  
    if not claim: return None  
    if current_user.role == UserRole.CLIENT and claim.client_id != current_user.client_id:  
        return None  
    return claim  
  
def create_claim(db: Session, data: ClaimCreate, current_user: User,  
                 ip_address: str = None, request_id: str = None):  
    client = db.query(Client).filter(Client.id == data.client_id).first()  
    if not client: raise ValueError("Client not found")  
    if current_user.role == UserRole.CLIENT and client.id != current_user.client_id:  
        raise PermissionError("Cannot create claim for another client")  
    policy = db.query(Policy).filter(Policy.id == data.policy_id).first()  
    holding = None
    if not policy:
        holding = db.query(Holding).filter(Holding.id == data.policy_id).first()
    if not policy and not holding:
        raise ValueError("Policy not found")  
        
    p_client_id = policy.client_id if policy else holding.client_id
    p_status = policy.status if policy else holding.status
    p_product_type = policy.product_type if policy else holding.product_type
    p_product_label = policy.product_label if policy else holding.product_label
    
    if p_client_id != data.client_id:  
        raise ValueError("Policy does not belong to the selected client")  
    if p_status != "active":  
        raise ValueError("Claims can only be created against an active policy")  
        
    steps = get_workflow(p_product_type, "claim")  
    claim = Claim(  
        id=f"CLM-{uuid.uuid4().hex[:8].upper()}",  
        client_id=data.client_id,  
        product_type=p_product_type,  
        product_label=p_product_label,  
        policy_id=data.policy_id,  
        type=data.type,  
        amount=data.amount,  
        currency="PKR",  
        current_step=steps[0],  
        step_index=0,  
        steps=steps,  
        incident_date=datetime.now(timezone.utc),  
        description=data.description,  
        severity="Standard",  
        reserve_amount=data.amount,  
        approved_amount=Decimal("0"),  
        fraud_indicator=False,  
        timeline=[{"time": datetime.now(timezone.utc).isoformat(), "event": "Claim created", "user": current_user.full_name or current_user.id}]  
    )  
    db.add(claim)  
    db.flush()  
    log_audit(db, current_user.id, client.id, "claim", claim.id, "claim.created",  
              f"Created claim {claim.id}", p_product_type, ip_address, request_id)  
    update_client_lifecycle_state(db, client.id)  
    db.refresh(claim)  
    return claim  
  
def advance_claim_service(db: Session, claim_id: str, current_user: User,  
                          ip_address: str = None, request_id: str = None):  
    claim = db.query(Claim).filter(Claim.id == claim_id).with_for_update().first()  
    if not claim: raise ValueError("Claim not found")  
    if current_user.role == UserRole.CLIENT and claim.client_id != current_user.client_id:  
        raise PermissionError("Cannot access this claim")  
    allowed_roles = {UserRole.CLAIMS_AGENT, UserRole.OPERATIONS_MANAGER, UserRole.ADMINISTRATOR}  
    if current_user.role not in allowed_roles:  
        raise PermissionError("Only claims or operations users may advance")  
    if not is_claim_open(claim):  
        raise ValueError("Claim is already resolved")  
    advance_claim_state(db, claim, current_user.id)  
    log_audit(db, current_user.id, claim.client_id, "claim", claim.id, "claim.advanced",  
              f"Advanced to {claim.current_step}", claim.product_type, ip_address, request_id)  
    db.flush()  
    db.refresh(claim)  
    return claim  
  
def resolve_claim_service(db: Session, claim_id: str, resolution: ClaimResolutionRequest,  
                          current_user: User, ip_address: str = None, request_id: str = None):  
    claim = db.query(Claim).filter(Claim.id == claim_id).with_for_update().first()  
    if not claim: raise ValueError("Claim not found")  
    if current_user.role == UserRole.CLIENT and claim.client_id != current_user.client_id:  
        raise PermissionError("Cannot access this claim")  
    allowed_roles = {UserRole.CLAIMS_AGENT, UserRole.OPERATIONS_MANAGER, UserRole.ADMINISTRATOR}  
    if current_user.role not in allowed_roles:  
        raise PermissionError("Only claims or operations users may resolve")  
    if not is_claim_open(claim):  
        raise ValueError("Claim is already resolved")  
    # Require reason code for adverse outcomes  
    adverse = ["Authorization Denied", "Partially Approved", "Fraud Review"]  
    if resolution.outcome in adverse and not resolution.reason_code:  
        raise ValueError("Reason code required for adverse outcome")  
    resolve_claim_state(
        db=db,
        claim=claim,
        outcome=resolution.outcome,
        reason_code=resolution.reason_code,
        notes=resolution.notes,
        user_id=current_user.id,
    )  
    log_audit(db, current_user.id, claim.client_id, "claim", claim.id, "claim.resolved",  
              f"Resolved with outcome {resolution.outcome}", claim.product_type, ip_address, request_id)  
    db.flush()  
    db.refresh(claim)  
    return claim

def add_claim_message(db: Session, claim_id: str, current_user: User, message: str,  
                      ip_address: str = None, request_id: str = None):  
    claim = db.query(Claim).filter(Claim.id == claim_id).with_for_update().first()  
    if not claim: raise ValueError("Claim not found")  
    if current_user.role == UserRole.CLIENT and claim.client_id != current_user.client_id:  
        raise PermissionError("Cannot access this claim")  
    timeline = list(claim.timeline)  
    timeline.append({  
        "time": datetime.now(timezone.utc).isoformat(),  
        "event": f"Message: {message}",  
        "user": current_user.full_name or current_user.id  
    })  
    claim.timeline = timeline  
    db.commit()  
    db.refresh(claim)  
    return claim  

def reset_claim_service(db: Session, claim_id: str, current_user: User,  
                        ip_address: str = None, request_id: str = None):  
    claim = db.query(Claim).filter(Claim.id == claim_id).with_for_update().first()  
    if not claim: raise ValueError("Claim not found")  
    allowed_roles = {UserRole.CLAIMS_AGENT, UserRole.OPERATIONS_MANAGER, UserRole.ADMINISTRATOR}  
    if current_user.role not in allowed_roles:  
        raise PermissionError("Only claims or operations users may reset claims")  
    
    claim.current_step = claim.steps[0]
    claim.step_index = 0
    claim.resolution_outcome = None
    claim.resolution_reason_code = None
    claim.resolution_notes = None

    timeline = list(claim.timeline)  
    timeline.append({  
        "time": datetime.now(timezone.utc).isoformat(),  
        "event": "Claim reset to first step (Draft/Event Reported)",  
        "user": current_user.full_name or current_user.id  
    })  
    claim.timeline = timeline  
    db.commit()  
    log_audit(db, current_user.id, claim.client_id, "claim", claim.id, "claim.reset",  
              f"Reset claim {claim.id} to step 0", claim.product_type, ip_address, request_id)  
    db.refresh(claim)  
    return claim
