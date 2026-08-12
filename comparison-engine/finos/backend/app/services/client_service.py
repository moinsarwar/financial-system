import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateEmailError
from app.models.client import Client, LifecycleStage
from app.models.user import User, UserRole
from app.schemas import ClientCreate
from app.services.audit_service import log_audit


def get_clients(
    db: Session,
    current_user: User,
    stage: str | None = None,
    search: str | None = None,
    department: str | None = None,
) -> list[Client]:
    query = db.query(Client)

    if current_user.role == UserRole.CLIENT:
        query = query.filter(
            Client.id == current_user.client_id,
        )

    if stage:
        query = query.filter(
            Client.lifecycle_stage == stage,
        )

    if search:
        search_value = f"%{search}%"

        query = query.filter(
            Client.name.ilike(search_value)
            | Client.email.ilike(search_value)
            | Client.phone.ilike(search_value)
            | Client.id.ilike(search_value)
        )

    if department:
        query = query.filter(
            Client.assigned_department == department,
        )

    return (
        query.order_by(Client.last_activity.desc())
        .all()
    )


def get_client(
    db: Session,
    client_id: str,
    current_user: User,
) -> Client | None:
    query = db.query(Client).filter(
        Client.id == client_id,
    )

    if current_user.role == UserRole.CLIENT:
        query = query.filter(
            Client.id == current_user.client_id,
        )

    return query.first()


def create_client(
    db: Session,
    data: ClientCreate,
    current_user: User,
    ip_address: str | None = None,
    request_id: str | None = None,
) -> Client:
    existing = (
        db.query(Client)
        .filter(Client.email == data.email)
        .first()
    )

    if existing:
        raise DuplicateEmailError(
            "A client with this email already exists",
        )

    client = Client(
        id=f"CLI-{uuid.uuid4().hex[:8].upper()}",
        name=data.name,
        email=data.email,
        phone=data.phone,
        assigned_department=data.assigned_department,
        lifecycle_stage=LifecycleStage.LEAD,
        has_open_claim=False,
        created_at=datetime.now(timezone.utc),
        last_activity=datetime.now(timezone.utc),
        engagement_score=50,
    )

    try:
        with db.begin_nested():
            db.add(client)
            db.flush()

    except IntegrityError as exc:
        raise DuplicateEmailError(
            "A client with this email already exists",
        ) from exc

    log_audit(
        db=db,
        actor_user_id=current_user.id,
        client_id=client.id,
        subject_type="client",
        subject_id=client.id,
        event="client.created",
        details=f"Created client {client.name}",
        department=client.assigned_department or "",
        ip_address=ip_address,
        request_id=request_id,
    )

    db.flush()
    db.refresh(client)

    return client
