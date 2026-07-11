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
from app.core.exceptions import DuplicateEmailError
from app.models.user import User
from app.schemas import ClientCreate, ClientResponse
from app.services.client_service import (
    create_client,
    get_client,
    get_clients,
)


router = APIRouter()


@router.get(
    "/",
    response_model=list[ClientResponse],
)
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    stage: str | None = Query(default=None),
    search: str | None = Query(default=None),
    department: str | None = Query(default=None),
):
    return get_clients(
        db=db,
        current_user=current_user,
        stage=stage,
        search=search,
        department=department,
    )


@router.get(
    "/{client_id}",
    response_model=ClientResponse,
)
def client_detail(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = get_client(
        db=db,
        client_id=client_id,
        current_user=current_user,
    )

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    return client


@router.post(
    "/",
    response_model=ClientResponse,
)
def create_new_client(
    data: ClientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("client.create"),
    ),
):
    try:
        return create_client(
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

    except DuplicateEmailError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
