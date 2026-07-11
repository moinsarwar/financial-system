import React from 'react';  
import { useNavigate } from 'react-router-dom';  
import { FunnelStats } from '../../api/dashboard';  
  
interface Props {  
  funnel: FunnelStats;  
  active: string | null;  
  onSelect: (key: string) => void;  
}  
  
export const FunnelBar: React.FC<Props> = ({ funnel, active, onSelect }) => {  
  const navigate = useNavigate();  
  
  const items = [  
    { key: 'leads', label: '🔍 Leads', count: funnel.leads, route: '/clients?stage=lead' },  
    { key: 'applicants', label: '📋 Applicants', count: funnel.applicants, route: '/applications?status=in-progress' },  
    { key: 'customers', label: '✅ Customers', count: funnel.customers, route: '/clients?stage=customer' },  
    { key: 'openClaims', label: '📄 Open Claims', count: funnel.openClaims, route: '/claims?open_only=true' },  
  ];  
  
  return (  
    <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">  
      {items.map((item, index) => (  
        <React.Fragment key={item.key}>  
          <button  
            className={`funnel-step ${active === item.key ? 'active' : ''}`}  
            onClick={() => {  
              onSelect(item.key);  
              navigate(item.route);  
            }}  
          >  
            {item.label}  
            <span className="count">{item.count}</span>  
          </button>  
          {index < items.length - 1 && <span className="text-gray-400 text-xl">›</span>}  
        </React.Fragment>  
      ))}  
    </div>  
  );  
};
