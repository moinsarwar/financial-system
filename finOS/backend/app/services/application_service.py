import uuid  
from decimal import Decimal  
from datetime import datetime, timezone  
from sqlalchemy.orm import Session  
from app.models.application import Application  
from app.models.client import Client  
from app.models.user import User, UserRole  
from app.schemas import ApplicationCreate, ApplicationDecisionRequest  
from app.services.audit_service import log_audit  
from app.services.workflow_service import (  
    advance_application_state, get_workflow, is_application_active,  
    update_client_lifecycle_state  
)  
  
def get_applications(db: Session, current_user: User, search: str = None, step: str = None,  
                     department: str = None, status: str = None):  
    query = db.query(Application).join(Client, Client.id == Application.client_id)  
    if current_user.role == UserRole.CLIENT:  
        query = query.filter(Application.client_id == current_user.client_id)  
    if search:  
        query = query.filter(Client.name.ilike(f"%{search}%") | Application.id.ilike(f"%{search}%") | Application.product_label.ilike(f"%{search}%"))  
    if step:  
        query = query.filter(Application.current_step == step)  
    if department:  
        query = query.filter(Application.department == department)  
    if status:  
        query = query.filter(Application.status == status)  
    return query.order_by(Application.updated_at.desc()).all()  
  
def get_application(db: Session, app_id: str, current_user: User):  
    app = db.query(Application).filter(Application.id == app_id).first()  
    if not app: return None  
    if current_user.role == UserRole.CLIENT and app.client_id != current_user.client_id:  
        return None  
    return app  
  
def create_application(db: Session, data: ApplicationCreate, current_user: User,  
                       ip_address: str = None, request_id: str = None):  
    client = db.query(Client).filter(Client.id == data.client_id).first()  
    if not client: raise ValueError("Client not found")  
    if current_user.role == UserRole.CLIENT and client.id != current_user.client_id:  
        raise PermissionError("Cannot create application for another client")  
    steps = get_workflow(data.product_type, "application")  
    app = Application(  
        id=f"APP-{uuid.uuid4().hex[:8].upper()}",  
        client_id=data.client_id,  
        product_type=data.product_type,  
        product_label=data.product_type.replace("_", " ").title(),  
        department=client.assigned_department,  
        steps=steps,  
        step_index=0,  
        current_step=steps[0],  
        amount=data.amount,  
        currency="PKR",  
        status="in-progress",  
        timeline=[{"time": datetime.now(timezone.utc).isoformat(), "event": "Application created", "user": current_user.full_name or current_user.id}]  
    )  
    db.add(app)  
    db.flush()  
    log_audit(db, current_user.id, client.id, "application", app.id, "application.created",  
              f"Created application {app.id}", app.department or "", ip_address, request_id)  
    update_client_lifecycle_state(db, client.id)  
    db.refresh(app)  
    return app  
  
def advance_application_service(db: Session, app_id: str, current_user: User,  
                                ip_address: str = None, request_id: str = None):  
    app = db.query(Application).filter(Application.id == app_id).with_for_update().first()  
    if not app: raise ValueError("Application not found")  
    if current_user.role == UserRole.CLIENT and app.client_id != current_user.client_id:  
        raise PermissionError("Cannot access this application")  
    allowed_roles = {UserRole.OPERATIONS_AGENT, UserRole.OPERATIONS_MANAGER, UserRole.ADMINISTRATOR}  
    if current_user.role not in allowed_roles:  
        raise PermissionError("Only operations users may advance")  
    if not is_application_active(app):  
        raise ValueError("Application cannot be advanced")  
    advance_application_state(db, app, current_user.id)  
    log_audit(db, current_user.id, app.client_id, "application", app.id, "application.advanced",  
              f"Advanced to {app.current_step}", app.department or "", ip_address, request_id)  
    db.flush()  
    db.refresh(app)  
    return app  
  
def decide_application(
    db: Session,
    app_id: str,
    decision: ApplicationDecisionRequest,
    current_user: User,
    ip_address: str | None = None,
    request_id: str | None = None,
) -> Application:
    app = (
        db.query(Application)
        .filter(Application.id == app_id)
        .with_for_update()
        .first()
    )

    if not app:
        raise ValueError("Application not found")

    if (
        current_user.role == UserRole.CLIENT
        and app.client_id != current_user.client_id
    ):
        raise PermissionError(
            "Cannot access this application",
        )

    allowed_roles = {
        UserRole.OPERATIONS_AGENT,
        UserRole.OPERATIONS_MANAGER,
        UserRole.UNDERWRITER,
        UserRole.ADMINISTRATOR,
    }

    if current_user.role not in allowed_roles:
        raise PermissionError(
            "Only authorized users may decide applications",
        )

    if app.status != "in-progress":
        raise ValueError(
            "Application is not in progress",
        )

    now = datetime.now(timezone.utc)

    app.status = decision.outcome
    app.decision_reason_code = decision.reason_code
    app.decision_notes = decision.notes
    app.decided_at = now
    app.decided_by_user_id = current_user.id
    app.updated_at = now

    if decision.outcome == "declined":
        app.current_step = "Declined"

    elif decision.outcome == "withdrawn":
        app.current_step = "Withdrawn"

    elif decision.outcome == "approved":
        app.current_step = "Approved"

    app.timeline = [
        *(app.timeline or []),
        {
            "time": now.isoformat(),
            "event": (
                f"Application {decision.outcome}; "
                f"reason code: {decision.reason_code}"
            ),
            "user": current_user.full_name,
        },
    ]

    log_audit(
        db=db,
        actor_user_id=current_user.id,
        client_id=app.client_id,
        subject_type="application",
        subject_id=app.id,
        event=f"application.{decision.outcome}",
        details=(
            f"Application {decision.outcome}; "
            f"reason code {decision.reason_code}"
        ),
        department=app.department or "",
        ip_address=ip_address,
        request_id=request_id,
    )

    db.flush()

    update_client_lifecycle_state(
        db,
        app.client_id,
    )

    db.flush()
    db.refresh(app)

    return app
