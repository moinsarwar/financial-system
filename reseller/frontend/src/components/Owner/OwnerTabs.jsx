import React from 'react';  
  
const tabs = [  
  { id: 'dashboard', label: 'Dashboard' },  
  { id: 'customers', label: 'Customers' },  
  { id: 'marketing', label: 'Marketing' },  
  { id: 'settings', label: 'Settings' },  
  { id: 'support', label: 'Support' },  
];  
  
const OwnerTabs = ({ activeTab, setActiveTab }) => {  
  return (  
    <div className="owner-tabs">  
      {tabs.map(tab => (  
        <button  
          key={tab.id}  
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}  
          onClick={() => setActiveTab(tab.id)}  
        >  
          {tab.label}  
        </button>  
      ))}  
    </div>  
  );  
};  
  
export default OwnerTabs;
