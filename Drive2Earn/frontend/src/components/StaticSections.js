import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { user } = useAuth();
  const { requestApply } = useApp();
  return (
    <>
      <div className="demo-badge">
        <i className="fas fa-code" style={{ marginRight: 6 }} /> INTERACTIVE DEMO · v3.0
      </div>
      <div className="disclaimer-banner">
        <i className="fas fa-info-circle" />
        <strong>Illustrative prototype</strong> — rates, earnings, and terms are indicative. All figures are for
        simulation purposes only.
        <span style={{ fontWeight: 400, background: '#e8f5e9', padding: '0.1rem 0.6rem', borderRadius: 30, fontSize: '0.65rem' }}>
          <i className="fas fa-flask" /> Prototype affordability logic only; not partner underwriting criteria
        </span>
        <span style={{ fontWeight: 400, background: '#e3f2fd', padding: '0.1rem 0.6rem', borderRadius: 30, fontSize: '0.65rem' }}>
          <i className="fas fa-info-circle" /> This prototype does not access a credit bureau. A financing partner may
          conduct its own checks during an actual application.
        </span>
      </div>
      <div className="main-header">
        <div className="brand">
          <h1>
            <span>Drive</span> to Earn
          </h1>
          <div className="sub">
            <i className="fas fa-route" /> Pakistan · vehicle access &amp; ownership pathway
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="header-btn" onClick={requestApply}>
            <i className="fas fa-file-signature" /> Apply
          </button>
          <Link to={user ? '/dashboard' : '/login?next=/dashboard'} className="ghost">
            <i className="fas fa-gauge-high" /> {user ? 'Dashboard' : 'Sign in'}
          </Link>
        </div>
      </div>
    </>
  );
};

export const CarPay = () => (
  <div className="carpay-section">
    <div className="carpay-header">
      <span className="card-icon">💳</span>
      <h2>Illustrative CarPay Experience</h2>
      <span className="raast-badge">RAAST</span>
      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(255,255,255,0.5)', padding: '0.2rem 0.8rem', borderRadius: 30, color: '#0b2b4a', fontWeight: 600 }}>
        Earn → Receive → Reserve → Spend
      </span>
    </div>
    <p className="subtitle">
      RAAST-enabled through participating banking/payment partners, subject to integration and agreement. Separate
      benefits and services delivered by participating partners.
    </p>
    <div className="carpay-grid">
      {[
        ['fa-credit-card', 'Receive & Pay', 'RAAST-enabled transactions', 'raast-tag', 'RAAST', false],
        ['fa-wallet', 'Reserve', 'Set aside for repayment', 'raast-tag', 'RAAST', false],
        ['fa-tags', 'Discounts', 'Partner offers & savings', 'partner-tag', 'Partners', false],
        ['fa-heartbeat', 'Health', 'Medical & wellness benefits', 'partner-tag', 'Partners', false],
        ['fa-shield-alt', 'Insurance', 'Arranged through applicable partner', 'partner-tag', 'Partner', true],
      ].map(([icon, title, sub, tagCls, tag, highlight]) => (
        <div
          key={title}
          className="carpay-item"
          style={highlight ? { borderColor: '#1565c0', background: 'rgba(21,101,192,0.08)' } : undefined}
        >
          <span className="icon" style={highlight ? { color: '#1565c0' } : undefined}>
            <i className={`fas ${icon}`} />
          </span>
          <div className="info">
            <h5>{title}</h5>
            <p>{sub}</p>
          </div>
          <span className={tagCls} style={highlight ? { background: '#1565c0', color: 'white' } : undefined}>
            {tag}
          </span>
        </div>
      ))}
    </div>
    <div className="carpay-benefits-line">
      <span>
        <i className="fas fa-check-circle" /> Earn → receive → reserve repayment → spend/save
      </span>
      <span>
        <i className="fas fa-check-circle" /> RAAST-enabled through participating partners
      </span>
      <span>
        <i className="fas fa-check-circle" /> Benefits through participating partners
      </span>
    </div>
  </div>
);

export const MonthlyPayment = () => (
  <div className="monthly-payment-section">
    <h2>
      <i className="fas fa-file-invoice" style={{ color: '#2a7de1' }} /> Indicative monthly modeled vehicle cost
    </h2>
    <p className="subtitle">One payment bundles key modeled costs for clearer monthly planning.</p>
    <div className="payment-grid">
      {[
        ['fa-car', 'Vehicle Access', 'Partner-inspected vehicle', false],
        ['fa-wrench', 'Maintenance / Service', 'Illustrative reserve, subject to plan', false],
        ['fa-shield-alt', 'Insurance', 'Illustrative assumption', false],
        ['fa-hand-holding-usd', 'Financing', 'Illustrative repayment', false],
        ['fa-check-circle', 'Greater cost predictability', 'For modeled costs only', true],
      ].map(([icon, title, sub, ok]) => (
        <div
          key={title}
          className="payment-item"
          style={ok ? { borderColor: '#a5d6a7', background: '#e8f5e9' } : undefined}
        >
          <div className="icon" style={ok ? { color: '#43a047' } : undefined}>
            <i className={`fas ${icon}`} />
          </div>
          <div className="content">
            <h5>{title}</h5>
            <p>{sub}</p>
          </div>
          <span className="check" style={ok ? { color: '#43a047' } : undefined}>
            ✓
          </span>
        </div>
      ))}
    </div>
  </div>
);

export const HowItWorks = () => (
  <div className="how-section" id="howSection">
    <h2>
      <i className="fas fa-route" style={{ color: '#2a7de1' }} /> How it works
    </h2>
    <div className="how-grid">
      {[
        ['1', 'Choose', 'Select an earning vehicle suited to your starting point.'],
        ['2', 'Estimate affordability', 'Understand indicative monthly vehicle cost.'],
        ['3', 'Earn', 'Put the asset to work and track the economics.'],
        ['4', 'Build', 'Use stronger earning capacity to work toward the next asset.'],
      ].map(([n, t, p]) => (
        <div className="how-step" key={n}>
          <div className="step-num">{n}</div>
          <h5>{t}</h5>
          <p>{p}</p>
        </div>
      ))}
    </div>
  </div>
);

export const BusinessModel = () => (
  <div className="d2e-section" id="d2eSection">
    <h2>
      <i className="fas fa-cubes" style={{ color: '#2a7de1' }} /> Drive to Earn — business model &amp; risk
    </h2>
    <div style={{ marginBottom: '1rem' }}>
      <h4 style={{ fontSize: '0.9rem', color: '#0b2b4a', marginBottom: '0.3rem' }}>
        <i className="fas fa-coins" style={{ color: '#2a7de1' }} /> Illustrative potential revenue sources
      </h4>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '0.8rem 1.2rem', border: '1px solid #eaf0f7', fontSize: '0.85rem', color: '#475569' }}>
        <p>
          Potential revenue streams may include vehicle sourcing margin, financing facilitation fees,
          insurance/service-related revenue, fleet management fees and CarPay partner commissions, subject to applicable
          commercial agreements and regulatory requirements.
        </p>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
          <i className="fas fa-info-circle" /> Exact margins depend on commercial agreements; figures are for illustration
          only.
        </p>
      </div>
    </div>
    <div className="eco-flow">
      {[
        ['fa-user', 'Driver', 'Accesses vehicle'],
        ['fa-people-arrows', 'Drive to Earn', 'Orchestration & servicing', true],
        ['fa-file-invoice-dollar', 'Finance Partner', 'Provides financing'],
        ['fa-shield-alt', 'Insurance Partner', 'Provides coverage'],
        ['fa-car', 'Vehicle Partner', 'Inspects & supplies'],
      ].map(([icon, title, sub, hi], i, arr) => (
        <React.Fragment key={title}>
          <div className="flow-item" style={hi ? { borderColor: '#2a7de1', background: '#f0f6fe' } : undefined}>
            <div className="icon" style={hi ? { color: '#2a7de1' } : undefined}>
              <i className={`fas ${icon}`} />
            </div>
            <h5>{title}</h5>
            <p>{sub}</p>
          </div>
          {i < arr.length - 1 && <div className="flow-arrow">→</div>}
        </React.Fragment>
      ))}
    </div>
    <div className="risk-matrix">
      <h4 style={{ fontSize: '0.9rem', color: '#0b2b4a', margin: '0.6rem 0 0.4rem' }}>
        <i className="fas fa-table" style={{ color: '#2a7de1' }} /> Illustrative target risk allocation
      </h4>
      <table>
        <thead>
          <tr>
            {['Risk type', 'Driver', 'Finance Partner', 'Insurer', 'D2E', 'Vehicle Supplier'].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['Default / non-payment', 'd', 'p', '', '', ''],
            ['Repossession', '', 'p', '', '', ''],
            ['Accident damage', '', '', 'p', '', ''],
            ['Fraud / misrepresentation', 'd', 'd', '', 's', ''],
            ['Residual value / depreciation', '', 'p', '', '', ''],
            ['Vehicle quality / inspection', '', '', '', '', 'p'],
          ].map((row) => (
            <tr key={row[0]}>
              <td>{row[0]}</td>
              {row.slice(1).map((cell, i) => (
                <td key={i} className={cell === 'p' ? 'highlight-cell' : cell === 's' ? 'secondary-cell' : undefined}>
                  {cell ? '•' : ''}
                </td>
              ))}
            </tr>
          ))}
          <tr className="disclaimer-row">
            <td colSpan={6}>
              <i className="fas fa-info-circle" /> Final risk allocation and responsibilities are subject to partner
              agreements and product structure.
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>
        <span className="highlight-cell" style={{ padding: '0.1rem 0.4rem', borderRadius: 4 }}>
          •
        </span>{' '}
        Primary risk owner &nbsp;|&nbsp;
        <span className="secondary-cell" style={{ padding: '0.1rem 0.4rem', borderRadius: 4 }}>
          •
        </span>{' '}
        Secondary risk owner
      </div>
    </div>
    <div className="upgrade-pathway">
      <h4>
        <i className="fas fa-arrow-trend-up" style={{ color: '#2a7de1' }} /> Upgrade pathway: Drive to Earn History
      </h4>
      <div className="steps">
        {['Payment history', 'Earning consistency', 'Vehicle utilization', 'Tenure'].flatMap((s) => [
          <span key={s}>{s}</span>,
          <span className="arrow" key={`${s}-a`}>
            →
          </span>,
        ])}
        <span style={{ background: '#2a7de1', color: 'white' }}>Stronger profile → next asset</span>
      </div>
      <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.3rem' }}>
        <i className="fas fa-info-circle" /> Subject to partner criteria. Not a guaranteed approval pathway.
      </p>
    </div>
  </div>
);

export const Ecosystem = () => (
  <div id="ecosystemSection" style={{ margin: '2rem 0 1.5rem' }}>
    <h3 style={{ fontSize: '1.1rem', color: '#0b2b4a', marginBottom: '0.8rem' }}>
      <i className="fas fa-cubes" style={{ color: '#2a7de1' }} /> Illustrative ecosystem
    </h3>
    <div className="eco-grid">
      {[
        ['fa-car', 'Vehicle partner', 'Inspection & sourcing'],
        ['fa-file-invoice-dollar', 'Financing partner', 'Facilitate vehicle financing'],
        ['fa-shield-alt', 'Insurance partner', 'Arrange coverage'],
        ['fa-university', 'Banking partner', 'Payment & wallet services'],
        ['fa-people-arrows', 'Drive to Earn', 'Orchestration & servicing', true],
      ].map(([icon, t, p, hi]) => (
        <div
          key={t}
          className="eco-item"
          style={hi ? { borderColor: '#2a7de1', background: '#f0f6fe', cursor: 'default' } : { cursor: 'default' }}
        >
          <div className="eco-icon" style={hi ? { color: '#2a7de1' } : undefined}>
            <i className={`fas ${icon}`} />
          </div>
          <h5>{t}</h5>
          <p>{p}</p>
        </div>
      ))}
    </div>
  </div>
);

export const Terms = () => (
  <div className="terms-section" id="termsSection">
    <h2>
      <i className="fas fa-file-contract" style={{ color: '#2a7de1' }} /> How the Model Could Work
    </h2>
    <div className="terms-grid">
      <div className="terms-col">
        <h4>What&apos;s modeled</h4>
        <ul>
          {[
            'Vehicle access through partners',
            'Illustrative financing at indicative rate',
            'Illustrative insurance assumption',
            'Illustrative maintenance reserve',
            'Indicative monthly modeled vehicle cost',
            'Potential end-of-term pathways may include continued ownership/use, upgrade or vehicle sale, subject to the applicable product structure and terms.',
          ].map((t) => (
            <li key={t}>
              <i className="fas fa-check-circle" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="terms-col">
        <h4>Your responsibilities</h4>
        <ul>
          {[
            'Timely monthly payments',
            'Lawful earning use',
            'Report issues promptly',
            'Valid licence and permits',
            'Follow insurance procedures',
          ].map((t) => (
            <li key={t}>
              <i className="fas fa-check-circle" /> {t}
            </li>
          ))}
        </ul>
        <div className="happy-badge">
          <i className="fas fa-smile" />
          <p>We&apos;re committed to making your earning journey smooth and stress-free. Questions? We&apos;re here to help.</p>
        </div>
      </div>
    </div>
  </div>
);

export const Assumptions = () => {
  const { assumptions } = useApp();
  if (!assumptions) return null;
  return (
    <details className="assumptions-section" id="assumptionsSection">
      <summary>
        <i className="fas fa-cog" style={{ color: '#2a7de1' }} /> Model assumptions &amp; disclosures
      </summary>
      <div className="assumptions-grid">
        <div>
          <span className="label">Financing rate:</span> {assumptions.financing_rate}% illustrative annual reducing-balance
          rate
        </div>
        <div>
          <span className="label">Term:</span> {assumptions.term_months} months
        </div>
        <div>
          <span className="label">Insurance assumption:</span> ~{(assumptions.insurance_rate * 100).toFixed(2)}% of vehicle
          price/month (illustrative)
        </div>
        <div>
          <span className="label">Maintenance reserve (car):</span> PKR 5,000/month (illustrative)
        </div>
        <div>
          <span className="label">Maintenance reserve (rickshaw):</span> PKR 3,000/month (illustrative)
        </div>
        <div>
          <span className="label">Maintenance reserve (motorbike):</span> PKR 2,000/month (illustrative)
        </div>
        <div>
          <span className="label">Earning assumptions:</span> User-adjustable illustrative gross earnings
        </div>
        <div>
          <span className="label">Fuel assumption:</span> User-adjustable percentage of gross earnings
        </div>
        <div>
          <span className="label">Affordability ratio:</span> {Math.round(assumptions.max_affordability_ratio * 100)}% of
          income (illustrative indicator)
        </div>
        <div>
          <span className="label">Downtime reserve:</span> {Math.round(assumptions.downtime_reserve * 100)}% of rental
          income (fleet)
        </div>
      </div>
      <div className="exclusions">
        <strong>
          <i className="fas fa-exclamation-triangle" /> Not currently modeled:
        </strong>{' '}
        Platform commissions, mobile/data costs, parking/tolls, fines, unscheduled costs, taxes, and other potential
        expenses. Maintenance reserve is illustrative and subject to plan limits and exclusions. Ownership/end-of-term
        treatment depends on the applicable financing structure and agreement.
      </div>
    </details>
  );
};

export const FinalCta = () => {
  const { scrollTo, requestApply } = useApp();
  return (
    <div className="cta-section">
      <div style={{ color: 'white' }}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Ready to find your starting point?</span>
        <br />
        <span style={{ fontWeight: 400, fontSize: '0.85rem', opacity: 0.8 }}>
          Check indicative affordability, model earnings, or apply for vehicle access.
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button type="button" className="cta-btn" onClick={() => scrollTo('lfeModule')}>
          <i className="fas fa-clipboard-check" /> Estimate affordability
        </button>
        <button type="button" className="cta-btn outline" onClick={() => scrollTo('calculatorSection')}>
          <i className="fas fa-calculator" /> Calculate earnings
        </button>
        <button type="button" className="cta-btn outline" onClick={requestApply}>
          <i className="fas fa-file-signature" /> Apply now
        </button>
      </div>
    </div>
  );
};

export const LegalFooter = () => (
  <>
    <div className="legal-footer">
      <div id="privacySection">
        <h4>
          <i className="fas fa-lock" style={{ color: '#2a7de1' }} /> Privacy
        </h4>
        <p>
          Affordability estimates are stored on the local Drive to Earn API (PostgreSQL) for this demo. No credit bureau
          check is performed.
        </p>
        <ul>
          <li>
            <i className="fas fa-check-circle" /> No credit bureau check is performed
          </li>
          <li>
            <i className="fas fa-check-circle" /> Estimates stay on this local stack unless you deploy
          </li>
          <li>
            <i className="fas fa-check-circle" /> Full privacy policy available on request for production
          </li>
        </ul>
      </div>
      <div>
        <h4>
          <i className="fas fa-file-contract" style={{ color: '#2a7de1' }} /> Legal
        </h4>
        <ul>
          <li>
            <i className="fas fa-check-circle" /> All figures are illustrative and for simulation purposes
          </li>
          <li>
            <i className="fas fa-check-circle" /> Final approval subject to partner underwriting
          </li>
          <li>
            <i className="fas fa-check-circle" /> Product terms to be provided before any live application or agreement
          </li>
          <li>
            <i className="fas fa-check-circle" /> Drive to Earn is a facilitator, not a lender
          </li>
          <li>
            <i className="fas fa-check-circle" /> Prototype affordability logic shown; not partner underwriting criteria
          </li>
        </ul>
      </div>
    </div>
    <hr style={{ border: 0, borderTop: '2px dashed #dce5f0', margin: '1.5rem 0 1rem' }} />
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
      <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: '#0b2b4a' }}>
          <i className="fas fa-car" style={{ color: '#2a7de1' }} /> Access an asset
        </span>
        <span style={{ fontWeight: 600, color: '#0b2b4a' }}>
          <i className="fas fa-chart-line" style={{ color: '#2a7de1' }} /> Earn from the asset
        </span>
        <span style={{ fontWeight: 600, color: '#0b2b4a' }}>
          <i className="fas fa-arrow-trend-up" style={{ color: '#2a7de1' }} /> Build toward the next
        </span>
      </div>
      <div style={{ background: '#0b2b4a', color: 'white', padding: '0.25rem 1.5rem', borderRadius: 60, fontWeight: 600, fontSize: '0.8rem' }}>
        <i className="fas fa-rocket" /> make the asset work
      </div>
    </div>
    <div className="footer-note">
      <div>
        <i className="fas fa-circle-check" style={{ color: '#1f8b4c' }} /> Drive to Earn Pakistan · illustrative
        ecosystem with participating partners subject to agreement
      </div>
      <div>
        <i className="fas fa-phone-alt" /> local stack · v3.0
      </div>
    </div>
  </>
);
