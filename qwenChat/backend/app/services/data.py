from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import settings

# Truncate payloads so qwen2.5:0.5b stays usable
MAX_ITEMS = 40
MAX_CHARS = 12000


SYSTEM_PROMPT = """You are QwenChat, a professional assistant for the Financial System monorepo.

You help users understand and explore READ-ONLY data from:
1) finOS — core banking/insurance system (clients, applications, claims, marketplace products, policies/holdings, dashboard).
2) reseller (Comparison Engine) — resellers, customers, commissions/activities, product categories, stats.

Rules:
- Never invent database records. Prefer facts from the "Live data context" block when present.
- If data is missing or APIs are unreachable, say so clearly and suggest using the quick-action buttons.
- You cannot create, edit, or delete anything. Read-only only.
- Keep answers concise, structured, and professional.
- When listing products, include bank/provider, product name, rate/fee when available.
"""


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
                return {"ok": True, "source": url, "data": _trim(payload)}
        except Exception as exc:  # noqa: BLE001 — surface as chat-friendly error
            return {"ok": False, "source": url, "error": str(exc), "data": None}

    # --- finOS (prefer unauthenticated / admin_portal mirrors for local chatbot) ---

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

    # --- reseller ---

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
            category = str(params.get("category", "personal"))
            return await self.reseller_products(category)
        if action == "reseller_customers":
            return await self.reseller_customers(int(params.get("reseller_id", 1)))
        if action == "reseller_activities":
            return await self.reseller_activities(int(params.get("reseller_id", 1)))

        handler = handlers.get(action)
        if not handler:
            return {"ok": False, "error": f"Unknown read-only action: {action}", "data": None}
        return await handler()


data_service = DataService()


QUICK_ACTIONS: list[dict[str, Any]] = [
    {
        "id": "finos_products",
        "label": "Marketplace products",
        "group": "finOS",
        "description": "Read active front_products catalog from finOS",
        "prompt": "Summarize the finOS marketplace products from the live data.",
    },
    {
        "id": "finos_clients",
        "label": "Clients",
        "group": "finOS",
        "description": "List clients (read-only)",
        "prompt": "Summarize the finOS clients from the live data.",
    },
    {
        "id": "finos_applications",
        "label": "Applications",
        "group": "finOS",
        "description": "List applications (read-only)",
        "prompt": "Summarize finOS applications: counts by status and recent items.",
    },
    {
        "id": "finos_claims",
        "label": "Claims",
        "group": "finOS",
        "description": "List claims (read-only)",
        "prompt": "Summarize finOS claims from the live data.",
    },
    {
        "id": "finos_policies",
        "label": "Policies & holdings",
        "group": "finOS",
        "description": "Issued policies and holdings (read-only)",
        "prompt": "Summarize issued policies and holdings from finOS.",
    },
    {
        "id": "reseller_list",
        "label": "Resellers",
        "group": "Reseller",
        "description": "List resellers and commission totals",
        "prompt": "Summarize resellers, conversions, and commissions.",
    },
    {
        "id": "reseller_stats",
        "label": "Reseller stats",
        "group": "Reseller",
        "description": "Aggregate reseller stats",
        "prompt": "Explain the overall reseller stats from the live data.",
    },
    {
        "id": "reseller_product_stats",
        "label": "Product stats",
        "group": "Reseller",
        "description": "Banks and product counts via reseller proxy",
        "prompt": "Summarize product catalog stats (banks and products).",
    },
    {
        "id": "reseller_categories",
        "label": "Product categories",
        "group": "Reseller",
        "description": "Available product categories",
        "prompt": "List available product categories and what they mean.",
    },
    {
        "id": "reseller_products",
        "label": "Personal loans",
        "group": "Reseller",
        "description": "Products in personal category",
        "params": {"category": "personal"},
        "prompt": "Compare personal loan products from the live data.",
    },
    {
        "id": "reseller_activities",
        "label": "Commissions (R1)",
        "group": "Reseller",
        "description": "Activities/commissions for reseller id=1",
        "params": {"reseller_id": 1},
        "prompt": "Summarize commission activities for reseller 1.",
    },
    {
        "id": "reseller_customers",
        "label": "Customers (R1)",
        "group": "Reseller",
        "description": "Customers for reseller id=1",
        "params": {"reseller_id": 1},
        "prompt": "Summarize customers for reseller 1.",
    },
]


def format_context_block(action: str, result: dict[str, Any]) -> str:
    return (
        f"### Live data context\n"
        f"Action: `{action}` (READ-ONLY)\n"
        f"OK: {result.get('ok')}\n"
        f"Source: {result.get('source')}\n"
        f"Payload:\n```json\n{_serialize(result.get('data') if result.get('ok') else result)}\n```\n"
    )
