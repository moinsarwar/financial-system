import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Toast from '../Common/Toast';
import { getResellerSiteUrl } from '../../utils/resellerSiteUrl';
import {
  FINOS_CATEGORIES,
  encodeCategories,
  fetchMarketplaceCategories,
} from '../../utils/categories';

const SignupForm = () => {
  const [categories, setCategories] = useState(FINOS_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    subdomain: '',
    categories: [],
    termsCheck: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const previewSubdomain = (formData.subdomain || 'yourbrand').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const allIds = categories.map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => formData.categories.includes(id));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchMarketplaceCategories(apiClient);
        if (cancelled) return;
        setCategories(list);
        // Default: no categories selected
        setFormData((prev) => ({
          ...prev,
          categories: [],
        }));
      } catch (err) {
        console.warn('Failed to load categories, using defaults', err);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleCategory = (id) => {
    setFormData((prev) => {
      const has = prev.categories.includes(id);
      const next = has
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id];
      return { ...prev, categories: next };
    });
  };

  const toggleSelectAllCategories = () => {
    setFormData((prev) => ({
      ...prev,
      categories: allSelected ? [] : [...allIds],
    }));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsCheck) return;
    if (!formData.categories.length) {
      showToast('Select at least one product category.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.fullName,
        business_name: formData.businessName || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        subdomain: formData.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        market_focus: encodeCategories(formData.categories, allIds),
      };

      const response = await apiClient.post('/resellers/', payload);
      const newReseller = response.data;

      setSubmitted(true);
      showToast(
        `Application received. After admin approval we will email ${newReseller.email} a link to set your password.`,
        'success',
      );
      setLoading(false);
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create account.', 'error');
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="signup-section" id="signupForm">
        <h2>Application submitted</h2>
        <p className="sub">
          Thanks — your reseller request is <strong>pending approval</strong>.
          Once an admin approves you, check your email for a secure <strong>Set password</strong> link,
          then sign in at <a href="/login">Login</a>.
        </p>
        {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />}
      </div>
    );
  }

  return (
    <div className="signup-section" id="signupForm">
      <h2>🚀 Start Your Reseller Journey</h2>
      <p className="sub">Join today — no fees, no commitment. Get approved within 24 hours.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input type="text" id="fullName" placeholder="e.g. Ahmed Khan" required value={formData.fullName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="businessName">Business Name</label>
            <input type="text" id="businessName" placeholder="e.g. FinCompare Pvt Ltd" value={formData.businessName} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input type="email" id="email" placeholder="ahmed@example.com" required value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone (Pakistan)</label>
            <input type="tel" id="phone" placeholder="03XX-XXXXXXX" value={formData.phone} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="subdomain">Your Subdomain *</label>
          <input type="text" id="subdomain" placeholder="yourbrand" required value={formData.subdomain} onChange={handleChange} />
          <div className="hint">🔗 Your site will be available at <strong>{getResellerSiteUrl(previewSubdomain, { withProtocol: false })}</strong></div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
            <label style={{ margin: 0 }}>
              Product Categories *{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                (live from FinOS{categoriesLoading ? ' · loading…' : ''})
              </span>
            </label>
            <button type="button" className="btn btn-secondary btn-sm" onClick={toggleSelectAllCategories} disabled={categoriesLoading || !allIds.length}>
              {allSelected ? 'Unselect all' : 'Select all'}
            </button>
          </div>
          <div className="category-multi-grid">
            {categories.map((cat) => {
              const selected = formData.categories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-multi-card${selected ? ' selected' : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                  aria-pressed={selected}
                  disabled={categoriesLoading}
                >
                  <span className="icon">{cat.icon || '📦'}</span>
                  <span className="label">{cat.label}</span>
                  {typeof cat.product_count === 'number' && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cat.product_count} products</span>
                  )}
                  <span className="check">{selected ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>
          <div className="hint">Customers on your subdomain will only see these categories on FinOS.</div>
        </div>

        <div className="checkbox-group">
          <input type="checkbox" id="termsCheck" required checked={formData.termsCheck} onChange={handleChange} />
          <label htmlFor="termsCheck">
            I agree to the <a href="#" onClick={(e) => { e.preventDefault(); alert('Agreement Modal Placeholder'); }}>Reseller Agreement</a> and confirm that I am a single account holder.
          </label>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }} disabled={loading}>
          {loading ? 'Creating Account...' : 'Submit Application'}
        </button>
      </form>

      {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />}
    </div>
  );
};

export default SignupForm;
