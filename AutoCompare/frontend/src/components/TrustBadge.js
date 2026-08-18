import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const TrustBadge = () => {
  const { openModal } = useContext(AppContext);

  return (
    <button
      type="button"
      className="trust-badge"
      onClick={() =>
        openModal(
          'Trust & Safety (Prototype)',
          `<div class="simulated-badge">🔬 PROTOTYPE · FEATURES IN DEVELOPMENT</div>
           <p>AutoCompare PK is a prototype demonstrating planned trust features.</p>
           <ul>
             <li><strong>Planned:</strong> Verified listings</li>
             <li><strong>Planned:</strong> Vehicle history reports</li>
             <li><strong>Planned:</strong> Buyer protection program</li>
             <li><strong>Planned:</strong> Secure payment escrow</li>
           </ul>`,
          'Prototype · Trust features planned',
        )
      }
      aria-label="Trust and safety features (prototype)"
    >
      <i className="fas fa-shield-alt" /> <span>🛡 Prototype</span>
    </button>
  );
};

export default TrustBadge;
