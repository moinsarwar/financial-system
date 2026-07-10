from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from .. import schemas
from ..database import get_db
from ..utils.security import verify_admin_key
from ..lfe_client import lfe_client
from ..models import Application, ApplicationStatus

router = APIRouter()

@router.get("/stats", response_model=schemas.DashboardStats, dependencies=[Depends(verify_admin_key)])
async def get_stats(db: AsyncSession = Depends(get_db)):
    try:
        lfe_stats = await lfe_client.get_dashboard_stats()
    except:
        lfe_stats = {}

    total_submitted = await db.scalar(select(func.count(Application.id)))
    failed = await db.scalar(select(func.count()).where(Application.status == ApplicationStatus.FAILED))
    pending_lfe = await db.scalar(select(func.count()).where(Application.status == ApplicationStatus.SUBMITTED))

    return {
        "total_submitted": total_submitted or 0,
        "lfe_accepted": lfe_stats.get("lfe_accepted", 0),
        "decisions_returned": lfe_stats.get("decisions_returned", 0),
        "routed_to_lender": lfe_stats.get("routed_to_lender", 0),
        "approved_in_principle": lfe_stats.get("approved_in_principle", 0),
        "rejected": lfe_stats.get("rejected", 0),
        "manual_review": lfe_stats.get("manual_review", 0),
        "avg_lfe_response_time": lfe_stats.get("avg_lfe_response_time", 0),
        "top_rejection_reasons": lfe_stats.get("top_rejection_reasons", []),
        "top_product_routes": lfe_stats.get("top_product_routes", []),
        "lender_match_rate": lfe_stats.get("lender_match_rate", 0),
        "channel_failed": failed or 0,
        "channel_pending_lfe": pending_lfe or 0
    }
