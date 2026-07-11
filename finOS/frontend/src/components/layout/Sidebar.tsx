import React, { useEffect } from 'react';  
import { Link, useNavigate } from 'react-router-dom';  
import clsx from 'clsx';  
import { can } from '../../utils/permissions';  
  
interface User { role: string; }  
interface Props { user: User | null; currentPath: string; open: boolean; onClose: () => void; }  
  
const navItems = {  
  operations: [  
    { to: '/', label: '📊 Dashboard' },  
    { to: '/clients', label: '👤 Clients' },  
    { to: '/applications', label: '📋 Applications' },  
    { to: '/claims', label: '📄 Claims' },  
    { to: '/products', label: '📦 Products' },  
    { to: '/documents', label: '📁 Documents' },  
    { to: '/activity', label: '📜 Activity' },  
  ],  
  client: [  
    { to: '/', label: '📊 Dashboard' },  
    { to: '/applications', label: '📋 My Applications' },  
    { to: '/claims', label: '📄 My Claims' },  
    { to: '/products', label: '📦 My Products' },  
    { to: '/documents', label: '📁 My Documents' },  
    { to: '/activity', label: '📜 Activity' },  
  ],  
};  
  
export const Sidebar: React.FC<Props> = ({ user, currentPath, open, onClose }) => {  
  const navigate = useNavigate();  
  useEffect(() => {  
    if (open) {  
      document.body.style.overflow = 'hidden';  
    } else {  
      document.body.style.overflow = '';  
    }  
    return () => { document.body.style.overflow = ''; };  
  }, [open]);  
  
  if (!user) return null;  
  const items = user.role === 'client' ? navItems.client : navItems.operations;  
  // Filter items based on permissions (simple)  
  const filtered = items.filter(item => {  
    if (item.to === '/activity') return can(user.role, 'activity.read_all');  
    return true;  
  });  
  
  const content = (  
    <div className="bg-gray-50 border-r border-gray-200 h-full w-48 p-3">  
      {filtered.map(item => (  
        <Link key={item.to} to={item.to} onClick={onClose}  
              className={clsx('block px-3 py-2 rounded-md text-sm font-medium transition',  
                currentPath === item.to ? 'bg-accent-soft text-primary border-r-2 border-accent' : 'text-gray-600 hover:bg-gray-100')}>  
          {item.label}  
        </Link>  
      ))}  
    </div>  
  );  
  
  if (window.innerWidth < 640) {  
    return (  
      <>  
        <div className={clsx('fixed inset-0 bg-black/30 z-40', open ? 'block' : 'hidden')} onClick={onClose} />  
        <div className={clsx('fixed left-0 top-0 h-full z-50 transform transition-transform duration-300', open ? 'translate-x-0' : '-translate-x-full')}>  
          {content}  
        </div>  
      </>  
    );  
  }  
  return content;  
};
