import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  getDashboardApplications,
  getDashboardInquiries,
  getDashboardStats,
  updateApplicationStatus,
  updateInquiryStatus,
} from '../api/client';
import { useAuth } from '../context/AuthContext';

const applicationStatusOptions = ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'];
const inquiryStatusOptions = ['new', 'contacted', 'answered', 'closed'];

const statusClass = (status) => {
  const map = {
    new: 'status-new',
    pending: 'status-pending',
    contacted: 'status-contacted',
    answered: 'status-answered',
    closed: 'status-closed',
    scheduled: 'status-scheduled',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
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
  const [inquiries, setInquiries] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inquiries');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, i, a] = await Promise.all([
        getDashboardStats(),
        getDashboardInquiries(),
        getDashboardApplications(),
      ]);
      setStats(s);
      setInquiries(i);
      setApplications(a);
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
      <div className="dash-shell portal-autocompare">
        <div className="dash-loading">
          <div className="dash-spinner" />
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login?next=/dashboard" replace />;

  return (
    <div className="dash-shell portal-autocompare">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <i className="fas fa-car-side" />
          <div>
            <strong>AutoCompare</strong>
            <small>Dashboard</small>
          </div>
        </div>
        <nav className="dash-nav">
          <button type="button" className={activeTab === 'inquiries' ? 'active' : ''} onClick={() => setActiveTab('inquiries')}>
            <i className="fas fa-envelope" />
            Inquiries
            {stats ? <span className="dash-nav-count">{stats.inquiries}</span> : null}
          </button>
          <button type="button" className={activeTab === 'applications' ? 'active' : ''} onClick={() => setActiveTab('applications')}>
            <i className="fas fa-key" />
            Test drives
            {stats ? <span className="dash-nav-count">{stats.applications}</span> : null}
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
            <h1>{isAdmin ? 'Operations overview' : 'Your activity'}</h1>
            <p className="dash-subtitle">
              {isAdmin
                ? 'Manage vehicle info requests and test-drive bookings.'
                : 'Track your inquiries and test-drive requests.'}
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
            <StatCard icon="fa-envelope-open-text" label="Inquiries" value={stats.inquiries} accent="teal" />
            <StatCard icon="fa-key" label="Test drives" value={stats.applications} accent="indigo" />
            <StatCard icon="fa-clock" label="Pending test drives" value={stats.pending_applications} accent="amber" />
            <StatCard icon="fa-inbox" label="New inquiries" value={stats.new_inquiries} accent="rose" />
          </div>
        )}

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>
              <i className={`fas ${activeTab === 'inquiries' ? 'fa-envelope' : 'fa-key'}`} />
              {activeTab === 'inquiries' ? 'Inquiries' : 'Test-drive applications'}
              <span className="dash-panel-scope">{isAdmin ? 'All records' : 'Your records'}</span>
            </h2>
          </div>

          {loading ? (
            <div className="dash-loading inline">
              <div className="dash-spinner" />
              <p>Fetching latest data…</p>
            </div>
          ) : activeTab === 'inquiries' ? (
            inquiries.length === 0 ? (
              <EmptyState icon="fa-inbox" title="No inquiries yet" text="Request info from the public site and it will appear here." />
            ) : (
              <div className="dash-table-wrap">
                <div className="dash-table-head" aria-hidden="true">
                  <span>Lead</span>
                  <span>Vehicle</span>
                  <span>Message</span>
                  <span>Status</span>
                </div>
                {inquiries.map((row) => (
                  <article key={row.id} className="dash-row">
                    <div className="dash-row-lead">
                      <div className="dash-row-avatar">{(row.customer_name || '?').charAt(0)}</div>
                      <div>
                        <h3>{row.customer_name}</h3>
                        <div className="dash-record-meta">
                          <span>#{row.id}</span>
                          <span><i className="fas fa-phone" /> {row.phone}</span>
                          {row.email && <span><i className="fas fa-at" /> {row.email}</span>}
                          <span><i className="fas fa-calendar" /> {formatDate(row.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dash-row-vehicle">
                      {row.vehicle_name ? (
                        <>
                          <i className="fas fa-car" /> {row.vehicle_name}
                        </>
                      ) : (
                        <span className="dash-muted">No vehicle</span>
                      )}
                    </div>
                    <p className="dash-row-message">{row.message || '—'}</p>
                    <div className="dash-row-status">
                      <span className="dash-source-chip">{(row.source || 'site').replace(/_/g, ' ')}</span>
                      {isAdmin ? (
                        <select
                          className={`dash-status-select ${statusClass(row.status)}`}
                          value={row.status}
                          onChange={(e) => updateInquiryStatus(row.id, e.target.value).then(load)}
                        >
                          {inquiryStatusOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`dash-status-pill ${statusClass(row.status)}`}>{row.status}</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : applications.length === 0 ? (
            <EmptyState icon="fa-key" title="No test drives yet" text="Book a test drive from the public site after signing in." />
          ) : (
            <div className="dash-table-wrap">
              <div className="dash-table-head" aria-hidden="true">
                <span>Customer</span>
                <span>Vehicle</span>
                <span>Schedule</span>
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
                        <span><i className="fas fa-phone" /> {row.phone}</span>
                        {row.email && <span><i className="fas fa-at" /> {row.email}</span>}
                        {row.city && <span><i className="fas fa-location-dot" /> {row.city}</span>}
                        <span><i className="fas fa-calendar" /> {formatDate(row.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="dash-row-vehicle">
                    {row.vehicle_name ? (
                      <>
                        <i className="fas fa-car" /> {row.vehicle_name}
                      </>
                    ) : (
                      <span className="dash-muted">No vehicle</span>
                    )}
                  </div>
                  <div className="dash-row-message">
                    {row.preferred_date || row.preferred_time || row.notes ? (
                      <>
                        {row.preferred_date && <div><strong>Date:</strong> {row.preferred_date}</div>}
                        {row.preferred_time && <div><strong>Time:</strong> {row.preferred_time}</div>}
                        {row.notes && <div>{row.notes}</div>}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="dash-row-status">
                    <span className="dash-source-chip">{(row.source || 'site').replace(/_/g, ' ')}</span>
                    {isAdmin ? (
                      <select
                        className={`dash-status-select ${statusClass(row.status)}`}
                        value={row.status}
                        onChange={(e) => updateApplicationStatus(row.id, e.target.value).then(load)}
                      >
                        {applicationStatusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`dash-status-pill ${statusClass(row.status)}`}>{row.status}</span>
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
