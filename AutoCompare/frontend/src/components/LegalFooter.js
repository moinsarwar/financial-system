import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const LegalFooter = () => {
  const { openModal } = useContext(AppContext);

  const legalContent = {
    privacy: {
      title: 'Privacy Policy (Prototype)',
      body: '<div class="simulated-badge">🔬 PROTOTYPE</div><p>We respect your privacy. Minimal data is collected for demo inquiries and test-drive bookings.</p>',
      meta: 'Prototype · Draft policy',
    },
    terms: {
      title: 'Terms of Service (Prototype)',
      body: '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Illustrative data only. Verify prices and specs with dealers before buying.</p>',
      meta: 'Prototype · Draft terms',
    },
    cookies: {
      title: 'Cookie Policy (Prototype)',
      body: '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Essential cookies only. Login token is stored locally for this demo.</p>',
      meta: 'Prototype · Draft policy',
    },
    disclaimer: {
      title: 'Disclaimer (Prototype)',
      body: '<div class="simulated-badge">🔬 PROTOTYPE</div><p>All prices, specs and running costs are illustrative estimates.</p>',
      meta: 'Prototype · Draft disclaimer',
    },
  };

  return (
    <footer className="legal-footer">
      <div className="legal-links">
        {Object.entries({
          privacy: ['fa-user-secret', 'Privacy'],
          terms: ['fa-file-contract', 'Terms'],
          cookies: ['fa-cookie-bite', 'Cookies'],
          disclaimer: ['fa-exclamation-triangle', 'Disclaimer'],
        }).map(([id, [icon, label]]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              const c = legalContent[id];
              openModal(c.title, c.body, c.meta);
            }}
          >
            <i className={`fas ${icon}`} /> {label}
          </button>
        ))}
      </div>
      <div className="legal-copy">
        <span>
          <i className="fas fa-lock" /> Secure connection planned
        </span>
        <span>
          <i className="fas fa-database" /> Data protected
        </span>
        <span>
          <i className="fas fa-globe" /> Pakistan law
        </span>
      </div>
      <div style={{ fontSize: 9, color: '#7a9aaf', marginTop: 6 }}>AutoCompare PK · Prototype v3.0</div>
    </footer>
  );
};

export default LegalFooter;
