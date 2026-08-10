"""Compare / savings formulas matching the Green Drive HTML simulation."""
from typing import Any, Dict, List

from .finance import (
    calculate_down_payment,
    calculate_monthly_installment,
    calculate_product_profit,
)


def calculate_product_savings(
    product: Any,
    electricity_bill: float,
    fuel_bill: float,
    compare_type: str = "both",
    profit_rate: float | None = None,
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
    monthly = calculate_monthly_installment(product.price, profit, 24)

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

    monthly_cost = new_total + monthly
    monthly_saving = total_bill - monthly_cost
    down_payment = calculate_down_payment(product.price)
    yearly_saving = monthly_saving * 12
    five_year_net = (monthly_saving * 60) - down_payment

    return {
        "monthly_saving": round(monthly_saving, 2),
        "yearly_saving": round(yearly_saving, 2),
        "five_year_net_saving": round(five_year_net, 2),
        "current_total_bill": round(total_bill, 2),
        "new_total_bill": round(new_total, 2),
        "monthly_installment": monthly,
        "down_payment": down_payment,
        "saving_factor_electric": se,
        "saving_factor_fuel": sf,
    }


def compare_products(
    products: List[Any],
    electricity_bill: float,
    fuel_bill: float,
    compare_type: str = "both",
    profit_rate: float | None = None,
) -> Dict[str, Any]:
    results = []
    for product in products:
        stats = calculate_product_savings(
            product, electricity_bill, fuel_bill, compare_type, profit_rate
        )
        results.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "price": product.price,
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
    return {
        "results": results,
        "best_product": best,
        "total_current_bill": round(total_current, 2),
    }
