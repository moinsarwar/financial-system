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
    if (reason !== 'testdrive') clearPendingAction();
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
      const dest = resolvePostAuthPath(searchParams);
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Registration failed';
      setError(typeof msg === 'string' ? msg : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell portal-autocompare layout-ac-auth">
      <section className="ac-auth-stage">
        <div className="ac-auth-stage-inner">
          <p className="ac-auth-kicker">Buyer profile</p>
          <h2>Create your AutoCompare account</h2>
          <p>Save info requests and book a test drive after you sign in. This is a demo account — not a dealer booking.</p>
        </div>
      </section>
      <aside className="ac-auth-rail">
        <div className="brand">
          <i className="fas fa-car-side" />
          <h1>
            AutoCompare <small>PK</small>
          </h1>
        </div>
        <h2>Register</h2>
        <p className="auth-sub">Open a buyer console account.</p>
        {reason === 'testdrive' && (
          <div className="auth-notice">
            <i className="fas fa-lock" /> After registering you can complete your test-drive request.
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
          <Link to={reason === 'testdrive' ? '/login?reason=testdrive' : '/login'}>Sign in</Link>
        </p>
        <Link to="/" className="auth-back">
          <i className="fas fa-arrow-left" /> Back to public site
        </Link>
      </aside>
    </div>
  );
};

export default RegisterPage;
