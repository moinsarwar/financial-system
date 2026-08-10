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
