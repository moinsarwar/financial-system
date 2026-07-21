from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    require_permission,
)
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.client import Client
from app.models.application import Application
from app.models.document import Document
from app.services.audit_service import log_audit
import uuid
import httpx
import threading
from datetime import datetime, timezone
from pydantic import BaseModel
from app.services.product_service import create_product_from_application
from app.services.workflow_service import get_workflow

def _send_to_finvault_async(payload: dict):
    try:
        with httpx.Client() as client:
            client.post("http://finvault-backend-1:8000/api/integrations/applications", json=payload, timeout=5.0)
    except Exception as e:
        print(f"FinVault webhook failed: {e}")

def notify_finvault(app: Application, client: Client):
    try:
        cnic_val = None
        if app.unified_data:
            cnic_val = app.unified_data.get("nationalId")

        payload = {
            "source_system": "finos",
            "source_application_id": app.id,
            "applicant": {
                "external_user_id": client.id,
                "name": client.name,
                "cnic": cnic_val
            },
            "product_type": app.product_type,
            "amount": float(app.amount) if app.amount else None,
            "details": f"Unified Application for {app.product_label}"
        }
        threading.Thread(target=_send_to_finvault_async, args=(payload,)).start()
    except Exception as e:
        print(f"Error preparing finvault webhook: {e}")

from app.schemas.unified import (
    UnifiedApplicationRequest,
    UnifiedApplicationResponse,
)
from app.schemas import (
    ApplicationCreate,
    ApplicationDecisionRequest,
    ApplicationResponse,
)
from app.services.application_service import (
    advance_application_service,
    create_application,
    decide_application,
    get_application,
    get_applications,
)


router = APIRouter()


@router.get(
    "/",
    response_model=list[ApplicationResponse],
)
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = Query(default=None),
    step: str | None = Query(default=None),
    department: str | None = Query(default=None),
    status_filter: str | None = Query(
        default=None,
        alias="status",
    ),
):
    return get_applications(
        db=db,
        current_user=current_user,
        search=search,
        step=step,
        department=department,
        status=status_filter,
    )


@router.get(
    "/{app_id}",
    response_model=ApplicationResponse,
)
def application_detail(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = get_application(
        db,
        app_id,
        current_user,
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    return application


@router.post(
    "/",
    response_model=ApplicationResponse,
)
def create_new_application(
    data: ApplicationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("application.create"),
    ),
):
    try:
        return create_application(
            db=db,
            data=data,
            current_user=current_user,
            ip_address=(
                request.client.host
                if request.client
                else None
            ),
            request_id=request.headers.get(
                "X-Request-ID",
            ),
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/{app_id}/advance",
    response_model=ApplicationResponse,
)
def advance_application_route(
    app_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("application.advance"),
    ),
):
    try:
        return advance_application_service(
            db=db,
            app_id=app_id,
            current_user=current_user,
            ip_address=(
                request.client.host
                if request.client
                else None
            ),
            request_id=request.headers.get(
                "X-Request-ID",
            ),
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/{app_id}/decision",
    response_model=ApplicationResponse,
)
def decide_application_route(
    app_id: str,
    decision: ApplicationDecisionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.api.dependencies import PERMISSION_ROLES
    if current_user.role == UserRole.CLIENT:
        if decision.outcome != "withdrawn":
            raise HTTPException(403, "Clients can only withdraw applications")
    else:
        if current_user.role not in PERMISSION_ROLES.get("application.decide", set()):
            raise HTTPException(403, "Not authorized")
    try:
        return decide_application(
            db=db,
            app_id=app_id,
            decision=decision,
            current_user=current_user,
            ip_address=(
                request.client.host
                if request.client
                else None
            ),
            request_id=request.headers.get(
                "X-Request-ID",
            ),
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


SUPPORTED_PRODUCTS = {
    "loan": "lending",
    "motor": "motor",
    "health": "health",
    "life": "life",
    "travel": "travel",
    "business": "commercial",
    "savings": "retail",
    "credit": "lending",
}

PRODUCT_LABELS = {
    "loan": {"personal": "Personal Loan", "business": "Business Loan"},
    "motor": "Motor Insurance",
    "health": "Health Insurance",
    "life": "Life Assurance",
    "travel": "Travel Insurance",
    "business": "Business Insurance",
    "savings": "Savings Account",
    "credit": "Credit Card",
}

def require_live_submission(current_user: User):
    if current_user.role not in [UserRole.ADMINISTRATOR, UserRole.OPERATIONS_MANAGER]:
        raise HTTPException(403, "Live submission requires elevated permissions")

@router.post("/unified", response_model=UnifiedApplicationResponse)
def create_unified_application(
    data: UnifiedApplicationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("application.create")),
):
    if data.product_type not in SUPPORTED_PRODUCTS:
        raise HTTPException(400, "Unsupported product type")

    if data.submission_mode == "live":
        require_live_submission(current_user)

    client = db.query(Client).filter(
        Client.id == data.client_id,
    ).first()
    
    if not client:
        raise HTTPException(404, "Client not found or access denied")

    docs = []
    if data.document_ids:
        docs = db.query(Document).filter(
            Document.id.in_(data.document_ids),
            Document.client_id == client.id,
        ).all()
        if len(docs) != len(data.document_ids):
            raise HTTPException(400, "One or more document IDs are invalid or do not belong to this client")

    department = SUPPORTED_PRODUCTS[data.product_type]
    if data.product_type == "loan":
        product_label = PRODUCT_LABELS["loan"][data.loan_subtype]
    else:
        product_label = PRODUCT_LABELS[data.product_type]

    from app.services.workflow_service import get_workflow
    steps = get_workflow(data.product_type, "application")
    if not steps:
        raise HTTPException(500, "Workflow configuration unavailable")

    app_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    application = Application(
        id=app_id,
        client_id=client.id,
        product_type=data.product_type,
        product_label=product_label,
        department=department,
        amount=data.amount,
        currency=data.currency,
        status="in-progress",
        current_step=steps[0],
        step_index=0,
        steps=steps,
        unified_schema_version="1.0",
        unified_data=data.model_dump(mode="json"),
        timeline=[{
            "time": datetime.now(timezone.utc).isoformat(),
            "event": "Unified application created",
            "user": current_user.full_name or current_user.id
        }],
    )

    try:
        db.add(application)
        db.flush()

        for doc in docs:
            doc.ref_id = app_id
            doc.ref_type = "application"
            db.add(doc)

        log_audit(
            db, current_user.id, client.id,
            "application", app_id,
            "application.unified_created",
            f"Unified application {app_id} ({data.submission_mode})",
            department
        )

        db.commit()
        db.refresh(application)
        
        notify_finvault(application, client)
    except Exception:
        db.rollback()
        raise

    return UnifiedApplicationResponse(
        application_id=application.id,
        client_id=client.id,
        status=application.status,
        created_at=application.created_at,
    )

class PublicProduct(BaseModel):
    id: str
    name: str
    type: str
    provider: str

class PublicSubmissionRequest(BaseModel):
    nationalId: str
    iban: str
    products: list[PublicProduct]
    kyc_documents: dict[str, str | None] = None

@router.post("/public/submit")
def public_submit(request: PublicSubmissionRequest, db: Session = Depends(get_db)):
    # Find client@finos.com
    demo_user = db.query(User).filter(User.email == "client@finos.com").first()
    if not demo_user or not demo_user.client_id:
        raise HTTPException(status_code=400, detail="Demo client user not found in DB")
    
    # We take the first product just for simplicity
    if request.products:
        prod = request.products[0]
        product_type = prod.type
        product_label = prod.name
        department = prod.provider
    else:
        product_type = "motor"
        product_label = "Motor Insurance"
        department = "System Provider"

    steps = get_workflow(product_type, "application")
    
    app_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    app = Application(
        id=app_id,
        client_id=demo_user.client_id,
        product_type=product_type,
        product_label=product_label,
        department=department,
        steps=steps,
        step_index=0,
        current_step=steps[0],
        amount=500000.0, # dummy amount
        currency="PKR",
        status="in-progress",
        unified_data={"nationalId": request.nationalId, "iban": request.iban}
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    
    if request.kyc_documents:
        import base64
        import os
        from app.core.config import settings
        
        os.makedirs(settings.UPLOAD_ROOT, exist_ok=True)
        for doc_key, b64_data in request.kyc_documents.items():
            if not b64_data:
                continue
                
            try:
                header, encoded = b64_data.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
                ext = mime_type.split("/")[1]
            except Exception:
                encoded = b64_data
                mime_type = "application/octet-stream"
                ext = "bin"

            file_data = base64.b64decode(encoded)
            file_name = f"{doc_key}_{uuid.uuid4().hex[:8]}.{ext}"
            file_path = os.path.join(settings.UPLOAD_ROOT, file_name)
            
            with open(file_path, "wb") as f:
                f.write(file_data)
                
            doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
            doc = Document(
                id=doc_id,
                client_id=demo_user.client_id,
                type=doc_key,
                name=f"KYC - {doc_key}",
                original_filename=file_name,
                storage_key=file_name,
                ref_id=app.id,
                ref_type="application",
                file_url=f"/uploads/{file_name}",
                mime_type=mime_type,
                size_bytes=len(file_data),
                status="uploaded"
            )
            db.add(doc)
            
        db.commit()
    
    client_obj = db.query(Client).filter(Client.id == demo_user.client_id).first()
    if client_obj:
        notify_finvault(app, client_obj)

    return {"application_id": app.id}

@router.post("/public/{app_id}/simulate-issue-policy")
def public_simulate_issue_policy(app_id: str, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
        
    app.status = "approved"
    app.current_step = "Approved"
    
    # Trigger product creation
    create_product_from_application(db, app)
    db.commit()
    db.refresh(app)
    
    # Fetch the generated policy/holding to return to frontend
    from app.models.policy import Policy
    from app.models.holding import Holding
    policy = db.query(Policy).filter(Policy.application_id == app.id).first()
    if policy:
        return {
            "policyNumber": policy.policy_number,
            "premium": f"PKR {policy.premium}/year",
            "coverage": f"PKR {policy.sum_assured}",
            "effectiveDate": policy.start_date.isoformat(),
            "expiryDate": policy.end_date.isoformat()
        }
    holding = db.query(Holding).filter(Holding.application_id == app.id).first()
    if holding:
        return {
            "policyNumber": holding.id,
            "premium": "N/A",
            "coverage": "N/A"
        }
    
    return {"status": "approved"}

class FinVaultWebhookPayload(BaseModel):
    source_application_id: str
    status: str
    reason: str | None = None

@router.post("/public/webhook/finvault/status")
def finvault_status_webhook(
    payload: FinVaultWebhookPayload,
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == payload.source_application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    terminal_success_statuses = ["disbursed", "policy-issued", "card-issued", "account-created", "activated", "completed", "approved", "accepted"]
    
    if payload.status in terminal_success_statuses:
        app.status = "completed"
        app.current_step = "Completed"
        create_product_from_application(db, app)
    elif payload.status == "rejected":
        app.status = "rejected"
    else:
        app.status = payload.status

    app.updated_at = datetime.now(timezone.utc)
    if payload.reason:
        app.timeline.append({
            "action": f"Status updated to {payload.status} via FinVault",
            "date": datetime.now(timezone.utc).isoformat(),
            "notes": payload.reason
        })
    db.commit()
    return {"status": "ok"}
