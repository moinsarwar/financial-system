import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ServiceCards = () => {
  const { requestApplication, selectedAppliance, showToast } = useContext(AppContext);

  const services = [
    { id: 'delivery', icon: 'fa-truck', label: 'Delivery', type: 'delivery' },
    { id: 'installation', icon: 'fa-wrench', label: 'Installation', type: 'installation' },
    { id: 'warranty', icon: 'fa-file-contract', label: 'Warranty', type: 'warranty' },
    { id: 'repair', icon: 'fa-screwdriver', label: 'Repair', type: 'repair' },
  ];

  const handleServiceClick = (service) => {
    if (!selectedAppliance) {
      showToast('Please select an appliance from the list first');
      return;
    }
    requestApplication({
      title: service.label,
      applicationType: service.type,
      appliance: selectedAppliance,
      source: `service_${service.id}`,
    });
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
            onClick={() => handleServiceClick(service)}
          >
            <i className={`fas ${service.icon}`} /> {service.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default ServiceCards;
