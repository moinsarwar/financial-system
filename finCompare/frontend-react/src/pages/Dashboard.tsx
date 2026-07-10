

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Products</h3>
          <div className="value">124</div>
        </div>
        <div className="stat-card">
          <h3>Active Providers</h3>
          <div className="value">12</div>
        </div>
        <div className="stat-card">
          <h3>Searches Today</h3>
          <div className="value">1,432</div>
        </div>
      </div>

      <div className="chart-section mt-8">
        <h2>Recent Activity</h2>
        <div className="placeholder-chart">
          {/* Replace with actual chart library like Recharts */}
          <div style={{height: '300px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            Activity Chart Placeholder
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
