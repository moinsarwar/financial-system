import React, { useState, useEffect } from 'react';  
import { useNavigate, useLocation } from 'react-router-dom';  
  
const departments = {  
  lending: { label: 'Lending', icon: '💰' },  
  motor: { label: 'Motor Insurance', icon: '🚗' },  
  health: { label: 'Health Insurance', icon: '❤️' },  
  life: { label: 'Life Assurance', icon: '🛡️' },  
  retail: { label: 'Retail Banking', icon: '🏦' },  
  commercial: { label: 'Commercial Insurance', icon: '🏢' },  
  travel: { label: 'Travel Insurance', icon: '✈️' },  
};  
  
type DepartmentKey = keyof typeof departments | null;  
  
export const DepartmentSelector: React.FC = () => {  
  const navigate = useNavigate();  
  const location = useLocation();  
  const [selected, setSelected] = useState<DepartmentKey>(null);  
  
  useEffect(() => {  
    const params = new URLSearchParams(location.search);  
    const dept = params.get('department');  
    if (dept && dept in departments) {  
      setSelected(dept as DepartmentKey);  
    } else {  
      setSelected(null);  
    }  
  }, [location.search]);  
  
  const handleSelect = (key: DepartmentKey) => {  
    setSelected(key);  
    const params = new URLSearchParams(location.search);  
    if (key) {  
      params.set('department', key);  
    } else {  
      params.delete('department');  
    }  
    navigate({ pathname: location.pathname, search: params.toString() });  
  };  
  
  return (  
    <div className="flex gap-1 p-2 bg-white border-b border-gray-200 flex-wrap items-center">  
      <span className="font-semibold text-gray-600 text-sm mr-2">🏢 Department:</span>  
      <button  
        onClick={() => handleSelect(null)}  
        className={`px-3 py-1 rounded-full border-2 text-xs font-semibold transition ${  
          selected === null ? 'border-accent bg-accent-soft text-primary' : 'border-gray-200 text-gray-600'  
        }`}  
      >  
        All Departments  
      </button>  
      {Object.entries(departments).map(([key, dept]) => (  
        <button  
          key={key}  
          onClick={() => handleSelect(key as DepartmentKey)}  
          className={`px-3 py-1 rounded-full border-2 text-xs font-semibold transition ${  
            selected === key ? 'border-accent bg-accent-soft text-primary' : 'border-gray-200 text-gray-600'  
          }`}  
        >  
          {dept.icon} {dept.label}  
        </button>  
      ))}  
    </div>  
  );  
};
