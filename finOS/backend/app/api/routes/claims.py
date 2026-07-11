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
from app.models.user import User
from app.schemas import (
    ClaimCreate,
    ClaimResolutionRequest,
    ClaimResponse,
)
from app.services.claim_service import (
    advance_claim_service,
    create_claim,
    get_claim,
    get_claims,
    resolve_claim_service,
)
from app.services.mapper_service import map_claim_response


router = APIRouter()


@router.get(
    "/",
    response_model=list[ClaimResponse],
)
def list_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = Query(default=None),
    step: str | None = Query(default=None),
    department: str | None = Query(default=None),
    open_only: bool = Query(default=False),
):
    claims = get_claims(
        db=db,
        current_user=current_user,
        search=search,
        step=step,
        department=department,
        open_only=open_only,
    )

    return [
        map_claim_response(db, claim)
        for claim in claims
    ]


@router.get(
    "/{claim_id}",
    response_model=ClaimResponse,
)
def claim_detail(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = get_claim(
        db,
        claim_id,
        current_user,
    )

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    return map_claim_response(
        db,
        claim,
    )


@router.post(
    "/",
    response_model=ClaimResponse,
)
def create_new_claim(
    data: ClaimCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("claim.create"),
    ),
):
    try:
        claim = create_claim(
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

        return map_claim_response(
            db,
            claim,
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
    "/{claim_id}/advance",
    response_model=ClaimResponse,
)
def advance_claim_route(
    claim_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("claim.advance"),
    ),
):
    try:
        claim = advance_claim_service(
            db=db,
            claim_id=claim_id,
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

        return map_claim_response(
            db,
            claim,
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
    "/{claim_id}/resolve",
    response_model=ClaimResponse,
)
def resolve_claim_route(
    claim_id: str,
    resolution: ClaimResolutionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("claim.resolve"),
    ),
):
    try:
        claim = resolve_claim_service(
            db=db,
            claim_id=claim_id,
            resolution=resolution,
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

        return map_claim_response(
            db,
            claim,
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
