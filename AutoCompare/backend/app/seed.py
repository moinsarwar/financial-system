import json
from pathlib import Path

from sqlalchemy.orm import Session

from . import auth
from .database import SessionLocal
from .models import User, UserRole, Vehicle

VEHICLES_PATH = Path(__file__).with_name("vehicles.json")


def _map_vehicle(row: dict) -> dict:
    def opt_str(value):
        if value is None or value == "":
            return None
        return str(value)

    return {
        "key": row["key"],
        "name": row["name"],
        "price": row["price"],
        "engine": row.get("engine"),
        "power": row.get("power"),
        "fuel": row.get("fuel"),
        "transmission": row.get("transmission"),
        "dimensions": row.get("dimensions"),
        "safety": row.get("safety"),
        "features": row.get("features"),
        "warranty": row.get("warranty"),
        "service": row.get("service"),
        "ownership": row.get("ownership"),
        "category": row.get("category"),
        "mfg": row.get("mfg"),
        "origin": row.get("origin"),
        "variant": row.get("variant"),
        "model_year": opt_str(row.get("modelYear")),
        "source": row.get("source"),
        "source_date": row.get("sourceDate"),
        "powertrain": row.get("powertrain"),
        "condition": row.get("condition"),
        "logo": row.get("logo") or "🚗",
        "price_source": row.get("priceSource"),
        "spec_source": row.get("specSource"),
        "fuel_efficiency": row.get("fuelEfficiency"),
        "annual_maint": row.get("annualMaint") or 40000,
        "insurance_pct": row.get("insurancePct") or 0.025,
        "battery_kwh": opt_str(row.get("batteryKwh")),
        "range_km": opt_str(row.get("rangeKm")),
        "ac_charge_kw": opt_str(row.get("acChargeKw")),
        "dc_charge_kw": opt_str(row.get("dcChargeKw")),
    }


def ensure_users(db: Session) -> None:
    users = [
        {
            "email": "admin@autocompare.pk",
            "password": "admin123",
            "name": "Admin User",
            "phone": "03001234567",
            "role": UserRole.ADMIN,
        },
        {
            "email": "user@autocompare.pk",
            "password": "user123",
            "name": "Demo User",
            "phone": "03007654321",
            "role": UserRole.USER,
        },
    ]
    for data in users:
        existing = db.query(User).filter(User.email == data["email"]).first()
        if existing:
            continue
        db.add(
            User(
                email=data["email"],
                password_hash=auth.get_password_hash(data["password"]),
                name=data["name"],
                phone=data["phone"],
                role=data["role"],
            )
        )


def seed_data():
    db: Session = SessionLocal()
    try:
        if db.query(Vehicle).count() == 0 and VEHICLES_PATH.exists():
            catalog = json.loads(VEHICLES_PATH.read_text(encoding="utf-8"))
            for row in catalog:
                db.add(Vehicle(**_map_vehicle(row)))
        ensure_users(db)
        db.commit()
    finally:
        db.close()
