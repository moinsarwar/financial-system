import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { MANUFACTURERS, getBrandStyle } from '../utils/catalog';

const ManufacturerGrid = ({ activeMfg, onSelectMfg }) => {
  const { showToast } = useContext(AppContext);

  return (
    <section className="page-section">
      <h2>
        <i className="fas fa-industry" /> All Manufacturers
      </h2>
      <div className="manufacturer-grid" role="list">
        {MANUFACTURERS.map((m) => {
          const brand = getBrandStyle(m.id);
          return (
            <button
              key={m.id}
              type="button"
              className={`manufacturer-card ${activeMfg === m.id ? 'active' : ''}`}
              data-mfg={m.id}
              role="listitem"
              onClick={() => {
                onSelectMfg(m.id);
                showToast(`${m.label} models`);
              }}
            >
              <span className="brand-avatar" style={{ background: brand.color }}>
                {brand.initial}
              </span>
              <span>{m.label}</span>
              <small>{m.hint}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ManufacturerGrid;
