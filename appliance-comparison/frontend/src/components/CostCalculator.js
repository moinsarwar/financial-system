import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateCosts } from '../api/client';
import { ELECTRIC_RATE, GAS_CYLINDER_PRICE } from '../utils/categories';

const CostCalculator = () => {
  const { selectedAppliance, showToast } = useContext(AppContext);
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAppliance) {
      fetchCosts(selectedAppliance.key);
    } else {
      setCosts(null);
    }
  }, [selectedAppliance]);

  const fetchCosts = async (key) => {
    setLoading(true);
    try {
      const data = await calculateCosts(key);
      setCosts(data);
    } catch (error) {
      showToast('Failed to calculate costs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAppliance || loading) {
    return (
      <div className="cost-calculator">
        <h3>
          <i className="fas fa-calculator" /> Estimated Running Costs
        </h3>
        <div id="costDisplay">
          <p className="cost-placeholder">
            {loading ? 'Loading...' : 'Select an appliance above to see estimated costs'}
          </p>
        </div>
      </div>
    );
  }

  if (!costs) return null;

  const pct = (part) => (costs.total_annual ? Math.round((part * 100) / costs.total_annual) : 0);

  let fuelBreakdown = null;
  if (costs.fuel_type === 'electric') {
    fuelBreakdown = (
      <>
        <div className="cost-item">
          <div className="label">Annual Electricity</div>
          <div className="value">{costs.annual_energy} kWh</div>
          <div className="cost-sub">{ELECTRIC_RATE} PKR/kWh</div>
        </div>
        <div className="cost-item">
          <div className="label">Electricity Cost</div>
          <div className="value highlight">PKR {costs.annual_energy_cost.toLocaleString()}</div>
          <div className="cost-sub">{pct(costs.annual_energy_cost)}% of total</div>
        </div>
      </>
    );
  } else if (costs.fuel_type === 'gas') {
    fuelBreakdown = (
      <>
        <div className="cost-item">
          <div className="label">Gas Cylinders / mo</div>
          <div className="value">{costs.gas_cylinders_per_month} cyl</div>
          <div className="cost-sub">{GAS_CYLINDER_PRICE} PKR/cyl</div>
        </div>
        <div className="cost-item">
          <div className="label">Gas Cost</div>
          <div className="value highlight">PKR {costs.annual_gas_cost.toLocaleString()}</div>
          <div className="cost-sub">{pct(costs.annual_gas_cost)}% of total</div>
        </div>
      </>
    );
  } else {
    fuelBreakdown = (
      <>
        <div className="cost-item">
          <div className="label">Electricity Cost</div>
          <div className="value">PKR {costs.annual_energy_cost.toLocaleString()}</div>
          <div className="cost-sub">{costs.annual_energy} kWh</div>
        </div>
        <div className="cost-item">
          <div className="label">Gas Cost</div>
          <div className="value">PKR {costs.annual_gas_cost.toLocaleString()}</div>
          <div className="cost-sub">{costs.gas_cylinders_per_month} cyl/mo</div>
        </div>
      </>
    );
  }

  return (
    <div className="cost-calculator">
      <h3>
        <i className="fas fa-calculator" /> Estimated Running Costs
      </h3>
      <div id="costDisplay">
        <div className="cost-selected-header">
          <span>
            {selectedAppliance.logo} {selectedAppliance.name}
          </span>
          <span>{selectedAppliance.energy}</span>
        </div>

        <div className="cost-grid">
          {fuelBreakdown}
          <div className="cost-item">
            <div className="label">Annual Maintenance</div>
            <div className="value">PKR {costs.annual_maint.toLocaleString()}</div>
            <div className="cost-sub">{pct(costs.annual_maint)}% of total</div>
          </div>
          <div className="cost-item">
            <div className="label">Daily Cost</div>
            <div className="value">PKR {costs.daily_cost.toFixed(1)}</div>
            <div className="cost-sub">per day estimate</div>
          </div>
        </div>

        <div className="cost-total">
          <div className="cost-total-row">
            <span>Total Annual Running Cost</span>
            <span className="big">PKR {costs.total_annual.toLocaleString()}</span>
          </div>
          <div className="cost-total-row secondary">
            <span className="small">Monthly: PKR {costs.monthly_cost.toLocaleString()}</span>
            <span className="small">5-Year: PKR {(costs.total_annual * 5).toLocaleString()}</span>
          </div>
        </div>

        <div className="cost-provenance">
          📋 Illustrative estimates · AnnualEnergy is the authoritative assumption
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;
