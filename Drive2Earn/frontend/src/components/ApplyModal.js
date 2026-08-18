import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const ApplyModal = () => {
  const { user } = useAuth();
  const { applyOpen, setApplyOpen, selected, price, deposit, mode, submitApplication, showToast } = useApp();
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!applyOpen || !user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      phone: prev.phone || user.phone || '',
      email: prev.email || user.email || '',
    }));
  }, [applyOpen, user]);

  if (!applyOpen) return null;

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required');
      return;
    }
    setBusy(true);
    try {
      await submitApplication(form);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || 'Could not submit application';
      setError(typeof msg === 'string' ? msg : 'Could not submit application');
      showToast('Application failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={() => setApplyOpen(false)}>
      <div className="apply-modal" onClick={(e) => e.stopPropagation()}>
        <div className="apply-modal-head">
          <h3>
            <i className="fas fa-file-signature" /> Apply for vehicle access
          </h3>
          <button type="button" className="apply-close" onClick={() => setApplyOpen(false)} aria-label="Close">
            ×
          </button>
        </div>
        <p className="apply-lead">
          {selected?.icon} {selected?.label} · {mode === 'fleet' ? 'Fleet pathway' : 'I Drive'} · PKR{' '}
          {Number(price).toLocaleString()} · deposit PKR {Number(deposit).toLocaleString()}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={onChange} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={onChange} />
          </label>
          <label>
            City
            <input name="city" value={form.city} onChange={onChange} placeholder="Karachi, Lahore…" />
          </label>
          <label>
            Notes
            <textarea name="notes" value={form.notes} onChange={onChange} rows={3} placeholder="Licence, preferred start date…" />
          </label>
          {error && (
            <div className="auth-error-box">
              <i className="fas fa-circle-exclamation" /> {error}
            </div>
          )}
          <button type="submit" className="btn-submit" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplyModal;
