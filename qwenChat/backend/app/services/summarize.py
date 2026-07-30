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


def _md_table(headers: list[str], rows: list[list[Any]]) -> str:
    """Build a markdown table. Empty rows → empty string."""
    if not rows:
        return ""
    head = "| " + " | ".join(headers) + " |"
    sep = "| " + " | ".join("---" for _ in headers) + " |"
    body = [
        "| " + " | ".join("" if c is None else str(c) for c in row) + " |"
        for row in rows
    ]
    return "\n".join([head, sep, *body])


def _count_table(title: str, bucket: dict[str, Any] | None, key_header: str = "Key") -> str:
    if not isinstance(bucket, dict) or not bucket:
        return ""
    rows = [[str(k).replace("_", " "), v] for k, v in bucket.items()]
    return f"**{title}**\n\n" + _md_table([key_header, "Count"], rows)


def natural_summary(action: str, facts: dict[str, Any]) -> str:
    """
    Deterministic summary in markdown tables from live DB facts.
    Guarantees correct totals and responds instantly.
    """
    entity = str(facts.get("entity") or action).replace("_", " ")
    total = facts.get("total")
    parts: list[str] = []

    if action in ("finos_products", "finos_marketplace"):
        parts.append(f"**Marketplace products** — total **{total}**")
        ct = _count_table("By product type", facts.get("by_product_type"), "Type")
        cp = _count_table("By provider", facts.get("by_provider"), "Provider")
        if ct:
            parts.append(ct)
        if cp:
            parts.append(cp)
        records = facts.get("records") or []
        product_rows: list[list[Any]] = []
        if isinstance(records, list):
            for p in records:
                if not isinstance(p, dict):
                    continue
                pricing = p.get("pricing") or {}
                rate = (
                    pricing.get("apr")
                    or pricing.get("interest_rate")
                    or pricing.get("profit_rate")
                    or "—"
                )
                fee = (
                    pricing.get("processing_fee")
                    or pricing.get("annual_fee")
                    or pricing.get("annual_premium")
                    or pricing.get("maintenance_fee")
                    or "—"
                )
                product_rows.append(
                    [
                        _product_name(p),
                        p.get("provider_id") or p.get("bank") or "—",
                        str(p.get("product_type") or "—").replace("_", " "),
                        rate,
                        fee,
                        p.get("status") or "—",
                    ]
                )
        if product_rows:
            parts.append(
                f"**All products ({len(product_rows)})**\n\n"
                + _md_table(
                    ["Product", "Provider", "Type", "Rate", "Fee", "Status"],
                    product_rows,
                )
            )
        return "\n\n".join(parts)

    if action == "finos_applications":
        parts.append(f"**Applications** — total **{total}**")
        cs = _count_table("By status", facts.get("by_status"), "Status")
        if cs:
            parts.append(cs)
        records = facts.get("records") or []
        rows = []
        if isinstance(records, list):
            for a in records:
                if isinstance(a, dict):
                    rows.append(
                        [
                            a.get("id"),
                            _norm_status(a.get("status")),
                            a.get("product_type") or a.get("product_label") or "—",
                            a.get("amount") if a.get("amount") is not None else "—",
                            a.get("currency") or "—",
                        ]
                    )
        if rows:
            parts.append(
                f"**All applications ({len(rows)})**\n\n"
                + _md_table(["ID", "Status", "Product", "Amount", "Currency"], rows)
            )
        return "\n\n".join(parts)

    if action == "finos_clients":
        parts.append(f"**Clients** — total **{total}**")
        cs = _count_table("By lifecycle stage", facts.get("by_lifecycle_stage"), "Stage")
        if cs:
            parts.append(cs)
        records = facts.get("records") or []
        rows = []
        if isinstance(records, list):
            for c in records:
                if isinstance(c, dict):
                    rows.append(
                        [
                            c.get("id"),
                            c.get("name") or "—",
                            _norm_status(c.get("lifecycle_stage")),
                            c.get("email") or "—",
                            c.get("phone") or "—",
                        ]
                    )
        if rows:
            parts.append(
                f"**All clients ({len(rows)})**\n\n"
                + _md_table(["ID", "Name", "Stage", "Email", "Phone"], rows)
            )
        return "\n\n".join(parts)

    if action == "finos_claims":
        parts.append(f"**Claims** — total **{total}**")
        cs = _count_table("By status", facts.get("by_status"), "Status")
        if cs:
            parts.append(cs)
        records = facts.get("records") or []
        rows = []
        if isinstance(records, list):
            for c in records:
                if isinstance(c, dict):
                    rows.append(
                        [
                            c.get("id"),
                            _norm_status(c.get("status")),
                            c.get("claim_type") or c.get("type") or "—",
                        ]
                    )
        if rows:
            parts.append(
                f"**All claims ({len(rows)})**\n\n"
                + _md_table(["ID", "Status", "Type"], rows)
            )
        return "\n\n".join(parts)

    if action == "finos_policies":
        parts.append(f"**Policies & holdings** — total **{total}**")
        cs = _count_table("By status", facts.get("by_status"), "Status")
        if cs:
            parts.append(cs)
        records = facts.get("records")
        rows = []
        if isinstance(records, list):
            for r in records:
                if isinstance(r, dict):
                    rows.append(
                        [
                            r.get("id"),
                            r.get("status") or "—",
                            r.get("product_type") or r.get("type") or "—",
                            r.get("client_id") or "—",
                        ]
                    )
        elif isinstance(records, dict):
            for kind, lst in records.items():
                if isinstance(lst, list):
                    for r in lst:
                        if isinstance(r, dict):
                            rows.append(
                                [
                                    r.get("id"),
                                    kind,
                                    r.get("status") or "—",
                                    r.get("product_type") or r.get("type") or "—",
                                ]
                            )
        if rows:
            parts.append(
                f"**All records ({len(rows)})**\n\n"
                + _md_table(["ID", "Kind/Status", "Type", "Client"], rows)
            )
        return "\n\n".join(parts)

    if action == "reseller_list":
        parts.append(f"**Resellers** — total **{total}**")
        cs = _count_table("By status", facts.get("by_status"), "Status")
        if cs:
            parts.append(cs)
        records = facts.get("records") or []
        rows = []
        if isinstance(records, list):
            for r in records:
                if isinstance(r, dict):
                    rows.append(
                        [
                            r.get("id"),
                            r.get("name") or r.get("business_name") or "—",
                            _norm_status(r.get("status")),
                            r.get("conversions") if r.get("conversions") is not None else "—",
                            r.get("commission") if r.get("commission") is not None else "—",
                        ]
                    )
        if rows:
            parts.append(
                f"**All resellers ({len(rows)})**\n\n"
                + _md_table(["ID", "Name", "Status", "Conversions", "Commission"], rows)
            )
        return "\n\n".join(parts)

    if action in ("reseller_stats", "reseller_product_stats"):
        stats = facts.get("stats") or facts.get("records") or {}
        parts.append(f"**{entity.title()}**")
        if isinstance(stats, dict):
            rows = [[k, v] for k, v in stats.items()]
            parts.append(_md_table(["Metric", "Value"], rows))
        return "\n\n".join(parts)

    if action == "reseller_categories":
        cats = facts.get("categories") or facts.get("records") or []
        parts.append(f"**Product categories** — total **{total}**")
        rows = [[i, c] for i, c in enumerate(cats, 1)]
        parts.append(_md_table(["#", "Category"], rows))
        return "\n\n".join(parts)

    if action == "reseller_products":
        parts.append(f"**Reseller products** — total **{total}**")
        records = facts.get("records") or []
        rows = []
        if isinstance(records, list):
            for p in records:
                if isinstance(p, dict):
                    rows.append(
                        [
                            p.get("bank") or "—",
                            p.get("product") or "—",
                            p.get("rate") or "—",
                            p.get("fee") or "—",
                            p.get("tenure") or "—",
                        ]
                    )
        if rows:
            parts.append(_md_table(["Bank", "Product", "Rate", "Fee", "Tenure"], rows))
        return "\n\n".join(parts)

    if action == "reseller_activities":
        parts.append(f"**Commission activities** — total **{total}**")
        if "total_commission" in facts:
            parts.append(f"Total commission: **{facts['total_commission']}**")
        cs = _count_table("By conversion status", facts.get("by_conversion_status"), "Status")
        if cs:
            parts.append(cs)
        records = facts.get("records") or []
        rows = []
        if isinstance(records, list):
            for a in records:
                if isinstance(a, dict):
                    rows.append(
                        [
                            a.get("id"),
                            a.get("product") or "—",
                            a.get("conversion_status") or "—",
                            a.get("commission") if a.get("commission") is not None else "—",
                            a.get("date") or "—",
                        ]
                    )
        if rows:
            parts.append(
                f"**All activities ({len(rows)})**\n\n"
                + _md_table(["ID", "Product", "Status", "Commission", "Date"], rows)
            )
        return "\n\n".join(parts)

    if action == "reseller_customers":
        parts.append(f"**Customers** — total **{total}**")
        cs = _count_table("By status", facts.get("by_status"), "Status")
        if cs:
            parts.append(cs)
        records = facts.get("records") or []
        rows = []
        if isinstance(records, list):
            for c in records:
                if isinstance(c, dict):
                    rows.append(
                        [
                            c.get("id"),
                            c.get("name") or "—",
                            c.get("email") or "—",
                            c.get("product") or "—",
                            c.get("status") or "—",
                        ]
                    )
        if rows:
            parts.append(
                f"**All customers ({len(rows)})**\n\n"
                + _md_table(["ID", "Name", "Email", "Product", "Status"], rows)
            )
        return "\n\n".join(parts)

    parts.append(f"**{entity.title()}** — total **{total}** (read-only live DB)")
    return "\n\n".join(parts)


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
