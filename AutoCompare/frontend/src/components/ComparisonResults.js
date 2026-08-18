import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ComparisonResults = () => {
  const { comparisonResults, showDifferences, openInquiryForm, requestTestDrive } = useContext(AppContext);

  if (!comparisonResults) return null;

  const { vehicle_a, vehicle_b, fields } = comparisonResults;

  return (
    <section className="comparison-results visible" aria-label="Comparison results">
      <h3>
        <i className="fas fa-chart-simple" /> Comparison
      </h3>

      <div className="result-grid" role="table">
        <div className="result-item result-header" style={{ gridColumn: 'span 2' }}>
          <span className="label" style={{ fontWeight: 700 }}>
            {vehicle_a.name} <span className="vs-badge">vs</span> {vehicle_b.name}
          </span>
          <div className="value" style={{ fontWeight: 700 }}>
            <span style={{ fontSize: 11, color: '#3d6a7e', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
              <span>
                <i className="fas fa-check-circle" style={{ color: '#0b4f6c' }} /> {vehicle_a.name}
              </span>
              <span>
                <i className="fas fa-check-circle" style={{ color: '#a6542a' }} /> {vehicle_b.name}
              </span>
            </span>
            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[vehicle_a, vehicle_b].map((vehicle) => (
                <React.Fragment key={vehicle.key}>
                  <button
                    type="button"
                    className="action-btn"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() => openInquiryForm({ title: 'Request Info', vehicle, source: 'comparison' })}
                  >
                    <i className="fas fa-envelope" /> Info {vehicle.name}
                  </button>
                  <button
                    type="button"
                    className="action-btn secondary"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() =>
                      requestTestDrive({
                        title: 'Book a Test Drive',
                        applicationType: 'testdrive',
                        vehicle,
                        source: 'comparison',
                      })
                    }
                  >
                    <i className="fas fa-key" /> Test drive
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {fields.map((field, index) => {
          const isDifferent = field.a !== field.b;
          if (showDifferences && !isDifferent) return null;
          return (
            <div key={index} className={`result-item ${isDifferent ? 'different' : ''}`} data-label={field.label}>
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
