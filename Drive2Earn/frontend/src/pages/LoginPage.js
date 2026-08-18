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
    <div className="auth-shell portal-drive2earn layout-d2e-auth">
      <div className="d2e-auth-stack">
        <Link to="/" className="d2e-auth-home">
          <i className="fas fa-arrow-left" /> Public site
        </Link>
        <p className="d2e-kicker">Driver hub</p>
        <h1 className="d2e-auth-title">
          <span>Drive</span> to Earn
        </h1>
        <p className="d2e-auth-lead">Sign in like a mobile wallet — then track applications and estimates.</p>

        <div className="d2e-phone">
          <div className="d2e-phone-notch" />
          <h2>Sign in</h2>
          <p className="auth-sub">Admin or driver access.</p>
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
                  Open hub <i className="fas fa-arrow-right" />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            New driver?{' '}
            <Link to={reason === 'apply' ? '/register?reason=apply' : '/register'}>Create an account</Link>
          </p>
        </div>

        <div className="d2e-demo-cards">
          <button type="button" onClick={() => fillDemo('admin')}>
            <i className="fas fa-user-shield" />
            <strong>Admin demo</strong>
            <span>Review applications</span>
          </button>
          <button type="button" onClick={() => fillDemo('user')}>
            <i className="fas fa-motorcycle" />
            <strong>Driver demo</strong>
            <span>Track your pathway</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
