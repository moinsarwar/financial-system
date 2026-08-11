"""Compare / savings formulas — tenure, down payment, and horizon are dynamic."""
from typing import Any, Dict, List, Optional

from .finance import (
    calculate_financed_monthly,
    calculate_product_profit,
)


def calculate_product_savings(
    product: Any,
    electricity_bill: float,
    fuel_bill: float,
    compare_type: str = "both",
    profit_rate: float | None = None,
    tenure_months: int | None = None,
    down_payment_rate: float = 0.2,
    horizon_years: int = 5,
) -> Dict[str, float]:
    se = float(product.saving_factor_electric or 0)
    sf = float(product.saving_factor_fuel or 0)

    total_bill = 0.0
    if compare_type == "both":
        total_bill = electricity_bill + fuel_bill
    elif compare_type == "electricity":
        total_bill = electricity_bill
    elif compare_type == "fuel":
        total_bill = fuel_bill

    profit = calculate_product_profit(product.price, profit_rate)
    tenure = int(tenure_months) if tenure_months and tenure_months > 0 else 24

    new_electric = electricity_bill
    new_fuel = fuel_bill
    if compare_type in ("both", "electricity"):
        new_electric = electricity_bill * (1 - se)
    if compare_type in ("both", "fuel"):
        new_fuel = fuel_bill * (1 - sf)

    new_total = 0.0
    if compare_type == "both":
        new_total = new_electric + new_fuel
    elif compare_type == "electricity":
        new_total = new_electric
    elif compare_type == "fuel":
        new_total = new_fuel

    rate = down_payment_rate if down_payment_rate is not None else 0.2
    if rate < 0:
        rate = 0.0
    if rate > 1:
        rate = 1.0

    horizon = int(horizon_years) if horizon_years and horizon_years > 0 else 5
    horizon_months = horizon * 12

    down_payment, monthly, _financed = calculate_financed_monthly(
        product.price, profit, tenure, rate
    )
    monthly_cost = new_total + monthly
    monthly_saving = total_bill - monthly_cost
    yearly_saving = monthly_saving * 12
    horizon_net = (monthly_saving * horizon_months) - down_payment

    return {
        "monthly_saving": round(monthly_saving, 2),
        "yearly_saving": round(yearly_saving, 2),
        "horizon_net_saving": round(horizon_net, 2),
        # alias kept for older clients
        "five_year_net_saving": round(horizon_net, 2),
        "current_total_bill": round(total_bill, 2),
        "new_total_bill": round(new_total, 2),
        "monthly_installment": monthly,
        "down_payment": down_payment,
        "saving_factor_electric": se,
        "saving_factor_fuel": sf,
        "tenure_months": tenure,
        "horizon_years": horizon,
        "down_payment_rate": rate,
        "category": getattr(product, "category", None),
    }


def compare_products(
    products: List[Any],
    electricity_bill: float,
    fuel_bill: float,
    compare_type: str = "both",
    profit_rate: float | None = None,
    tenure_months: int | None = None,
    down_payment_rate: float = 0.2,
    horizon_years: int = 5,
) -> Dict[str, Any]:
    results = []
    for product in products:
        stats = calculate_product_savings(
            product,
            electricity_bill,
            fuel_bill,
            compare_type,
            profit_rate,
            tenure_months,
            down_payment_rate,
            horizon_years,
        )
        results.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "price": product.price,
                "category": getattr(product, "category", None),
                **stats,
            }
        )
    results.sort(key=lambda r: r["monthly_saving"], reverse=True)
    total_current = (
        electricity_bill
        if compare_type == "electricity"
        else fuel_bill
        if compare_type == "fuel"
        else electricity_bill + fuel_bill
    )
    best = results[0] if results else None
    tenure = int(tenure_months) if tenure_months and tenure_months > 0 else 24
    horizon = int(horizon_years) if horizon_years and horizon_years > 0 else 5
    return {
        "results": results,
        "best_product": best,
        "total_current_bill": round(total_current, 2),
        "tenure_months": tenure,
        "horizon_years": horizon,
        "down_payment_rate": down_payment_rate if down_payment_rate is not None else 0.2,
    }
