"""
One-shot: remap legacy market_focus values to finOS category ids.

Examples:
  Insurance / insurance → health_insurance
  Mortgage / mortgage   → personal_loan
  All / all             → all
  credit / health / auto / personal → credit_card / health_insurance / motor_insurance / personal_loan

Usage (inside comparison_backend container):
  python migrate_market_focus.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

KNOWN = {
    "savings",
    "credit_card",
    "personal_loan",
    "health_insurance",
    "motor_insurance",
    "life_insurance",
    "all",
}

# Exact legacy string → new market_focus value
LEGACY_MAP = {
    "all": "all",
    "All": "all",
    "ALL": "all",
    "insurance": "health_insurance",
    "Insurance": "health_insurance",
    "INSURANCE": "health_insurance",
    "health": "health_insurance",
    "Health": "health_insurance",
    "mortgage": "personal_loan",
    "Mortgage": "personal_loan",
    "MORTGAGE": "personal_loan",
    "personal": "personal_loan",
    "Personal": "personal_loan",
    "auto": "motor_insurance",
    "Auto": "motor_insurance",
    "car": "motor_insurance",
    "Car Loans": "motor_insurance",
    "credit": "credit_card",
    "Credit": "credit_card",
    "Credit Cards": "credit_card",
    "life": "life_insurance",
    "Life": "life_insurance",
    "savings": "savings",
    "Savings": "savings",
}


def normalize(value: str | None) -> str:
    if value is None or not str(value).strip():
        return "all"
    raw = str(value).strip()

    if raw in LEGACY_MAP:
        return LEGACY_MAP[raw]

    # Already new format (single or comma-separated)
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    if parts and all(p in KNOWN or p.lower() == "all" for p in parts):
        if len(parts) == 1 and parts[0].lower() == "all":
            return "all"
        if all(p in KNOWN - {"all"} for p in parts):
            return ",".join(parts)
        return "all"

    # Case-insensitive fallback
    lower = raw.lower()
    if lower in {k.lower(): v for k, v in LEGACY_MAP.items()}:
        # rebuild lower map
        lower_map = {k.lower(): v for k, v in LEGACY_MAP.items()}
        return lower_map[lower]

    print(f"  ! unknown value kept as-is for review: {raw!r}")
    return raw


def main():
    db = SessionLocal()
    try:
        rows = db.query(models.Reseller).all()
        if not rows:
            print("No resellers found.")
            return
        changed = 0
        for r in rows:
            old = r.market_focus
            new = normalize(old)
            if old != new:
                print(f"  {r.subdomain}: {old!r} → {new!r}")
                r.market_focus = new
                changed += 1
            else:
                print(f"  {r.subdomain}: unchanged ({old!r})")
        db.commit()
        print(f"Done. Updated {changed}/{len(rows)} resellers.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
