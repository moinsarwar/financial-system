import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats/', {
        headers: { 'x-admin-key': 'admin_secret_123' }
      });
      return res.data as DashboardStats;
    },
  });

  if (isLoading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Unable to load stats.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Submitted</div>
          <div className="text-2xl font-bold">{stats.total_submitted}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">LFE Accepted</div>
          <div className="text-2xl font-bold">{stats.lfe_accepted}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Approved in Principle</div>
          <div className="text-2xl font-bold">{stats.approved_in_principle}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Lender Match Rate</div>
          <div className="text-2xl font-bold">{stats.lender_match_rate}%</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold">Channel Metrics</h3>
          <p>Pending LFE: {stats.channel_pending_lfe}</p>
          <p>Failed: {stats.channel_failed}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold">Top Rejection Reasons</h3>
          <ul>
            {stats.top_rejection_reasons.map((item, i) => (
              <li key={i}>{item.reason}: {item.count}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
