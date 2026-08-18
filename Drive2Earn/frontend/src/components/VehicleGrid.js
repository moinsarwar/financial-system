import React from 'react';
import { useApp } from '../context/AppContext';
import { formatNum } from '../utils/model';

const extraCopy = {
  motorbike: ['Best for city commuting & food delivery'],
  rickshaw: ['Higher passenger capacity', 'Good for urban & semi-urban routes'],
  car: ['Full ride-share capability'],
  fleet: ['Scale your earning capacity'],
};

const VehicleGrid = () => {
  const { vehicles, applyVehicle, scrollTo } = useApp();

  return (
    <div className="vehicle-detail-section" id="vehicleDetails">
      <h2>
        <i className="fas fa-car" style={{ color: '#2a7de1' }} /> Explore vehicles
      </h2>
      <div className="vehicle-detail-grid">
        {vehicles.map((v) => (
          <button
            type="button"
            key={v.key}
            className="vehicle-detail-card"
            onClick={() => {
              applyVehicle(v.key);
              scrollTo('calculatorSection');
            }}
          >
            <span className="vehicle-icon">{v.icon}</span>
            <h3>{v.label}</h3>
            <div className="price-tag">
              {v.key === 'fleet'
                ? 'Multiple vehicles · custom pricing'
                : `Indicative price: PKR ${formatNum(v.price)}`}
            </div>
            <div className="monthly-indicative">
              {v.key === 'fleet'
                ? 'Illustrative fleet pathway — separate product structure and eligibility may apply'
                : `Modeled monthly cost from PKR ${v.monthly_payment_estimate}`}
            </div>
            <ul>
              {(extraCopy[v.key] || []).concat(v.features || []).slice(0, 4).map((f) => (
                <li key={f}>
                  <i className="fas fa-check-circle" /> {f}
                </li>
              ))}
            </ul>
            <span className="cta-link">Model this vehicle →</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VehicleGrid;
