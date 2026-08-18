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
    city: '',
    preferred_date: '',
    preferred_time: 'morning',
    notes: '',
  });

  useEffect(() => {
    if (!formModal.isOpen) return;
    setForm({
      customer_name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      message: '',
      city: '',
      preferred_date: '',
      preferred_time: 'morning',
      notes: '',
    });
  }, [formModal.isOpen, user]);

  if (!formModal.isOpen) return null;

  const vehicle = formModal.vehicle;
  const isInquiry = formModal.mode === 'inquiry';

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const base = {
        customer_name: form.customer_name,
        phone: form.phone,
        email: form.email || undefined,
        vehicle_key: vehicle?.key,
        vehicle_name: vehicle?.name,
        source: formModal.source,
      };
      if (isInquiry) {
        await createInquiry({ ...base, message: form.message || undefined, inquiry_type: 'info' });
        showToast('✅ Info request submitted');
      } else {
        await createApplication({
          ...base,
          application_type: formModal.applicationType || 'testdrive',
          city: form.city || undefined,
          preferred_date: form.preferred_date || undefined,
          preferred_time: form.preferred_time || undefined,
          notes: form.notes || undefined,
        });
        showToast('✅ Test drive request submitted');
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
        <button type="button" className="close-btn" onClick={closeFormModal} aria-label="Close">
          ✕ Close
        </button>
        <h2>{formModal.title}</h2>
        {formModal.meta && <p className="modal-meta">{formModal.meta}</p>}
        {vehicle && (
          <p className="form-appliance-tag">
            {vehicle.name}
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
              Your question
              <textarea name="message" rows={3} value={form.message} onChange={onChange} />
            </label>
          ) : (
            <>
              <label>
                City
                <input name="city" value={form.city} onChange={onChange} placeholder="Karachi, Lahore…" />
              </label>
              <label>
                Preferred date
                <input name="preferred_date" type="date" value={form.preferred_date} onChange={onChange} />
              </label>
              <label>
                Preferred time
                <select name="preferred_time" value={form.preferred_time} onChange={onChange}>
                  <option value="morning">Morning (9AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 4PM)</option>
                  <option value="evening">Evening (4PM - 7PM)</option>
                </select>
              </label>
              <label>
                Notes
                <textarea name="notes" rows={3} value={form.notes} onChange={onChange} />
              </label>
            </>
          )}
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Submitting…' : isInquiry ? 'Send request' : 'Book test drive'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
