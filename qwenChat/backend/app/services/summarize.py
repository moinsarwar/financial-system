from __future__ import annotations

from collections import Counter
from typing import Any


# Collapse near-duplicate status labels so 0.5b cannot split the same bucket twice
STATUS_ALIASES: dict[str, str] = {
    "completed": "completed",
    "complete": "completed",
    "application completed": "completed",
    "app completed": "completed",
    "done": "completed",
    "approved": "approved",
    "application approved": "approved",
    "rejected": "rejected",
    "application rejected": "rejected",
    "declined": "rejected",
    "pending": "pending",
    "in progress": "in_progress",
    "in_progress": "in_progress",
    "submitted": "submitted",
    "draft": "draft",
    "cancelled": "cancelled",
    "canceled": "cancelled",
    "active": "active",
    "inactive": "inactive",
    "open": "open",
    "closed": "closed",
    "paid": "paid",
}


def _norm_status(raw: Any) -> str:
    if raw is None:
        return "unknown"
    key = str(raw).strip().lower().replace("-", " ").replace("_", " ")
    key = " ".join(key.split())
    if key in STATUS_ALIASES:
        return STATUS_ALIASES[key]
    # soft match: if contains "complet" treat as completed
    if "complet" in key:
        return "completed"
    if "approv" in key:
        return "approved"
    if "reject" in key or "declin" in key:
        return "rejected"
    return key.replace(" ", "_") or "unknown"


def _as_list(data: Any) -> list[Any]:
    if data is None:
        return []
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("items", "applications", "clients", "claims", "products", "resellers", "customers", "activities"):
            if isinstance(data.get(key), list):
                return data[key]
        # admin portal sometimes returns bare list-like dict values
        if "total" in data and "products" in data:
            return data.get("products") or []
    return []


def _count_by(items: list[Any], field: str) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for item in items:
        if not isinstance(item, dict):
            continue
        counter[_norm_status(item.get(field))] += 1
    return dict(sorted(counter.items(), key=lambda x: (-x[1], x[0])))


def _product_name(p: dict[str, Any]) -> str:
    features = p.get("features") or []
    if isinstance(features, list):
        for f in features:
            if isinstance(f, dict) and f.get("name") == "Product Name":
                return str(f.get("details") or p.get("product_id") or "Product")
    return str(p.get("product") or p.get("product_id") or p.get("name") or "Product")


def summarize_action(action: str, raw: Any) -> dict[str, Any]:
    """Build deterministic facts. The LLM must copy these numbers, never recount."""
    items = _as_list(raw)

    if action == "finos_applications":
        by_status = _count_by(items, "status")
        samples = []
        for a in items[:8]:
            if not isinstance(a, dict):
                continue
            samples.append(
                {
                    "id": a.get("id"),
                    "status": _norm_status(a.get("status")),
                    "product_type": a.get("product_type") or a.get("product_label"),
                    "amount": a.get("amount"),
                    "currency": a.get("currency"),
                }
            )
        return {
            "entity": "applications",
            "total": len(items),
            "by_status": by_status,
            "note": "Status labels are normalized. Each status appears once. Do not invent extra statuses.",
            "samples": samples,
        }

    if action == "finos_clients":
        by_stage = _count_by(items, "lifecycle_stage")
        return {
            "entity": "clients",
            "total": len(items),
            "by_lifecycle_stage": by_stage,
            "samples": [
                {
                    "id": c.get("id"),
                    "name": c.get("name"),
                    "lifecycle_stage": _norm_status(c.get("lifecycle_stage")),
                }
                for c in items[:8]
                if isinstance(c, dict)
            ],
        }

    if action == "finos_claims":
        by_status = _count_by(items, "status")
        return {
            "entity": "claims",
            "total": len(items),
            "by_status": by_status,
            "samples": [
                {"id": c.get("id"), "status": _norm_status(c.get("status"))}
                for c in items[:8]
                if isinstance(c, dict)
            ],
        }

    if action in ("finos_products", "finos_marketplace"):
        products = items
        if isinstance(raw, dict) and isinstance(raw.get("products"), list):
            products = raw["products"]
        by_type: Counter[str] = Counter()
        by_provider: Counter[str] = Counter()
        samples = []
        for p in products:
            if not isinstance(p, dict):
                continue
            ptype = str(p.get("product_type") or "other")
            provider = str(p.get("provider_id") or p.get("bank") or "unknown")
            by_type[ptype] += 1
            by_provider[provider] += 1
            if len(samples) < 10:
                pricing = p.get("pricing") or {}
                samples.append(
                    {
                        "name": _product_name(p),
                        "provider": provider,
                        "type": ptype,
                        "rate": pricing.get("apr")
                        or pricing.get("interest_rate")
                        or pricing.get("profit_rate")
                        or p.get("rate"),
                    }
                )
        return {
            "entity": "marketplace_products",
            "total": len(products) if products else (raw.get("total") if isinstance(raw, dict) else 0),
            "by_product_type": dict(sorted(by_type.items(), key=lambda x: (-x[1], x[0]))),
            "by_provider": dict(sorted(by_provider.items(), key=lambda x: (-x[1], x[0]))[:15]),
            "samples": samples,
        }

    if action == "finos_policies":
        return {
            "entity": "policies_and_holdings",
            "total": len(items),
            "by_status": _count_by(items, "status"),
            "samples": items[:8],
        }

    if action == "reseller_list":
        return {
            "entity": "resellers",
            "total": len(items),
            "by_status": _count_by(items, "status"),
            "samples": [
                {
                    "id": r.get("id"),
                    "name": r.get("name") or r.get("business_name"),
                    "status": _norm_status(r.get("status")),
                    "conversions": r.get("conversions"),
                    "commission": r.get("commission"),
                }
                for r in items[:10]
                if isinstance(r, dict)
            ],
        }

    if action == "reseller_stats":
        return {"entity": "reseller_stats", "stats": raw if isinstance(raw, dict) else {"value": raw}}

    if action == "reseller_product_stats":
        return {"entity": "product_stats", "stats": raw if isinstance(raw, dict) else {"value": raw}}

    if action == "reseller_categories":
        cats = raw if isinstance(raw, list) else _as_list(raw)
        return {"entity": "product_categories", "total": len(cats), "categories": cats}

    if action == "reseller_products":
        return {
            "entity": "reseller_products",
            "total": len(items),
            "products": [
                {
                    "bank": p.get("bank"),
                    "product": p.get("product"),
                    "rate": p.get("rate"),
                    "fee": p.get("fee"),
                    "tenure": p.get("tenure"),
                }
                for p in items[:20]
                if isinstance(p, dict)
            ],
        }

    if action == "reseller_activities":
        return {
            "entity": "commission_activities",
            "total": len(items),
            "by_conversion_status": _count_by(items, "conversion_status"),
            "total_commission": sum(float(a.get("commission") or 0) for a in items if isinstance(a, dict)),
            "samples": items[:10],
        }

    if action == "reseller_customers":
        return {
            "entity": "customers",
            "total": len(items),
            "by_status": _count_by(items, "status"),
            "samples": items[:10],
        }

    return {"entity": action, "total": len(items), "raw_preview": items[:5]}


def facts_to_markdown(facts: dict[str, Any]) -> str:
    """Deterministic answer — used as ground truth for the model and UI."""
    lines: list[str] = []
    entity = facts.get("entity", "data")
    lines.append(f"**{entity.replace('_', ' ').title()}** (computed from live DB, read-only)")
    if "total" in facts:
        lines.append(f"- Total: **{facts['total']}**")

    for key in (
        "by_status",
        "by_lifecycle_stage",
        "by_product_type",
        "by_provider",
        "by_conversion_status",
    ):
        bucket = facts.get(key)
        if isinstance(bucket, dict) and bucket:
            lines.append(f"- {key.replace('_', ' ').title()}:")
            for label, count in bucket.items():
                lines.append(f"  - `{label}`: **{count}**")

    if isinstance(facts.get("stats"), dict):
        lines.append("- Stats:")
        for k, v in facts["stats"].items():
            lines.append(f"  - `{k}`: **{v}**")

    if "categories" in facts:
        lines.append(f"- Categories: {', '.join(map(str, facts['categories']))}")

    if "total_commission" in facts:
        lines.append(f"- Total commission: **{facts['total_commission']}**")

    if facts.get("note"):
        lines.append(f"- Note: {facts['note']}")

    samples = facts.get("samples") or facts.get("products")
    if isinstance(samples, list) and samples:
        lines.append("- Examples:")
        for s in samples[:6]:
            lines.append(f"  - {s}")

    return "\n".join(lines)
