from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import settings
from app.services.summarize import facts_to_markdown, summarize_action

# Keep raw preview small for the UI panel; LLM gets facts only
MAX_ITEMS = 25
MAX_CHARS = 8000


SYSTEM_PROMPT = """You are the Financial System assistant (read-only).

You answer using ONLY the FACTS block when it is provided.
finOS = core banking/insurance data. Reseller = partner commissions and catalog.

HARD RULES:
1) NEVER invent numbers, statuses, products, clients, or commissions.
2) NEVER recount or re-group data. Copy counts EXACTLY from FACTS.
3) Each status/category appears ONCE. Do not list "completed" and "application completed" as two different things — FACTS are already normalized.
4) If FACTS is missing or ok=false, say the live API failed and ask the user to retry a quick action.
5) Do not claim you can create, edit, or delete anything.
6) Keep answers short: total, then breakdown, then 2–4 examples max.
7) Prefer plain language. No long essays. No duplicate sections (do not repeat the same summary twice).
"""


USER_PROMPT_WITH_FACTS = (
    "Using ONLY the FACTS below, write a short accurate summary. "
    "Copy every number exactly. Do not add statuses that are not in FACTS. "
    "Do not repeat the same breakdown twice.\n\n"
    "User request: {message}"
)


def _trim(data: Any, max_items: int = MAX_ITEMS) -> Any:
    if isinstance(data, list):
        trimmed = data[:max_items]
        if len(data) > max_items:
            return {"items": trimmed, "truncated": True, "total": len(data), "showing": max_items}
        return trimmed
    if isinstance(data, dict):
        if "products" in data and isinstance(data["products"], list):
            products = data["products"][:max_items]
            out = {**data, "products": products}
            if len(data["products"]) > max_items:
                out["truncated"] = True
                out["total"] = len(data["products"])
                out["showing"] = max_items
            return out
        return data
    return data


def _serialize(data: Any) -> str:
    text = json.dumps(data, default=str, ensure_ascii=False, indent=2)
    if len(text) > MAX_CHARS:
        return text[:MAX_CHARS] + "\n...[truncated]"
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
            result["data_preview"] = _trim(result["data"])
        return result


data_service = DataService()


QUICK_ACTIONS: list[dict[str, Any]] = [
    {
        "id": "finos_products",
        "label": "Marketplace",
        "group": "finOS",
        "description": "Active marketplace catalog",
        "prompt": "List ALL marketplace products from FACTS with totals and full catalog.",
    },
    {
        "id": "finos_clients",
        "label": "Clients",
        "group": "finOS",
        "description": "Clients list (read-only)",
        "prompt": "Summarize clients using FACTS only.",
    },
    {
        "id": "finos_applications",
        "label": "Applications",
        "group": "finOS",
        "description": "Applications by status (read-only)",
        "prompt": "Summarize applications using FACTS only. Use by_status exactly once.",
    },
    {
        "id": "finos_claims",
        "label": "Claims",
        "group": "finOS",
        "description": "Claims (read-only)",
        "prompt": "Summarize claims using FACTS only.",
    },
    {
        "id": "finos_policies",
        "label": "Policies",
        "group": "finOS",
        "description": "Policies and holdings",
        "prompt": "Summarize policies and holdings using FACTS only.",
    },
    {
        "id": "reseller_list",
        "label": "Resellers",
        "group": "Reseller",
        "description": "Reseller list and commissions",
        "prompt": "Summarize resellers using FACTS only.",
    },
    {
        "id": "reseller_stats",
        "label": "Stats",
        "group": "Reseller",
        "description": "Aggregate reseller stats",
        "prompt": "Summarize reseller stats using FACTS only.",
    },
    {
        "id": "reseller_product_stats",
        "label": "Catalog stats",
        "group": "Reseller",
        "description": "Banks and product counts",
        "prompt": "Summarize catalog stats using FACTS only.",
    },
    {
        "id": "reseller_categories",
        "label": "Categories",
        "group": "Reseller",
        "description": "Product categories",
        "prompt": "List product categories using FACTS only.",
    },
    {
        "id": "reseller_products",
        "label": "Personal loans",
        "group": "Reseller",
        "description": "Personal category products",
        "params": {"category": "personal"},
        "prompt": "Compare personal loan products using FACTS only.",
    },
    {
        "id": "reseller_activities",
        "label": "Commissions",
        "group": "Reseller",
        "description": "Activities for reseller 1",
        "params": {"reseller_id": 1},
        "prompt": "Summarize commissions using FACTS only.",
    },
    {
        "id": "reseller_customers",
        "label": "Customers",
        "group": "Reseller",
        "description": "Customers for reseller 1",
        "params": {"reseller_id": 1},
        "prompt": "Summarize customers using FACTS only.",
    },
]


def format_context_block(action: str, result: dict[str, Any]) -> str:
    if not result.get("ok"):
        return (
            f"### FACTS\n"
            f"ok: false\n"
            f"action: {action}\n"
            f"error: {result.get('error')}\n"
            f"Tell the user the live data fetch failed.\n"
        )

    facts = result.get("facts") or summarize_action(action, result.get("data"))
    md = result.get("facts_markdown") or facts_to_markdown(facts)
    return (
        f"### FACTS (authoritative — copy numbers exactly, do not recount)\n"
        f"action: {action}\n"
        f"ok: true\n"
        f"source: {result.get('source')}\n\n"
        f"{md}\n\n"
        f"JSON facts:\n```json\n{_serialize(facts)}\n```\n"
    )


def build_user_message(message: str, has_facts: bool) -> str:
    if has_facts:
        return USER_PROMPT_WITH_FACTS.format(message=message)
    return (
        f"{message}\n\n"
        "(No FACTS block was attached. If the question needs live DB numbers, "
        "ask the user to press a quick-action button.)"
    )
