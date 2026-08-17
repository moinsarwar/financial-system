import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const TrustBadge = () => {
  const { openModal } = useContext(AppContext);

  const handleClick = () => {
    openModal(
      'Trust & Safety (Prototype)',
      `<div class="simulated-badge">🔬 PROTOTYPE · FEATURES IN DEVELOPMENT</div>
       <p>HomeCompare PK is a prototype demonstrating planned trust features.</p>
       <ul>
         <li><strong>Planned:</strong> Verified dealers</li>
         <li><strong>Planned:</strong> Warranty verification</li>
         <li><strong>Planned:</strong> Buyer protection program</li>
       </ul>`,
      'Prototype · Trust features planned',
    );
  };

  return (
    <button
      type="button"
      className="trust-badge"
      onClick={handleClick}
      aria-label="Trust and safety features (prototype)"
    >
      <i className="fas fa-shield-alt" /> <span>🛡 Prototype</span>
    </button>
  );
};

export default TrustBadge;
