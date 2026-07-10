import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Activity, CreditCard } from 'lucide-react';

const data = [
  { name: 'Mon', searches: 4000, active: 2400 },
  { name: 'Tue', searches: 3000, active: 1398 },
  { name: 'Wed', searches: 2000, active: 9800 },
  { name: 'Thu', searches: 2780, active: 3908 },
  { name: 'Fri', searches: 1890, active: 4800 },
  { name: 'Sat', searches: 2390, active: 3800 },
  { name: 'Sun', searches: 3490, active: 4300 },
];

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <h3>Total Products</h3>
            <div className="stat-icon"><CreditCard size={24} /></div>
          </div>
          <div className="value">
            124 <span className="trend up"><TrendingUp size={16} /> +12%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <h3>Active Providers</h3>
            <div className="stat-icon"><Users size={24} /></div>
          </div>
          <div className="value">
            12 <span className="trend up"><TrendingUp size={16} /> +2</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <h3>Searches Today</h3>
            <div className="stat-icon"><Activity size={24} /></div>
          </div>
          <div className="value">
            1,432 <span className="trend up"><TrendingUp size={16} /> +18%</span>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h2>Activity Overview</h2>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Area type="monotone" dataKey="searches" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSearches)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
