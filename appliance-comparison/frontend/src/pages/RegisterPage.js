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
    if (reason !== 'service') {
      clearPendingAction();
    }
  }, [reason]);

  useEffect(() => {
    if (!user) return;
    navigate(resolvePostAuthPath(searchParams), { replace: true });
  }, [user, navigate, searchParams]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
        <p className="hc-auth-kicker">New household account</p>
        <h2>Register to book delivery &amp; installation</h2>
        <p>Create a free account to request installation, delivery and service bookings for your selected appliances.</p>
      </section>

      <div className="hc-auth-card-wrap">
        <div className="auth-card">
          <h2>Create account</h2>
          <p className="auth-sub">Sign up as a customer to book installation services.</p>

          <form onSubmit={handleSubmit} className="auth-form hc-auth-grid">
            <label>
              Full name
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              Email address
              <input name="email" type="email" value={form.email} onChange={onChange} required />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={onChange} placeholder="03xx-xxxxxxx" />
            </label>
            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={onChange} required />
            </label>
            <label className="hc-span-2">
              Confirm password
              <input name="confirm" type="password" value={form.confirm} onChange={onChange} required />
            </label>
            {error && (
              <div className="auth-error-box hc-span-2">
                <i className="fas fa-circle-exclamation" /> {error}
              </div>
            )}
            <button type="submit" className="compare-btn auth-submit hc-span-2" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to={reason === 'service' ? '/login?reason=service' : '/login'}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
