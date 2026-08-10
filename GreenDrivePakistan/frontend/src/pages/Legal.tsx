import { useState } from 'react';

const LEGAL: Record<string, { title: string; html: string }> = {
  terms: {
    title: 'Terms of Service',
    html: `<h3>Terms of Service</h3><p><strong>Acceptance:</strong> By using GreenDrive.pk you agree to these terms. <strong>Eligibility:</strong> 18+ Pakistani resident with valid CNIC. <strong>Financing:</strong> Subject to LFE Sharia screening. <strong>Delivery:</strong> Est. timelines; install by certified partners. <strong>Governing Law:</strong> Pakistan.</p><p><strong>Liability:</strong> We are not liable for product defects beyond manufacturer warranty. All financing decisions are at LFE's discretion.</p>`,
  },
  privacy: {
    title: 'Privacy',
    html: `<h3>Privacy Policy</h3><p>We collect: Name, CNIC, phone, address, utility bills, bank details. Used for: order processing, LFE underwriting, support. <strong>No data sold.</strong> SSL encrypted. Request deletion anytime via support@greendrive.pk.</p><p>We share data only with LFE and logistics partners. You may opt out of marketing communications.</p>`,
  },
  sale: {
    title: 'Terms of Sale',
    html: `<h3>Terms of Sale</h3><p><strong>Order Confirmation:</strong> All orders are subject to availability and confirmation of financing. <strong>Pricing:</strong> Prices are fixed at time of order. <strong>Delivery:</strong> Standard delivery within 5-7 working days. <strong>Installation:</strong> Solar and electrical installations must be performed by our certified technicians.</p><p><strong>Cancellation:</strong> Cancellation within 24 hours of order is free of charge. After that, a 10% restocking fee applies.</p>`,
  },
  agreement: {
    title: 'Murabaha Agreement',
    html: `<h3>Murabaha Financing Agreement</h3><p><strong>Seller:</strong> GreenDrive (Pvt) Ltd. <strong>Buyer:</strong> [Customer]. <strong>Disclosure:</strong> Cost + fixed profit shown separately. <strong>Deferred Price:</strong> Equal installments. <strong>Ownership:</strong> passes immediately. <strong>Default:</strong> No monetary penalty; hardship restructuring available. <strong>Early Payment:</strong> Rebate (<em>Ibra</em>) on remaining profit. This contract is free from Riba and Gharar.</p><p><strong>Sharia Supervisory Board:</strong> LFE certifies compliance.</p>`,
  },
};

export default function Legal() {
  const [tab, setTab] = useState('terms');
  return (
    <div className="container page-section">
      <h2>
        <i className="fas fa-gavel" style={{ color: 'var(--secondary)' }} /> Legal &amp; Trust
      </h2>
      <div className="legal-tabs">
        {Object.entries(LEGAL).map(([key, val]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {val.title}
          </button>
        ))}
      </div>
      <div className="card">
        <div
          className="legal-content"
          dangerouslySetInnerHTML={{ __html: LEGAL[tab]?.html || LEGAL.terms.html }}
        />
      </div>
      <div className="card mt-16" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
        <i className="fas fa-shield-alt" style={{ color: 'var(--primary)' }} />{' '}
        <strong>Trusted by LFE</strong> — All financing is Sharia-screened. No hidden fees.
      </div>
    </div>
  );
}
