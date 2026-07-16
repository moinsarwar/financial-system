import React, { useState } from 'react';  
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  
import { getClients, createClient } from '../api/clients';  
import { useAuth } from '../contexts/AuthContext';  
import { useSearchParams, useNavigate } from 'react-router-dom';  
import { Table } from '../components/common/Table';  
import { Badge } from '../components/common/Badge';  
import { SearchFilterBar } from '../components/common/SearchFilterBar';  
import { Modal } from '../components/common/Modal';  
import { can } from '../utils/permissions';  
import toast from 'react-hot-toast';  
  
export const Clients: React.FC = () => {  
  const { user } = useAuth();  
  const queryClient = useQueryClient();  
  const [searchParams] = useSearchParams();  
  const navigate = useNavigate();  
  const [search, setSearch] = useState('');  
  const [stage, setStage] = useState(searchParams.get('stage') || 'all');  
  const [isModalOpen, setIsModalOpen] = useState(false);  
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', assigned_department: '' });  
  
  const { data, isLoading } = useQuery({  
    queryKey: ['clients', { search, stage }],  
    queryFn: () => getClients({ search: search || undefined, stage: stage === 'all' ? undefined : stage }),  
  });  
  
  const create = useMutation({  
    mutationFn: createClient,  
    onSuccess: () => { toast.success('Client created'); queryClient.invalidateQueries({ queryKey: ['clients'] }); setIsModalOpen(false); },  
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed')  
  });  
  
  const columns = [  
    { key: 'id', header: 'ID' },  
    { key: 'name', header: 'Name' },  
    { key: 'email', header: 'Email' },  
    { key: 'phone', header: 'Phone' },  
    { key: 'lifecycle_stage', header: 'Stage', render: (v: string) => <Badge type={v}>{v}</Badge> },  
    { key: 'has_open_claim', header: 'Open Claim', render: (v: boolean) => v ? '⚠️ Yes' : '✅ No' },  
    { key: 'actions', header: 'Actions', render: (_: any, row: any) => <button className="btn-sm primary" onClick={() => navigate(`/dashboard/clients/${row.id}`)}>View</button> },  
  ];  
  
  return (  
    <div>  
      <div className="flex justify-between items-center mb-4">  
        <SearchFilterBar search={search} onSearchChange={setSearch} filters={[{ key: 'stage', label: 'Stage', options: ['all','lead','applicant','customer'], value: stage, onChange: setStage }]} />  
        {can(user?.role, 'client.create') && <button className="btn-sm primary" onClick={() => setIsModalOpen(true)}>➕ New Client</button>}  
      </div>  
      <Table columns={columns} data={data || []} loading={isLoading} />  
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Client" onSave={() => create.mutate(newClient)} loading={create.isPending}>  
        <div className="space-y-3">  
          <div><label className="form-label">Name *</label><input className="form-input" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} /></div>  
          <div><label className="form-label">Email *</label><input className="form-input" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} /></div>  
          <div><label className="form-label">Phone</label><input className="form-input" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} /></div>  
          <div><label className="form-label">Department *</label><select className="form-input" value={newClient.assigned_department} onChange={e => setNewClient({...newClient, assigned_department: e.target.value})}>  
            <option value="">Select</option>  
            <option value="lending">Lending</option><option value="motor">Motor</option><option value="health">Health</option>  
            <option value="life">Life</option><option value="retail">Retail</option><option value="commercial">Commercial</option><option value="travel">Travel</option>  
          </select></div>  
        </div>  
      </Modal>  
    </div>  
  );  
};
