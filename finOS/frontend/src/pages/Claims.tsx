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

const getFlag = (claim: any) => {
  const CLOSED_STEPS = new Set([
    'Payment Confirmed',
    'Authorization Denied',
    'Partially Approved',
    'Fraud Review',
  ]);
  if (CLOSED_STEPS.has(claim.current_step)) return 'ontrack';
  const changedAt = new Date(claim.updated_at || claim.created_at).getTime();
  const elapsedDays = Math.max(0, (Date.now() - changedAt) / 86400000);
  if (elapsedDays < 3) return 'ontrack';
  if (elapsedDays < 7) return 'delayed';
  return 'overdue';
};

const getDefaultDocs = (type: string) => {
  const base = [
    { name: 'Policy Document', type: 'policy' },
    { name: 'Application Form', type: 'application' },
    { name: 'CNIC Copy', type: 'cnic' },
  ];
  const extra: Record<string, Array<{ name: string; type: string }>> = {
    'Health': [{ name: 'Medical Records', type: 'medical' }],
    'Critical Health': [{ name: 'Diagnosis Report', type: 'diagnosis' }],
    'Car / Motorcycle': [
      { name: 'Accident Report', type: 'report' },
      { name: 'Photos', type: 'photos' },
    ],
    'Home': [{ name: 'Damage Assessment', type: 'assessment' }],
    'Accident': [{ name: 'Police Report', type: 'police' }],
    'Accidental Death': [
      { name: 'Death Certificate', type: 'certificate' },
      { name: 'Police Report', type: 'police' },
    ],
    'Other': [{ name: 'Supporting Documents', type: 'support' }],
  };
  return [...base, ...(extra[type] || [])];
};
  
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
  
  const effectiveClientId = user?.role === 'client' ? user.client_id || '' : newClaim.client_id;

  // Fetch products for policy selector (only when modal is open)  
  const { data: productData = [] } = useQuery({  
    queryKey: ['active-products-for-claim', effectiveClientId],  
    queryFn: () => getProducts({ status: 'active' }),  
    enabled: isModalOpen && !!effectiveClientId,  
  });  
  const policies = productData  
    .filter((p: any) => {
      const isCorrectClient = p.client_id === effectiveClientId;
      const isInsuranceType = [
        'health_insurance', 'motor_insurance', 'life_insurance', 'accident', 
        'travel_insurance', 'home_insurance', 'health', 'motor', 'life', 'travel', 
        'accident_insurance'
      ].includes(p.product_type?.toLowerCase());
      return isCorrectClient && (p.policy_number || isInsuranceType);
    })  
    .map((p: any) => {
      const typeLabels: Record<string, string> = {
        health_insurance: 'Health',
        motor_insurance: 'Motor',
        life_insurance: 'Life',
        travel_insurance: 'Travel',
        home_insurance: 'Home',
        accident: 'Accident',
        health: 'Health',
        motor: 'Motor',
        life: 'Life',
        travel: 'Travel',
      };
      const typeKey = p.product_type?.toLowerCase() || '';
      const mappedType = typeLabels[typeKey] || (typeKey ? typeKey.charAt(0).toUpperCase() + typeKey.slice(1) : 'Policy');
      return { id: p.id, label: `${mappedType} - ${p.product_label} (${p.policy_number || p.id})` };
    });  
  
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
      key: 'flag',
      header: 'Flag',
      render: (_: any, row: Claim) => {
        const flag = getFlag(row);
        const typeMap: Record<string, string> = { ontrack: 'approved', delayed: 'gold', overdue: 'rejected' };
        const labelMap: Record<string, string> = { ontrack: 'On Track', delayed: 'Delayed', overdue: 'Overdue' };
        return <Badge type={typeMap[flag]}>{labelMap[flag]}</Badge>;
      }
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
              onClick={() => navigate(`/dashboard/claims/${row.id}`)}  
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
  
  const claimsList = data || [];
  const totalClaims = claimsList.length;
  const pendingValidation = claimsList.filter((c: any) => c.current_step === 'Evidence Collated').length;
  const underReview = claimsList.filter((c: any) => c.current_step === 'Under Review' || c.current_step === 'Submitted to Insurer').length;
  const settled = claimsList.filter((c: any) => c.current_step === 'Payment Confirmed').length;

  return (  
    <div>  
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Claims</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalClaims}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-lg">
            <i className="fas fa-file-invoice text-xl"></i>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Validation</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{pendingValidation}</h3>
          </div>
          <div className="p-3 bg-yellow-50 text-yellow-500 rounded-lg">
            <i className="fas fa-clipboard-check text-xl"></i>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Under Review</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{underReview}</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-500 rounded-lg">
            <i className="fas fa-search text-xl"></i>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settled</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{settled}</h3>
          </div>
          <div className="p-3 bg-green-50 text-green-500 rounded-lg">
            <i className="fas fa-check-circle text-xl"></i>
          </div>
        </div>
      </div>

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
              disabled={!effectiveClientId}  
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
              <option value="Health">Health</option>  
              <option value="Critical Health">Critical Health</option>  
              <option value="Car / Motorcycle">Car / Motorcycle</option>  
              <option value="Home">Home</option>  
              <option value="Accident">Accident</option>  
              <option value="Accidental Death">Accidental Death</option>  
              <option value="Other">Other</option>  
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
          {newClaim.type && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs">
              <span className="font-semibold text-blue-800 block mb-1">Required Documents Checklist:</span>
              <ul className="list-disc pl-4 text-blue-700 space-y-0.5">
                {getDefaultDocs(newClaim.type).map((d: any, idx: number) => (
                  <li key={idx}>{d.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>  
      </Modal>  
    </div>  
  );  
};
