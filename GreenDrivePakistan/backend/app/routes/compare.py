from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..services.savings import compare_products
from ..config import get_settings

router = APIRouter(prefix="/api/compare", tags=["compare"])
settings = get_settings()


def _active_lender(db: Session):
    return db.query(models.Lender).filter(models.Lender.is_active == True).first()  # noqa: E712


def get_or_create_compare_settings(db: Session) -> models.CompareSettings:
    row = db.query(models.CompareSettings).filter(models.CompareSettings.id == 1).first()
    if row:
        return row
    row = models.CompareSettings(id=1, down_payment_rate=0.2, default_horizon_years=5)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/financing")
def financing_defaults(db: Session = Depends(get_db)):
    """Public: active lender + formula defaults for marketplace/compare."""
    lender = _active_lender(db)
    cfg = get_or_create_compare_settings(db)
    base = {
        "down_payment_rate": cfg.down_payment_rate,
        "default_horizon_years": cfg.default_horizon_years,
        "horizon_options": [3, 5, 7, 10],
    }
    if not lender:
        return {
            **base,
            "lender_id": None,
            "lender_name": None,
            "profit_rate": settings.LENDER_PROFIT_RATE,
            "max_tenure": settings.MAX_TENURE_MONTHS,
        }
    return {
        **base,
        "lender_id": lender.id,
        "lender_name": lender.name,
        "profit_rate": lender.profit_rate,
        "max_tenure": lender.max_tenure,
    }


@router.get("/settings", response_model=schemas.CompareSettingsResponse)
def get_compare_settings(db: Session = Depends(get_db)):
    return get_or_create_compare_settings(db)


@router.put("/settings", response_model=schemas.CompareSettingsResponse)
def update_compare_settings(
    payload: schemas.CompareSettingsUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_active_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    row = get_or_create_compare_settings(db)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.post("/", response_model=schemas.CompareResponse)
def compare(payload: schemas.CompareInput, db: Session = Depends(get_db)):
    query = db.query(models.Product).filter(models.Product.is_active == True)  # noqa: E712
    if payload.category and payload.category.lower() not in ("", "all"):
        query = query.filter(models.Product.category == payload.category)
    if payload.product_ids:
        query = query.filter(models.Product.id.in_(payload.product_ids))
    products = query.all()

    all_cats = (
        db.query(models.Product.category)
        .filter(models.Product.is_active == True)  # noqa: E712
        .distinct()
        .all()
    )
    categories = sorted({c[0] for c in all_cats if c[0]})

    lender = _active_lender(db)
    cfg = get_or_create_compare_settings(db)
    profit_rate = lender.profit_rate if lender else None
    lender_max = lender.max_tenure if lender else settings.MAX_TENURE_MONTHS

    # Tenure: override capped by lender max
    if payload.tenure_months and payload.tenure_months > 0:
        tenure = min(int(payload.tenure_months), int(lender_max))
    else:
        tenure = int(lender_max)

    down_rate = (
        float(payload.down_payment_rate)
        if payload.down_payment_rate is not None
        else float(cfg.down_payment_rate or 0.2)
    )
    horizon = (
        int(payload.horizon_years)
        if payload.horizon_years and payload.horizon_years > 0
        else int(cfg.default_horizon_years or 5)
    )

    result = compare_products(
        products,
        payload.electricity_bill,
        payload.fuel_bill,
        payload.compare_type,
        profit_rate,
        tenure,
        down_rate,
        horizon,
    )
    result["lender_name"] = lender.name if lender else None
    result["lender_max_tenure"] = lender_max
    result["categories"] = categories
    return result
