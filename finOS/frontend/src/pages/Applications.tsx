import React, { useState, useEffect } from 'react';  
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  
import { getApplications, advanceApplication, Application, createApplication } from '../api/applications';  
import { getClients } from '../api/clients';  
import { useAuth } from '../contexts/AuthContext';  
import { useSearchParams, useNavigate } from 'react-router-dom';  
import { Table } from '../components/common/Table';  
import { Badge } from '../components/common/Badge';  
import { SearchFilterBar } from '../components/common/SearchFilterBar';  
import { Modal } from '../components/common/Modal';  
import { can } from '../utils/permissions';  
import toast from 'react-hot-toast';  
  
export const Applications: React.FC = () => {  
  const { user } = useAuth();  
  const queryClient = useQueryClient();  
  const [searchParams, setSearchParams] = useSearchParams();  
  const navigate = useNavigate();  
  const [search, setSearch] = useState('');  
  const [step, setStep] = useState(searchParams.get('step') || 'all');  
  const department = searchParams.get('department') || 'all';  
  const status = searchParams.get('status') || 'all';  
  const [isModalOpen, setIsModalOpen] = useState(false);  
  const [newApp, setNewApp] = useState({ client_id: '', product_type: 'loan', amount: 10000 });  
  
  // Fetch clients for dropdown  
  const { data: clientData = [] } = useQuery({  
    queryKey: ['clients-list'],  
    queryFn: () => getClients({}),  
  });  
  const clients = clientData.map((c: any) => ({ id: c.id, name: c.name }));  
  
  const { data, isLoading } = useQuery({  
    queryKey: ['applications', { search, step, department, status }],  
    queryFn: () => getApplications({  
      search: search || undefined,  
      step: step === 'all' ? undefined : step,  
      department: department === 'all' ? undefined : department,  
      status: status === 'all' ? undefined : status,  
    }),  
  });  
  
  const advance = useMutation({  
    mutationFn: advanceApplication,  
    onSuccess: () => {  
      toast.success('Application advanced');  
      queryClient.invalidateQueries({ queryKey: ['applications'] });  
    },  
    onError: (err: any) => {  
      toast.error(err.response?.data?.detail || 'Advance failed');  
    },  
  });  
  
  const createAppMut = useMutation({  
    mutationFn: createApplication,  
    onSuccess: () => {  
      toast.success('Application created');  
      queryClient.invalidateQueries({ queryKey: ['applications'] });  
      setIsModalOpen(false);  
      setNewApp({ client_id: '', product_type: 'loan', amount: 10000 });  
    },  
    onError: (err: any) => {  
      toast.error(err.response?.data?.detail || 'Failed to create application');  
    },  
  });  
  
  const columns = [  
    { key: 'id', header: 'ID' },  
    { key: 'product_label', header: 'Product' },  
    { key: 'department', header: 'Dept' },  
    {  
      key: 'current_step',  
      header: 'Step',  
      render: (v: string) => <Badge type="in-progress">{v}</Badge>,  
    },  
    {  
      key: 'status',  
      header: 'Status',  
      render: (v: string) => <Badge type={v}>{v}</Badge>,  
    },  
    {  
      key: 'amount',  
      header: 'Amount',  
      render: (v: number) => `PKR ${v.toLocaleString()}`,  
    },  
    {  
      key: 'actions',  
      header: 'Actions',  
      render: (_: any, row: Application) => (  
        <div className="flex gap-2">  
          <button  
            className="btn-sm primary"  
            onClick={() => navigate(`/applications/${row.id}`)}  
          >  
            View  
          </button>  
          {can(user?.role, 'application.advance') && row.status === 'in-progress' && (  
            <button  
              className="btn-sm gold"  
              onClick={() => advance.mutate(row.id)}  
              disabled={advance.isPending && advance.variables === row.id}  
            >  
              Advance  
            </button>  
          )}  
        </div>  
      ),  
    },  
  ];  
  
  const stepOptions = [  
    'all',  
    'Selection',  
    'Payment',  
    'Submitted to Insurer',  
    'Underwriting Review',  
    'Terms Offered',  
    'Policy Issued',  
    'KYC Submitted',  
    'Credit Assessment',  
    'Approval',  
    'Disbursement',  
    'Account Opened',  
    'Card Issued',  
  ];  
  
  return (  
    <div>  
      <div className="flex justify-between items-center mb-4">  
        <SearchFilterBar  
          search={search}  
          onSearchChange={setSearch}  
          filters={[  
            {  
              key: 'step',  
              label: 'Step',  
              options: stepOptions,  
              value: step,  
              onChange: (v) => {  
                setStep(v);  
                setSearchParams(prev => {  
                  if (v === 'all') prev.delete('step');  
                  else prev.set('step', v);  
                  return prev;  
                });  
              },  
            },  
          ]}  
        />  
        {can(user?.role, 'application.create') && (  
          <button className="btn-sm primary" onClick={() => setIsModalOpen(true)}>  
            📋 New Application  
          </button>  
        )}  
      </div>  
      <Table columns={columns} data={data || []} loading={isLoading} />  
  
      <Modal  
        isOpen={isModalOpen}  
        onClose={() => setIsModalOpen(false)}  
        title="Create New Application"  
        onSave={() => {  
          const effectiveClientId = user?.role === 'client' ? user.client_id ?? '' : newApp.client_id;
          if (!effectiveClientId || !newApp.product_type) {  
            toast.error('Please select client and product');  
            return;  
          }  
          createAppMut.mutate({ ...newApp, client_id: effectiveClientId });  
        }}  
        loading={createAppMut.isPending}  
      >  
        <div className="space-y-3">  
          {user?.role !== 'client' && (
            <div className="form-group">  
              <label className="form-label">Client *</label>  
              <select  
                className="form-input"  
                value={newApp.client_id}  
                onChange={(e) => setNewApp({ ...newApp, client_id: e.target.value })}  
              >  
                <option value="">Select client</option>  
                {clients.map((c: any) => (  
                  <option key={c.id} value={c.id}>{c.name}</option>  
                ))}  
              </select>  
            </div>  
          )}
          <div className="form-group">  
            <label className="form-label">Product *</label>  
            <select  
              className="form-input"  
              value={newApp.product_type}  
              onChange={(e) => setNewApp({ ...newApp, product_type: e.target.value })}  
            >  
              <option value="loan">Loan</option>  
              <option value="motor">Motor Insurance</option>  
              <option value="health">Health Insurance</option>  
              <option value="life">Life Assurance</option>  
              <option value="savings">Savings</option>  
              <option value="credit">Credit Card</option>  
              <option value="business">Business Insurance</option>  
              <option value="travel">Travel Insurance</option>  
            </select>  
          </div>  
          <div className="form-group">  
            <label className="form-label">Amount (PKR) *</label>  
            <input  
              type="number"  
              className="form-input"  
              value={newApp.amount}  
              onChange={(e) => setNewApp({ ...newApp, amount: Number(e.target.value) })}  
            />  
          </div>  
        </div>  
      </Modal>  
    </div>  
  );  
};
