from datetime import datetime, timedelta
from ..config import get_settings

settings = get_settings()


def calculate_product_profit(price: float, profit_rate: float | None = None) -> float:
    rate = profit_rate if profit_rate is not None else settings.LENDER_PROFIT_RATE
    return round(price * rate)


def calculate_monthly_installment(price: float, profit: float, tenure: int = 24) -> float:
    total = price + profit
    if tenure <= 0:
        tenure = settings.MAX_TENURE_MONTHS
    return round(total / tenure)


def calculate_down_payment(price: float, rate: float = 0.2) -> float:
    return round(price * rate)


def calculate_financed_monthly(
    price: float, profit: float, tenure: int, down_payment_rate: float = 0.2
) -> tuple[float, float, float]:
    """Return (down_payment, monthly_installment, financed_amount).

    Down payment reduces principal; profit scales with remaining principal.
    At 100% down payment, installment and financed amount are 0.
    """
    rate = 0.0 if down_payment_rate is None else float(down_payment_rate)
    if rate < 0:
        rate = 0.0
    if rate > 1:
        rate = 1.0
    down_payment = round(price * rate)
    principal = round(price - down_payment)
    if principal <= 0 or tenure <= 0:
        return float(down_payment), 0.0, 0.0
    financed_profit = round(profit * (principal / price)) if price else 0
    financed = principal + financed_profit
    monthly = round(financed / tenure)
    return float(down_payment), float(monthly), float(financed)



def calculate_repayment_schedule(
    total_amount: float, tenure: int, start_date: datetime
) -> list:
    monthly_amount = round(total_amount / tenure, 2) if tenure else 0
    schedule = []
    for i in range(tenure):
        due_date = start_date + timedelta(days=30 * (i + 1))
        schedule.append(
            {"due_date": due_date, "amount": monthly_amount, "status": "pending"}
        )
    return schedule
