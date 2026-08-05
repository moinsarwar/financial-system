from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas, models
from ..auth import get_password_hash
from ..config import settings
from ..database import get_db
from ..services.mail import send_set_password_invite

logger = logging.getLogger(__name__)
router = APIRouter()


def _issue_invite_and_email(db: Session, reseller: models.Reseller) -> models.User:
    """Create/update reseller user with invite token and send set-password email."""
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=settings.INVITE_TOKEN_HOURS)
    # Unusable until they set a real password
    placeholder = get_password_hash(secrets.token_urlsafe(48))

    user = crud.get_user_by_email(db, reseller.email)
    if not user:
        user = models.User(
            email=reseller.email,
            hashed_password=placeholder,
            role="reseller",
            reseller_id=reseller.id,
            invite_token=token,
            invite_expires_at=expires,
            must_set_password=True,
        )
        db.add(user)
    else:
        user.reseller_id = reseller.id
        user.role = "reseller"
        user.invite_token = token
        user.invite_expires_at = expires
        user.must_set_password = True
        # Keep existing password if they already set one and we're re-inviting;
        # still force set via must_set_password for Option A re-approve.
        user.hashed_password = placeholder

    db.commit()
    db.refresh(user)

    base = settings.FRONTEND_URL.rstrip("/")
    set_url = f"{base}/set-password?token={token}"
    try:
        send_set_password_invite(
            to_email=reseller.email,
            name=reseller.name or "Partner",
            set_password_url=set_url,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send invite email to %s", reseller.email)
        raise HTTPException(
            status_code=502,
            detail=f"Reseller activated but invite email failed: {exc}",
        ) from exc

    return user


@router.get("/", response_model=list[schemas.Reseller])
def read_resellers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_resellers(db, skip=skip, limit=limit)


@router.post("/", response_model=schemas.Reseller, status_code=status.HTTP_201_CREATED)
def create_reseller(reseller: schemas.ResellerCreate, db: Session = Depends(get_db)):
    if crud.get_reseller_by_subdomain(db, reseller.subdomain):
        raise HTTPException(status_code=400, detail="Subdomain already registered")
    if crud.get_reseller_by_email(db, reseller.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_reseller(db, reseller)


@router.get("/stats", response_model=schemas.ResellerStats)
def get_stats(db: Session = Depends(get_db)):
    return crud.get_reseller_stats(db)


@router.get("/verify")
def verify_reseller_domain(domain: str, db: Session = Depends(get_db)):
    subdomain_prefix = domain.split(".")[0] if "." in domain else domain
    db_reseller = crud.get_reseller_by_subdomain(db, subdomain_prefix)
    if not db_reseller:
        raise HTTPException(status_code=404, detail="Reseller not found for this domain")

    ALL = [
        "savings",
        "credit_card",
        "personal_loan",
        "health_insurance",
        "motor_insurance",
        "life_insurance",
    ]
    focus = (db_reseller.market_focus or "all").strip()
    legacy = {
        "insurance": ["health_insurance"],
        "mortgage": ["personal_loan"],
        "personal": ["personal_loan"],
        "auto": ["motor_insurance"],
        "health": ["health_insurance"],
        "credit": ["credit_card"],
        "life": ["life_insurance"],
        "savings": ["savings"],
    }
    if focus.lower() in ("all", ""):
        categories = ALL
    else:
        parts = [p.strip() for p in focus.split(",") if p.strip()]
        categories = [p for p in parts if p in ALL]
        if not categories:
            categories = legacy.get(focus.lower(), ALL)

    return {
        "id": db_reseller.id,
        "subdomain": db_reseller.subdomain,
        "name": db_reseller.name,
        "categories": categories,
        "market_focus": db_reseller.market_focus,
    }


@router.post("/{reseller_id}/approve", response_model=schemas.Reseller)
def approve_reseller(reseller_id: int, db: Session = Depends(get_db)):
    """Option A: mark active, create login user, email set-password link."""
    db_reseller = crud.get_reseller(db, reseller_id)
    if not db_reseller:
        raise HTTPException(status_code=404, detail="Reseller not found")

    db_reseller.status = models.ResellerStatus.ACTIVE
    db.commit()
    db.refresh(db_reseller)

    _issue_invite_and_email(db, db_reseller)
    return db_reseller


@router.post("/{reseller_id}/resend-invite")
def resend_invite(reseller_id: int, db: Session = Depends(get_db)):
    db_reseller = crud.get_reseller(db, reseller_id)
    if not db_reseller:
        raise HTTPException(status_code=404, detail="Reseller not found")
    if db_reseller.status != models.ResellerStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Approve the reseller before sending invite")
    _issue_invite_and_email(db, db_reseller)
    return {"ok": True, "email": db_reseller.email}


@router.get("/{reseller_id}", response_model=schemas.Reseller)
def read_reseller(reseller_id: int, db: Session = Depends(get_db)):
    db_reseller = crud.get_reseller(db, reseller_id)
    if not db_reseller:
        raise HTTPException(status_code=404, detail="Reseller not found")
    return db_reseller


@router.put("/{reseller_id}", response_model=schemas.Reseller)
def update_reseller(
    reseller_id: int,
    reseller_update: schemas.ResellerUpdate,
    db: Session = Depends(get_db),
):
    db_reseller = crud.update_reseller(db, reseller_id, reseller_update)
    if not db_reseller:
        raise HTTPException(status_code=404, detail="Reseller not found")
    return db_reseller


@router.delete("/{reseller_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reseller(reseller_id: int, db: Session = Depends(get_db)):
    if not crud.delete_reseller(db, reseller_id):
        raise HTTPException(status_code=404, detail="Reseller not found")
    return
