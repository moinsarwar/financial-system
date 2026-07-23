import React, { useState } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Toast from '../Common/Toast';

const SignupForm = () => {
  const { loginAsReseller } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    subdomain: '',
    marketFocus: 'all',
    termsCheck: false
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsCheck) return;
    
    setLoading(true);
    try {
      const payload = {
        name: formData.fullName,
        business_name: formData.businessName || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        subdomain: formData.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        market_focus: formData.marketFocus
      };
      
      const response = await apiClient.post('/resellers', payload);
      const newReseller = response.data;
      
      showToast(`✅ Application submitted! Welcome, ${newReseller.name}.`, 'success');
      
      // Auto login and redirect
      setTimeout(() => {
        loginAsReseller(newReseller);
        window.location.href = `/owner/${newReseller.id}`;
      }, 1500);

    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create account.', 'error');
      setLoading(false);
    }
  };

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
          <div className="hint">🔗 Your site will be available at <strong>{(formData.subdomain || 'yourbrand').toLowerCase().replace(/[^a-z0-9-]/g, '')}.compareengine.pk</strong></div>
        </div>
        <div className="form-group">
          <label htmlFor="marketFocus">Primary Product Focus</label>
          <select id="marketFocus" value={formData.marketFocus} onChange={handleChange}>
            <option value="all">All Categories</option>
            <option value="personal">Personal Loans</option>
            <option value="mortgage">Home Loans</option>
            <option value="auto">Car Loans</option>
            <option value="insurance">Insurance</option>
            <option value="health">Health</option>
            <option value="credit">Credit Cards</option>
          </select>
        </div>
        <div className="checkbox-group">
          <input type="checkbox" id="termsCheck" required checked={formData.termsCheck} onChange={handleChange} />
          <label htmlFor="termsCheck">
            I agree to the <a href="#" onClick={(e) => { e.preventDefault(); alert('Agreement Modal Placeholder'); }}>Reseller Agreement</a> and confirm that I am a single account holder.
          </label>
        </div>
        
        <button type="submit" className="btn btn-primary" style={{width: '100%', padding: '14px', fontSize: '1.1rem'}} disabled={loading}>
          {loading ? 'Creating Account...' : 'Submit Application'}
        </button>
      </form>
      
      {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />}
    </div>
  );
};

export default SignupForm;
