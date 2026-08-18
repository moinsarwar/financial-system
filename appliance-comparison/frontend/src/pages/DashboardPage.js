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

const appTypeMeta = {
  delivery: { icon: 'fa-truck', label: 'Delivery' },
  installation: { icon: 'fa-wrench', label: 'Installation' },
  warranty: { icon: 'fa-file-contract', label: 'Warranty' },
  repair: { icon: 'fa-screwdriver', label: 'Repair' },
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

  const handleApplicationStatusChange = async (id, status) => {
    try {
      await updateApplicationStatus(id, status);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInquiryStatusChange = async (id, status) => {
    try {
      await updateInquiryStatus(id, status);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="dash-shell">
        <div className="dash-loading">
          <div className="dash-spinner" />
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login?next=/dashboard" replace />;

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <i className="fas fa-house-chimney" />
          <div>
            <strong>HomeCompare</strong>
            <small>Dashboard</small>
          </div>
        </div>

        <nav className="dash-nav">
          <button
            type="button"
            className={activeTab === 'inquiries' ? 'active' : ''}
            onClick={() => setActiveTab('inquiries')}
          >
            <i className="fas fa-envelope" />
            Inquiries
            {stats ? <span className="dash-nav-count">{stats.inquiries}</span> : null}
          </button>
          <button
            type="button"
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications')}
          >
            <i className="fas fa-clipboard-list" />
            Applications
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
        <header className="dash-topbar">
          <div>
            <p className="dash-eyebrow">Welcome back</p>
            <h1>{isAdmin ? 'Admin Overview' : 'My Activity'}</h1>
            <p className="dash-subtitle">
              {isAdmin
                ? 'Manage customer inquiries, service applications and catalog activity.'
                : 'Track your submitted inquiries and service requests.'}
            </p>
          </div>
          <button type="button" className="dash-refresh-btn" onClick={load} disabled={loading}>
            <i className={`fas fa-rotate-right ${loading ? 'spin' : ''}`} /> Refresh
          </button>
        </header>

        {error && (
          <div className="dash-alert">
            <i className="fas fa-circle-exclamation" /> {error}
          </div>
        )}

        {stats && (
          <div className="dash-stats-grid">
            <StatCard icon="fa-box" label="Catalog appliances" value={stats.appliances} accent="blue" />
            <StatCard icon="fa-envelope-open-text" label="Total inquiries" value={stats.inquiries} accent="teal" />
            <StatCard icon="fa-file-signature" label="Applications" value={stats.applications} accent="indigo" />
            <StatCard icon="fa-clock" label="Pending applications" value={stats.pending_applications} accent="amber" />
            <StatCard icon="fa-inbox" label="New inquiries" value={stats.new_inquiries} accent="rose" />
          </div>
        )}

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>
              <i className={`fas ${activeTab === 'inquiries' ? 'fa-envelope' : 'fa-clipboard-list'}`} />
              {activeTab === 'inquiries' ? 'Inquiries' : 'Applications'}
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
              <EmptyState
                icon="fa-inbox"
                title="No inquiries yet"
                text="When customers request info from the site, their messages will appear here."
              />
            ) : (
              <div className="dash-record-list">
                {inquiries.map((row) => (
                  <article key={row.id} className="dash-record-card">
                    <div className="dash-record-top">
                      <div className="dash-record-id">#{row.id}</div>
                      <span className={`dash-status-pill ${statusClass(row.status)}`}>{row.status}</span>
                    </div>
                    <h3>{row.customer_name}</h3>
                    <div className="dash-record-meta">
                      <span>
                        <i className="fas fa-phone" /> {row.phone}
                      </span>
                      {row.email && (
                        <span>
                          <i className="fas fa-at" /> {row.email}
                        </span>
                      )}
                      <span>
                        <i className="fas fa-calendar" /> {formatDate(row.created_at)}
                      </span>
                    </div>
                    {row.appliance_name && (
                      <div className="dash-record-tag">
                        <i className="fas fa-plug" /> {row.appliance_name}
                      </div>
                    )}
                    {row.message && <p className="dash-record-message">{row.message}</p>}
                    <div className="dash-record-foot">
                      <span className="dash-source-chip">{row.source.replace(/_/g, ' ')}</span>
                      {isAdmin ? (
                        <select
                          className={`dash-status-select ${statusClass(row.status)}`}
                          value={row.status}
                          onChange={(e) => handleInquiryStatusChange(row.id, e.target.value)}
                        >
                          {inquiryStatusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
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
            <EmptyState
              icon="fa-clipboard"
              title="No applications yet"
              text="Delivery, installation, warranty and repair requests will show up here."
            />
          ) : (
            <div className="dash-record-list">
              {applications.map((row) => {
                const type = appTypeMeta[row.application_type] || {
                  icon: 'fa-file',
                  label: row.application_type,
                };
                return (
                  <article key={row.id} className="dash-record-card">
                    <div className="dash-record-top">
                      <div className="dash-record-type">
                        <i className={`fas ${type.icon}`} /> {type.label}
                      </div>
                      <span className="dash-record-id">#{row.id}</span>
                    </div>
                    <h3>{row.customer_name}</h3>
                    <div className="dash-record-meta">
                      <span>
                        <i className="fas fa-phone" /> {row.phone}
                      </span>
                      {row.email && (
                        <span>
                          <i className="fas fa-at" /> {row.email}
                        </span>
                      )}
                      <span>
                        <i className="fas fa-calendar" /> {formatDate(row.created_at)}
                      </span>
                    </div>
                    {row.appliance_name && (
                      <div className="dash-record-tag">
                        <i className="fas fa-plug" /> {row.appliance_name}
                      </div>
                    )}
                    {(row.address || row.preferred_date || row.notes) && (
                      <div className="dash-record-details">
                        {row.address && <p><strong>Address:</strong> {row.address}</p>}
                        {row.preferred_date && <p><strong>Preferred date:</strong> {row.preferred_date}</p>}
                        {row.notes && <p><strong>Notes:</strong> {row.notes}</p>}
                      </div>
                    )}
                    <div className="dash-record-foot">
                      <span className="dash-source-chip">{row.source.replace(/_/g, ' ')}</span>
                      {isAdmin ? (
                        <select
                          className={`dash-status-select ${statusClass(row.status)}`}
                          value={row.status}
                          onChange={(e) => handleApplicationStatusChange(row.id, e.target.value)}
                        >
                          {applicationStatusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`dash-status-pill ${statusClass(row.status)}`}>{row.status}</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
