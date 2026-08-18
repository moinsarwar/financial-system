import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ComparisonResults = () => {
  const { comparisonResults, showDifferences, openInquiryForm, requestApplication } = useContext(AppContext);

  if (!comparisonResults) {
    return null;
  }

  const { appliance_a, appliance_b, fields, summary } = comparisonResults;

  const lowerCostName =
    summary?.lower_cost === 'a'
      ? appliance_a.name
      : summary?.lower_cost === 'b'
        ? appliance_b.name
        : 'similar';

  const largerCapName =
    summary?.larger_capacity === 'a'
      ? appliance_a.name
      : summary?.larger_capacity === 'b'
        ? appliance_b.name
        : 'similar';

  const longerWarrantyName =
    summary?.longer_warranty === 'a'
      ? appliance_a.name
      : summary?.longer_warranty === 'b'
        ? appliance_b.name
        : 'similar';

  const sameCategory = appliance_a.category === appliance_b.category;

  return (
    <section className="comparison-results visible" aria-label="Comparison results">
      <h3>
        <i className="fas fa-chart-simple" /> Comparison
      </h3>

      <div className="decision-summary">
        <p>
          <strong>📊 Decision summary</strong>
        </p>
        <ul>
          <li>
            💰 <strong>Lower running cost:</strong> {lowerCostName}
          </li>
          <li>
            📏 <strong>Larger capacity:</strong>{' '}
            {sameCategory ? largerCapName : 'N/A (different categories)'}
          </li>
          <li>
            🛡️ <strong>Longer warranty:</strong> {longerWarrantyName}
          </li>
          {summary?.lower_cost_a != null && (
            <li>
              💵 <strong>5-year cost:</strong> {appliance_a.name}: PKR{' '}
              {(summary.lower_cost_a * 5).toLocaleString()} · {appliance_b.name}: PKR{' '}
              {(summary.lower_cost_b * 5).toLocaleString()}
            </li>
          )}
        </ul>
      </div>

      <div className="comparison-actions">
        {[appliance_a, appliance_b].map((appliance) => (
          <div key={appliance.key} className="comparison-action-card">
            <span>
              {appliance.logo} {appliance.name}
            </span>
            <div className="comparison-action-btns">
              <button
                type="button"
                className="action-btn"
                onClick={() =>
                  openInquiryForm({
                    title: 'Request Info',
                    appliance,
                    source: 'comparison',
                  })
                }
              >
                Info
              </button>
              <button
                type="button"
                className="action-btn secondary"
                onClick={() =>
                  requestApplication({
                    title: 'Delivery & Install',
                    applicationType: 'installation',
                    appliance,
                    source: 'comparison',
                  })
                }
              >
                Delivery
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="result-grid" role="table">
        <div className="result-item result-header">
          <span className="label">
            {appliance_a.logo} {appliance_a.name}{' '}
            <span className="vs-badge">vs</span> {appliance_b.logo} {appliance_b.name}
          </span>
        </div>

        {fields.map((field, index) => {
          const isDifferent = field.a !== field.b;
          if (showDifferences && !isDifferent) return null;

          return (
            <div
              key={index}
              className={`result-item ${isDifferent ? 'different' : ''}`}
              data-label={field.label}
            >
              <span className="label">{field.label}</span>
              <div className="value">
                <span className="highlight-a">{field.a}</span>
                <span className="vs-badge">vs</span>
                <span className="highlight-b">{field.b}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ComparisonResults;
