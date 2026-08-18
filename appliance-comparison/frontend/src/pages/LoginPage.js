import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolvePostAuthPath } from '../utils/authRedirect';
import { clearPendingAction } from '../utils/pendingAction';

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reason !== 'service') {
      clearPendingAction();
    }
  }, [reason]);

  useEffect(() => {
    if (!user) return;
    navigate(resolvePostAuthPath(searchParams), { replace: true });
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(resolvePostAuthPath(searchParams), { replace: true });
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@homecompare.pk');
      setPassword('admin123');
    } else {
      setEmail('user@homecompare.pk');
      setPassword('user123');
    }
  };

  return (
    <div className="auth-shell portal-homecompare layout-hc-auth">
      <header className="hc-auth-top">
        <div className="brand">
          <i className="fas fa-house-chimney" />
          <h1>
            HomeCompare <small>PK</small>
          </h1>
        </div>
        <Link to="/" className="auth-back">
          <i className="fas fa-arrow-left" /> Public site
        </Link>
      </header>

      <section className="hc-auth-hero">
        <p className="hc-auth-kicker">Appliance workspace</p>
        <h2>Sign in to manage bookings</h2>
        <p>Inquiries, delivery, installation and warranty requests live in one household-style console.</p>
        <ul className="hc-auth-pills">
          <li><i className="fas fa-snowflake" /> Inquiries</li>
          <li><i className="fas fa-truck" /> Delivery</li>
          <li><i className="fas fa-screwdriver-wrench" /> Service</li>
        </ul>
      </section>

      <div className="hc-auth-card-wrap">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-sub">Access your dashboard as admin or customer.</p>

          {reason === 'service' && (
            <div className="auth-notice">
              <i className="fas fa-lock" /> Sign in or register to book delivery &amp; installation for your selected product.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            {error && (
              <div className="auth-error-box">
                <i className="fas fa-circle-exclamation" /> {error}
              </div>
            )}
            <button type="submit" className="compare-btn auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in to dashboard'}
            </button>
          </form>

          <div className="auth-demo">
            <p className="auth-demo-title">Quick demo login</p>
            <div className="auth-demo-btns">
              <button type="button" onClick={() => fillDemo('admin')}>
                <i className="fas fa-user-shield" /> Admin
              </button>
              <button type="button" onClick={() => fillDemo('user')}>
                <i className="fas fa-user" /> User
              </button>
            </div>
          </div>

          <p className="auth-switch">
            New customer?{' '}
            <Link to={reason === 'service' ? '/register?reason=service' : '/register'}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
