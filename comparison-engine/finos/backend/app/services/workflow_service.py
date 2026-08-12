import uuid  
from decimal import Decimal  
from datetime import datetime, timezone  
from sqlalchemy.orm import Session  
from app.models.application import Application  
from app.models.claim import Claim  
from app.models.client import Client, LifecycleStage  
from app.models.policy import Policy  
from app.models.holding import Holding  
from app.services.product_service import create_product_from_application  
  
WORKFLOWS = {  
    "motor": {"application": ["Selection","Payment","Submitted to Insurer","Underwriting Review","Terms Offered","Policy Issued"]},  
    "health": {"application": ["Selection","Payment","Submitted to Insurer","Underwriting Review","Terms Offered","Policy Issued"]},  
    "life": {"application": ["Selection","Payment","Submitted to Insurer","Underwriting Review","Terms Offered","Policy Issued"]},  
    "travel": {"application": ["Selection","Payment","Submitted to Insurer","Underwriting Review","Terms Offered","Policy Issued"]},  
    "business": {"application": ["Selection","Payment","Submitted to Insurer","Underwriting Review","Terms Offered","Policy Issued"]},  
    "loan": {"application": ["Selection","KYC Submitted","Credit Assessment","Approval","Disbursement"]},  
    "savings": {"application": ["Selection","KYC Submitted","Account Verification","Account Opened"]},  
    "credit": {"application": ["Selection","KYC Submitted","Credit Assessment","Approval","Card Issued"]},  
}  
CLAIM_STEPS = ["Event Reported","Evidence Collated","Submitted to Insurer","Under Review","Decision Advised"]  
CLAIM_OUTCOMES = ["Payment Confirmed","Authorization Denied","Partially Approved","Fraud Review"]  
  
def get_workflow(product_type: str, kind: str) -> list:  
    if kind == "application":  
        return WORKFLOWS.get(product_type, {}).get("application", ["Selection","Processing","Completed"])  
    return CLAIM_STEPS.copy()  
  
def is_application_active(app: Application) -> bool:  
    return app.status not in ["completed","declined","withdrawn"] and app.step_index < len(app.steps)-1  
  
def is_claim_open(claim: Claim) -> bool:  
    return claim.current_step not in CLAIM_OUTCOMES  
  
def advance_application_state(db: Session, app: Application, user_id: str) -> Application:  
    app.step_index += 1  
    app.current_step = app.steps[app.step_index]  
    app.updated_at = datetime.now(timezone.utc)  
    app.timeline = app.timeline + [{"time": datetime.now(timezone.utc).isoformat(), "event": f"Advanced to {app.current_step}", "user": user_id}]  
    if app.step_index >= len(app.steps) - 1:  
        app.status = "completed"  
        app.timeline = app.timeline + [{"time": datetime.now(timezone.utc).isoformat(), "event": "Application completed", "user": user_id}]  
        create_product_from_application(db, app)  
        db.flush()  
    update_client_lifecycle_state(db, app.client_id)  
    return app  
  
def advance_claim_state(db: Session, claim: Claim, user_id: str) -> Claim:  
    if claim.current_step == "Decision Advised":  
        raise ValueError("Claim is awaiting resolution")  
    if claim.step_index >= len(claim.steps) - 1:  
        raise ValueError("Claim is already at final step")  
    claim.step_index += 1  
    claim.current_step = claim.steps[claim.step_index]  
    claim.updated_at = datetime.now(timezone.utc)  
    claim.timeline = claim.timeline + [{"time": datetime.now(timezone.utc).isoformat(), "event": f"Advanced to {claim.current_step}", "user": user_id}]  
    db.flush()  
    update_client_lifecycle_state(db, claim.client_id)  
    return claim  
  
def resolve_claim_state(
    db: Session,
    claim: Claim,
    outcome: str,
    reason_code: str,
    notes: str | None,
    user_id: str,
) -> Claim:
    if outcome not in CLAIM_OUTCOMES:
        raise ValueError(
            "Invalid claim outcome",
        )

    if claim.current_step != "Decision Advised":
        raise ValueError(
            "Claim must be at Decision Advised",
        )

    now = datetime.now(timezone.utc)

    claim.current_step = outcome
    claim.outcome = outcome.lower().replace(
        " ",
        "_",
    )
    claim.steps = [
        *CLAIM_STEPS,
        outcome,
    ]
    claim.step_index = len(claim.steps) - 1
    claim.updated_at = now
    claim.resolution_reason_code = reason_code
    claim.resolution_notes = notes
    claim.resolved_at = now
    claim.resolved_by_user_id = user_id

    claim.timeline = [
        *(claim.timeline or []),
        {
            "time": now.isoformat(),
            "event": (
                f"Claim resolved as {outcome}; "
                f"reason code: {reason_code}"
            ),
            "user": user_id,
        },
    ]

    if outcome == "Payment Confirmed":
        claim.approved_amount = claim.amount
        claim.payment_ref = (
            f"PAY-{uuid.uuid4().hex[:8].upper()}"
        )

    elif outcome == "Partially Approved":
        claim.approved_amount = (
            claim.amount * Decimal("0.50")
        ).quantize(
            Decimal("0.01"),
        )
        claim.payment_ref = (
            f"PAY-{uuid.uuid4().hex[:8].upper()}"
        )

    else:
        claim.approved_amount = Decimal("0.00")

    db.flush()

    update_client_lifecycle_state(
        db,
        claim.client_id,
    )

    return claim  
  
def update_client_lifecycle_state(db: Session, client_id: str):  
    client = db.query(Client).filter(Client.id == client_id).first()  
    if not client: return  
    has_open_claim = db.query(Claim).filter(Claim.client_id == client_id, Claim.current_step.notin_(CLAIM_OUTCOMES)).count() > 0  
    has_active_policy = db.query(Policy).filter(Policy.client_id == client_id, Policy.status == "active").count() > 0  
    has_active_holding = db.query(Holding).filter(Holding.client_id == client_id, Holding.status == "active").count() > 0  
    has_active_app = db.query(Application).filter(Application.client_id == client_id, Application.status == "in-progress").count() > 0  
    if has_active_policy or has_active_holding or has_open_claim:  
        client.lifecycle_stage = LifecycleStage.CUSTOMER  
    elif has_active_app:  
        client.lifecycle_stage = LifecycleStage.APPLICANT  
    else:  
        client.lifecycle_stage = LifecycleStage.LEAD  
    client.has_open_claim = has_open_claim  
    client.last_activity = datetime.now(timezone.utc)
