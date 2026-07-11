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
from datetime import datetime, timezone

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
    current_user: User = Depends(
        require_permission("application.decide"),
    ),
):
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
    except Exception:
        db.rollback()
        raise

    return UnifiedApplicationResponse(
        application_id=application.id,
        client_id=client.id,
        status=application.status,
        created_at=application.created_at,
    )
