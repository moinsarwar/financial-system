from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from . import models, schemas
from .lfe_client import lfe_client
from .encryption import encrypt_value, mask_cnic, mask_mobile
import random, string, hashlib
from datetime import datetime

def generate_ref():
    return f"TQ-{datetime.now().strftime('%Y%m%d')}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"

async def get_products(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Product).where(models.Product.active == True).offset(skip).limit(limit))
    return result.scalars().all()

async def get_product(db: AsyncSession, product_id: str):
    result = await db.execute(select(models.Product).where(models.Product.id == product_id))
    return result.scalar_one_or_none()

async def sync_products_from_lfe(db: AsyncSession):
    try:
        lfe_products = await lfe_client.get_products()
        for p in lfe_products:
            product_data = {
                "id": p.get("lfe_product_id"),
                "lfe_product_id": p.get("lfe_product_id"),
                "name": p["name"],
                "icon": p.get("icon", "fa-box"),
                "type": p.get("type", "general"),
                "group_name": p.get("group_name", "Other"),
                "max_amount": p.get("max_amount", 0),
                "min_tenure": p.get("min_tenure", 1),
                "max_tenure": p.get("max_tenure", 12),
                "tag": p.get("tag", ""),
                "ideal": p.get("ideal", ""),
                "processing": p.get("processing", ""),
                "active": True,
                "last_synced_at": func.now()
            }
            stmt = select(models.Product).where(models.Product.id == product_data["id"])
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                for key, value in product_data.items():
                    setattr(existing, key, value)
            else:
                db.add(models.Product(**product_data))
        await db.commit()
    except Exception as e:
        print(f"LFE product sync failed: {e}")

async def create_application(db: AsyncSession, app_data: schemas.ApplicationCreate):
    ref = generate_ref()
    cnic_encrypted = encrypt_value(app_data.cnic)
    mobile_encrypted = encrypt_value(app_data.mobile)
    cnic_masked = mask_cnic(app_data.cnic)
    mobile_masked = mask_mobile(app_data.mobile)

    lfe_payload = app_data.model_dump()
    lfe_payload["ref"] = ref
    product = await get_product(db, app_data.product_id)
    if product:
        lfe_payload["product_type"] = product.type

    # Store masked version locally
    lfe_payload_for_storage = {
        **lfe_payload,
        "cnic": cnic_masked,
        "mobile": mobile_masked,
    }

    status = models.ApplicationStatus.SUBMITTED
    lfe_response = None
    decision = None
    score = None
    risk_band = None
    route = None
    matched_lenders = []
    reason_codes = []
    policy_version = None
    audit_id = None
    lfe_application_id = None
    lfe_decision_id = None
    retry_count = 0

    try:
        lfe_response = await lfe_client.submit_application(lfe_payload)
        status = models.ApplicationStatus.LFE_DECIDED
        decision = getattr(models.LfeDecision, lfe_response.get("decision", "review").upper(), None)
        score = lfe_response.get("score")
        risk_band = lfe_response.get("risk_band")
        route = lfe_response.get("route")
        matched_lenders = lfe_response.get("matched_lenders", [])
        reason_codes = lfe_response.get("reason_codes", [])
        policy_version = lfe_response.get("policy_version")
        audit_id = lfe_response.get("audit_id")
        lfe_application_id = lfe_response.get("lfe_application_id")
        lfe_decision_id = lfe_response.get("lfe_decision_id")
    except Exception as e:
        status = models.ApplicationStatus.SUBMITTED
        reason_codes = [f"LFE submission failed: {str(e)}"]
        retry_count = 0

    db_app = models.Application(
        ref=ref,
        product_id=app_data.product_id,
        full_name=app_data.full_name,
        cnic_encrypted=cnic_encrypted,
        mobile_encrypted=mobile_encrypted,
        cnic_masked=cnic_masked,
        mobile_masked=mobile_masked,
        income=app_data.income,
        liabilities=app_data.liabilities or 0.0,
        amount=app_data.amount,
        tenure=app_data.tenure,
        status=status,
        decision=decision,
        score=score,
        risk_band=risk_band,
        route=route,
        matched_lenders=matched_lenders,
        reason_codes=reason_codes,
        policy_version=policy_version,
        audit_id=audit_id,
        lfe_application_id=lfe_application_id,
        lfe_decision_id=lfe_decision_id,
        retry_count=retry_count,
        lfe_payload=lfe_payload_for_storage,
        lfe_response=lfe_response
    )
    db.add(db_app)
    await db.commit()
    await db.refresh(db_app)
    return db_app

async def get_applications(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Application).order_by(models.Application.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

async def retry_failed_submissions(db: AsyncSession):
    stmt = select(models.Application).where(
        models.Application.status == models.ApplicationStatus.SUBMITTED,
        models.Application.retry_count < 3
    )
    result = await db.execute(stmt)
    apps = result.scalars().all()
    for app in apps:
        app.retry_count += 1
        # In a real implementation, re‑submit to LFE here
        # For now, mark as failed after 3 attempts
        if app.retry_count >= 3:
            app.status = models.ApplicationStatus.FAILED
            app.reason_codes = ["Max retries exceeded"]
    await db.commit()
