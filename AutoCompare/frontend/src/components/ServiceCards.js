import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const SERVICE_CONTENT = {
  insurance: {
    title: 'Car Insurance',
    body: `<div class="simulated-badge">🔬 PROTOTYPE · SIMULATED SERVICE</div>
      <p>Protect your vehicle with comprehensive insurance coverage.</p>
      <ul>
        <li><strong>Coverage:</strong> Theft, accident, fire, flood, and third-party liability</li>
        <li><strong>Options:</strong> Comprehensive, Third-party, and Theft-only policies</li>
        <li><strong>Add-ons:</strong> Natural disasters, personal accident, and more</li>
      </ul>
      <button class="action-btn" data-action="quote" data-vehicle-name="Insurance"><i class="fas fa-file-invoice"></i> Get a free quote</button>
      <button class="action-btn secondary" data-action="info" data-vehicle-name="Insurance"><i class="fas fa-phone"></i> Speak to an agent</button>`,
    meta: 'Prototype · Insurance',
  },
  finance: {
    title: 'Car Financing',
    body: `<div class="simulated-badge">🔬 PROTOTYPE · SIMULATED SERVICE</div>
      <p>Flexible financing options for new or used cars in Pakistan.</p>
      <ul>
        <li><strong>Tenure:</strong> 1 to 5 years</li>
        <li><strong>Islamic options:</strong> Ijarah and Diminishing Musharakah</li>
        <li><strong>Pre-approval:</strong> Get approved before you shop</li>
      </ul>
      <button class="action-btn" data-action="finance_quote" data-vehicle-name="Finance"><i class="fas fa-calculator"></i> Calculate your payment</button>
      <button class="action-btn secondary" data-action="info" data-vehicle-name="Finance"><i class="fas fa-handshake"></i> Talk to a finance advisor</button>`,
    meta: 'Prototype · Financing',
  },
  maintenance: {
    title: 'Service & Maintenance',
    body: `<div class="simulated-badge">🔬 PROTOTYPE · SIMULATED SERVICE</div>
      <p>Keep your car running with authorized service centers.</p>
      <ul>
        <li><strong>Services:</strong> Oil changes, brakes, AC, tires</li>
        <li><strong>Parts:</strong> Genuine OEM parts with warranty</li>
        <li><strong>Coverage:</strong> All major cities in Pakistan</li>
      </ul>
      <button class="action-btn" data-action="service_book" data-vehicle-name="Maintenance"><i class="fas fa-calendar-check"></i> Book a service appointment</button>
      <button class="action-btn secondary" data-action="info" data-vehicle-name="Maintenance"><i class="fas fa-file-invoice"></i> Maintenance package details</button>`,
    meta: 'Prototype · Service',
  },
  inspection: {
    title: 'Vehicle Inspection',
    body: `<div class="simulated-badge">🔬 PROTOTYPE · SIMULATED SERVICE</div>
      <p>Get a thorough 150-point inspection before buying a used car.</p>
      <ul>
        <li><strong>Engine & Transmission:</strong> Compression, leaks, gear shifts</li>
        <li><strong>Chassis & Body:</strong> Frame damage, rust, panel gaps</li>
        <li><strong>Report:</strong> Findings with photos and recommendations</li>
      </ul>
      <button class="action-btn" data-action="inspect_book" data-vehicle-name="Inspection"><i class="fas fa-clipboard-check"></i> Book an inspection</button>
      <button class="action-btn secondary" data-action="info" data-vehicle-name="Inspection"><i class="fas fa-download"></i> Sample inspection report</button>`,
    meta: 'Prototype · Inspection',
  },
};

const ServiceCards = () => {
  const { openModal } = useContext(AppContext);
  const services = [
    { id: 'insurance', icon: 'fa-shield-alt', label: 'Insurance' },
    { id: 'finance', icon: 'fa-wallet', label: 'Finance' },
    { id: 'maintenance', icon: 'fa-tools', label: 'Service & Maintenance' },
    { id: 'inspection', icon: 'fa-search', label: 'Inspection' },
  ];

  return (
    <>
      <div style={{ margin: '4px 0 2px', display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className="fas fa-concierge-bell" style={{ color: '#0f5b7a', fontSize: 14 }} />
        <span style={{ fontWeight: 500, color: '#1f4d66', fontSize: 13 }}>Services</span>
      </div>
      <div className="service-strip">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            className="service-card"
            onClick={() => {
              const data = SERVICE_CONTENT[service.id];
              if (data) openModal(data.title, data.body, data.meta);
            }}
          >
            <i className={`fas ${service.icon}`} /> {service.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default ServiceCards;
