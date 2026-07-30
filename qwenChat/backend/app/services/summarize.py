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


def _product_name(p: dict[str, Any]) -> str:
    features = p.get("features") or []
    if isinstance(features, list):
        for f in features:
            if isinstance(f, dict) and f.get("name") == "Product Name":
                return str(f.get("details") or p.get("product_id") or "Product")
    return str(p.get("product") or p.get("product_id") or p.get("name") or "Product")


def compact_for_llm(action: str, facts: dict[str, Any]) -> dict[str, Any]:
    """
    Small structured payload for Ollama.
    Full raw JSON blows past 0.5b/4k context so the model only sees the first
    few rows and invents wrong totals (e.g. 3 instead of 74).
    """
    records = facts.get("records")
    rows: list[Any] = records if isinstance(records, list) else []

    compact_rows: list[dict[str, Any]] = []
    if action in ("finos_products", "finos_marketplace"):
        for p in rows:
            if not isinstance(p, dict):
                continue
            pricing = p.get("pricing") or {}
            compact_rows.append(
                {
                    "name": _product_name(p),
                    "provider": p.get("provider_id") or p.get("bank"),
                    "type": p.get("product_type"),
                    "status": p.get("status"),
                    "rate": pricing.get("apr")
                    or pricing.get("interest_rate")
                    or pricing.get("profit_rate"),
                }
            )
    elif action == "finos_applications":
        for a in rows:
            if not isinstance(a, dict):
                continue
            compact_rows.append(
                {
                    "id": a.get("id"),
                    "status": _norm_status(a.get("status")),
                    "product_type": a.get("product_type") or a.get("product_label"),
                    "amount": a.get("amount"),
                    "currency": a.get("currency"),
                }
            )
    elif action == "finos_clients":
        for c in rows:
            if not isinstance(c, dict):
                continue
            compact_rows.append(
                {
                    "id": c.get("id"),
                    "name": c.get("name"),
                    "lifecycle_stage": _norm_status(c.get("lifecycle_stage")),
                    "email": c.get("email"),
                }
            )
    elif action == "finos_claims":
        for c in rows:
            if not isinstance(c, dict):
                continue
            compact_rows.append(
                {
                    "id": c.get("id"),
                    "status": _norm_status(c.get("status")),
                    "type": c.get("claim_type") or c.get("type"),
                }
            )
    elif action == "reseller_list":
        for r in rows:
            if not isinstance(r, dict):
                continue
            compact_rows.append(
                {
                    "id": r.get("id"),
                    "name": r.get("name") or r.get("business_name"),
                    "status": _norm_status(r.get("status")),
                    "conversions": r.get("conversions"),
                    "commission": r.get("commission"),
                }
            )
    elif action == "reseller_products":
        for p in rows:
            if not isinstance(p, dict):
                continue
            compact_rows.append(
                {
                    "bank": p.get("bank"),
                    "product": p.get("product"),
                    "rate": p.get("rate"),
                    "fee": p.get("fee"),
                    "tenure": p.get("tenure"),
                }
            )
    elif action in ("reseller_activities", "reseller_customers"):
        for row in rows:
            if isinstance(row, dict):
                # drop huge nested blobs if any
                compact_rows.append({k: v for k, v in row.items() if not isinstance(v, (dict, list)) or k in ("id",)})
    elif action == "finos_policies":
        if isinstance(records, dict):
            for key, lst in records.items():
                if isinstance(lst, list):
                    for row in lst:
                        if isinstance(row, dict):
                            compact_rows.append({"kind": key, **{k: row.get(k) for k in ("id", "status", "product_type", "client_id") if k in row}})
        else:
            compact_rows = [r for r in rows if isinstance(r, dict)]
    else:
        # stats / categories / fallback — keep as-is but small
        if isinstance(records, list):
            compact_rows = records
        elif records is not None:
            return {
                "total": facts.get("total"),
                "data": records,
            }

    out: dict[str, Any] = {
        "total": facts.get("total"),
        "row_count": len(compact_rows),
        "rows": compact_rows,
    }
    for key in (
        "by_status",
        "by_lifecycle_stage",
        "by_product_type",
        "by_provider",
        "by_conversion_status",
        "stats",
        "categories",
        "total_commission",
        "entity",
    ):
        if key in facts and facts[key] is not None:
            out[key] = facts[key]
    return out


def _fmt_breakdown(title: str, bucket: dict[str, Any] | None) -> str:
    if not isinstance(bucket, dict) or not bucket:
        return ""
    parts = [f"{k.replace('_', ' ')} (**{v}**)" for k, v in bucket.items()]
    return f"{title}: " + ", ".join(parts) + "."


def natural_summary(action: str, facts: dict[str, Any]) -> str:
    """
    Deterministic natural-language summary from live DB facts.
    Guarantees correct totals (no LLM counting) and responds instantly.
    """
    entity = str(facts.get("entity") or action).replace("_", " ")
    total = facts.get("total")
    lines: list[str] = []

    if action in ("finos_products", "finos_marketplace"):
        lines.append(
            f"The live marketplace catalog has a total of **{total}** products."
        )
        bt = _fmt_breakdown("By product type", facts.get("by_product_type"))
        bp = _fmt_breakdown("By provider", facts.get("by_provider"))
        if bt:
            lines.append(bt)
        if bp:
            lines.append(bp)
        records = facts.get("records") or []
        if isinstance(records, list) and records:
            # Highlight a few named products without dumping all JSON
            samples = []
            for p in records[:8]:
                if isinstance(p, dict):
                    samples.append(
                        f"{_product_name(p)} ({p.get('provider_id') or p.get('bank')}, {p.get('product_type')})"
                    )
            if samples:
                lines.append("Examples: " + "; ".join(samples) + ".")
            if len(records) > 8:
                lines.append(f"See the Facts panel for the complete list of all **{total}** products.")
        return "\n\n".join(lines)

    if action == "finos_applications":
        lines.append(f"There are **{total}** applications in finOS.")
        bs = _fmt_breakdown("By status", facts.get("by_status"))
        if bs:
            lines.append(bs)
        lines.append("Full application rows are available in the Facts panel.")
        return "\n\n".join(lines)

    if action == "finos_clients":
        lines.append(f"There are **{total}** clients in finOS.")
        bs = _fmt_breakdown("By lifecycle stage", facts.get("by_lifecycle_stage"))
        if bs:
            lines.append(bs)
        return "\n\n".join(lines)

    if action == "finos_claims":
        lines.append(f"There are **{total}** claims in finOS.")
        bs = _fmt_breakdown("By status", facts.get("by_status"))
        if bs:
            lines.append(bs)
        return "\n\n".join(lines)

    if action == "finos_policies":
        lines.append(f"There are **{total}** policies/holdings records.")
        bs = _fmt_breakdown("By status", facts.get("by_status"))
        if bs:
            lines.append(bs)
        return "\n\n".join(lines)

    if action == "reseller_list":
        lines.append(f"There are **{total}** resellers.")
        bs = _fmt_breakdown("By status", facts.get("by_status"))
        if bs:
            lines.append(bs)
        records = facts.get("records") or []
        if isinstance(records, list):
            for r in records:
                if isinstance(r, dict):
                    lines.append(
                        f"- **{r.get('name') or r.get('business_name') or r.get('id')}**: "
                        f"status `{_norm_status(r.get('status'))}`, "
                        f"conversions {r.get('conversions')}, commission {r.get('commission')}"
                    )
        return "\n".join(lines)

    if action in ("reseller_stats", "reseller_product_stats"):
        stats = facts.get("stats") or facts.get("records") or {}
        lines.append(f"**{entity.title()}** from live DB:")
        if isinstance(stats, dict):
            for k, v in stats.items():
                lines.append(f"- `{k}`: **{v}**")
        return "\n".join(lines)

    if action == "reseller_categories":
        cats = facts.get("categories") or facts.get("records") or []
        lines.append(f"There are **{total}** product categories: " + ", ".join(map(str, cats)) + ".")
        return "\n".join(lines)

    if action == "reseller_products":
        lines.append(f"There are **{total}** products in this reseller category.")
        records = facts.get("records") or []
        if isinstance(records, list):
            for p in records:
                if isinstance(p, dict):
                    lines.append(
                        f"- **{p.get('bank')}** — {p.get('product')} "
                        f"(rate: {p.get('rate')}, fee: {p.get('fee')}, tenure: {p.get('tenure')})"
                    )
        return "\n".join(lines)

    if action == "reseller_activities":
        lines.append(f"There are **{total}** commission activity records.")
        bs = _fmt_breakdown("By conversion status", facts.get("by_conversion_status"))
        if bs:
            lines.append(bs)
        if "total_commission" in facts:
            lines.append(f"Total commission: **{facts['total_commission']}**.")
        return "\n\n".join(lines)

    if action == "reseller_customers":
        lines.append(f"There are **{total}** customers for this reseller.")
        bs = _fmt_breakdown("By status", facts.get("by_status"))
        if bs:
            lines.append(bs)
        return "\n\n".join(lines)

    # fallback
    lines.append(f"**{entity.title()}** — total **{total}** records (read-only live DB).")
    return "\n".join(lines)


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
