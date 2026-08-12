import React, { useState } from 'react';  
  
const steps = [  
  { icon: 'fa-search', label: 'Search', desc: 'Sarah searches' },  
  { icon: 'fa-list', label: 'Compare', desc: 'Sees 5 offers' },  
  { icon: 'fa-hand-pointer', label: 'Select', desc: 'Chooses best rate' },  
  { icon: 'fa-envelope', label: 'Enquiry', desc: 'Submits application' },  
  { icon: 'fa-tachometer-alt', label: 'Dashboard', desc: 'Lead appears' },  
];  
  
const descriptions = [  
  'Sarah searches for a mortgage on your subdomain. She sees a list of products from major banks.',  
  'Sarah compares the offers — rates, fees, and terms. She narrows down to two options.',  
  'Sarah selects the best mortgage offer from HBL and clicks "Apply".',  
  'Sarah submits her application. You receive a lead notification in your dashboard instantly.',  
  'Your dashboard updates with Sarah\'s lead — product, customer details, and potential commission of ₨ 12,500.'  
];  
  
const CustomerJourney = () => {  
  const [currentStep, setCurrentStep] = useState(0);  
  
  const handleNext = () => {  
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);  
  };  
  const handlePrev = () => {  
    if (currentStep > 0) setCurrentStep(currentStep - 1);  
  };  
  const handleReset = () => setCurrentStep(0);  
  
  return (  
    <div>  
      <h3 style={{fontWeight:'700',fontSize:'1.1rem'}}>Customer Journey — Meet Sarah</h3>  
      <div className="journey-story">  
        <p><span className="person">Sarah</span>, a first-time home buyer from Lahore, is looking for a mortgage. She lands on your subdomain and starts comparing options.</p>  
      </div>  
      <div className="journey-steps">  
        {steps.map((step, index) => (  
          <div key={index} className={`journey-step ${index === currentStep ? 'active' : ''}`}>  
            <span className="step-icon"><i className={`fas ${step.icon}`}></i></span>  
            <span className="step-label">{step.label}</span>  
            <span className="step-desc">{step.desc}</span>  
          </div>  
        ))}  
      </div>  
      <div className="journey-controls">  
        <button className="btn btn-secondary btn-sm" onClick={handlePrev} disabled={currentStep === 0}><i className="fas fa-arrow-left"></i> Prev</button>  
        <button className="btn btn-primary btn-sm" onClick={handleNext} disabled={currentStep === steps.length - 1}>Next <i className="fas fa-arrow-right"></i></button>  
        <button className="btn btn-success btn-sm" onClick={handleReset}><i className="fas fa-redo"></i> Reset</button>  
      </div>  
      <div className="journey-feedback">  
        <p><strong>Step {currentStep+1}:</strong> {descriptions[currentStep]}</p>  
      </div>  
    </div>  
  );  
};  
  
export default CustomerJourney;
