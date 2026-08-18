import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { driveEconomics, fleetEconomics, formatNegPkr, formatNum, formatPkr } from '../utils/model';

const Range = ({ label, value, display, min, max, step, onChange, suffix = '' }) => (
  <div>
    <label>
      {label}: <span className="range-value">{display}{suffix}</span>
    </label>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </div>
);

const Calculator = () => {
  const app = useApp();
  const {
    assumptions,
    selected,
    vehicles,
    vehicleKey,
    price,
    deposit,
    mode,
    setMode,
    scenario,
    setScenario,
    days,
    setDays,
    daily,
    setDaily,
    fuelPct,
    setFuelPct,
    fleetSize,
    setFleetSize,
    rental,
    setRental,
    rentalDays,
    setRentalDays,
    management,
    setManagement,
    payoutPct,
    setPayoutPct,
    updatePrice,
    updateDeposit,
  } = app;

  const drive = useMemo(() => {
    if (!assumptions || !selected) return null;
    const v = vehicleKey === 'fleet' ? vehicles.find((row) => row.key === (assumptions.fleet_vehicle_type || 'car')) : selected;
    if (!v) return null;
    return driveEconomics({
      days,
      daily,
      fuelPct,
      price,
      deposit,
      maintenance: v.maintenance_reserve,
      assumptions,
      scenario,
    });
  }, [assumptions, selected, vehicles, vehicleKey, days, daily, fuelPct, price, deposit, scenario]);

  const fleet = useMemo(() => {
    if (!assumptions || !vehicles.length) return null;
    const v = vehicles.find((row) => row.key === (assumptions.fleet_vehicle_type || 'car'));
    if (!v) return null;
    return fleetEconomics({
      fleetSize,
      rental,
      rentalDays,
      management,
      price,
      deposit,
      payoutPct,
      maintenance: v.maintenance_reserve,
      assumptions,
    });
  }, [assumptions, vehicles, fleetSize, rental, rentalDays, management, price, deposit, payoutPct]);

  if (!assumptions || !selected || !drive || !fleet) return null;

  const priceMin = selected.price_min;
  const priceMax = selected.price_max;
  const priceStep = selected.price_step;

  return (
    <div className="calculator-section" id="calculatorSection">
      <div className="calc-header">
        <h2>
          <i className="fas fa-chart-pie" style={{ color: '#2a7de1' }} /> Estimate driver economics
        </h2>
        <div className="mode-toggle">
          <button type="button" className={mode === 'drive' ? 'active' : ''} onClick={() => setMode('drive')}>
            <i className="fas fa-user" /> I Drive
          </button>
          <button type="button" className={mode === 'fleet' ? 'active' : ''} onClick={() => setMode('fleet')}>
            <i className="fas fa-people-arrows" /> I Own a Fleet <span className="fleet-badge">Separate economics</span>
          </button>
        </div>
      </div>

      <div className={`calc-controls${mode === 'drive' ? '' : ' hidden'}`}>
        <Range label="Working days/month" value={days} display={days} min={10} max={30} step={1} onChange={setDays} />
        <Range label="Assumed gross earnings/day (PKR)" value={daily} display={formatNum(daily)} min={3000} max={12000} step={100} onChange={setDaily} />
        <Range label="Fuel cost (% of revenue)" value={fuelPct} display={fuelPct} min={5} max={20} step={0.5} onChange={setFuelPct} suffix="%" />
        <Range label="Vehicle price (PKR)" value={price} display={formatNum(price)} min={priceMin} max={priceMax} step={priceStep} onChange={updatePrice} />
        <Range label="Deposit (PKR)" value={deposit} display={formatNum(deposit)} min={0} max={price} step={10000} onChange={updateDeposit} />
      </div>

      <div className={`calc-controls${mode === 'fleet' ? '' : ' hidden'}`}>
        <Range label="Fleet size" value={fleetSize} display={fleetSize} min={1} max={10} step={1} onChange={setFleetSize} />
        <Range label="Assumed rental/day (PKR)" value={rental} display={formatNum(rental)} min={2000} max={8000} step={100} onChange={setRental} />
        <Range label="Paid rental days/month" value={rentalDays} display={rentalDays} min={10} max={30} step={1} onChange={setRentalDays} />
        <Range label="Management/car/month" value={management} display={formatNum(management)} min={5000} max={20000} step={500} onChange={setManagement} />
        <Range label="Vehicle price (PKR)" value={price} display={formatNum(price)} min={priceMin} max={priceMax} step={priceStep} onChange={updatePrice} />
        <Range label="Deposit (PKR)" value={deposit} display={formatNum(deposit)} min={0} max={price} step={10000} onChange={updateDeposit} />
        <Range label="Driver payout (%)" value={payoutPct} display={payoutPct} min={50} max={90} step={5} onChange={setPayoutPct} />
      </div>

      <div className="scenario-selector">
        {[
          ['expected', 'Expected'],
          ['low', 'Low (-25%)'],
          ['strong', 'Strong (+25%)'],
        ].map(([key, label]) => (
          <button key={key} type="button" className={scenario === key ? 'active' : ''} onClick={() => setScenario(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="pnl-grid">
        <div className={`pnl-card${mode === 'drive' ? '' : ' hidden'}`}>
          <h4>
            <i className="fas fa-user" style={{ color: '#1f5a8e' }} /> Self-drive · {selected.label} · {drive.scenarioLabel}
          </h4>
          <div>
            <div className="pnl-row">
              <span>Assumed gross earnings</span>
              <span className="value positive">{formatPkr(drive.gross)}</span>
            </div>
            <div className="pnl-row">
              <span>Fuel / charging</span>
              <span className="value negative">{formatNegPkr(drive.fuelCost)}</span>
            </div>
            <div className="pnl-row" style={{ borderBottom: '2px solid #e2eaf3', paddingBottom: '0.3rem', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 600 }}>Modeled vehicle cost</span>
              <span className="value negative">{formatNegPkr(drive.modeledCost)}</span>
            </div>
            <div className="pnl-row sub-item">
              <span>↳ Financing repayment</span>
              <span className="value negative">{formatNegPkr(drive.repayment)}</span>
            </div>
            <div className="pnl-row sub-item">
              <span>↳ Insurance (illustrative)</span>
              <span className="value negative">{formatNegPkr(drive.insurance)}</span>
            </div>
            <div className="pnl-row sub-item" style={{ borderBottom: 0 }}>
              <span>↳ Maintenance reserve (illustrative)</span>
              <span className="value negative">{formatNegPkr(drive.maintenance)}</span>
            </div>
          </div>
          <div className="pnl-total">
            <span className={drive.surplus ? 'label-surplus' : 'label-shortfall'}>
              {drive.surplus ? 'Modeled driver surplus' : 'Modeled driver shortfall'}
            </span>
            <span className={`value ${drive.surplus ? 'positive' : 'negative'}`}>{formatPkr(drive.net)}</span>
          </div>
          <div className="break-even-box">
            <span>
              <i className="fas fa-calculator" /> Days to cover vehicle cost: {drive.breakEvenDays} days
            </span>
            <span>
              <i className="fas fa-tag" /> Break-even gross/day: {formatPkr(drive.minDaily)}
            </span>
          </div>
          <div className="all-inclusive-note">
            <i className="fas fa-info-circle" /> Modeled costs: financing + illustrative insurance + maintenance reserve.
            Actual costs may differ.
          </div>
        </div>

        <div className={`pnl-card${mode === 'fleet' ? '' : ' hidden'}`}>
          <h4>
            <i className="fas fa-people-arrows" style={{ color: '#1f5a8e' }} /> Fleet · {fleetSize} vehicles{' '}
            <span className="fleet-badge" style={{ fontSize: '0.6rem' }}>
              Separate economics
            </span>
          </h4>
          <div>
            <div className="pnl-row">
              <span>Gross rental income</span>
              <span className="value positive">{formatPkr(fleet.gross)}</span>
            </div>
            <div className="pnl-row">
              <span>Driver payouts ({payoutPct}%)</span>
              <span className="value negative">{formatNegPkr(fleet.driverPayout)}</span>
            </div>
            <div className="pnl-row" style={{ borderBottom: '2px solid #e2eaf3', paddingBottom: '0.3rem', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 600 }}>Fleet vehicle costs</span>
              <span className="value negative">{formatNegPkr(fleet.modeledCost)}</span>
            </div>
            <div className="pnl-row sub-item">
              <span>↳ Financing repayment</span>
              <span className="value negative">{formatNegPkr(fleet.repayment)}</span>
            </div>
            <div className="pnl-row sub-item">
              <span>↳ Insurance (illustrative)</span>
              <span className="value negative">{formatNegPkr(fleet.insurance)}</span>
            </div>
            <div className="pnl-row sub-item" style={{ borderBottom: 0 }}>
              <span>↳ Maintenance reserve (illustrative)</span>
              <span className="value negative">{formatNegPkr(fleet.maintenance)}</span>
            </div>
            <div className="pnl-row">
              <span>Management</span>
              <span className="value negative">{formatNegPkr(fleet.management)}</span>
            </div>
            <div className="pnl-row">
              <span>Downtime reserve (5%)</span>
              <span className="value negative">{formatNegPkr(fleet.downtime)}</span>
            </div>
          </div>
          <div className="pnl-total">
            <span className={fleet.surplus ? 'label-surplus' : 'label-shortfall'}>
              {fleet.surplus ? 'Modeled fleet surplus' : 'Modeled fleet shortfall'}
            </span>
            <span className={`value ${fleet.surplus ? 'positive' : 'negative'}`}>{formatPkr(fleet.net)}</span>
          </div>
          <div className="break-even-box">
            <span>
              <i className="fas fa-calculator" /> Break-even rental days: {fleet.breakEvenDays} days/vehicle
            </span>
            <span>
              <i className="fas fa-tag" /> Required rental/day: {formatPkr(fleet.minDaily)}
            </span>
          </div>
          <div className="all-inclusive-note">
            <i className="fas fa-info-circle" /> Fleet economics model: rental income − driver payouts − vehicle costs −
            management − downtime reserve.
          </div>
        </div>
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        <i className="fas fa-info-circle" /> {assumptions.financing_rate}% illustrative annual reducing-balance rate,{' '}
        {assumptions.term_months} months — within the displayed indicative 5–7% range.{' '}
        {mode === 'drive' ? 'Self-drive shown.' : 'Fleet scenario shown.'}
        {vehicleKey === 'fleet' ? ' Fleet uses car cost assumptions.' : ''}
      </div>
      <div className="apply-cta-row">
        <button type="button" className="btn-submit" onClick={app.requestApply}>
          Apply for this vehicle <i className="fas fa-arrow-right" />
        </button>
      </div>
    </div>
  );
};

export default Calculator;
