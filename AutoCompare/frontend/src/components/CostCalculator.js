import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateCosts } from '../api/client';
import { COST_PROVENANCE } from '../utils/catalog';

const CostCalculator = () => {
  const { selectedVehicle, showToast } = useContext(AppContext);
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedVehicle) {
      setCosts(null);
      return;
    }
    let cancelled = false;
    const fetchCosts = async () => {
      setLoading(true);
      try {
        const data = await calculateCosts(selectedVehicle.key);
        if (!cancelled) setCosts(data);
      } catch (error) {
        showToast('Failed to calculate costs');
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCosts();
    return () => {
      cancelled = true;
    };
  }, [selectedVehicle, showToast]);

  if (!selectedVehicle || loading || !costs) {
    return (
      <div className="cost-calculator">
        <h3>
          <i className="fas fa-calculator" /> Real-World Running Costs
        </h3>
        <div id="costDisplay">
          <p style={{ color: '#5e7d92', fontSize: 13, textAlign: 'center', padding: '6px 0' }}>
            {loading ? 'Loading costs…' : 'Select a vehicle above to see detailed running costs'}
          </p>
        </div>
      </div>
    );
  }

  const fuelLabel = costs.is_ev ? 'Electricity' : costs.fuel_type === 'diesel' ? 'Diesel' : 'Petrol';
  const fuelUnit = costs.is_ev ? 'kWh' : 'L';

  return (
    <div className="cost-calculator">
      <h3>
        <i className="fas fa-calculator" /> Real-World Running Costs
      </h3>
      <div id="costDisplay">
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#0b3d54' }}>
            {selectedVehicle.name}
          </span>
          <span style={{ fontSize: 11, color: '#5e7d92', float: 'right' }}>
            {costs.is_ev ? '⚡ Electric' : costs.fuel_type.toUpperCase()}
          </span>
        </div>
        <div className="cost-grid">
          <div className="cost-item">
            <div className="label">
              {fuelLabel} ({costs.efficiency})
            </div>
            <div className="value">PKR {costs.annual_fuel.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#7a9aaf' }}>
              {costs.fuel_price} PKR/{fuelUnit} · {costs.annual_km} km/yr
            </div>
          </div>
          <div className="cost-item">
            <div className="label">Maintenance</div>
            <div className="value">PKR {costs.annual_maint.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#7a9aaf' }}>Annual service estimate</div>
          </div>
          <div className="cost-item">
            <div className="label">Insurance</div>
            <div className="value">PKR {costs.annual_insurance.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#7a9aaf' }}>{(costs.insurance_pct * 100).toFixed(1)}% of value</div>
          </div>
          <div className="cost-item">
            <div className="label">Registration/Tax</div>
            <div className="value">PKR {costs.annual_registration.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#7a9aaf' }}>{(costs.registration_pct * 100).toFixed(1)}% of value</div>
          </div>
          <div className="cost-item">
            <div className="label">Depreciation (Year 1)</div>
            <div className="value highlight-red">PKR {costs.annual_depreciation.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#7a9aaf' }}>{(costs.depreciation_pct * 100).toFixed(0)}% of value</div>
          </div>
          <div className="cost-item">
            <div className="label">Cost per km</div>
            <div className="value highlight">PKR {Number(costs.cost_per_km).toFixed(1)}</div>
            <div style={{ fontSize: 9, color: '#7a9aaf' }}>{costs.annual_km} km/year</div>
          </div>
        </div>
        <div className="cost-total">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>Total Annual Cost</span>
            <span className="big">PKR {costs.total_annual.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, flexWrap: 'wrap' }}>
            <span className="small">Monthly: PKR {costs.monthly_cost.toLocaleString()}</span>
            <span className="small">Daily: PKR {costs.daily_cost.toLocaleString()}</span>
          </div>
        </div>
        <div className="cost-provenance">📋 {COST_PROVENANCE}</div>
      </div>
    </div>
  );
};

export default CostCalculator;
