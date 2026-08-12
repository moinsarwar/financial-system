"""Direct Ollama recommend (finOS-style) — no qwenChat dependency."""
from __future__ import annotations

from typing import Any

import httpx

from ..config import get_settings

SYSTEM_PROMPT = (
    "You are GreenDrive Pakistan's product advisor for solar, EV, battery, and appliances. "
    "Use ONLY the product facts and numbers in the user message. Do not invent prices or savings. "
    "Pick the single best product that matches the customer's need/query. "
    "Reply in 2–4 short sentences for a yellow highlight banner. "
    "Start with the product name, then why it fits the query, then cite key numbers "
    "(new bill / installment / monthly saving / net saving) from the data. "
    "Currency is PKR. Do not use markdown headings. Keep it concise and complete."
)


class OllamaRecommendService:
    def __init__(self) -> None:
        settings = get_settings()
        self.base = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT

    def _options(self) -> dict[str, Any]:
        return {
            "temperature": 0.2,
            "top_p": 0.85,
            "repeat_penalty": 1.1,
            "num_ctx": 4096,
            "num_predict": 280,
        }

    def build_user_prompt(
        self,
        query: str,
        products: list[dict[str, Any]],
        context: dict[str, Any] | None = None,
    ) -> str:
        ctx = context or {}
        lines = [
            f"Customer query: {query.strip()}",
            "",
            "Compare context:",
            f"- Current bill total (PKR/mo): {ctx.get('current_bill', 'n/a')}",
            f"- Tenure months: {ctx.get('tenure_months', 'n/a')}",
            f"- Down payment %: {ctx.get('down_payment_pct', 'n/a')}",
            f"- Horizon years: {ctx.get('horizon_years', 'n/a')}",
            f"- Formula best (by monthly saving): {ctx.get('formula_best', 'n/a')}",
            "",
            "Candidate products (use only these):",
        ]
        for i, p in enumerate(products[:12], start=1):
            lines.append(
                f"{i}. {p.get('product_name')} | category={p.get('category') or 'n/a'} | "
                f"price=PKR {p.get('price')} | installment=PKR {p.get('monthly_installment')} | "
                f"new_bill=PKR {p.get('new_total_bill')} | monthly_saving=PKR {p.get('monthly_saving')} | "
                f"yearly_saving=PKR {p.get('yearly_saving')} | "
                f"horizon_net=PKR {p.get('horizon_net_saving', p.get('five_year_net_saving'))} | "
                f"down=PKR {p.get('down_payment')} | "
                f"elec_factor={p.get('saving_factor_electric')} | fuel_factor={p.get('saving_factor_fuel')}"
            )
        lines.append("")
        lines.append(
            "Recommend the best match for the customer query. "
            "If the query is vague, prefer the strongest savings fit among candidates."
        )
        return "\n".join(lines)

    async def recommend(
        self,
        query: str,
        products: list[dict[str, Any]],
        context: dict[str, Any] | None = None,
    ) -> str:
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": self.build_user_prompt(query, products, context)},
            ],
            "stream": False,
            "think": False,
            "keep_alive": -1,
            "options": self._options(),
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(f"{self.base}/api/chat", json=body)
            resp.raise_for_status()
            data = resp.json()
        text = ((data.get("message") or {}).get("content") or "").strip()
        if not text:
            raise RuntimeError("Empty response from Ollama")
        return text

    async def health(self) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base}/api/tags")
                resp.raise_for_status()
                models = [m.get("name") for m in resp.json().get("models", [])]
                return {
                    "ok": True,
                    "model": self.model,
                    "base_url": self.base,
                    "models": models,
                    "model_present": any(self.model in (m or "") for m in models),
                }
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "model": self.model, "base_url": self.base, "error": str(exc)}


ollama_recommend_service = OllamaRecommendService()
