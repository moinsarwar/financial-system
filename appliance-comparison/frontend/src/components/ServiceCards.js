import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ServiceCards = () => {
  const { openModal } = useContext(AppContext);

  const services = [
    { id: 'delivery', icon: 'fa-truck', label: 'Delivery' },
    { id: 'installation', icon: 'fa-wrench', label: 'Installation' },
    { id: 'warranty', icon: 'fa-file-contract', label: 'Warranty' },
    { id: 'repair', icon: 'fa-screwdriver', label: 'Repair' },
  ];

  const serviceData = {
    delivery: {
      title: 'Delivery & Installation',
      body: `<div class="simulated-badge">🔬 PROTOTYPE · SIMULATED SERVICE</div>
          <p>Get your appliance delivered and installed professionally.</p>
          <ul><li><strong>Delivery:</strong> Free within city limits</li>
          <li><strong>Installation:</strong> Professional setup included</li></ul>`,
      meta: 'Prototype · Simulated delivery',
    },
    installation: {
      title: 'Professional Installation',
      body: `<div class="simulated-badge">🔬 PROTOTYPE · SIMULATED SERVICE</div>
          <p>Expert installation for all major appliances.</p>`,
      meta: 'Prototype · Simulated installation',
    },
    warranty: {
      title: 'Extended Warranty',
      body: `<div class="simulated-badge">🔬 PROTOTYPE · SIMULATED SERVICE</div>
          <p>Protect your appliance with extended warranty coverage.</p>`,
      meta: 'Prototype · Simulated warranty',
    },
    repair: {
      title: 'Repair Service',
      body: `<div class="simulated-badge">🔬 PROTOTYPE · SIMULATED SERVICE</div>
          <p>Fast and reliable repair service for all appliance types.</p>`,
      meta: 'Prototype · Simulated repair',
    },
  };

  const handleServiceClick = (serviceId) => {
    const data = serviceData[serviceId];
    if (data) openModal(data.title, data.body, data.meta);
  };

  return (
    <>
      <div style={{ margin: '4px 0 2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <i className="fas fa-concierge-bell" style={{ color: '#0f5b7a', fontSize: '14px' }} />
        <span style={{ fontWeight: '500', color: '#1f4d66', fontSize: '13px' }}>Services</span>
      </div>
      <div className="service-strip">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            className="service-card"
            data-service={service.id}
            onClick={() => handleServiceClick(service.id)}
          >
            <i className={`fas ${service.icon}`} /> {service.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default ServiceCards;
