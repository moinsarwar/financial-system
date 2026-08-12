from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..services.savings import compare_products
from ..services.ollama_recommend import ollama_recommend_service
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


def _run_compare(
    db: Session,
    *,
    electricity_bill: float,
    fuel_bill: float,
    compare_type: str,
    tenure_months: int | None,
    down_payment_rate: float | None,
    horizon_years: int | None,
    category: str | None,
    product_ids: list[int] | None,
) -> dict:
    query = db.query(models.Product).filter(models.Product.is_active == True)  # noqa: E712
    if category and category.lower() not in ("", "all"):
        query = query.filter(models.Product.category == category)
    if product_ids:
        query = query.filter(models.Product.id.in_(product_ids))
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

    if tenure_months and tenure_months > 0:
        tenure = min(int(tenure_months), int(lender_max))
    else:
        tenure = int(lender_max)

    down_rate = (
        float(down_payment_rate)
        if down_payment_rate is not None
        else float(cfg.down_payment_rate or 0.2)
    )
    horizon = (
        int(horizon_years)
        if horizon_years and horizon_years > 0
        else int(cfg.default_horizon_years or 5)
    )

    result = compare_products(
        products,
        electricity_bill,
        fuel_bill,
        compare_type,
        profit_rate,
        tenure,
        down_rate,
        horizon,
    )
    result["lender_name"] = lender.name if lender else None
    result["lender_max_tenure"] = lender_max
    result["categories"] = categories
    return result


@router.get("/financing")
def financing_defaults(db: Session = Depends(get_db)):
    """Public: active lender + formula defaults for marketplace/compare."""
    lender = _active_lender(db)
    cfg = get_or_create_compare_settings(db)
    base = {
        "down_payment_rate": cfg.down_payment_rate,
        "default_horizon_years": cfg.default_horizon_years,
        "horizon_options": [3, 5, 7, 10],
        "ollama_model": settings.OLLAMA_MODEL,
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


@router.get("/ai/health")
async def ai_health():
    return await ollama_recommend_service.health()


@router.post("/", response_model=schemas.CompareResponse)
def compare(payload: schemas.CompareInput, db: Session = Depends(get_db)):
    return _run_compare(
        db,
        electricity_bill=payload.electricity_bill,
        fuel_bill=payload.fuel_bill,
        compare_type=payload.compare_type,
        tenure_months=payload.tenure_months,
        down_payment_rate=payload.down_payment_rate,
        horizon_years=payload.horizon_years,
        category=payload.category,
        product_ids=payload.product_ids,
    )


@router.post("/ai-recommend", response_model=schemas.CompareAiResponse)
async def ai_recommend(payload: schemas.CompareAiRequest, db: Session = Depends(get_db)):
    """Ask host Ollama (qwen2.5:1.5b) which product best matches the user query."""
    result = _run_compare(
        db,
        electricity_bill=payload.electricity_bill,
        fuel_bill=payload.fuel_bill,
        compare_type=payload.compare_type,
        tenure_months=payload.tenure_months,
        down_payment_rate=payload.down_payment_rate,
        horizon_years=payload.horizon_years,
        category=payload.category,
        product_ids=payload.product_ids,
    )
    products = result.get("results") or []
    if not products:
        raise HTTPException(status_code=400, detail="No products available to recommend")

    best = result.get("best_product") or {}
    context = {
        "current_bill": result.get("total_current_bill"),
        "tenure_months": result.get("tenure_months"),
        "down_payment_pct": round(float(result.get("down_payment_rate") or 0) * 100),
        "horizon_years": result.get("horizon_years"),
        "formula_best": best.get("product_name"),
    }
    try:
        text = await ollama_recommend_service.recommend(payload.query, products, context)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502,
            detail=f"Ollama unavailable ({settings.OLLAMA_MODEL}): {exc}",
        ) from exc

    return schemas.CompareAiResponse(
        recommendation=text,
        model=settings.OLLAMA_MODEL,
        formula_best=best.get("product_name"),
    )
