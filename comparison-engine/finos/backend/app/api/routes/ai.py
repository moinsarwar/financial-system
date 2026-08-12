from __future__ import annotations

import json
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.ollama_explain import ollama_explain_service

router = APIRouter()


class ProductBrief(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    provider: Optional[str] = None
    type: Optional[str] = None
    rank: Optional[int] = None
    completeness: Optional[float | int] = None
    cost_summary: Optional[str] = None
    profitRate: Optional[str] = None
    maintenanceFee: Optional[str] = None
    apr: Optional[str] = None
    annualFee: Optional[str] = None
    processingFee: Optional[str] = None
    coverageLimit: Optional[str] = None
    annualPremium: Optional[str] = None
    premiumRate: Optional[str] = None
    deathBenefit: Optional[str] = None
    markup: Optional[str] = None
    fee: Optional[str] = None
    monthlyCost: Optional[float | int | str] = None
    annualCost: Optional[float | int | str] = None
    sharia: Optional[bool] = None
    features: Optional[List[Any]] = None
    eligibility: Optional[Any] = None
    pricing: Optional[Any] = None
    status: Optional[str] = None
    dataFreshness: Optional[str] = None
    reasons: Optional[List[str]] = None


class ExplainRequest(BaseModel):
    intent: Optional[str] = None
    age: Optional[int | float | str] = None
    income_band: Optional[str] = None
    jurisdiction: Optional[str] = "PK"
    currency: Optional[str] = None
    ranking_rule: Optional[str] = None
    recommended_product_id: Optional[str] = None
    recommended_product_name: Optional[str] = None
    recommended_provider: Optional[str] = None
    recommended_reason: Optional[str] = None
    matrix_comparison: Optional[Any] = None
    top_eligible: List[ProductBrief] = Field(default_factory=list)
    excluded_sample: List[ProductBrief] = Field(default_factory=list)
    stream: bool = True


@router.get("/health")
async def ai_health():
    return await ollama_explain_service.health()


@router.post("/explain")
async def explain(req: ExplainRequest):
    payload = req.model_dump()
    if not req.top_eligible and not req.excluded_sample:
        raise HTTPException(status_code=400, detail="No eligible or excluded products to explain")

    if not req.stream:
        try:
            text = await ollama_explain_service.explain(payload)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail=f"Ollama error: {exc}") from exc
        return {"explanation": text, "model": ollama_explain_service.model}

    async def event_gen():
        try:
            async for token in ollama_explain_service.explain_stream(payload):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
