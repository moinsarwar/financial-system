import React, { useState, useEffect } from 'react';  
import { useAuth } from '../../context/AuthContext';  
import apiClient from '../../api/client';  
import Modal from '../Common/Modal';  
import Toast from '../Common/Toast';  
  
const AdminDashboard = () => {  
  const { loginAsReseller, logout } = useAuth();  
  const [stats, setStats] = useState({  
    total_resellers: 0,  
    active_resellers: 0,  
    pending_resellers: 0,  
    total_conversions: 0,  
    total_commission: 0,  
  });  
  const [resellers, setResellers] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [modalOpen, setModalOpen] = useState(false);  
  const [modalTitle, setModalTitle] = useState('');  
  const [modalContent, setModalContent] = useState('');  
  const [toast, setToast] = useState({ message: '', type: '' });  
  
  const fetchData = async () => {  
    try {  
      const [statsRes, resellersRes] = await Promise.all([  
        apiClient.get('/resellers/stats'),  
        apiClient.get('/resellers'),  
      ]);  
      setStats(statsRes.data);  
      setResellers(resellersRes.data);  
    } catch (error) {  
      showToast('Failed to load data', 'error');  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  useEffect(() => {  
    fetchData();  
  }, []);  
  
  const showToast = (message, type = 'info') => {  
    setToast({ message, type });  
    setTimeout(() => setToast({ message: '', type: '' }), 4000);  
  };  
  
  const showModal = (title, content) => {  
    setModalTitle(title);  
    setModalContent(content);  
    setModalOpen(true);  
  };  
  
  const handleViewReseller = (reseller) => {  
    const content = (  
      <div>  
        <div className="detail-row"><span className="label">Name</span><span>{reseller.name}</span></div>  
        <div className="detail-row"><span className="label">Business</span><span>{reseller.business_name || 'N/A'}</span></div>  
        <div className="detail-row"><span className="label">Subdomain</span><span>{reseller.subdomain}.compareengine.pk</span></div>  
        <div className="detail-row"><span className="label">Email</span><span>{reseller.email}</span></div>  
        <div className="detail-row"><span className="label">Status</span><span className={`status-badge ${reseller.status}`}>{reseller.status}</span></div>  
        <div className="detail-row"><span className="label">Conversions</span><span>{reseller.conversions}</span></div>  
        <div className="detail-row"><span className="label">Commission</span><span className="value green">₨ {reseller.commission.toLocaleString()}</span></div>  
        <button className="btn btn-primary mt-16" onClick={() => {  
          loginAsReseller(reseller);  
          window.location.href = `/owner/${reseller.id}`;  
        }}>Impersonate</button>  
      </div>  
    );  
    showModal(`Reseller: ${reseller.name}`, content);  
  };  
  
  const handleApprove = async (id) => {  
    try {  
      await apiClient.put(`/resellers/${id}`, { status: 'active' });  
      showToast('Reseller approved!', 'success');  
      fetchData();  
    } catch (error) {  
      showToast('Failed to approve', 'error');  
    }  
  };  
  
  if (loading) return <div className="container">Loading...</div>;  
  
  return (  
    <div className="container" style={{ padding: '24px 0' }}>  
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>  
        <div>  
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Admin Dashboard</h2>  
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage all resellers and monitor platform health.</p>  
        </div>  
        <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/'}><i className="fas fa-arrow-left"></i> Back</button>  
      </div>  
  
      <div className="admin-stats">  
        <div className="stat-card" onClick={() => {  
          const list = resellers.map(r => `${r.name} (${r.status})`).join(', ');  
          showModal('All Resellers', list || 'No resellers');  
        }}>  
          <div className="num">{stats.total_resellers}</div>  
          <div className="label">Total Resellers</div>  
        </div>  
        <div className="stat-card" onClick={() => {  
          const active = resellers.filter(r => r.status === 'active').map(r => r.name).join(', ');  
          showModal('Active Resellers', active || 'None');  
        }}>  
          <div className="num green">{stats.active_resellers}</div>  
          <div className="label">Active</div>  
        </div>  
        <div className="stat-card" onClick={() => {  
          const pending = resellers.filter(r => r.status === 'pending').map(r => r.name).join(', ');  
          showModal('Pending Approval', pending || 'None');  
        }}>  
          <div className="num gold">{stats.pending_resellers}</div>  
          <div className="label">Pending</div>  
        </div>  
        <div className="stat-card" onClick={() => showModal('Total Conversions (30d)', `All resellers: ${stats.total_conversions}`)}>  
          <div className="num">{stats.total_conversions}</div>  
          <div className="label">Conversions</div>  
        </div>  
        <div className="stat-card" onClick={() => showModal('Commissions Paid (30d)', `Total: ₨ ${stats.total_commission.toLocaleString()}`)}>  
          <div className="num green">₨ {stats.total_commission.toLocaleString()}</div>  
          <div className="label">Commissions</div>  
        </div>  
      </div>  
  
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', margin: '12px 0 8px' }}>  
        <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>All Resellers</h3>  
        <button className="btn btn-success btn-sm" onClick={() => showToast('New reseller invitation sent (simulated)', 'success')}>  
          <i className="fas fa-user-plus"></i> Invite  
        </button>  
      </div>  
  
      <div className="table-wrap">  
        <table>  
          <thead>  
            <tr><th>Reseller</th><th>Subdomain</th><th>Status</th><th>Conversions</th><th>Commission</th><th>Action</th></tr>  
          </thead>  
          <tbody>  
            {resellers.map(r => (  
              <tr key={r.id}>  
                <td><strong>{r.name}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.business_name || 'Independent'}</span></td>  
                <td><code style={{ background: 'var(--bg)', padding: '1px 8px', borderRadius: '4px' }}>{r.subdomain}.compareengine.pk</code></td>  
                <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>  
                <td>{r.conversions}</td>  
                <td>₨ {r.commission.toLocaleString()}</td>  
                <td>  
                  <button className="btn btn-xs btn-secondary" onClick={() => handleViewReseller(r)}><i className="fas fa-eye"></i></button>  
                  {r.status === 'pending' && (  
                    <button className="btn btn-xs" style={{ background: '#d4edda', color: '#0a613a', border: 'none' }} onClick={() => handleApprove(r.id)}><i className="fas fa-check"></i></button>  
                  )}  
                </td>  
              </tr>  
            ))}  
          </tbody>  
        </table>  
      </div>  
  
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>  
        <button className="btn btn-secondary btn-sm" onClick={() => showToast('Commission report generated (simulated)', 'success')}><i className="fas fa-file-invoice"></i> Report</button>  
        <button className="btn btn-secondary btn-sm" onClick={() => showToast('All reseller data exported (simulated)', 'success')}><i className="fas fa-download"></i> Export</button>  
        <button className="btn btn-secondary btn-sm" onClick={() => showToast('Platform settings updated (simulated)', 'success')}><i className="fas fa-cog"></i> Settings</button>  
      </div>  
  
      <Modal isOpen={modalOpen} title={modalTitle} onClose={() => setModalOpen(false)}>  
        <div dangerouslySetInnerHTML={{ __html: modalContent }} />  
      </Modal>  
  
      {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />}  
    </div>  
  );  
};  
  
export default AdminDashboard;
