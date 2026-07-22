from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
    Body,
)
from sqlalchemy.orm import Session
from app.models.claim import Claim
from app.models.document import Document
from app.services.workflow_service import CLAIM_STEPS
from datetime import datetime, timezone

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
    add_claim_message,
    reset_claim_service,
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


@router.post(
    "/{claim_id}/message",
    response_model=ClaimResponse,
)
def post_claim_message(
    claim_id: str,
    message: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        claim = add_claim_message(
            db=db,
            claim_id=claim_id,
            message=message,
            current_user=current_user,
        )
        return map_claim_response(db, claim)
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
    "/{claim_id}/reset",
    response_model=ClaimResponse,
)
def reset_claim_route(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Reset claim states
    claim.current_step = "Event Reported"
    claim.step_index = 0
    claim.steps = CLAIM_STEPS.copy()
    claim.outcome = None
    claim.resolution_reason_code = None
    claim.resolution_notes = None
    claim.resolved_at = None
    claim.resolved_by_user_id = None
    
    # Reset timeline
    claim.timeline = [{
        "time": datetime.now(timezone.utc).isoformat(),
        "event": "Claim reset to Draft for demonstration.",
        "user": current_user.id
    }]
    
    # Clear uploaded documents associated with this claim to make it a clean reset
    db.query(Document).filter(
        Document.ref_id == claim_id,
        Document.ref_type == "claim"
    ).delete()
    
    db.commit()
    db.refresh(claim)
    return map_claim_response(db, claim)

