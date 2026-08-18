import React from 'react';
import { useApp } from '../context/AppContext';

const Hero = () => {
  const { vehicleKey, applyVehicle, scrollTo } = useApp();
  const steps = [
    { key: 'motorbike', icon: '🛵', title: 'Model Motorbike' },
    { key: 'rickshaw', icon: '🛺', title: 'Model Rickshaw' },
    { key: 'car', icon: '🚗', title: 'Model Car' },
    { key: 'fleet', icon: '🚙🚙', title: 'Model Fleet (separate pathway)' },
  ];

  return (
    <div className="hero">
      <div>
        <div className="eyebrow">VEHICLE ACCESS FOR EARNING DRIVERS</div>
        <h1>
          Start with the vehicle you can access today—
          <span>and build toward the assets you want tomorrow.</span>
        </h1>
        <p>
          Drive to Earn brings vehicle access, financing pathways and earning economics into one journey for
          Pakistan&apos;s earning drivers.
        </p>
        <div className="cta-group">
          <button type="button" className="cta-btn primary" onClick={() => scrollTo('lfeModule')}>
            <i className="fas fa-clipboard-check" /> Check indicative starting point
          </button>
          <button type="button" className="cta-btn secondary" onClick={() => scrollTo('calculatorSection')}>
            <i className="fas fa-calculator" /> Estimate affordability
          </button>
          <button type="button" className="cta-btn tertiary" onClick={() => scrollTo('vehicleDetails')}>
            <i className="fas fa-chevron-right" /> Explore vehicles
          </button>
        </div>
        <div className="trust-line">
          <span>
            <i className="fas fa-percent" /> Illustrative financing scenario: 5–7% p.a. — actual rate and structure
            determined by participating financing partner.
          </span>
          <span>
            <i className="fas fa-check-circle" /> Vehicle inspection through participating sourcing partners
          </span>
          <span>
            <i className="fas fa-wrench" /> Scheduled maintenance/service allowance included
          </span>
          <span>
            <i className="fas fa-zero" /> No separate Drive to Earn fee in this illustrative scenario
          </span>
        </div>
      </div>
      <div className="hero-visual">
        <div className="steps">
          {steps.map((step, i) => (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <span className="arrow-icon">
                  <i className="fas fa-arrow-right" />
                </span>
              )}
              <button
                type="button"
                className={`step-icon${vehicleKey === step.key ? ' active' : ''}`}
                title={step.title}
                onClick={() => {
                  applyVehicle(step.key);
                  scrollTo('calculatorSection');
                }}
              >
                {step.icon}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="pathway-label">
          <span>START</span> · EARN · REPAY · BUILD A DRIVE TO EARN HISTORY · <span>BUILD TOWARD NEXT ASSET</span>
        </div>
        <div className="click-hint">
          <i className="fas fa-hand-pointer" /> Click to model this vehicle
        </div>
      </div>
    </div>
  );
};

export default Hero;
