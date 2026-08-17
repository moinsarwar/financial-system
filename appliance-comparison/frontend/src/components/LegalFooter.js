import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const LegalFooter = () => {
  const { openModal } = useContext(AppContext);

  const legalLinks = [
    { id: 'privacy', icon: 'fa-user-secret', label: 'Privacy' },
    { id: 'terms', icon: 'fa-file-contract', label: 'Terms' },
    { id: 'cookies', icon: 'fa-cookie-bite', label: 'Cookies' },
    { id: 'disclaimer', icon: 'fa-exclamation-triangle', label: 'Disclaimer' },
  ];

  const legalContent = {
    privacy: {
      title: 'Privacy Policy (Prototype)',
      body: '<div class="simulated-badge">🔬 PROTOTYPE</div><p>We respect your privacy. Minimal data collected.</p>',
      meta: 'Prototype · Draft policy',
    },
    terms: {
      title: 'Terms of Service (Prototype)',
      body: '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Illustrative data only. Verify details with dealers.</p>',
      meta: 'Prototype · Draft terms',
    },
    cookies: {
      title: 'Cookie Policy (Prototype)',
      body: '<div class="simulated-badge">🔬 PROTOTYPE</div><p>Essential cookies only. No tracking.</p>',
      meta: 'Prototype · Draft policy',
    },
    disclaimer: {
      title: 'Disclaimer (Prototype)',
      body: '<div class="simulated-badge">🔬 PROTOTYPE</div><p>All prices and costs are illustrative.</p>',
      meta: 'Prototype · Draft disclaimer',
    },
  };

  return (
    <footer className="legal-footer">
      <div className="legal-links">
        {legalLinks.map((link) => (
          <button
            key={link.id}
            type="button"
            data-legal={link.id}
            onClick={() => {
              const c = legalContent[link.id];
              if (c) openModal(c.title, c.body, c.meta);
            }}
          >
            <i className={`fas ${link.icon}`} /> {link.label}
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
      <div style={{ fontSize: '9px', color: '#7a9aaf', marginTop: '6px' }}>
        HomeCompare PK · Prototype v3.0
      </div>
    </footer>
  );
};

export default LegalFooter;
