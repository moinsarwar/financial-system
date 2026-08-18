import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { createApplication, createInquiry } from '../api/client';

const FormModal = () => {
  const { formModal, closeFormModal, showToast } = useContext(AppContext);
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    message: '',
    address: '',
    preferred_date: '',
    notes: '',
  });

  useEffect(() => {
    if (!formModal.isOpen) return;
    setForm({
      customer_name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      message: '',
      address: '',
      preferred_date: '',
      notes: '',
    });
  }, [formModal.isOpen, user]);

  if (!formModal.isOpen) return null;

  const appliance = formModal.appliance;
  const isInquiry = formModal.mode === 'inquiry';

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const base = {
        customer_name: form.customer_name,
        phone: form.phone,
        email: form.email || undefined,
        appliance_key: appliance?.key,
        appliance_name: appliance?.name,
        source: formModal.source,
      };
      if (isInquiry) {
        await createInquiry({
          ...base,
          message: form.message || undefined,
          inquiry_type: 'info',
        });
        showToast('✅ Info request submitted successfully');
      } else {
        await createApplication({
          ...base,
          application_type: formModal.applicationType,
          address: form.address || undefined,
          preferred_date: form.preferred_date || undefined,
          notes: form.notes || form.message || undefined,
        });
        showToast('✅ Application submitted successfully');
      }
      closeFormModal();
    } catch (err) {
      console.error(err);
      showToast('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={closeFormModal} role="presentation">
      <div className="modal-box form-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{formModal.title}</h2>
          <button type="button" className="close-btn" onClick={closeFormModal} aria-label="Close">
            ×
          </button>
        </div>
        {formModal.meta && <p className="modal-meta">{formModal.meta}</p>}
        {appliance && (
          <p className="form-appliance-tag">
            {appliance.logo || '🔌'} {appliance.name}
          </p>
        )}
        <form className="request-form" onSubmit={handleSubmit}>
          <label>
            Full name *
            <input name="customer_name" required value={form.customer_name} onChange={onChange} />
          </label>
          <label>
            Phone *
            <input name="phone" required value={form.phone} onChange={onChange} />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={onChange} />
          </label>
          {isInquiry ? (
            <label>
              Message
              <textarea name="message" rows={3} value={form.message} onChange={onChange} />
            </label>
          ) : (
            <>
              <label>
                Address
                <input name="address" value={form.address} onChange={onChange} />
              </label>
              <label>
                Preferred date
                <input name="preferred_date" type="date" value={form.preferred_date} onChange={onChange} />
              </label>
              <label>
                Notes
                <textarea name="notes" rows={3} value={form.notes} onChange={onChange} />
              </label>
            </>
          )}
          <button type="submit" className="action-btn" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
