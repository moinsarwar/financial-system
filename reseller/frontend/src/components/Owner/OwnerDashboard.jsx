import React, { useState, useEffect } from 'react';  
import { useParams } from 'react-router-dom';  
import { useAuth } from '../../context/AuthContext';  
import apiClient from '../../api/client';  
import Modal from '../Common/Modal';  
import Toast from '../Common/Toast';  
import OwnerTabs from './OwnerTabs';  
import DashboardTab from './DashboardTab';  
import CustomersTab from './CustomersTab';  
import MarketingTab from './MarketingTab';  
import SettingsTab from './SettingsTab';  
import SupportTab from './SupportTab';  
  
const OwnerDashboard = () => {  
  const { id } = useParams();  
  const { currentUser } = useAuth();  
  const [reseller, setReseller] = useState(null);  
  const [loading, setLoading] = useState(true);  
  const [activeTab, setActiveTab] = useState('dashboard');  
  const [customers, setCustomers] = useState([]);  
  const [activities, setActivities] = useState([]);  
  const [testimonials, setTestimonials] = useState([]);  
  const [toast, setToast] = useState({ message: '', type: '' });  
  const [modalOpen, setModalOpen] = useState(false);  
  const [modalTitle, setModalTitle] = useState('');  
  const [modalContent, setModalContent] = useState('');  
  
  const showToast = (message, type = 'info') => {  
    setToast({ message, type });  
    setTimeout(() => setToast({ message: '', type: '' }), 4000);  
  };  
  
  const showModal = (title, content) => {  
    setModalTitle(title);  
    setModalContent(content);  
    setModalOpen(true);  
  };  
  
  const fetchData = async () => {  
    try {  
      const [resellerRes, customersRes, activitiesRes, testimonialsRes] = await Promise.all([  
        apiClient.get(`/resellers/${id}`),  
        apiClient.get(`/customers/reseller/${id}`),  
        apiClient.get(`/activities/reseller/${id}`),  
        apiClient.get(`/testimonials/reseller/${id}`),  
      ]);  
      setReseller(resellerRes.data);  
      setCustomers(customersRes.data);  
      setActivities(activitiesRes.data);  
      setTestimonials(testimonialsRes.data);  
    } catch (error) {  
      showToast('Failed to load dashboard', 'error');  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  useEffect(() => {  
    fetchData();  
  }, [id]);  
  
  // Simulated stats (you can add more API calls for real stats)  
  const stats = {  
    visits: 2410,  
    conversions: reseller?.conversions || 0,  
    commission: reseller?.commission || 0,  
    conversionRate: reseller ? ((reseller.conversions / 2410) * 100).toFixed(1) + '%' : '0%',  
  };  
  
  if (loading) return <div className="container">Loading...</div>;  
  if (!reseller) return <div className="container">Reseller not found</div>;  
  
  return (  
    <div className="container" style={{ padding: '24px 0' }}>  
      <div className="owner-header">  
        <div>  
          <h2>👋 Welcome, {reseller.name}</h2>  
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your reseller dashboard — track performance and manage your site.</p>  
        </div>  
        <div className="subdomain-box">  
          <i className="fas fa-globe"></i>  
          <span>{reseller.subdomain}.compareengine.pk</span>  
          <button className="btn btn-sm btn-secondary" style={{ padding: '2px 10px', fontSize: '0.7rem' }} onClick={() => {  
            navigator.clipboard.writeText(`${reseller.subdomain}.compareengine.pk`);  
            showToast('Subdomain copied!', 'success');  
          }}><i className="fas fa-copy"></i></button>  
        </div>  
      </div>  
  
      <OwnerTabs activeTab={activeTab} setActiveTab={setActiveTab} />  
  
      {activeTab === 'dashboard' && (  
        <DashboardTab  
          reseller={reseller}  
          stats={stats}  
          customers={customers}  
          activities={activities}  
          testimonials={testimonials}  
          onAddTestimonial={fetchData}  
          onCopyLink={() => {  
            navigator.clipboard.writeText(`https://${reseller.subdomain}.compareengine.pk?ref=owner`);  
            showToast('Referral link copied!', 'success');  
          }}  
          onShowModal={showModal}  
        />  
      )}  
      {activeTab === 'customers' && (  
        <CustomersTab customers={customers} />  
      )}  
      {activeTab === 'marketing' && (  
        <MarketingTab reseller={reseller} />  
      )}  
      {activeTab === 'settings' && (  
        <SettingsTab reseller={reseller} onUpdate={fetchData} />  
      )}  
      {activeTab === 'support' && (  
        <SupportTab />  
      )}  
  
      <Modal isOpen={modalOpen} title={modalTitle} onClose={() => setModalOpen(false)}>  
        <div dangerouslySetInnerHTML={{ __html: modalContent }} />  
      </Modal>  
      {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />}  
    </div>  
  );  
};  
  
export default OwnerDashboard;
