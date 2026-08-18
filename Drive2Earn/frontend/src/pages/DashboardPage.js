import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  getDashboardApplications,
  getDashboardEstimates,
  getDashboardStats,
  updateApplicationStatus,
  updateEstimateFollowUp,
} from '../api/client';
import { useAuth } from '../context/AuthContext';

const applicationStatusOptions = ['pending', 'contacted', 'under_review', 'approved', 'declined', 'cancelled'];
const estimateFollowUpOptions = ['new', 'contacted', 'converted', 'closed'];

const statusClass = (status) => {
  const map = {
    new: 'status-new',
    pending: 'status-pending',
    contacted: 'status-contacted',
    under_review: 'status-scheduled',
    approved: 'status-completed',
    converted: 'status-answered',
    declined: 'status-cancelled',
    closed: 'status-closed',
    cancelled: 'status-cancelled',
    'indicative-fit': 'status-answered',
    'outside-range': 'status-pending',
  };
  return map[status] || 'status-pending';
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPkr = (n) => `PKR ${Math.round(Number(n) || 0).toLocaleString()}`;

const StatCard = ({ icon, label, value, accent }) => (
  <div className={`dash-stat-card dash-stat-${accent}`}>
    <div className="dash-stat-icon">
      <i className={`fas ${icon}`} />
    </div>
    <div className="dash-stat-body">
      <span className="dash-stat-label">{label}</span>
      <strong className="dash-stat-value">{value ?? '—'}</strong>
    </div>
  </div>
);

const EmptyState = ({ icon, title, text }) => (
  <div className="dash-empty">
    <div className="dash-empty-icon">
      <i className={`fas ${icon}`} />
    </div>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

const DashboardPage = () => {
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('applications');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, a, e] = await Promise.all([
        getDashboardStats(),
        getDashboardApplications(),
        getDashboardEstimates(),
      ]);
      setStats(s);
      setApplications(a);
      setEstimates(e);
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (authLoading) {
    return (
      <div className="dash-shell portal-drive2earn">
        <div className="dash-loading">
          <div className="dash-spinner" />
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login?next=/dashboard" replace />;

  return (
    <div className="dash-shell portal-drive2earn">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <i className="fas fa-route" />
          <div>
            <strong>Drive to Earn</strong>
            <small>Dashboard</small>
          </div>
        </div>
        <nav className="dash-nav">
          <button type="button" className={activeTab === 'applications' ? 'active' : ''} onClick={() => setActiveTab('applications')}>
            <i className="fas fa-clipboard-list" />
            Applications
            {stats ? <span className="dash-nav-count">{stats.applications}</span> : null}
          </button>
          <button type="button" className={activeTab === 'estimates' ? 'active' : ''} onClick={() => setActiveTab('estimates')}>
            <i className="fas fa-calculator" />
            Estimates
            {stats ? <span className="dash-nav-count">{stats.estimates}</span> : null}
          </button>
        </nav>
        <div className="dash-sidebar-foot">
          <div className="dash-user-card">
            <div className="dash-user-avatar">{user.name?.charAt(0) || 'U'}</div>
            <div>
              <strong>{user.name}</strong>
              <span className={`role-badge role-${user.role}`}>{user.role}</span>
            </div>
          </div>
          <Link to="/" className="dash-sidebar-link">
            <i className="fas fa-arrow-left" /> Back to site
          </Link>
          <button type="button" className="dash-sidebar-link dash-logout" onClick={logout}>
            <i className="fas fa-right-from-bracket" /> Logout
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <div className="dash-eyebrow">Welcome back</div>
            <h1>{isAdmin ? 'Operations overview' : 'Your pathway'}</h1>
            <p className="dash-subtitle">
              {isAdmin
                ? 'Manage vehicle access applications and affordability estimates.'
                : 'Track your applications and saved affordability estimates.'}
            </p>
          </div>
          <button type="button" className="dash-refresh-btn" onClick={load} disabled={loading}>
            <i className={`fas fa-rotate ${loading ? 'spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="dash-alert">
            <i className="fas fa-circle-exclamation" /> {error}
          </div>
        )}

        {stats && (
          <div className="dash-stats-grid">
            <StatCard icon="fa-car" label="Catalog vehicles" value={stats.vehicles} accent="blue" />
            <StatCard icon="fa-clipboard-list" label="Applications" value={stats.applications} accent="indigo" />
            <StatCard icon="fa-clock" label="Pending applications" value={stats.pending_applications} accent="amber" />
            <StatCard icon="fa-calculator" label="Estimates" value={stats.estimates} accent="teal" />
            <StatCard icon="fa-inbox" label="New estimates" value={stats.new_estimates} accent="rose" />
          </div>
        )}

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>
              <i className={`fas ${activeTab === 'applications' ? 'fa-clipboard-list' : 'fa-calculator'}`} />
              {activeTab === 'applications' ? 'Applications' : 'Affordability estimates'}
              <span className="dash-panel-scope">{isAdmin ? 'All records' : 'Your records'}</span>
            </h2>
          </div>

          {loading ? (
            <div className="dash-loading inline">
              <div className="dash-spinner" />
              <p>Fetching latest data…</p>
            </div>
          ) : activeTab === 'applications' ? (
            applications.length === 0 ? (
              <EmptyState
                icon="fa-inbox"
                title="No applications yet"
                text="Apply from the public site after choosing a vehicle and signing in."
              />
            ) : (
              <div className="dash-table-wrap">
                <div className="dash-table-head" aria-hidden="true">
                  <span>Applicant</span>
                  <span>Vehicle</span>
                  <span>Finance</span>
                  <span>Status</span>
                </div>
                {applications.map((row) => (
                  <article key={row.id} className="dash-row">
                    <div className="dash-row-lead">
                      <div className="dash-row-avatar">{(row.customer_name || '?').charAt(0)}</div>
                      <div>
                        <h3>{row.customer_name}</h3>
                        <div className="dash-record-meta">
                          <span>#{row.id}</span>
                          <span className="dash-record-type">
                            <i className={`fas ${row.pathway === 'fleet' ? 'fa-people-arrows' : 'fa-user'}`} />
                            {row.pathway === 'fleet' ? 'Fleet' : 'I Drive'}
                          </span>
                          <span><i className="fas fa-phone" /> {row.phone}</span>
                          {row.email && <span><i className="fas fa-at" /> {row.email}</span>}
                          {row.city && <span><i className="fas fa-location-dot" /> {row.city}</span>}
                          <span><i className="fas fa-calendar" /> {formatDate(row.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dash-row-vehicle">
                      <i className="fas fa-car" /> {row.vehicle_label} · {formatPkr(row.vehicle_price)}
                    </div>
                    <div className="dash-row-message">
                      <div><strong>Deposit:</strong> {formatPkr(row.deposit)}</div>
                      <div><strong>Income:</strong> {formatPkr(row.income)} / month · {row.employment}</div>
                      {row.notes && <div>{row.notes}</div>}
                    </div>
                    <div className="dash-row-status">
                      <span className="dash-source-chip">{row.pathway}</span>
                      {isAdmin ? (
                        <select
                          className={`dash-status-select ${statusClass(row.status)}`}
                          value={row.status}
                          onChange={(e) => updateApplicationStatus(row.id, e.target.value).then(load)}
                        >
                          {applicationStatusOptions.map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`dash-status-pill ${statusClass(row.status)}`}>{row.status.replace('_', ' ')}</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : estimates.length === 0 ? (
            <EmptyState
              icon="fa-calculator"
              title="No estimates yet"
              text="Run Estimate affordability on the public site. Logged-in estimates appear here."
            />
          ) : (
            <div className="dash-table-wrap">
              <div className="dash-table-head" aria-hidden="true">
                <span>Lead</span>
                <span>Vehicle</span>
                <span>Affordability</span>
                <span>Follow-up</span>
              </div>
              {estimates.map((row) => (
                <article key={row.id} className="dash-row">
                  <div className="dash-row-lead">
                    <div className="dash-row-avatar">{(row.customer_name || row.customer_email || '?').charAt(0)}</div>
                    <div>
                      <h3>{row.customer_name || row.customer_email || 'Anonymous estimate'}</h3>
                      <div className="dash-record-meta">
                        <span>#{row.id}</span>
                        {row.customer_email && <span><i className="fas fa-at" /> {row.customer_email}</span>}
                        <span><i className="fas fa-calendar" /> {formatDate(row.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="dash-row-vehicle">
                    <i className="fas fa-car" /> {row.vehicle_key} · {formatPkr(row.monthly_vehicle_cost)} / mo
                  </div>
                  <div className="dash-row-message">
                    <div><strong>Income:</strong> {formatPkr(row.income)} ({row.employment})</div>
                    <div><strong>Deposit:</strong> {formatPkr(row.deposit)}</div>
                    <div><strong>Ratio:</strong> {Math.round(row.repayment_ratio * 100)}%</div>
                    {row.suggested_vehicle && <div><strong>Suggested:</strong> {row.suggested_vehicle}</div>}
                  </div>
                  <div className="dash-row-status">
                    <span className={`dash-status-pill ${statusClass(row.status)}`}>{row.status.replace('-', ' ')}</span>
                    {isAdmin ? (
                      <select
                        className={`dash-status-select ${statusClass(row.follow_up)}`}
                        value={row.follow_up}
                        onChange={(e) => updateEstimateFollowUp(row.id, e.target.value).then(load)}
                      >
                        {estimateFollowUpOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`dash-status-pill ${statusClass(row.follow_up)}`}>{row.follow_up}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
