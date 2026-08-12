import React from 'react';  
  
const tabs = [  
  { id: 'sim1', label: 'Customer Journey' },  
  { id: 'sim2', label: 'Earnings' },  
  { id: 'sim3', label: 'Business Growth' },  
  { id: 'sim4', label: 'Day in the Life' },  
  { id: 'sim5', label: 'Can I Really Do This?' },  
  { id: 'sim6', label: 'Admin View' },  
  { id: 'sim7', label: 'Marketing Tools' },  
];  
  
const SimulatorTabs = ({ activeTab, setActiveTab }) => {  
  return (  
    <div className="simulator-tabs" id="simTabs">  
      {tabs.map(tab => (  
        <button  
          key={tab.id}  
          className={`sim-tab-btn ${activeTab === tab.id ? 'active' : ''}`}  
          onClick={() => setActiveTab(tab.id)}  
        >  
          {tab.label}  
        </button>  
      ))}  
    </div>  
  );  
};  
  
export default SimulatorTabs;
