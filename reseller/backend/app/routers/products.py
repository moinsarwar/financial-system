import os
import httpx
from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

# Canonical marketplace categories (same keys as finOS vanilla.html)
MARKETPLACE_CATEGORIES = [
    {"id": "savings", "label": "Savings", "icon": "🏦"},
    {"id": "credit_card", "label": "Credit Cards", "icon": "💳"},
    {"id": "personal_loan", "label": "Personal Loans", "icon": "💰"},
    {"id": "health_insurance", "label": "Health Insurance", "icon": "❤️"},
    {"id": "motor_insurance", "label": "Motor Insurance", "icon": "🚗"},
    {"id": "life_insurance", "label": "Life / Takaful", "icon": "👨‍👩‍👧"},
]

# Map finOS product_type → marketplace category id
PRODUCT_TYPE_TO_CATEGORY = {
    "savings": "savings",
    "credit_card": "credit_card",
    "credit": "credit_card",
    "personal_loan": "personal_loan",
    "loan": "personal_loan",
    "health_insurance": "health_insurance",
    "health": "health_insurance",
    "motor_insurance": "motor_insurance",
    "motor": "motor_insurance",
    "auto": "motor_insurance",
    "life_insurance": "life_insurance",
    "life": "life_insurance",
    "takaful": "life_insurance",
}


async def fetch_finos_products():
    finos_url = os.environ.get("FINOS_API_URL")
    if not finos_url:
        return {}

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{finos_url}/front_products")
            response.raise_for_status()
            data = response.json()
            products = data.get("products", [])

            mapped_data: Dict[str, List[Dict[str, Any]]] = {}
            for p in products:
                raw_cat = (p.get("product_type") or "other").lower()
                cat = PRODUCT_TYPE_TO_CATEGORY.get(raw_cat, raw_cat)

                pricing = p.get("pricing") or {}
                product_name = p.get("product_id", "Product")
                features = p.get("features", [])
                if isinstance(features, list):
                    for f in features:
                        if f.get("name") == "Product Name":
                            product_name = f.get("details", product_name)
                            break

                mapped = {
                    "bank": p.get("provider_id", "Unknown Provider"),
                    "product": product_name,
                    "rate": pricing.get(
                        "interest_rate",
                        pricing.get("apr", pricing.get("profit_rate", "N/A")),
                    ),
                    "fee": pricing.get(
                        "processing_fee",
                        pricing.get("annual_fee", pricing.get("annual_premium", "N/A")),
                    ),
                    "tenure": pricing.get("max_tenure", "N/A"),
                    "product_type": raw_cat,
                    "category_id": cat,
                }

                mapped_data.setdefault(cat, []).append(mapped)

            return mapped_data
    except Exception as e:
        print(f"Failed to fetch finOS products: {e}")
        return {}


@router.get("/stats")
async def get_stats():
    products = await fetch_finos_products()
    total_products = 0
    banks = set()
    for _cat, items in products.items():
        total_products += len(items)
        for item in items:
            banks.add(item.get("bank"))
    return {"total_banks": len(banks), "total_products": total_products}


@router.get("/categories")
async def get_categories():
    """
    Dynamic category list for reseller signup / filters.
    Prefer live finOS product types; always return full marketplace catalog
    with product_count so the UI can show every finOS card.
    """
    products = await fetch_finos_products()
    result = []
    for cat in MARKETPLACE_CATEGORIES:
        items = products.get(cat["id"], []) if products else []
        result.append(
            {
                **cat,
                "product_count": len(items),
                "source": "finos" if products else "default",
            }
        )

    # Include any extra types returned by finOS that we don't know yet
    if products:
        known = {c["id"] for c in MARKETPLACE_CATEGORIES}
        for cat_id, items in products.items():
            if cat_id not in known and cat_id != "other":
                result.append(
                    {
                        "id": cat_id,
                        "label": cat_id.replace("_", " ").title(),
                        "icon": "📦",
                        "product_count": len(items),
                        "source": "finos",
                    }
                )
    return result


@router.get("/{category}")
async def get_products(category: str):
    products = await fetch_finos_products()
    # Accept both marketplace ids and legacy aliases
    alias = PRODUCT_TYPE_TO_CATEGORY.get(category, category)
    return products.get(alias, []) or products.get(category, [])
