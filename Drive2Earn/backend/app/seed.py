from sqlalchemy import text
from sqlalchemy.orm import Session

from . import auth
from .database import SessionLocal, engine
from .models import ModelAssumption, User, UserRole, Vehicle

VEHICLES = [
    {
        "key": "motorbike",
        "label": "Motorbike",
        "icon": "🛵",
        "price": 250000,
        "price_min": 200000,
        "price_max": 400000,
        "price_step": 10000,
        "default_daily_earning": 3000,
        "default_fuel_pct": 10,
        "default_rental": 1500,
        "maintenance_reserve": 2000,
        "description": "Best for city commuting & food delivery",
        "features": ["Low entry cost", "Fuel efficient", "Quick to start earning"],
        "monthly_payment_estimate": "~8,000",
        "sort_order": 1,
    },
    {
        "key": "rickshaw",
        "label": "Rickshaw",
        "icon": "🛺",
        "price": 600000,
        "price_min": 400000,
        "price_max": 900000,
        "price_step": 10000,
        "default_daily_earning": 5000,
        "default_fuel_pct": 12,
        "default_rental": 3000,
        "maintenance_reserve": 3000,
        "description": "Higher passenger capacity for urban routes",
        "features": ["Durable and low maintenance", "Established earning model", "Good for semi-urban routes"],
        "monthly_payment_estimate": "~18,000",
        "sort_order": 2,
    },
    {
        "key": "car",
        "label": "Car",
        "icon": "🚗",
        "price": 1800000,
        "price_min": 500000,
        "price_max": 3000000,
        "price_step": 50000,
        "default_daily_earning": 7400,
        "default_fuel_pct": 11.5,
        "default_rental": 4500,
        "maintenance_reserve": 5000,
        "description": "Full ride-share capability with higher earning potential",
        "features": ["Comfort & safety", "Partner-inspected & maintained", "Higher earning potential"],
        "monthly_payment_estimate": "~55,500",
        "sort_order": 3,
    },
    {
        "key": "fleet",
        "label": "Fleet",
        "icon": "🚙🚙",
        "price": 1800000,
        "price_min": 500000,
        "price_max": 3000000,
        "price_step": 50000,
        "default_daily_earning": 7400,
        "default_fuel_pct": 11.5,
        "default_rental": 4500,
        "maintenance_reserve": 5000,
        "description": "Scale your earning capacity with multiple vehicles",
        "features": [
            "Potential to place vehicles with eligible drivers",
            "Revenue share or fixed rental",
            "Fleet management support",
        ],
        "monthly_payment_estimate": "custom",
        "sort_order": 4,
    },
]


def ensure_schema():
    statements = [
        "ALTER TABLE affordability_estimates ADD COLUMN IF NOT EXISTS user_id INTEGER",
        "ALTER TABLE affordability_estimates ADD COLUMN IF NOT EXISTS follow_up VARCHAR(50) DEFAULT 'new'",
    ]
    with engine.begin() as conn:
        for sql in statements:
            conn.execute(text(sql))


def ensure_users(db: Session) -> None:
    users = [
        {
            "email": "admin@drive2earn.pk",
            "password": "admin123",
            "name": "Admin User",
            "phone": "03001234567",
            "role": UserRole.ADMIN,
        },
        {
            "email": "driver@drive2earn.pk",
            "password": "driver123",
            "name": "Demo Driver",
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
    ensure_schema()
    db: Session = SessionLocal()
    try:
        if db.query(Vehicle).count() == 0:
            for row in VEHICLES:
                db.add(Vehicle(**row))
        if db.query(ModelAssumption).count() == 0:
            db.add(
                ModelAssumption(
                    financing_rate=6,
                    term_months=48,
                    insurance_rate=0.0006,
                    max_affordability_ratio=0.45,
                    downtime_reserve=0.05,
                    fleet_vehicle_type="car",
                )
            )
        ensure_users(db)
        db.commit()
    finally:
        db.close()
