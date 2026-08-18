import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { getBrandStyle } from '../utils/catalog';

const VehicleList = ({ vehicles, loading, error, categoryTitle, onRetry }) => {
  const { setSelectedVehicle, openModal, setCompareStatus, selectedVehicle } = useContext(AppContext);

  const openDetail = (vehicle) => {
    setSelectedVehicle(vehicle);
    setCompareStatus(`${vehicle.name} selected`);
    const evSpecs =
      vehicle.powertrain === 'ev'
        ? `<p><strong>Battery:</strong> ${vehicle.battery_kwh || 'N/A'} kWh</p>
           <p><strong>Range:</strong> ${vehicle.range_km || 'N/A'} km</p>
           <p><strong>AC Charge:</strong> ${vehicle.ac_charge_kw || 'N/A'} kW</p>
           <p><strong>DC Fast Charge:</strong> ${vehicle.dc_charge_kw || 'N/A'} kW</p>`
        : '';
    const fuelDisplay = vehicle.powertrain === 'ev' ? `${vehicle.range_km || 'N/A'} km range` : vehicle.fuel || 'N/A';
    const body = `
      <div class="simulated-badge">🔬 PROTOTYPE · SIMULATED DATA</div>
      <p><strong>Price:</strong> ${vehicle.price}</p>
      <p><strong>Variant:</strong> ${vehicle.variant || 'Standard'}</p>
      <p><strong>Model Year:</strong> ${vehicle.model_year || '2026'}</p>
      <p><strong>Powertrain:</strong> ${(vehicle.powertrain || '').toUpperCase()}</p>
      <p><strong>Engine:</strong> ${vehicle.engine || 'N/A'}</p>
      <p><strong>Power:</strong> ${vehicle.power || 'N/A'}</p>
      <p><strong>${vehicle.powertrain === 'ev' ? 'Range' : 'Fuel Economy'}:</strong> ${fuelDisplay}</p>
      ${evSpecs}
      <p><strong>Transmission:</strong> ${vehicle.transmission || 'N/A'}</p>
      <p><strong>Dimensions:</strong> ${vehicle.dimensions || 'N/A'}</p>
      <p><strong>Safety:</strong> ${vehicle.safety || 'N/A'}</p>
      <p><strong>Features:</strong> ${vehicle.features || 'N/A'}</p>
      <p><strong>Warranty:</strong> ${vehicle.warranty || 'N/A'}</p>
      <p><strong>Service/Parts:</strong> ${vehicle.service || 'N/A'}</p>
      <p style="font-size:11px;color:#5e7d92;border-top:1px solid #e0eaf3;padding-top:6px;margin-top:6px;">
        Price: ${vehicle.price_source || vehicle.source} · Specs: ${vehicle.spec_source || vehicle.source} · Updated: ${vehicle.source_date || ''} · Model Year: ${vehicle.model_year || ''}
      </p>
      <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">
        <button type="button" class="action-btn" data-action="info" data-vehicle-key="${vehicle.key}" data-vehicle-name="${vehicle.name}" data-source="product_detail"><i class="fas fa-envelope"></i> Request further info</button>
        <button type="button" class="action-btn secondary" data-action="testdrive" data-vehicle-key="${vehicle.key}" data-vehicle-name="${vehicle.name}" data-source="product_detail"><i class="fas fa-key"></i> Book a test drive</button>
      </div>`;
    openModal(
      `${vehicle.name} (${vehicle.category})`,
      body,
      `Origin: ${vehicle.origin === 'assembled' ? 'Assembled in Pakistan' : 'Imported'} · Manufacturer: ${(vehicle.mfg || '').toUpperCase()}`,
    );
  };

  if (loading) {
    return (
      <section className="page-section">
        <h2>
          <i className="fas fa-car-side" /> <span>Loading vehicles...</span>
        </h2>
        <div className="model-list">
          <div className="model-list-empty">Loading...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <h2>
          <i className="fas fa-car-side" /> <span>{categoryTitle}</span>
        </h2>
        <div className="model-list">
          <div className="model-list-empty">
            <p>{error}</p>
            <button type="button" className="compare-btn retry-btn" onClick={onRetry}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <h2>
        <i className="fas fa-car-side" /> <span>{categoryTitle}</span>
        <span className="section-count">{vehicles.length}</span>
      </h2>
      <div className="model-list" role="list">
        {vehicles.length === 0 ? (
          <div className="model-list-empty">No vehicles found matching your criteria.</div>
        ) : (
          vehicles.map((vehicle) => {
            const brand = getBrandStyle(vehicle.mfg);
            const specChip = vehicle.powertrain === 'ev'
              ? `${vehicle.range_km || 'N/A'} km`
              : vehicle.fuel || 'N/A';
            const isSelected = selectedVehicle?.key === vehicle.key;
            return (
              <button
                key={vehicle.key}
                type="button"
                className={`model-item${isSelected ? ' selected' : ''}`}
                role="listitem"
                onClick={() => openDetail(vehicle)}
              >
                <div className="model-item-top">
                  <span className="brand-avatar" style={{ background: brand.color }}>
                    {brand.initial}
                  </span>
                  <span className="badge">{(vehicle.mfg || '').toUpperCase()}</span>
                </div>
                <div className="name">{vehicle.name}</div>
                <div className="model-chips">
                  {vehicle.category && <span>{vehicle.category}</span>}
                  {vehicle.variant && <span>{vehicle.variant}</span>}
                  {vehicle.powertrain === 'ev' ? (
                    <span className="chip-ev">EV · {specChip}</span>
                  ) : (
                    <span>{specChip}</span>
                  )}
                </div>
                <div className="model-price">{vehicle.price}</div>
                <span className="source-note">
                  {vehicle.source} · {vehicle.source_date}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};

export default VehicleList;
