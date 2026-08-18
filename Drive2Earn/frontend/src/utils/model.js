export const formatPkr = (n) => `PKR ${Math.round(Number(n) || 0).toLocaleString()}`;
export const formatNegPkr = (n) => `−PKR ${Math.round(Math.abs(Number(n) || 0)).toLocaleString()}`;
export const formatNum = (n) => Math.round(Number(n) || 0).toLocaleString();

export const clampDeposit = (deposit, price) => Math.min(Math.max(0, deposit), Math.max(0, price));

export const calcRepayment = (price, deposit, apr, term) => {
  const financed = Math.max(0, price - deposit);
  const monthlyRate = apr / 100 / 12;
  if (monthlyRate === 0) return financed / term;
  const factor = (1 + monthlyRate) ** term;
  return (financed * monthlyRate * factor) / (factor - 1);
};

export const getEffectiveVehicle = (vehicles, key, assumptions) => {
  const map = Object.fromEntries((vehicles || []).map((v) => [v.key, v]));
  if (key === 'fleet') return map[assumptions?.fleet_vehicle_type || 'car'] || map.car;
  return map[key] || map.car;
};

export const driveEconomics = ({
  days,
  daily,
  fuelPct,
  price,
  deposit,
  maintenance,
  assumptions,
  scenario,
}) => {
  const multiplier = scenario === 'low' ? 0.75 : scenario === 'strong' ? 1.25 : 1;
  const scenarioLabel = scenario === 'low' ? 'Low (-25%)' : scenario === 'strong' ? 'Strong (+25%)' : 'Expected';
  const repayment = Math.round(calcRepayment(price, deposit, assumptions.financing_rate, assumptions.term_months));
  const insurance = Math.round(price * assumptions.insurance_rate);
  const modeledCost = repayment + insurance + maintenance;
  const adjDaily = Math.round(daily * multiplier);
  const gross = days * adjDaily;
  const fuelCost = Math.round(gross * (fuelPct / 100));
  const net = gross - fuelCost - modeledCost;
  const contributionPerDay = adjDaily * (1 - fuelPct / 100);
  const minDays = contributionPerDay ? modeledCost / contributionPerDay : 0;
  const minDaily = days && fuelPct < 100 ? modeledCost / (days * (1 - fuelPct / 100)) : 0;
  return {
    repayment,
    insurance,
    maintenance,
    modeledCost,
    gross,
    fuelCost,
    net,
    breakEvenDays: minDays.toFixed(1),
    minDaily: Math.round(minDaily),
    scenarioLabel,
    surplus: net >= 0,
  };
};

export const fleetEconomics = ({
  fleetSize,
  rental,
  rentalDays,
  management,
  price,
  deposit,
  payoutPct,
  maintenance,
  assumptions,
}) => {
  const repayment = Math.round(calcRepayment(price, deposit, assumptions.financing_rate, assumptions.term_months));
  const insurance = Math.round(price * assumptions.insurance_rate);
  const modeled = repayment + insurance + maintenance;
  const payoutRatio = payoutPct / 100;
  const gross = rentalDays * rental * fleetSize;
  const driverPayout = Math.round(gross * payoutRatio);
  const fleetCosts = modeled * fleetSize;
  const fleetMgmt = management * fleetSize;
  const downtime = Math.round(gross * assumptions.downtime_reserve);
  const net = gross - driverPayout - fleetCosts - fleetMgmt - downtime;
  const totalCosts = fleetCosts + fleetMgmt + downtime;
  const denomDays = rental * fleetSize * (1 - payoutRatio);
  const minDays = denomDays ? totalCosts / denomDays : 0;
  const denomDaily = rentalDays * fleetSize * (1 - payoutRatio);
  const minDaily = denomDaily ? totalCosts / denomDaily : 0;
  return {
    repayment: repayment * fleetSize,
    insurance: insurance * fleetSize,
    maintenance: maintenance * fleetSize,
    modeledCost: fleetCosts,
    gross,
    driverPayout,
    payoutPct,
    management: fleetMgmt,
    downtime,
    net,
    breakEvenDays: minDays.toFixed(1),
    minDaily: Math.round(minDaily),
    surplus: net >= 0,
  };
};
