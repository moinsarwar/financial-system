from __future__ import annotations

import json
from collections import Counter
from typing import Any


# Collapse near-duplicate status labels for accurate counts only
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
        for key in (
            "items",
            "applications",
            "clients",
            "claims",
            "products",
            "resellers",
            "customers",
            "activities",
            "policies",
            "holdings",
        ):
            if isinstance(data.get(key), list):
                return data[key]
        # Single aggregate object (stats) — not a list
        return []
    return []


def _count_by(items: list[Any], field: str) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for item in items:
        if not isinstance(item, dict):
            continue
        counter[_norm_status(item.get(field))] += 1
    return dict(sorted(counter.items(), key=lambda x: (-x[1], x[0])))


def _full_records(raw: Any) -> list[Any] | dict[str, Any] | Any:
    """Return complete API payload for listing — never a truncated sample."""
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        products = raw.get("products")
        if isinstance(products, list):
            return products
        items = _as_list(raw)
        if items:
            return items
        return raw
    return raw


def _json_line(obj: Any) -> str:
    return json.dumps(obj, default=str, ensure_ascii=False)


def summarize_action(action: str, raw: Any) -> dict[str, Any]:
    """Facts = counts + FULL DB records (no samples / no field stripping)."""
    records = _full_records(raw)
    items = records if isinstance(records, list) else _as_list(raw)

    base: dict[str, Any] = {
        "entity": action,
        "list_all": True,
        "total": len(items) if isinstance(items, list) else (1 if records is not None else 0),
        "records": records,  # pure DB / API rows
    }

    if action == "finos_applications":
        base["entity"] = "applications"
        base["by_status"] = _count_by(items, "status")
        return base

    if action == "finos_clients":
        base["entity"] = "clients"
        base["by_lifecycle_stage"] = _count_by(items, "lifecycle_stage")
        return base

    if action == "finos_claims":
        base["entity"] = "claims"
        base["by_status"] = _count_by(items, "status")
        return base

    if action in ("finos_products", "finos_marketplace"):
        products = items
        by_type: Counter[str] = Counter()
        by_provider: Counter[str] = Counter()
        for p in products:
            if not isinstance(p, dict):
                continue
            by_type[str(p.get("product_type") or "other")] += 1
            by_provider[str(p.get("provider_id") or p.get("bank") or "unknown")] += 1
        base["entity"] = "marketplace_products"
        base["total"] = len(products)
        base["by_product_type"] = dict(sorted(by_type.items(), key=lambda x: (-x[1], x[0])))
        base["by_provider"] = dict(sorted(by_provider.items(), key=lambda x: (-x[1], x[0])))
        base["records"] = products
        return base

    if action == "finos_policies":
        base["entity"] = "policies_and_holdings"
        base["by_status"] = _count_by(items, "status")
        # admin_portal/products may return dict with policies+holdings
        if isinstance(raw, dict) and not items:
            base["records"] = raw
            base["total"] = sum(len(v) for v in raw.values() if isinstance(v, list))
        return base

    if action == "reseller_list":
        base["entity"] = "resellers"
        base["by_status"] = _count_by(items, "status")
        return base

    if action == "reseller_stats":
        return {
            "entity": "reseller_stats",
            "list_all": True,
            "total": 1,
            "stats": raw if isinstance(raw, dict) else {"value": raw},
            "records": raw,
        }

    if action == "reseller_product_stats":
        return {
            "entity": "product_stats",
            "list_all": True,
            "total": 1,
            "stats": raw if isinstance(raw, dict) else {"value": raw},
            "records": raw,
        }

    if action == "reseller_categories":
        cats = raw if isinstance(raw, list) else _as_list(raw)
        return {
            "entity": "product_categories",
            "list_all": True,
            "total": len(cats),
            "categories": cats,
            "records": cats,
        }

    if action == "reseller_products":
        base["entity"] = "reseller_products"
        return base

    if action == "reseller_activities":
        base["entity"] = "commission_activities"
        base["by_conversion_status"] = _count_by(items, "conversion_status")
        base["total_commission"] = sum(
            float(a.get("commission") or 0) for a in items if isinstance(a, dict)
        )
        return base

    if action == "reseller_customers":
        base["entity"] = "customers"
        base["by_status"] = _count_by(items, "status")
        return base

    return base


def facts_to_markdown(facts: dict[str, Any]) -> str:
    """Full DB dump in the reply — every record, no sample cutoff."""
    lines: list[str] = []
    entity = facts.get("entity", "data")
    lines.append(f"**{str(entity).replace('_', ' ').title()}** (full live DB data, read-only)")
    if "total" in facts:
        lines.append(f"- Total records: **{facts['total']}**")

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

    if "categories" in facts and isinstance(facts["categories"], list):
        lines.append(f"- Categories ({len(facts['categories'])}):")
        for i, c in enumerate(facts["categories"], 1):
            lines.append(f"  {i}. {_json_line(c)}")

    if "total_commission" in facts:
        lines.append(f"- Total commission: **{facts['total_commission']}**")

    records = facts.get("records")
    if records is None:
        return "\n".join(lines)

    lines.append("")
    if isinstance(records, list):
        lines.append(f"**Complete DB list ({len(records)}):**")
        for i, row in enumerate(records, 1):
            lines.append(f"{i}. {_json_line(row)}")
    elif isinstance(records, dict):
        # nested collections (e.g. policies + holdings) or single stats object
        nested_lists = {k: v for k, v in records.items() if isinstance(v, list)}
        if nested_lists:
            for key, rows in nested_lists.items():
                lines.append(f"**{key} ({len(rows)}):**")
                for i, row in enumerate(rows, 1):
                    lines.append(f"{i}. {_json_line(row)}")
            other = {k: v for k, v in records.items() if not isinstance(v, list)}
            if other:
                lines.append(f"**Other fields:** {_json_line(other)}")
        else:
            lines.append("**Complete DB record:**")
            lines.append(_json_line(records))
    else:
        lines.append(f"**Complete DB value:** {_json_line(records)}")

    return "\n".join(lines)
