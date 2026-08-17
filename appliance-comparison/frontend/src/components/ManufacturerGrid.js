import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { MANUFACTURERS, CATEGORY_TITLES } from '../utils/categories';

const ManufacturerGrid = ({ activeMfg, onSelectMfg }) => {
  const { showToast } = useContext(AppContext);

  return (
    <section className="page-section">
      <h2>
        <i className="fas fa-tags" /> Categories
      </h2>
      <div className="manufacturer-grid" role="list">
        {MANUFACTURERS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`manufacturer-card ${activeMfg === m.id ? 'active' : ''}`}
            data-mfg={m.id}
            role="listitem"
            onClick={() => {
              onSelectMfg(m.id);
              showToast(`📂 ${CATEGORY_TITLES[m.id] || m.label}`);
            }}
          >
            <span className="logo">{m.logo}</span>
            <span>{m.label}</span>
            <small>{m.hint}</small>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ManufacturerGrid;
