from fastapi import APIRouter, Depends, HTTPException
from .. import schemas
from ..lfe_client import lfe_client

router = APIRouter()

@router.post("/check", response_model=schemas.EligibilityResult)
async def check_eligibility(data: schemas.EligibilityCheck):
    try:
        lfe_response = await lfe_client.check_eligibility(data.model_dump())
        matches = lfe_response.get("products", [])
        if not matches:
            matches = ["Explore our full product portfolio"]
        return {"matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LFE eligibility check failed: {str(e)}")
