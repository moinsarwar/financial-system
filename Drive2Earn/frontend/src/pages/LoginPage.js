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
    if (reason !== 'apply') clearPendingAction();
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
      setEmail('admin@drive2earn.pk');
      setPassword('admin123');
    } else {
      setEmail('driver@drive2earn.pk');
      setPassword('driver123');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-inner">
          <div className="auth-visual-badge">
            <i className="fas fa-gauge-high" /> Drive to Earn portal
          </div>
          <h2>Track vehicle applications in one place</h2>
          <p>Drivers apply for bike, rickshaw, car or fleet access. Admins follow up estimates and applications.</p>
          <ul className="auth-feature-list">
            <li><i className="fas fa-check-circle" /> Affordability estimates</li>
            <li><i className="fas fa-check-circle" /> Vehicle access applications</li>
            <li><i className="fas fa-check-circle" /> Admin status management</li>
          </ul>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <div className="brand">
            <h1><span>Drive</span> to Earn</h1>
          </div>
          <h2>Sign in</h2>
          <p className="auth-sub">Access your dashboard as admin or driver.</p>
          {reason === 'apply' && (
            <div className="auth-notice">
              <i className="fas fa-lock" /> Sign in or register to apply for the selected vehicle.
            </div>
          )}
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error && (
              <div className="auth-error-box">
                <i className="fas fa-circle-exclamation" /> {error}
              </div>
            )}
            <button type="submit" className="btn-submit auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : (
                <>
                  Sign in <i className="fas fa-arrow-right" />
                </>
              )}
            </button>
          </form>
          <div className="auth-demo">
            <p className="auth-demo-title">Quick demo login</p>
            <div className="auth-demo-btns">
              <button type="button" onClick={() => fillDemo('admin')}>
                <i className="fas fa-user-shield" /> Admin
              </button>
              <button type="button" onClick={() => fillDemo('user')}>
                <i className="fas fa-user" /> Driver
              </button>
            </div>
          </div>
          <p className="auth-switch">
            New driver?{' '}
            <Link to={reason === 'apply' ? '/register?reason=apply' : '/register'}>Create an account</Link>
          </p>
          <Link to="/" className="auth-back">
            <i className="fas fa-arrow-left" /> Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
