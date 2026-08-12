import React, { useState } from 'react';  
import { Outlet, useLocation } from 'react-router-dom';  
import { useAuth } from '../../contexts/AuthContext';  
import { Header } from './Header';  
import { DepartmentSelector } from '../common/DepartmentSelector';  
import { Sidebar } from './Sidebar';  
  
export const Layout: React.FC = () => {  
  const { user } = useAuth();  
  const location = useLocation();  
  const [sidebarOpen, setSidebarOpen] = useState(false);  
  
  return (  
    <div className="min-h-screen bg-gray-100 p-3">  
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden border-t-4 border-accent">  
        <div className="bg-gray-800 text-white text-center py-1 text-xs font-medium">  
          <span className="text-gold">⚡ Simulation Environment</span> · Synthetic data · Demonstration only  
        </div>  
        <Header user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />  
        <div className="flex">  
          <Sidebar user={user} currentPath={location.pathname} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />  
          <div className="flex-1">  
            {user?.role !== 'client' && <DepartmentSelector />}  
            <div className="p-6">  
              <Outlet />  
            </div>  
          </div>  
        </div>  
      </div>  
    </div>  
  );  
};
