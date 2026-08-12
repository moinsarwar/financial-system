import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import type { AuthResponse } from '../api/auth';

interface InvitePreview {
  email: string;
  name: string;
  valid: boolean;
}

export const SetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
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
        const { data } = await api.get<InvitePreview>(
          `/auth/invite/${encodeURIComponent(token)}`,
        );
        if (!cancelled) setPreview(data);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Invalid or expired invite link.');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const { data } = await api.post<AuthResponse>('/auth/set-password', {
        token,
        password,
      });
      const userData = {
        id: data.user_id,
        full_name: data.full_name,
        email: preview?.email || '',
        role: data.role,
        client_id: data.client_id,
      };
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Password saved — welcome!');
      window.location.assign('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Could not set password.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md border-t-4 border-accent p-8">
        <h1 className="text-2xl font-extrabold text-primary">FinOS</h1>
        <p className="text-gray-400 mb-6">Set your password</p>
        {preview && (
          <p className="text-sm text-gray-600 mb-4">
            Welcome, <strong>{preview.name}</strong>
            <br />
            <span className="text-gray-400">{preview.email}</span>
          </p>
        )}
        {checking && <p className="text-center text-gray-500">Checking invite…</p>}
        {error && <div className="text-danger text-sm mb-4">{error}</div>}
        {!checking && preview?.valid && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
                minLength={8}
              />
            </div>
            <div className="mb-6">
              <label className="form-label">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="form-input"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-full font-bold hover:bg-primary-light transition disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save password & continue'}
            </button>
          </form>
        )}
        {!checking && !preview?.valid && !error && (
          <p className="text-gray-500">This invite is not valid.</p>
        )}
        {!checking && error && !preview?.valid && (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 text-sm text-accent underline"
          >
            Go to login
          </button>
        )}
      </div>
    </div>
  );
};
