import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { login } = useAuth();
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setError('Missing invite token.');
        setChecking(false);
        return;
      }
      try {
        const { data } = await apiClient.get(`/auth/invite/${encodeURIComponent(token)}`);
        if (!cancelled) setPreview(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Invalid or expired invite link.');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/set-password', { token, password });
      login(data.access_token, data.user);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(`/owner/${data.user.reseller_id || ''}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not set password.');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80, marginBottom: 80 }}>
      <div className="card" style={{ padding: 28, boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Set your password</h2>
        {preview && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 20 }}>
            Welcome, <strong>{preview.name}</strong><br />
            <span style={{ fontSize: '0.9rem' }}>{preview.email}</span>
          </p>
        )}
        {checking && <p style={{ textAlign: 'center' }}>Checking invite…</p>}
        {error && (
          <div style={{ color: '#b91c1c', marginBottom: 16, fontSize: '0.95rem' }}>{error}</div>
        )}
        {!checking && preview?.valid && (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: 10, marginTop: 6 }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: 10, marginTop: 6 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving…' : 'Save password & continue'}
            </button>
          </form>
        )}
        {!checking && !preview?.valid && !error && (
          <p>This invite is not valid.</p>
        )}
      </div>
    </div>
  );
};

export default SetPassword;
