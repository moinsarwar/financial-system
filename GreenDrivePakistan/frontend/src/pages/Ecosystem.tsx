import { Fragment } from 'react';

export default function Ecosystem() {
  const nodes = [
    ['fa-user', 'Customer'],
    ['fa-store', 'Marketplace'],
    ['fa-hand-holding-usd', 'Finance (Murabaha)'],
    ['fa-truck', 'Vendor / Supplier'],
    ['fa-tools', 'Installer'],
    ['fa-shield-alt', 'Warranty & Support'],
    ['fa-chart-line', 'Savings & Referrals'],
    ['fa-redo', 'Repeat Purchase'],
  ];
  return (
    <div className="container page-section">
      <h2>
        <i className="fas fa-sitemap" style={{ color: 'var(--primary)' }} /> Our Ecosystem
      </h2>
      <p className="text-muted">How the GreenDrive platform works from start to finish.</p>
      <div className="card mt-16">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center' }}>
          {nodes.map(([icon, label], idx) => (
            <Fragment key={label}>
              <div>
                <i className={`fas ${icon}`} style={{ fontSize: 32, color: 'var(--accent)' }} />
                <br />
                <strong>{label}</strong>
              </div>
              {idx < nodes.length - 1 && (
                <div>
                  <i className="fas fa-arrow-down" style={{ fontSize: 24, color: 'var(--gray)' }} />
                </div>
              )}
            </Fragment>
          ))}
        </div>
        <p className="mt-16 text-center text-muted">
          This end-to-end journey ensures transparency, trust, and long-term value.
        </p>
      </div>
    </div>
  );
}
