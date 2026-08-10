"""Seed demo data matching the Green Drive HTML simulation."""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from . import models, auth
from .services.finance import calculate_product_profit


def _dt(s: str):
    return datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=timezone.utc)


def seed_database(db: Session) -> None:
    if db.query(models.Vendor).count() > 0 and db.query(models.Product).count() > 0:
        return

    vendors_spec = [
        {"name": "SolarTech Solutions", "email": "vendor@demo.com", "password": "vendor123"},
        {"name": "EcoRides Pakistan", "email": "vendor2@demo.com", "password": "vendor123"},
        {"name": "CoolAir Industries", "email": "vendor3@demo.com", "password": "vendor123"},
    ]
    vendors = []
    for v in vendors_spec:
        existing = db.query(models.Vendor).filter(models.Vendor.email == v["email"]).first()
        if existing:
            vendors.append(existing)
            continue
        row = models.Vendor(
            name=v["name"],
            email=v["email"],
            password_hash=auth.get_password_hash(v["password"]),
            description=f"{v['name']} partner vendor",
            is_active=True,
        )
        db.add(row)
        db.flush()
        vendors.append(row)

    lenders_spec = [
        {"name": "LFE", "profit_rate": 0.13, "max_tenure": 24, "is_active": True},
        {"name": "Bank Al-Falah", "profit_rate": 0.18, "max_tenure": 36, "is_active": False},
        {"name": "Meezan Bank", "profit_rate": 0.15, "max_tenure": 24, "is_active": False},
    ]
    lenders = []
    for l in lenders_spec:
        existing = db.query(models.Lender).filter(models.Lender.name == l["name"]).first()
        if existing:
            existing.profit_rate = l["profit_rate"]
            existing.max_tenure = l["max_tenure"]
            existing.is_active = l["is_active"]
            lenders.append(existing)
            continue
        row = models.Lender(**l)
        db.add(row)
        db.flush()
        lenders.append(row)

    active_rate = next((l.profit_rate for l in lenders if l.is_active), 0.13)

    users_spec = [
        {
            "name": "Ali Khan",
            "email": "user@demo.com",
            "password": "user123",
            "cnic": "42101-1234567-8",
            "phone": "0300-1234567",
            "address": "Lahore",
            "salary": 80000,
        },
        {
            "name": "Sara Ahmed",
            "email": "sara@demo.com",
            "password": "user123",
            "cnic": "42101-9876543-2",
            "phone": "0300-7654321",
            "address": "Karachi",
            "salary": 60000,
        },
    ]
    users = []
    for u in users_spec:
        existing = db.query(models.User).filter(models.User.email == u["email"]).first()
        if existing:
            users.append(existing)
            continue
        row = models.User(
            name=u["name"],
            email=u["email"],
            password_hash=auth.get_password_hash(u["password"]),
            cnic=u["cnic"],
            phone=u["phone"],
            address=u["address"],
            salary=u["salary"],
            role=models.UserRole.USER,
            is_active=True,
        )
        db.add(row)
        db.flush()
        users.append(row)

    products_spec = [
        {
            "vendor_idx": 0,
            "name": "Solar Panel Kit (3kW)",
            "price": 450000,
            "category": "Solar",
            "type": models.ProductType.FINANCED,
            "saving_factor_electric": 0.70,
            "saving_factor_fuel": 0,
            "description": "Cuts electricity bill by 70%",
            "warranty": "25 years",
            "installation": "Included",
            "monthly_saving": 10500,
            "annual_saving": 126000,
            "payback": "4 years",
            "rating": 4.9,
        },
        {
            "vendor_idx": 0,
            "name": "Lithium Battery (200Ah)",
            "price": 280000,
            "category": "Battery",
            "type": models.ProductType.BOTH,
            "saving_factor_electric": 0.30,
            "saving_factor_fuel": 0,
            "description": "Shifts peak usage, saves 30%",
            "warranty": "5 years",
            "installation": "Included",
            "monthly_saving": 4500,
            "annual_saving": 54000,
            "payback": "3 years",
            "rating": 4.7,
        },
        {
            "vendor_idx": 1,
            "name": "Electric Bike (Commuter)",
            "price": 180000,
            "category": "EV",
            "type": models.ProductType.BOTH,
            "saving_factor_electric": 0,
            "saving_factor_fuel": 0.80,
            "description": "Replaces fuel bike, saves 80% fuel",
            "warranty": "2 years",
            "installation": "Free assembly",
            "monthly_saving": 8000,
            "annual_saving": 96000,
            "payback": "2 years",
            "rating": 4.8,
        },
        {
            "vendor_idx": 1,
            "name": "Electric Rickshaw",
            "price": 850000,
            "category": "EV",
            "type": models.ProductType.FINANCED,
            "saving_factor_electric": 0,
            "saving_factor_fuel": 0.90,
            "description": "Cuts fuel cost by 90%",
            "warranty": "3 years",
            "installation": "Included",
            "monthly_saving": 25000,
            "annual_saving": 300000,
            "payback": "3 years",
            "rating": 4.6,
        },
        {
            "vendor_idx": 1,
            "name": "Electric Car (Base)",
            "price": 3200000,
            "category": "EV",
            "type": models.ProductType.FINANCED,
            "saving_factor_electric": 0,
            "saving_factor_fuel": 0.95,
            "description": "Almost zero fuel cost",
            "warranty": "8 years battery",
            "installation": "Included",
            "monthly_saving": 45000,
            "annual_saving": 540000,
            "payback": "5 years",
            "rating": 4.9,
        },
        {
            "vendor_idx": 2,
            "name": "BLDC Energy Fan",
            "price": 15000,
            "category": "Appliances",
            "type": models.ProductType.BOTH,
            "saving_factor_electric": 0.35,
            "saving_factor_fuel": 0,
            "description": "Saves 35% on fan electricity",
            "warranty": "2 years",
            "installation": "Self",
            "monthly_saving": 500,
            "annual_saving": 6000,
            "payback": "1 year",
            "rating": 4.5,
        },
        {
            "vendor_idx": 2,
            "name": "Inverter AC (1.5 Ton)",
            "price": 120000,
            "category": "Appliances",
            "type": models.ProductType.BOTH,
            "saving_factor_electric": 0.40,
            "saving_factor_fuel": 0,
            "description": "Saves 40% AC electricity",
            "warranty": "3 years",
            "installation": "Included",
            "monthly_saving": 6000,
            "annual_saving": 72000,
            "payback": "2 years",
            "rating": 4.7,
        },
        {
            "vendor_idx": 2,
            "name": "LED Bulbs & Smart Appliances Pack",
            "price": 25000,
            "category": "Lighting",
            "type": models.ProductType.BOTH,
            "saving_factor_electric": 0.20,
            "saving_factor_fuel": 0,
            "description": "Saves 20% lighting/appliance",
            "warranty": "2 years",
            "installation": "Self",
            "monthly_saving": 1000,
            "annual_saving": 12000,
            "payback": "1 year",
            "rating": 4.3,
        },
    ]

    products = []
    if db.query(models.Product).count() == 0:
        for p in products_spec:
            row = models.Product(
                vendor_id=vendors[p["vendor_idx"]].id,
                name=p["name"],
                description=p["description"],
                price=p["price"],
                profit=calculate_product_profit(p["price"], active_rate),
                category=p["category"],
                type=p["type"],
                saving_factor_electric=p["saving_factor_electric"],
                saving_factor_fuel=p["saving_factor_fuel"],
                warranty=p["warranty"],
                installation=p["installation"],
                monthly_saving=p["monthly_saving"],
                annual_saving=p["annual_saving"],
                payback=p["payback"],
                rating=p["rating"],
                is_active=True,
            )
            db.add(row)
            db.flush()
            products.append(row)
    else:
        products = db.query(models.Product).order_by(models.Product.id).all()

    if db.query(models.Application).count() == 0 and len(products) >= 7 and len(users) >= 2:
        apps = [
            {
                "user": users[0],
                "product": products[0],
                "vendor": vendors[0],
                "status": models.ApplicationStatus.APPROVED,
                "applied": "2026-06-01",
                "reviewed": "2026-06-03",
                "approved": "2026-06-05",
                "down_payment": 90000,
                "monthly_installment": 15000,
                "tenure": 24,
                "total_deferred": 510000,
                "paid_amount": 150000,
                "remaining_amount": 360000,
                "next_due": "2026-08-05",
                "details": {
                    "monthly_income": 80000,
                    "employment": "Salaried",
                    "existing_bills": "15000",
                    "notes": "",
                },
                "repayments": [
                    {"due": "2026-07-05", "paid": "2026-07-04", "amount": 15000, "status": "paid"},
                    {"due": "2026-08-05", "paid": None, "amount": 15000, "status": "overdue"},
                    {"due": "2026-09-05", "paid": None, "amount": 15000, "status": "pending"},
                ],
            },
            {
                "user": users[0],
                "product": products[2],
                "vendor": vendors[1],
                "status": models.ApplicationStatus.PENDING_REVIEW,
                "applied": "2026-07-10",
                "reviewed": None,
                "approved": None,
                "down_payment": 36000,
                "monthly_installment": 6000,
                "tenure": 24,
                "total_deferred": 204000,
                "paid_amount": 0,
                "remaining_amount": 204000,
                "next_due": None,
                "details": {
                    "monthly_income": 80000,
                    "employment": "Salaried",
                    "existing_bills": "25000",
                    "notes": "Already have solar",
                },
                "repayments": [],
            },
            {
                "user": users[1],
                "product": products[6],
                "vendor": vendors[2],
                "status": models.ApplicationStatus.APPROVED,
                "applied": "2026-06-15",
                "reviewed": "2026-06-16",
                "approved": "2026-06-18",
                "down_payment": 24000,
                "monthly_installment": 4000,
                "tenure": 24,
                "total_deferred": 136000,
                "paid_amount": 4000,
                "remaining_amount": 132000,
                "next_due": "2026-08-18",
                "details": {
                    "monthly_income": 60000,
                    "employment": "Self-employed",
                    "existing_bills": "12000",
                    "notes": "",
                },
                "repayments": [
                    {"due": "2026-07-18", "paid": "2026-07-17", "amount": 4000, "status": "paid"},
                    {"due": "2026-08-18", "paid": None, "amount": 4000, "status": "pending"},
                ],
            },
        ]
        status_map = {
            "paid": models.RepaymentStatus.PAID,
            "pending": models.RepaymentStatus.PENDING,
            "overdue": models.RepaymentStatus.OVERDUE,
        }
        for a in apps:
            app_row = models.Application(
                user_id=a["user"].id,
                product_id=a["product"].id,
                vendor_id=a["vendor"].id,
                lender_id=lenders[0].id,
                status=a["status"],
                applied_date=_dt(a["applied"]),
                reviewed_date=_dt(a["reviewed"]) if a["reviewed"] else None,
                approved_date=_dt(a["approved"]) if a["approved"] else None,
                down_payment=a["down_payment"],
                monthly_installment=a["monthly_installment"],
                tenure=a["tenure"],
                total_deferred=a["total_deferred"],
                paid_amount=a["paid_amount"],
                remaining_amount=a["remaining_amount"],
                next_due_date=_dt(a["next_due"]) if a["next_due"] else None,
                application_details=a["details"],
            )
            db.add(app_row)
            db.flush()
            for r in a["repayments"]:
                db.add(
                    models.Repayment(
                        application_id=app_row.id,
                        user_id=a["user"].id,
                        due_date=_dt(r["due"]),
                        paid_date=_dt(r["paid"]) if r["paid"] else None,
                        amount=r["amount"],
                        status=status_map[r["status"]],
                    )
                )

    if db.query(models.CashSale).count() == 0 and len(products) >= 6:
        db.add(
            models.CashSale(
                vendor_id=vendors[0].id,
                product_id=products[1].id,
                buyer_name="Imran Ali",
                amount=280000,
                sale_date=_dt("2026-07-01"),
            )
        )
        db.add(
            models.CashSale(
                vendor_id=vendors[2].id,
                product_id=products[5].id,
                buyer_name="Nadia Khan",
                amount=15000,
                sale_date=_dt("2026-07-12"),
            )
        )

    db.commit()
