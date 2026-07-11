import React, { useState } from 'react';  
import { useQuery } from '@tanstack/react-query';  
import { getFunnelStats, getDashboardStats } from '../api/dashboard';  
import { StatCard } from '../components/common/StatCard';  
import { FunnelBar } from '../components/common/FunnelBar';  
import { useAuth } from '../contexts/AuthContext';  
  
export const Dashboard: React.FC = () => {  
  const { user } = useAuth();  
  const { data: funnel, isLoading: fLoading } = useQuery({  
    queryKey: ['funnel'],  
    queryFn: getFunnelStats,  
  });  
  const { data: stats, isLoading: sLoading } = useQuery({  
    queryKey: ['stats'],  
    queryFn: getDashboardStats,  
  });  
  const [activeFunnel, setActiveFunnel] = useState<string | null>(null);  
  
  if (fLoading || sLoading) return <div className="p-8 text-center">Loading...</div>;  
  if (!funnel || !stats) return <div className="p-8 text-center">No data available</div>;  
  
  return (  
    <div>  
      <div className="mb-6">  
        <h2 className="text-2xl font-extrabold">  
          {user?.role === 'client' ? `Welcome, ${user.full_name}` : 'Operations Dashboard'}  
        </h2>  
        <p className="text-gray-600">{user?.role === 'client' ? 'Your financial portfolio' : 'All departments overview'}</p>  
      </div>  
  
      {user?.role !== 'client' && (  
        <FunnelBar funnel={funnel} active={activeFunnel} onSelect={setActiveFunnel} />  
      )}  
  
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">  
        <StatCard label="Total Clients" value={stats.totalClients} />  
        <StatCard label="Active Products" value={stats.activeProducts} />  
        <StatCard label="Open Claims" value={stats.openClaims} />  
        <StatCard label="Applications" value={stats.applications} />  
      </div>  
    </div>  
  );  
};
