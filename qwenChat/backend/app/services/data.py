from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import settings
from app.services.summarize import facts_to_markdown, summarize_action

MAX_CHARS = 100000


SYSTEM_PROMPT = """You are the Financial System assistant (read-only), powered by Qwen.

You receive live database data and must write a clear natural-language SUMMARY for the user.

HARD RULES:
1) Summarize in plain professional English (or match the user's language). Do NOT paste raw JSON.
2) Use AUTHORITATIVE COUNTS exactly when stating totals or breakdowns — never invent or recount.
3) Each status/category appears once. Do not split the same status into two labels.
4) If the fetch failed (ok=false), say so briefly and suggest retrying a quick action.
5) Read-only: you cannot create, edit, or delete data.
6) Structure: short overview → key totals/breakdown → notable items or groups. No duplicate sections.
7) Be informative but readable — group marketplace products by type/provider; do not dump every field.
"""


USER_PROMPT_WITH_FACTS = (
    "Summarize the live database data below for the user in clear prose. "
    "Do not output raw JSON. Use AUTHORITATIVE COUNTS for every number. "
    "User request: {message}"
)


def _serialize(data: Any) -> str:
    text = json.dumps(data, default=str, ensure_ascii=False, indent=2)
    if len(text) > MAX_CHARS:
        return text[:MAX_CHARS] + "\n...[truncated for context size]"
    return text


class DataService:
    """Read-only HTTP client for finOS + reseller APIs. Never mutates remote data."""

    def __init__(self) -> None:
        self.finos = settings.finos_api_url.rstrip("/")
        self.reseller = settings.reseller_api_url.rstrip("/")

    async def _get(self, url: str) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                payload = resp.json()
                return {"ok": True, "source": url, "data": payload}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "source": url, "error": str(exc), "data": None}

    async def finos_products(self) -> dict[str, Any]:
        return await self._get(f"{self.finos}/front_products")

    async def finos_clients(self) -> dict[str, Any]:
        return await self._get(f"{self.finos}/admin_portal/clients")

    async def finos_applications(self) -> dict[str, Any]:
        return await self._get(f"{self.finos}/admin_portal/applications")

    async def finos_claims(self) -> dict[str, Any]:
        return await self._get(f"{self.finos}/admin_portal/claims")

    async def finos_policies(self) -> dict[str, Any]:
        return await self._get(f"{self.finos}/admin_portal/products")

    async def finos_marketplace(self) -> dict[str, Any]:
        return await self._get(f"{self.finos}/admin_portal/marketplace")

    async def reseller_list(self) -> dict[str, Any]:
        return await self._get(f"{self.reseller}/resellers/")

    async def reseller_stats(self) -> dict[str, Any]:
        return await self._get(f"{self.reseller}/resellers/stats")

    async def reseller_product_stats(self) -> dict[str, Any]:
        return await self._get(f"{self.reseller}/products/stats")

    async def reseller_categories(self) -> dict[str, Any]:
        return await self._get(f"{self.reseller}/products/categories")

    async def reseller_products(self, category: str) -> dict[str, Any]:
        return await self._get(f"{self.reseller}/products/{category}")

    async def reseller_customers(self, reseller_id: int) -> dict[str, Any]:
        return await self._get(f"{self.reseller}/customers/reseller/{reseller_id}")

    async def reseller_activities(self, reseller_id: int) -> dict[str, Any]:
        return await self._get(f"{self.reseller}/activities/reseller/{reseller_id}")

    async def run_action(self, action: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        params = params or {}
        handlers = {
            "finos_products": self.finos_products,
            "finos_clients": self.finos_clients,
            "finos_applications": self.finos_applications,
            "finos_claims": self.finos_claims,
            "finos_policies": self.finos_policies,
            "finos_marketplace": self.finos_marketplace,
            "reseller_list": self.reseller_list,
            "reseller_stats": self.reseller_stats,
            "reseller_product_stats": self.reseller_product_stats,
            "reseller_categories": self.reseller_categories,
        }
        if action == "reseller_products":
            result = await self.reseller_products(str(params.get("category", "personal")))
        elif action == "reseller_customers":
            result = await self.reseller_customers(int(params.get("reseller_id", 1)))
        elif action == "reseller_activities":
            result = await self.reseller_activities(int(params.get("reseller_id", 1)))
        else:
            handler = handlers.get(action)
            if not handler:
                return {"ok": False, "error": f"Unknown read-only action: {action}", "data": None}
            result = await handler()

        if result.get("ok") and result.get("data") is not None:
            facts = summarize_action(action, result["data"])
            result["facts"] = facts
            result["facts_markdown"] = facts_to_markdown(facts)
            # Full payload for UI — no sample truncation
            result["data_preview"] = result["data"]
        return result


data_service = DataService()


QUICK_ACTIONS: list[dict[str, Any]] = [
    {
        "id": "finos_products",
        "label": "Marketplace",
        "group": "finOS",
        "description": "Full marketplace catalog from DB",
        "prompt": "Summarize the marketplace products from the live database.",
    },
    {
        "id": "finos_clients",
        "label": "Clients",
        "group": "finOS",
        "description": "Full clients list from DB",
        "prompt": "Summarize all clients from the live database.",
    },
    {
        "id": "finos_applications",
        "label": "Applications",
        "group": "finOS",
        "description": "Full applications list from DB",
        "prompt": "Summarize all applications from the live database by status.",
    },
    {
        "id": "finos_claims",
        "label": "Claims",
        "group": "finOS",
        "description": "Full claims list from DB",
        "prompt": "Summarize all claims from the live database.",
    },
    {
        "id": "finos_policies",
        "label": "Policies",
        "group": "finOS",
        "description": "Full policies and holdings from DB",
        "prompt": "Summarize all policies and holdings from the live database.",
    },
    {
        "id": "reseller_list",
        "label": "Resellers",
        "group": "Reseller",
        "description": "Full resellers list from DB",
        "prompt": "Summarize all resellers from the live database.",
    },
    {
        "id": "reseller_stats",
        "label": "Stats",
        "group": "Reseller",
        "description": "Aggregate reseller stats",
        "prompt": "Summarize the reseller stats from the live database.",
    },
    {
        "id": "reseller_product_stats",
        "label": "Catalog stats",
        "group": "Reseller",
        "description": "Banks and product counts",
        "prompt": "Summarize the product catalog stats from the live database.",
    },
    {
        "id": "reseller_categories",
        "label": "Categories",
        "group": "Reseller",
        "description": "All product categories",
        "prompt": "Summarize the product categories from the live database.",
    },
    {
        "id": "reseller_products",
        "label": "Personal loans",
        "group": "Reseller",
        "description": "Full personal category products",
        "params": {"category": "personal"},
        "prompt": "Summarize personal loan products from the live database.",
    },
    {
        "id": "reseller_activities",
        "label": "Commissions",
        "group": "Reseller",
        "description": "Full activities for reseller 1",
        "params": {"reseller_id": 1},
        "prompt": "Summarize commission activities from the live database.",
    },
    {
        "id": "reseller_customers",
        "label": "Customers",
        "group": "Reseller",
        "description": "Full customers for reseller 1",
        "params": {"reseller_id": 1},
        "prompt": "Summarize customers from the live database.",
    },
]


def _authoritative_counts(facts: dict[str, Any]) -> dict[str, Any]:
    """Small accurate totals for the model — prevents recounting errors."""
    out: dict[str, Any] = {"entity": facts.get("entity"), "total": facts.get("total")}
    for key in (
        "by_status",
        "by_lifecycle_stage",
        "by_product_type",
        "by_provider",
        "by_conversion_status",
        "stats",
        "categories",
        "total_commission",
    ):
        if key in facts and facts[key] is not None:
            out[key] = facts[key]
    return out


def format_context_block(action: str, result: dict[str, Any]) -> str:
    if not result.get("ok"):
        return (
            "### FETCH FAILED\n"
            f"action: {action}\n"
            f"ok: false\n"
            f"error: {result.get('error')}\n"
            "Tell the user the live data fetch failed.\n"
        )

    facts = result.get("facts") or summarize_action(action, result.get("data"))
    counts = _authoritative_counts(facts)
    raw = result.get("data")
    return (
        "### AUTHORITATIVE COUNTS (copy these numbers exactly — do not recount)\n"
        f"```json\n{_serialize(counts)}\n```\n\n"
        "### RAW DATABASE DATA (write a natural-language summary — do NOT paste this JSON back)\n"
        f"action: {action}\n"
        f"source: {result.get('source')}\n"
        f"```json\n{_serialize(raw)}\n```\n"
    )


def build_user_message(message: str, has_facts: bool) -> str:
    if has_facts:
        return USER_PROMPT_WITH_FACTS.format(message=message)
    return (
        f"{message}\n\n"
        "(No live database context was attached. If the question needs DB data, "
        "ask the user to press a quick-action button.)"
    )
