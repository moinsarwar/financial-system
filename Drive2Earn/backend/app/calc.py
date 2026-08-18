def calc_repayment(price: float, deposit: float, apr: float, term: int) -> float:
    financed = max(0.0, float(price) - float(deposit))
    monthly_rate = apr / 100 / 12
    if monthly_rate == 0:
        return financed / term if term else 0.0
    factor = (1 + monthly_rate) ** term
    return financed * monthly_rate * factor / (factor - 1)


def clamp_deposit(deposit: int, price: int) -> int:
    return min(max(0, deposit), max(0, price))


def calc_modeled_vehicle_cost(price: int, deposit: int, maintenance: int, insurance_rate: float, apr: float, term: int) -> dict:
    repayment = round(calc_repayment(price, deposit, apr, term))
    insurance = round(price * insurance_rate)
    modeled = repayment + insurance + maintenance
    return {
        "repayment": repayment,
        "insurance": insurance,
        "maintenance": maintenance,
        "modeled_cost": modeled,
    }


def scenario_multiplier(scenario: str) -> tuple[float, str]:
    if scenario == "low":
        return 0.75, "Low (-25%)"
    if scenario == "strong":
        return 1.25, "Strong (+25%)"
    return 1.0, "Expected"


def drive_economics(
    *,
    days: int,
    daily: int,
    fuel_pct: float,
    price: int,
    deposit: int,
    maintenance: int,
    insurance_rate: float,
    apr: float,
    term: int,
    scenario: str = "expected",
) -> dict:
    multiplier, scenario_label = scenario_multiplier(scenario)
    costs = calc_modeled_vehicle_cost(price, deposit, maintenance, insurance_rate, apr, term)
    adj_daily = round(daily * multiplier)
    gross = days * adj_daily
    fuel_cost = round(gross * (fuel_pct / 100))
    net = gross - fuel_cost - costs["modeled_cost"]
    contribution_per_day = adj_daily * (1 - fuel_pct / 100)
    min_days = costs["modeled_cost"] / contribution_per_day if contribution_per_day else 0
    min_daily = costs["modeled_cost"] / (days * (1 - fuel_pct / 100)) if days and fuel_pct < 100 else 0
    return {
        **costs,
        "gross": gross,
        "fuel_cost": fuel_cost,
        "net": net,
        "break_even_days": round(min_days, 1),
        "min_daily": round(min_daily),
        "scenario": scenario,
        "scenario_label": scenario_label,
        "surplus": net >= 0,
    }


def fleet_economics(
    *,
    fleet_size: int,
    rental: int,
    rental_days: int,
    management: int,
    price: int,
    deposit: int,
    payout_pct: float,
    maintenance: int,
    insurance_rate: float,
    apr: float,
    term: int,
    downtime_reserve: float,
    scenario: str = "expected",
) -> dict:
    costs = calc_modeled_vehicle_cost(price, deposit, maintenance, insurance_rate, apr, term)
    payout_ratio = payout_pct / 100
    gross_rental = rental_days * rental * fleet_size
    driver_payout = round(gross_rental * payout_ratio)
    fleet_costs = costs["modeled_cost"] * fleet_size
    fleet_mgmt = management * fleet_size
    downtime = round(gross_rental * downtime_reserve)
    net = gross_rental - driver_payout - fleet_costs - fleet_mgmt - downtime
    fleet_total_costs = fleet_costs + fleet_mgmt + downtime
    denom_days = rental * fleet_size * (1 - payout_ratio)
    min_days = (fleet_total_costs / denom_days) if denom_days else 0
    denom_daily = rental_days * fleet_size * (1 - payout_ratio)
    min_daily = fleet_total_costs / denom_daily if denom_daily else 0
    return {
        "repayment": costs["repayment"] * fleet_size,
        "insurance": costs["insurance"] * fleet_size,
        "maintenance": costs["maintenance"] * fleet_size,
        "modeled_cost": fleet_costs,
        "gross": gross_rental,
        "driver_payout": driver_payout,
        "payout_pct": payout_pct,
        "management": fleet_mgmt,
        "downtime": downtime,
        "net": net,
        "break_even_days": round(min_days, 1),
        "min_daily": round(min_daily),
        "fleet_size": fleet_size,
        "scenario": scenario,
        "surplus": net >= 0,
    }
