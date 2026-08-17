import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ProductList = ({ appliances, loading, error, categoryTitle, onRetry }) => {
  const { setSelectedAppliance, openModal, showToast } = useContext(AppContext);

  const openDetail = (appliance) => {
    setSelectedAppliance(appliance);
    showToast(`🔌 ${appliance.name} selected`);
    const body = `
      <div class="simulated-badge">🔬 PROTOTYPE · ILLUSTRATIVE DATA</div>
      <p><strong>Price:</strong> ${appliance.price}</p>
      <p><strong>Brand:</strong> ${appliance.brand}</p>
      <p><strong>Type:</strong> ${appliance.category}</p>
      <p><strong>Capacity:</strong> ${appliance.capacity}</p>
      <p><strong>Energy:</strong> ${appliance.energy}</p>
      <p><strong>Warranty:</strong> ${appliance.warranty}</p>
      <p><strong>Noise Level:</strong> ${appliance.noise}</p>
      <p><strong>Variant:</strong> ${appliance.variant || 'Standard'}</p>
      <p><strong>Model Year:</strong> ${appliance.model_year || '2026'}</p>
      <p style="font-size:11px;color:#5e7d92;border-top:1px solid #e0eaf3;padding-top:6px;margin-top:6px;">
        Source: ${appliance.source}
      </p>
      <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">
        <button type="button" class="action-btn" data-action="info"><i class="fas fa-envelope"></i> Request info</button>
        <button type="button" class="action-btn secondary" data-action="delivery"><i class="fas fa-truck"></i> Delivery/Install</button>
      </div>`;
    openModal(`${appliance.logo} ${appliance.name} (${appliance.category})`, body, `Brand: ${appliance.brand}`);
  };

  if (loading) {
    return (
      <section className="page-section">
        <h2>
          <i className="fas fa-flag" /> <span>Loading appliances...</span>
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
          <i className="fas fa-flag" /> <span>{categoryTitle}</span>
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
        <i className="fas fa-flag" /> <span>{categoryTitle}</span>
        <span className="section-count">{appliances.length} items</span>
      </h2>
      <div className="model-list" role="list">
        {appliances.length === 0 ? (
          <div className="model-list-empty">No appliances found matching your criteria.</div>
        ) : (
          appliances.map((appliance) => {
            const variantInfo = appliance.variant ? ` · ${appliance.variant}` : '';
            const detailText = `${appliance.category}${variantInfo} · ${appliance.energy || 'Standard'}`;
            return (
              <button
                key={appliance.key}
                type="button"
                className="model-item"
                data-key={appliance.key}
                role="listitem"
                onClick={() => openDetail(appliance)}
              >
                <span className="logo-small">{appliance.logo}</span>
                <div className="info">
                  <div className="name">
                    {appliance.name}
                    {appliance.is_new && <span className="new-star"> ⭐</span>}
                  </div>
                  <div className="detail">
                    {detailText} · {appliance.price}
                  </div>
                  <span className="source-note">📋 {appliance.source}</span>
                </div>
                <span className="badge">{appliance.brand.toUpperCase()}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ProductList;
