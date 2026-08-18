import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolvePostAuthPath } from '../utils/authRedirect';
import { clearPendingAction } from '../utils/pendingAction';

const RegisterPage = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reason !== 'apply') clearPendingAction();
  }, [reason]);

  useEffect(() => {
    if (!user) return;
    navigate(resolvePostAuthPath(searchParams), { replace: true });
  }, [user, navigate, searchParams]);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      navigate(resolvePostAuthPath(searchParams), { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Registration failed';
      setError(typeof msg === 'string' ? msg : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell portal-drive2earn layout-d2e-auth">
      <div className="d2e-auth-stack">
        <Link to="/" className="d2e-auth-home">
          <i className="fas fa-arrow-left" /> Public site
        </Link>
        <p className="d2e-kicker">New driver</p>
        <h1 className="d2e-auth-title">
          <span>Drive</span> to Earn
        </h1>
        <p className="d2e-auth-lead">Create a profile to save estimates and submit vehicle access applications.</p>

        <div className="d2e-phone d2e-phone-wide">
          <div className="d2e-phone-notch" />
          <h2>Register</h2>
          <p className="auth-sub">Demo account — not credit approval.</p>
          {reason === 'apply' && (
            <div className="auth-notice">
              <i className="fas fa-lock" /> After registering you can complete your vehicle application.
            </div>
          )}
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Full name
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={onChange} required />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={onChange} />
            </label>
            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={onChange} required />
            </label>
            <label>
              Confirm password
              <input name="confirm" type="password" value={form.confirm} onChange={onChange} required />
            </label>
            {error && (
              <div className="auth-error-box">
                <i className="fas fa-circle-exclamation" /> {error}
              </div>
            )}
            <button type="submit" className="btn-submit auth-submit" disabled={loading}>
              {loading ? 'Creating…' : (
                <>
                  Create account <i className="fas fa-arrow-right" />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account?{' '}
            <Link to={reason === 'apply' ? '/login?reason=apply' : '/login'}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
