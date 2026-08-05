from __future__ import annotations

import json
from typing import Any, AsyncIterator

import httpx

from app.core.config import settings


JURISDICTION_CURRENCY = {
    "PK": "PKR",
    "UAE": "AED",
    "AE": "AED",
    "KSA": "SAR",
    "SA": "SAR",
    "US": "USD",
    "UK": "GBP",
    "GB": "GBP",
}

INCOME_BAND_LABELS = {
    "<50k": "under {cur} 50,000",
    "50k-100k": "{cur} 50,000 – 100,000",
    "100k-250k": "{cur} 100,000 – 250,000",
    ">250k": "over {cur} 250,000",
}

CATEGORY_COST_RULES = {
    "savings": (
        "Cost metrics = Profit Rate + Maintenance Fee. "
        "Best = highest Profit Rate; tie-break = lowest Maintenance Fee."
    ),
    "credit_card": (
        "Cost metrics = APR + Annual Fee. "
        "Best = lowest APR; tie-break = lowest Annual Fee. "
        "Do not prefer N/A APR over a real APR."
    ),
    "personal_loan": (
        "Cost metrics = APR + Processing Fee. "
        "Best = lowest APR; tie-break = lowest Processing Fee."
    ),
    "health_insurance": (
        "Cost metrics = Annual Premium + Coverage Limit. "
        "Best = highest Coverage Limit when premium varies by age."
    ),
    "motor_insurance": (
        "Cost metrics = Premium Rate (% of vehicle value). "
        "Best = lowest Premium Rate."
    ),
    "life_insurance": (
        "Cost metrics = Death Benefit + Annual Premium. "
        "Best = highest Death Benefit when premium varies by age."
    ),
}


def currency_for_jurisdiction(jurisdiction: str | None) -> str:
    code = (jurisdiction or "PK").strip().upper()
    return JURISDICTION_CURRENCY.get(code, "PKR")


def format_income_band(income_band: str | None, currency: str) -> str:
    band = (income_band or "").strip()
    template = INCOME_BAND_LABELS.get(band)
    if template:
        return template.format(cur=currency)
    if band:
        return f"{currency} ({band})"
    return f"{currency} (not specified)"


SYSTEM_PROMPT = (
    "You are FinOS, a financial product advisor. "
    "Use ONLY the facts in the user message. Do not invent products, rates, fees, coverage, features, or eligibility. "
    "Currency rule: always use the given Currency code (PK→PKR, UAE→AED, KSA→SAR). Never use $ unless Currency is USD. "
    "Each product category has different Cost-column metrics AND different Matrix features. "
    "Follow the Ranking rule for Cost. Also use the Matrix comparison (feature yes/no grid) to strengthen the recommendation. "
    "The engine already ranked eligible products. You MUST recommend the BEST / recommended product first. "
    "Always cite exact Cost metrics from cost_summary. When useful, mention Matrix features the BEST product has "
    "(and notable features competitors lack). "
    "Do not invent Sharia status — use the sharia field. "
    "Write a COMPLETE answer — never stop mid-sentence or mid-list. Finish with a clear closing sentence. "
    "Structure: (1) Recommend BEST with provider + Cost metrics + why, "
    "(2) Optional short Matrix/feature comparison vs alternatives, "
    "(3) One-sentence exclusion summary if exclusions exist, "
    "(4) End with a complete final sentence."
)


class OllamaExplainService:
    def __init__(self) -> None:
        self.base = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT

    def _options(self) -> dict[str, Any]:
        return {
            "temperature": 0.15,
            "top_p": 0.8,
            "repeat_penalty": 1.15,
            "num_ctx": 4096,
            # -1 = no token cap; model stops naturally when the answer is complete
            "num_predict": -1,
        }

    def _format_product_block(self, p: dict[str, Any], currency: str) -> str:
        features = p.get("features") or []
        if isinstance(features, list):
            feat_txt = "; ".join(str(f) for f in features[:5]) or "n/a"
        else:
            feat_txt = str(features)
        eligibility = p.get("eligibility") or {}
        cost_summary = p.get("cost_summary") or "n/a"
        return "\n".join(
            [
                f"- Rank #{p.get('rank')}: {p.get('name')} | provider={p.get('provider')} | id={p.get('id')}",
                f"  type={p.get('type')} | sharia={p.get('sharia')} | confidence={p.get('completeness')}%",
                f"  COST SUMMARY ({currency}): {cost_summary}",
                f"  profit_rate={p.get('profitRate') or 'n/a'} | maintenance_fee={p.get('maintenanceFee') or 'n/a'}",
                f"  apr={p.get('apr') or 'n/a'} | annual_fee={p.get('annualFee') or 'n/a'} | "
                f"processing_fee={p.get('processingFee') or 'n/a'}",
                f"  coverage_limit={p.get('coverageLimit') or 'n/a'} | annual_premium={p.get('annualPremium') or 'n/a'}",
                f"  premium_rate={p.get('premiumRate') or 'n/a'} | death_benefit={p.get('deathBenefit') or 'n/a'}",
                f"  eligibility={eligibility}",
                f"  features={feat_txt}",
            ]
        )

    def build_user_prompt(self, payload: dict[str, Any]) -> str:
        top = payload.get("top_eligible") or []
        excluded = payload.get("excluded_sample") or []
        matrix = payload.get("matrix_comparison") or {}
        jurisdiction = payload.get("jurisdiction") or "PK"
        intent = payload.get("intent") or "n/a"
        currency = payload.get("currency") or currency_for_jurisdiction(str(jurisdiction))
        income_label = format_income_band(payload.get("income_band"), currency)
        category_rule = CATEGORY_COST_RULES.get(str(intent), CATEGORY_COST_RULES.get("savings", ""))
        ranking_rule = payload.get("ranking_rule") or category_rule
        best_name = payload.get("recommended_product_name")
        best_provider = payload.get("recommended_provider")
        best_id = payload.get("recommended_product_id")
        best_reason = payload.get("recommended_reason")

        lines = [
            f"Category: {intent}",
            f"Jurisdiction: {jurisdiction}",
            f"Currency: {currency}",
            f"Age: {payload.get('age')}",
            f"Income label: {income_label}",
            f"Category Cost rules: {category_rule}",
            f"Ranking rule: {ranking_rule}",
            f"BEST product (MUST recommend first): {best_name} from {best_provider} (id={best_id})",
            f"BEST reason: {best_reason}",
            f"IMPORTANT: Use {currency} only. Recommend BEST first. Quote Cost Summary numbers exactly.",
            "Also use Matrix comparison features for this category (features differ by category).",
            "",
            "Eligible products with FULL Cost details (already ranked best-first):",
        ]
        if not top:
            lines.append("- (none)")
        for p in top[:8]:
            lines.append(self._format_product_block(p, currency))

        lines.append("")
        lines.append("Matrix tab comparison (Cost + category-specific features):")
        if not matrix:
            lines.append("- (none)")
        else:
            lines.append(f"Matrix note: {matrix.get('note') or 'n/a'}")
            for mp in (matrix.get("products") or [])[:8]:
                yes = ", ".join(mp.get("features_yes") or []) or "none"
                no = ", ".join((mp.get("features_no") or [])[:8]) or "none"
                lines.append(
                    f"- Rank #{mp.get('rank')}: {mp.get('name')} ({mp.get('provider')}) | "
                    f"cost={mp.get('cost')} | sharia={mp.get('sharia')} | "
                    f"features_yes=[{yes}] | features_no=[{no}]"
                )
            feature_matrix = matrix.get("feature_matrix") or []
            if feature_matrix:
                lines.append("Feature presence grid:")
                for row in feature_matrix[:12]:
                    cells = ", ".join(
                        f"{c.get('provider')}:{'Y' if c.get('has') else 'N'}"
                        for c in (row.get("presence") or [])[:8]
                    )
                    lines.append(f"  - {row.get('feature')}: {cells}")

        lines.append("")
        lines.append("Exclusions (sample):")
        if not excluded:
            lines.append("- (none)")
        for e in excluded[:5]:
            reasons = e.get("reasons") or []
            reason_txt = ", ".join(reasons) if isinstance(reasons, list) else str(reasons)
            lines.append(
                f"- {e.get('name')} ({e.get('provider')}): "
                f"cost={e.get('cost_summary') or 'n/a'}; reasons={reason_txt}"
            )
        lines.append("")
        lines.append(
            f"Write the full customer explanation now using {currency} only. "
            "Start with the BEST product, cite Cost Summary, and use Matrix features where helpful. "
            "Write a complete answer with a proper ending — do not truncate."
        )
        return "\n".join(lines)

    async def explain_stream(self, payload: dict[str, Any]) -> AsyncIterator[str]:
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": self.build_user_prompt(payload)},
            ],
            "stream": True,
            "think": False,
            "keep_alive": -1,
            "options": self._options(),
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream("POST", f"{self.base}/api/chat", json=body) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    token = (chunk.get("message") or {}).get("content") or ""
                    if token:
                        yield token
                    if chunk.get("done"):
                        break

    async def explain(self, payload: dict[str, Any]) -> str:
        parts: list[str] = []
        async for token in self.explain_stream(payload):
            parts.append(token)
        return "".join(parts).strip()

    async def health(self) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base}/api/tags")
                resp.raise_for_status()
                models = [m.get("name") for m in resp.json().get("models", [])]
                return {
                    "ok": True,
                    "model": self.model,
                    "models": models,
                    "model_present": any(self.model in (m or "") for m in models),
                }
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "model": self.model, "error": str(exc)}


ollama_explain_service = OllamaExplainService()
