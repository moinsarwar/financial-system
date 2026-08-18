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
    if (reason !== 'testdrive') clearPendingAction();
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
      const dest = resolvePostAuthPath(searchParams);
      await login(email.trim(), password);
      navigate(dest, { replace: true });
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@autocompare.pk');
      setPassword('admin123');
    } else {
      setEmail('user@autocompare.pk');
      setPassword('user123');
    }
  };

  return (
    <div className="auth-shell portal-autocompare layout-ac-auth">
      <section className="ac-auth-stage">
        <div className="ac-auth-stage-inner">
          <p className="ac-auth-kicker">Dealer console</p>
          <h2>Showroom ops for inquiries &amp; test drives</h2>
          <p>Buyers request vehicle info and book drives. Admins work the queue from a dark ops rail.</p>
          <div className="ac-auth-tiles">
            <article>
              <i className="fas fa-envelope-open-text" />
              <strong>Info requests</strong>
              <span>Lead capture from the catalog</span>
            </article>
            <article>
              <i className="fas fa-key" />
              <strong>Test drives</strong>
              <span>Bookings with date &amp; time</span>
            </article>
            <article>
              <i className="fas fa-gauge-high" />
              <strong>Status board</strong>
              <span>Admin follow-up in one table</span>
            </article>
          </div>
        </div>
      </section>

      <aside className="ac-auth-rail">
        <div className="brand">
          <i className="fas fa-car-side" />
          <h1>
            AutoCompare <small>PK</small>
          </h1>
        </div>
        <h2>Staff sign-in</h2>
        <p className="auth-sub">Access the showroom dashboard as admin or buyer.</p>
        {reason === 'testdrive' && (
          <div className="auth-notice">
            <i className="fas fa-lock" /> Sign in or register to book a test drive for the selected vehicle.
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
                Enter console <i className="fas fa-arrow-right" />
              </>
            )}
          </button>
        </form>
        <div className="auth-demo">
          <p className="auth-demo-title">Demo keys</p>
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
          New here?{' '}
          <Link to={reason === 'testdrive' ? '/register?reason=testdrive' : '/register'}>Create an account</Link>
        </p>
        <Link to="/" className="auth-back">
          <i className="fas fa-arrow-left" /> Back to public site
        </Link>
      </aside>
    </div>
  );
};

export default LoginPage;
