import React, { useState } from 'react';  
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  
import { getClaims, advanceClaim, resolveClaim, Claim, createClaim } from '../api/claims';  
import { getClients } from '../api/clients';  
import { getProducts } from '../api/products';  
import { useAuth } from '../contexts/AuthContext';  
import { useSearchParams, useNavigate } from 'react-router-dom';  
import { Table } from '../components/common/Table';  
import { Badge } from '../components/common/Badge';  
import { SearchFilterBar } from '../components/common/SearchFilterBar';  
import { Modal } from '../components/common/Modal';  
import { can } from '../utils/permissions';  
import toast from 'react-hot-toast';  
  
export const Claims: React.FC = () => {  
  const { user } = useAuth();  
  const queryClient = useQueryClient();  
  const [searchParams] = useSearchParams();  
  const navigate = useNavigate();  
  const [search, setSearch] = useState('');  
  const [step, setStep] = useState(searchParams.get('step') || 'all');  
  const department = searchParams.get('department') || 'all';  
  const openOnly = searchParams.get('open_only') === 'true';  
  const [isModalOpen, setIsModalOpen] = useState(false);  
  const [newClaim, setNewClaim] = useState({  
    client_id: '',  
    policy_id: '',  
    type: '',  
    amount: 0,  
    description: '',  
  });  
  
  // Fetch clients  
  const { data: clientData = [] } = useQuery({  
    queryKey: ['clients-list'],  
    queryFn: () => getClients({}),  
  });  
  const clients = clientData.map((c: any) => ({ id: c.id, name: c.name }));  
  
  // Fetch products for policy selector (only when modal is open)  
  const { data: productData = [] } = useQuery({  
    queryKey: ['active-products-for-claim', newClaim.client_id],  
    queryFn: () => getProducts({ status: 'active' }),  
    enabled: isModalOpen,  
  });  
  const policies = productData  
    .filter((p: any) => p.client_id === newClaim.client_id && p.policy_number)  
    .map((p: any) => ({ id: p.id, label: p.product_label }));  
  
  const { data, isLoading } = useQuery({  
    queryKey: ['claims', { search, step, department, openOnly }],  
    queryFn: () => getClaims({  
      search: search || undefined,  
      step: step === 'all' ? undefined : step,  
      department: department === 'all' ? undefined : department,  
      open_only: openOnly || undefined,  
    }),  
  });  
  
  const advance = useMutation({  
    mutationFn: advanceClaim,  
    onSuccess: () => {  
      toast.success('Claim advanced');  
      queryClient.invalidateQueries({ queryKey: ['claims'] });  
    },  
    onError: (err: any) => {  
      toast.error(err.response?.data?.detail || 'Advance failed');  
    },  
  });  
  
  const resolve = useMutation({  
    mutationFn: ({ id, resolution }: { id: string; resolution: any }) => resolveClaim(id, resolution),  
    onSuccess: () => {  
      toast.success('Claim resolved');  
      queryClient.invalidateQueries({ queryKey: ['claims'] });  
    },  
    onError: (err: any) => {  
      toast.error(err.response?.data?.detail || 'Resolve failed');  
    },  
  });  
  
  const createClaimMut = useMutation({  
    mutationFn: createClaim,  
    onSuccess: () => {  
      toast.success('Claim created');  
      queryClient.invalidateQueries({ queryKey: ['claims'] });  
      setIsModalOpen(false);  
      setNewClaim({ client_id: '', policy_id: '', type: '', amount: 0, description: '' });  
    },  
    onError: (err: any) => {  
      toast.error(err.response?.data?.detail || 'Failed to create claim');  
    },  
  });  
  
  const isClaimOpen = (claim: Claim) =>  
    claim.current_step !== 'Payment Confirmed' &&  
    claim.current_step !== 'Authorization Denied' &&  
    claim.current_step !== 'Partially Approved' &&  
    claim.current_step !== 'Fraud Review';  
  
  const columns = [  
    { key: 'id', header: 'ID' },  
    { key: 'client_name', header: 'Client' },  
    { key: 'product_label', header: 'Product' },  
    { key: 'type', header: 'Type' },  
    {  
      key: 'amount',  
      header: 'Amount',  
      render: (v: number) => `PKR ${v.toLocaleString()}`,  
    },  
    {  
      key: 'current_step',  
      header: 'Step',  
      render: (v: string) => <Badge type={v === 'Decision Advised' ? 'gold' : 'in-progress'}>{v}</Badge>,  
    },  
    {  
      key: 'status',  
      header: 'Status',  
      render: (_: any, row: Claim) => (  
        <Badge type={isClaimOpen(row) ? 'in-progress' : 'closed'}>  
          {isClaimOpen(row) ? 'Open' : 'Closed'}  
        </Badge>  
      ),  
    },  
    {  
      key: 'actions',  
      header: 'Actions',  
      render: (_: any, row: Claim) => {  
        const open = isClaimOpen(row);  
        return (  
          <div className="flex gap-2 flex-wrap">  
            <button  
              className="btn-sm primary"  
              onClick={() => navigate(`/claims/${row.id}`)}  
            >  
              View  
            </button>  
            {can(user?.role, 'claim.advance') && open && (  
              <>  
                {row.current_step === 'Decision Advised' ? (  
                  <>  
                    <button  
                      className="btn-sm success"  
                      onClick={() => resolve.mutate({ id: row.id, resolution: { outcome: 'Payment Confirmed', reason_code: 'claim_validated', notes: 'Claim verified and approved for payment.' } })}  
                      disabled={resolve.isPending && resolve.variables?.id === row.id}  
                    >  
                      Approve  
                    </button>  
                    <button  
                      className="btn-sm danger"  
                      onClick={() => resolve.mutate({ id: row.id, resolution: { outcome: 'Authorization Denied', reason_code: 'coverage_not_met', notes: 'The reported event is outside the policy coverage.' } })}  
                      disabled={resolve.isPending && resolve.variables?.id === row.id}  
                    >  
                      Deny  
                    </button>  
                    <button  
                      className="btn-sm gold"  
                      onClick={() => resolve.mutate({ id: row.id, resolution: { outcome: 'Partially Approved', reason_code: 'partial_coverage', notes: 'Claim is partially approved.' } })}  
                      disabled={resolve.isPending && resolve.variables?.id === row.id}  
                    >  
                      Partial  
                    </button>  
                  </>  
                ) : (  
                  <button  
                    className="btn-sm gold"  
                    onClick={() => advance.mutate(row.id)}  
                    disabled={advance.isPending && advance.variables === row.id}  
                  >  
                    Advance  
                  </button>  
                )}  
              </>  
            )}  
          </div>  
        );  
      },  
    },  
  ];  
  
  const stepOptions = ['all', 'Event Reported', 'Evidence Collated', 'Submitted to Insurer', 'Under Review', 'Decision Advised'];  
  
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
              onChange: setStep,  
            },  
          ]}  
        />  
        {can(user?.role, 'claim.create') && (  
          <button className="btn-sm primary" onClick={() => setIsModalOpen(true)}>  
            ➕ New Claim  
          </button>  
        )}  
      </div>  
      <Table columns={columns} data={data || []} loading={isLoading} />  
  
      <Modal  
        isOpen={isModalOpen}  
        onClose={() => setIsModalOpen(false)}  
        title="Create New Claim"  
        onSave={() => {  
          const effectiveClientId = user?.role === 'client' ? user.client_id ?? '' : newClaim.client_id;
          if (!effectiveClientId || !newClaim.policy_id || !newClaim.type || newClaim.amount <= 0) {  
            toast.error('Please fill all required fields');  
            return;  
          }  
          createClaimMut.mutate({ ...newClaim, client_id: effectiveClientId });  
        }}  
        loading={createClaimMut.isPending}  
      >  
        <div className="space-y-3">  
          {user?.role !== 'client' && (
            <div className="form-group">  
              <label className="form-label">Client *</label>  
              <select  
                className="form-input"  
                value={newClaim.client_id}  
                onChange={(e) => setNewClaim({ ...newClaim, client_id: e.target.value, policy_id: '' })}  
              >  
                <option value="">Select client</option>  
                {clients.map((c: any) => (  
                  <option key={c.id} value={c.id}>{c.name}</option>  
                ))}  
              </select>  
            </div>  
          )}
          <div className="form-group">  
            <label className="form-label">Policy *</label>  
            <select  
              className="form-input"  
              value={newClaim.policy_id}  
              onChange={(e) => setNewClaim({ ...newClaim, policy_id: e.target.value })}  
              disabled={!newClaim.client_id}  
            >  
              <option value="">Select policy</option>  
              {policies.map((p: any) => (  
                <option key={p.id} value={p.id}>{p.label}</option>  
              ))}  
            </select>  
          </div>  
          <div className="form-group">  
            <label className="form-label">Claim Type *</label>  
            <select  
              className="form-input"  
              value={newClaim.type}  
              onChange={(e) => setNewClaim({ ...newClaim, type: e.target.value })}  
            >  
              <option value="">Select type</option>  
              <option value="Accident">Accident</option>  
              <option value="Theft">Theft</option>  
              <option value="Health">Health</option>  
              <option value="Life">Life</option>  
              <option value="Property">Property</option>  
              <option value="Travel">Travel</option>  
            </select>  
          </div>  
          <div className="form-group">  
            <label className="form-label">Amount (PKR) *</label>  
            <input  
              type="number"  
              className="form-input"  
              value={newClaim.amount}  
              onChange={(e) => setNewClaim({ ...newClaim, amount: Number(e.target.value) })}  
            />  
          </div>  
          <div className="form-group">  
            <label className="form-label">Description *</label>  
            <textarea  
              className="form-input"  
              rows={3}  
              value={newClaim.description}  
              onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}  
            />  
          </div>  
        </div>  
      </Modal>  
    </div>  
  );  
};
