from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    require_permission,
)
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.client import Client, LifecycleStage
from app.models.application import Application
from app.models.document import Document
from app.models.payment import Payment
from app.services.audit_service import log_audit
import uuid
import httpx
import threading
import logging
import secrets
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode

from pydantic import BaseModel, EmailStr, Field
from app.core.config import settings
from app.core.security import get_password_hash
from app.services.mail import send_set_password_invite
from app.services.product_service import create_product_from_application
from app.services.workflow_service import get_workflow
from app.services import safepay_service

logger = logging.getLogger(__name__)

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

def _send_to_reseller_async(payload: dict):
    try:
        with httpx.Client() as client:
            client.post("http://comparison_backend:8000/api/webhooks/commission", json=payload, timeout=5.0)
    except Exception as e:
        print(f"Reseller webhook failed: {e}")

def notify_reseller_status(app: Application, client: Client, subdomain: str, status: str):
    try:
        payload = {
            "subdomain": subdomain,
            "application_id": app.id,
            "product_name": app.product_label,
            "amount": float(app.amount) if app.amount else 0.0,
            "customer_name": client.name,
            "customer_email": client.email if hasattr(client, 'email') and client.email else "no-email@example.com",
            "status": status
        }
        threading.Thread(target=_send_to_reseller_async, args=(payload,)).start()
    except Exception as e:
        print(f"Error preparing reseller webhook: {e}")

from app.schemas.unified import (
    UnifiedApplicationRequest,
    UnifiedApplicationResponse,
)
from app.schemas import (
    ApplicationCreate,
    ApplicationDecisionRequest,
    ApplicationResponse,
    ApplicationWithDetailsResponse,
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
    response_model=ApplicationWithDetailsResponse,
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
        app_res = create_application(
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

        if data.reseller_id:
            client = db.query(Client).filter(Client.id == data.client_id).first()
            if client:
                reseller_subdomain = str(data.reseller_id)
                notify_reseller_status(app_res, client, reseller_subdomain, "pending")

        return app_res

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
        updated_app = advance_application_service(
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

        if updated_app.status == "completed":
            reseller_subdomain = updated_app.unified_data.get("reseller_subdomain") if updated_app.unified_data else None
            if reseller_subdomain:
                client_obj = db.query(Client).filter(Client.id == updated_app.client_id).first()
                if client_obj:
                    notify_reseller_status(updated_app, client_obj, reseller_subdomain, status="completed")

        return updated_app

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
        updated_app = decide_application(
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
        
        # Check if this was a terminal decision
        if decision.outcome in ["approved", "rejected", "withdrawn"]:
            reseller_subdomain = updated_app.unified_data.get("reseller_subdomain") if updated_app.unified_data else None
            if reseller_subdomain:
                client_obj = db.query(Client).filter(Client.id == updated_app.client_id).first()
                if client_obj:
                    # Maps to reseller status logic
                    notify_reseller_status(updated_app, client_obj, reseller_subdomain, status="completed" if decision.outcome == "approved" else decision.outcome)

        return updated_app

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
    unified_payload = data.model_dump(mode="json")
    if data.reseller_id:
        unified_payload["reseller_subdomain"] = str(data.reseller_id)
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
        unified_data=unified_payload,
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
        if data.reseller_id:
            reseller_subdomain = str(data.reseller_id)
            notify_reseller_status(application, client, reseller_subdomain, "pending")
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
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str | None = None
    nationalId: str
    iban: str
    products: list[PublicProduct]
    kyc_documents: dict[str, str | None] = None
    reseller_subdomain: str | None = None


def _resolve_or_create_client_user(
    db: Session,
    *,
    first_name: str,
    last_name: str,
    email: str,
    phone: str | None,
) -> tuple[Client, User, bool, bool]:
    """Return (client, user, user_created, invite_email_sent)."""
    email_norm = email.strip().lower()
    full_name = f"{first_name.strip()} {last_name.strip()}".strip()
    user = db.query(User).filter(User.email == email_norm).first()
    client = db.query(Client).filter(Client.email == email_norm).first()
    user_created = False
    invite_email_sent = False

    if not client:
        client = Client(
            id=f"CLI-{uuid.uuid4().hex[:8].upper()}",
            name=full_name,
            email=email_norm,
            phone=phone,
            lifecycle_stage=LifecycleStage.APPLICANT,
            assigned_department=None,
            engagement_score=50,
        )
        db.add(client)
        db.flush()
    else:
        if full_name and client.name != full_name:
            client.name = full_name
        if phone and not client.phone:
            client.phone = phone
        if client.lifecycle_stage == LifecycleStage.LEAD:
            client.lifecycle_stage = LifecycleStage.APPLICANT

    if not user:
        token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=settings.INVITE_TOKEN_HOURS)
        placeholder = get_password_hash(secrets.token_urlsafe(48))
        user = User(
            id=f"USR-{uuid.uuid4().hex[:8].upper()}",
            email=email_norm,
            hashed_password=placeholder,
            full_name=full_name,
            role=UserRole.CLIENT,
            client_id=client.id,
            is_active=True,
            invite_token=token,
            invite_expires_at=expires,
            must_set_password=True,
        )
        db.add(user)
        db.flush()
        user_created = True

        base = settings.FRONTEND_URL.rstrip("/")
        set_url = f"{base}/set-password?token={token}"
        try:
            send_set_password_invite(
                to_email=email_norm,
                name=full_name or "Applicant",
                set_password_url=set_url,
            )
            invite_email_sent = True
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Invite email not sent to %s (account created anyway): %s",
                email_norm,
                exc,
            )
    else:
        if not user.client_id:
            user.client_id = client.id
        if full_name and user.full_name != full_name:
            user.full_name = full_name

    return client, user, user_created, invite_email_sent


@router.post("/public/submit")
def public_submit(request: PublicSubmissionRequest, db: Session = Depends(get_db)):
    client, _user, user_created, invite_email_sent = _resolve_or_create_client_user(
        db,
        first_name=request.first_name,
        last_name=request.last_name,
        email=str(request.email),
        phone=request.phone,
    )

    if request.products:
        prod = request.products[0]
        product_type = safepay_service.normalize_product_type(prod.type)
        product_label = prod.name
        department = prod.provider
    else:
        product_type = "motor"
        product_label = "Motor Insurance"
        department = "System Provider"

    steps = get_workflow(product_type, "application")
    needs_payment = safepay_service.requires_payment(product_type)

    step_index = 0
    current_step = steps[0]
    app_status = "in-progress"
    if needs_payment and "Payment" in steps:
        step_index = steps.index("Payment")
        current_step = "Payment"
        app_status = "awaiting_payment"
    elif needs_payment:
        app_status = "awaiting_payment"
        current_step = "Payment"

    app_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    app = Application(
        id=app_id,
        client_id=client.id,
        product_type=product_type,
        product_label=product_label,
        department=department,
        steps=steps,
        step_index=step_index,
        current_step=current_step,
        amount=500000.0,
        currency="PKR",
        status=app_status,
        unified_data={
            "first_name": request.first_name,
            "last_name": request.last_name,
            "email": str(request.email).strip().lower(),
            "phone": request.phone,
            "nationalId": request.nationalId,
            "iban": request.iban,
            "reseller_subdomain": request.reseller_subdomain,
            "payment_required": needs_payment,
        },
        timeline=[
            {
                "time": datetime.now(timezone.utc).isoformat(),
                "event": "Application created",
                "user": "public",
            }
        ],
    )
    db.add(app)
    db.flush()

    payment_url = None
    payment_id = None
    if needs_payment:
        pay_amount = safepay_service.sandbox_amount()
        payment = Payment(
            id=f"PAY-{uuid.uuid4().hex[:8].upper()}",
            application_id=app.id,
            client_id=client.id,
            amount=pay_amount,
            currency=settings.SAFEPAY_CURRENCY or "PKR",
            status="pending",
            provider="safepay",
            raw_events=[],
        )
        db.add(payment)
        db.flush()
        payment_id = payment.id

        front = settings.FRONTEND_URL.rstrip("/")
        api_success = (
            f"{front}/api/applications/public/payment/return"
            f"?app={app.id}&result=success"
        )
        api_cancel = (
            f"{front}/api/applications/public/payment/return"
            f"?app={app.id}&result=cancel"
        )
        try:
            checkout = safepay_service.create_checkout(
                order_id=payment.id,
                amount=pay_amount,
                success_url=api_success,
                cancel_url=api_cancel,
            )
            payment.tracker = checkout["tracker"]
            payment.checkout_url = checkout["redirect_url"]
            payment_url = checkout["redirect_url"]
            app.timeline = list(app.timeline or []) + [
                {
                    "time": datetime.now(timezone.utc).isoformat(),
                    "event": f"SafePay checkout created (PKR {pay_amount})",
                    "user": "system",
                }
            ]
        except Exception as exc:  # noqa: BLE001
            logger.exception("SafePay checkout failed for %s", app.id)
            db.rollback()
            raise HTTPException(
                status_code=502,
                detail=f"Payment checkout failed: {exc}",
            ) from exc

    db.commit()
    db.refresh(app)

    if request.kyc_documents:
        import base64
        import os

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
                client_id=client.id,
                type=doc_key,
                name=f"KYC - {doc_key}",
                original_filename=file_name,
                storage_key=file_name,
                ref_id=app.id,
                ref_type="application",
                file_url=f"/uploads/{file_name}",
                mime_type=mime_type,
                size_bytes=len(file_data),
                status="uploaded",
            )
            db.add(doc)

        db.commit()

    # Free products notify immediately; paid products wait for webhook
    if not needs_payment:
        notify_finvault(app, client)
        if request.reseller_subdomain:
            notify_reseller_status(
                app, client, request.reseller_subdomain, status="pending"
            )

    return {
        "application_id": app.id,
        "client_id": client.id,
        "user_created": user_created,
        "invite_email_sent": invite_email_sent,
        "payment_required": needs_payment,
        "payment_url": payment_url,
        "payment_id": payment_id,
        "status": app.status,
    }

@router.post("/public/{app_id}/simulate-issue-policy")
def public_simulate_issue_policy(app_id: str, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")

    if app.status == "awaiting_payment":
        raise HTTPException(
            status_code=402,
            detail="Payment required before policy can be issued",
        )
        
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


def _mark_payment_paid_and_advance(db: Session, payment: Payment, app: Application, event: dict) -> None:
    """Idempotent: mark paid, advance past Payment, notify FinVault."""
    if payment.status != "paid":
        payment.status = "paid"
        payment.paid_at = datetime.now(timezone.utc)
        events = list(payment.raw_events or [])
        events.append({"at": datetime.now(timezone.utc).isoformat(), "event": event})
        payment.raw_events = events

    if app.status == "awaiting_payment" or app.current_step == "Payment":
        steps = list(app.steps or [])
        if "Payment" in steps:
            idx = steps.index("Payment")
            next_idx = min(idx + 1, len(steps) - 1)
            app.step_index = next_idx
            app.current_step = steps[next_idx]
        app.status = "in-progress"
        app.updated_at = datetime.now(timezone.utc)
        app.timeline = list(app.timeline or []) + [
            {
                "time": datetime.now(timezone.utc).isoformat(),
                "event": "Payment confirmed via SafePay",
                "user": "safepay",
            }
        ]

    client = db.query(Client).filter(Client.id == app.client_id).first()
    if client and not (app.unified_data or {}).get("finvault_notified_after_payment"):
        notify_finvault(app, client)
        reseller = (app.unified_data or {}).get("reseller_subdomain")
        if reseller:
            notify_reseller_status(app, client, reseller, status="pending")
        data = dict(app.unified_data or {})
        data["finvault_notified_after_payment"] = True
        app.unified_data = data


@router.api_route("/public/payment/return", methods=["GET", "POST"])
async def safepay_payment_return(request: Request, db: Session = Depends(get_db)):
    """Accept SafePay browser redirect (GET/POST form) and bounce to the UI."""
    form = {}
    if request.method == "POST":
        try:
            form = dict(await request.form())
        except Exception:  # noqa: BLE001
            form = {}
    q = request.query_params

    app_id = q.get("app") or form.get("order_id") or form.get("Order ID") or form.get("app")
    result = (q.get("result") or "success").lower()
    tracker = q.get("tracker") or form.get("tracker") or form.get("Tracker")
    sig = q.get("sig") or form.get("sig") or form.get("signature") or form.get("Signature")

    if tracker and sig and not safepay_service.verify_redirect_sig(str(tracker), str(sig)):
        result = "invalid"
    elif result == "success":
        payment = None
        if tracker:
            payment = db.query(Payment).filter(Payment.tracker == str(tracker)).first()
        if not payment and app_id:
            payment = (
                db.query(Payment)
                .filter(Payment.application_id == str(app_id))
                .order_by(Payment.created_at.desc())
                .first()
            )
            if payment and payment.tracker:
                tracker = payment.tracker

        if payment and payment.status == "pending":
            # Local/dev: webhook often cannot reach localhost — confirm via Safepay reporter
            state = safepay_service.fetch_payment_state(str(tracker)) if tracker else None
            app = db.query(Application).filter(Application.id == payment.application_id).first()
            if safepay_service.is_tracker_paid(state) and app:
                _mark_payment_paid_and_advance(
                    db,
                    payment,
                    app,
                    {
                        "type": "browser_return_confirmed",
                        "tracker": tracker,
                        "state": state,
                    },
                )
                db.commit()
            else:
                payment.raw_events = list(payment.raw_events or []) + [
                    {
                        "at": datetime.now(timezone.utc).isoformat(),
                        "event": {
                            "type": "browser_return",
                            "tracker": tracker,
                            "state": state,
                        },
                    }
                ]
                db.commit()

    # Prefer site root (/) — local Vite + prod nginx both serve vanilla there
    front = settings.FRONTEND_URL.rstrip("/")
    params = {"payment": result if result in ("success", "cancel", "invalid") else "success"}
    if app_id:
        params["app"] = str(app_id)
    if tracker:
        params["tracker"] = str(tracker)
    return RedirectResponse(
        url=f"{front}/?{urlencode(params)}",
        status_code=303,
    )


@router.post("/public/webhook/safepay")
async def safepay_webhook(request: Request, db: Session = Depends(get_db)):
    raw = await request.body()
    signature = request.headers.get("X-SFPY-SIGNATURE") or request.headers.get(
        "x-sfpy-signature"
    )
    timestamp = request.headers.get("X-SFPY-TIMESTAMP") or request.headers.get(
        "x-sfpy-timestamp"
    )

    if not safepay_service.verify_webhook(raw, signature, timestamp):
        raise HTTPException(status_code=400, detail="Invalid SafePay webhook signature")

    import json

    try:
        payload = json.loads(raw.decode("utf-8") or "{}")
    except Exception:  # noqa: BLE001
        payload = {}

    parsed = safepay_service.parse_webhook_event(payload if isinstance(payload, dict) else {})
    tracker = parsed.get("tracker")
    if not tracker:
        logger.warning("SafePay webhook missing tracker: %s", payload)
        return {"status": "ignored", "reason": "no_tracker"}

    payment = db.query(Payment).filter(Payment.tracker == tracker).first()
    if not payment:
        # Also allow order_id / payment id in metadata
        order_id = None
        if isinstance(payload, dict):
            order_id = (
                (payload.get("notification") or {}).get("reference")
                or payload.get("order_id")
            )
        if order_id:
            payment = db.query(Payment).filter(Payment.id == str(order_id)).first()
    if not payment:
        logger.warning("SafePay webhook payment not found for tracker=%s", tracker)
        return {"status": "ignored", "reason": "payment_not_found"}

    app = db.query(Application).filter(Application.id == payment.application_id).first()
    if not app:
        return {"status": "ignored", "reason": "application_not_found"}

    if payment.status == "paid":
        return {"status": "ok", "idempotent": True}

    if parsed.get("paid"):
        _mark_payment_paid_and_advance(db, payment, app, parsed)
        db.commit()
        return {"status": "ok", "payment": "paid"}

    if parsed.get("failed"):
        payment.status = "failed"
        payment.raw_events = list(payment.raw_events or []) + [
            {"at": datetime.now(timezone.utc).isoformat(), "event": parsed}
        ]
        app.timeline = list(app.timeline or []) + [
            {
                "time": datetime.now(timezone.utc).isoformat(),
                "event": "Payment failed via SafePay",
                "user": "safepay",
            }
        ]
        db.commit()
        return {"status": "ok", "payment": "failed"}

    payment.raw_events = list(payment.raw_events or []) + [
        {"at": datetime.now(timezone.utc).isoformat(), "event": parsed}
    ]
    db.commit()
    return {"status": "ok", "payment": payment.status}


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

    if payload.status in terminal_success_statuses or payload.status == "rejected":
        reseller_subdomain = app.unified_data.get("reseller_subdomain") if app.unified_data else None
        if reseller_subdomain:
            client_obj = db.query(Client).filter(Client.id == app.client_id).first()
            if client_obj:
                notify_reseller_status(app, client_obj, reseller_subdomain, status=app.status)

    return {"status": "ok"}

from app.models.communication import Communication, MessageReceipt
from app.models.information_request import InformationRequest
from app.schemas import MessageCreate, MessageResponse, InfoRequestCreate, InfoRequestResponse, DocumentResponse

@router.get('/{app_id}/messages', response_model=list[MessageResponse])
def get_messages(app_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = get_application(db, app_id, current_user)
    if not app: raise HTTPException(404, 'Application not found')
    return db.query(Communication).filter(Communication.application_id == app.id).order_by(Communication.created_at).all()

@router.post('/{app_id}/messages', response_model=MessageResponse)
def post_message(app_id: str, data: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = get_application(db, app_id, current_user)
    if not app: raise HTTPException(404, 'Application not found')
    msg = Communication(application_id=app.id, sender_id=current_user.id, sender_role=current_user.role, sender_name=current_user.full_name, message=data.message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.post('/{app_id}/messages/read')
def read_messages(app_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # simple mock for read receipts
    return {'status': 'ok'}

@router.post('/{app_id}/information-requests', response_model=list[InfoRequestResponse])
def create_info_requests(app_id: str, data: InfoRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = get_application(db, app_id, current_user)
    if not app: raise HTTPException(404, 'Application not found')
    created = []
    for item in data.items:
        req = InformationRequest(application_id=app.id, kind=item.kind, label=item.label, document_requirement_code=item.document_requirement_code, requested_by_id=current_user.id)
        db.add(req)
        created.append(req)
    # also advance status to additional-info if needed
    if app.status != 'additional-info':
        app.status = 'additional-info'
    db.commit()
    for req in created: db.refresh(req)
    return created

@router.post('/{app_id}/information-requests/submit')
def submit_info_requests(app_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = get_application(db, app_id, current_user)
    if not app: raise HTTPException(404, 'Application not found')
    # find open requests and mark them submitted
    reqs = db.query(InformationRequest).filter(InformationRequest.application_id == app.id, InformationRequest.status == 'open').all()
    for r in reqs:
        r.status = 'submitted'
        r.submitted_at = datetime.now(timezone.utc)
    db.commit()
    return {'status': 'ok'}

@router.post('/{app_id}/information-requests/resolve')
def resolve_info_requests(app_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = get_application(db, app_id, current_user)
    if not app: raise HTTPException(404, 'Application not found')
    reqs = db.query(InformationRequest).filter(InformationRequest.application_id == app.id, InformationRequest.status.in_(['open', 'submitted'])).all()
    for r in reqs:
        r.status = 'resolved'
        r.resolved_at = datetime.now(timezone.utc)
        r.resolved_by_id = current_user.id
    if app.status == 'additional-info':
        # revert status or move to review
        app.status = 'in-progress'
    db.commit()
    return {'status': 'ok'}

@router.post('/{app_id}/information-requests/{public_id}/response')
def respond_to_info_request(app_id: str, public_id: str, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = get_application(db, app_id, current_user)
    if not app: raise HTTPException(404, 'Application not found')
    req = db.query(InformationRequest).filter(InformationRequest.public_id == public_id, InformationRequest.application_id == app.id).first()
    if not req: raise HTTPException(404, 'Request not found')
    req.response_text = data.get('response_text', '')
    req.status = 'submitted'
    req.submitted_at = datetime.now(timezone.utc)
    db.commit()
    return {'status': 'ok'}

from fastapi import UploadFile, File
import os
from app.core.config import settings
from app.services.document_service import create_document
from app.services.mapper_service import map_document_response

@router.post('/{app_id}/documents/{code}', response_model=DocumentResponse)
async def upload_app_document(app_id: str, code: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user), req: Request = None):
    app = get_application(db, app_id, current_user)
    if not app: raise HTTPException(404, 'Application not found')
    
    # Check if a document with this code (type) already exists for this app
    existing = db.query(Document).filter(Document.ref_id == app.id, Document.type == code).first()
    if existing:
        # Delete old file
        if existing.storage_key:
            old_path = os.path.join(settings.UPLOAD_ROOT, existing.storage_key)
            if os.path.exists(old_path):
                os.remove(old_path)
        db.delete(existing)
        db.commit()

    content = await file.read()
    # Create new document
    doc = create_document(
        db, app.client_id, code.replace('_', ' ').title(), file.filename, code, content, file.content_type,
        app.id, 'application', current_user,
        req.client.host if req else None,
        req.headers.get('X-Request-ID') if req else None
    )
    return map_document_response(db, doc)
