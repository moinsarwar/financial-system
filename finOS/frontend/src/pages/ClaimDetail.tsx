import React from 'react';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';  
import { advanceClaim, getClaim, resolveClaim } from '../api/claims';  
import { DetailPanel } from '../components/common/DetailPanel';  
import { useAuth } from '../contexts/AuthContext';  
import toast from 'react-hot-toast';  
  
const CLOSED_STEPS = new Set([  
  'Payment Confirmed',  
  'Authorization Denied',  
  'Partially Approved',  
  'Fraud Review',  
]);  
  
export const ClaimDetail: React.FC = () => {  
  const { id } = useParams<{ id: string }>();  
  const navigate = useNavigate();  
  const queryClient = useQueryClient();  
  const { user } = useAuth();  
  
  const { data, isLoading, isError } = useQuery({  
    queryKey: ['claim', id],  
    queryFn: () => getClaim(id as string),  
    enabled: Boolean(id),  
  });  
  
  const advance = useMutation({  
    mutationFn: advanceClaim,  
    onSuccess: () => {  
      toast.success('Claim advanced');  
      queryClient.invalidateQueries({ queryKey: ['claim', id] });  
      queryClient.invalidateQueries({ queryKey: ['claims'] });  
    },  
    onError: () => toast.error('Advance failed'),  
  });  
  
  const resolve = useMutation({  
    mutationFn: ({ claimId, outcome }: { claimId: string; outcome: any }) =>  
      resolveClaim(claimId, outcome),  
    onSuccess: () => {  
      toast.success('Claim resolved');  
      queryClient.invalidateQueries({ queryKey: ['claim', id] });  
      queryClient.invalidateQueries({ queryKey: ['claims'] });  
    },  
    onError: () => toast.error('Resolution failed'),  
  });  
  
  if (isLoading) return <div>Loading...</div>;  
  if (isError || !data) return <div>Claim not found</div>;  
  
  const isOpen = !CLOSED_STEPS.has(data.current_step);  
  const isBusy = advance.isPending || resolve.isPending;  
  
  return (  
    <DetailPanel  
      isOpen={true}  
      onClose={() => navigate('/claims')}  
      title={data.id}  
      subhead={`${data.type} · ${data.product_label}`}  
      actions={  
        <>  
          {user?.role !== 'client' && isOpen && data.current_step !== 'Decision Advised' && (  
            <button className="btn-sm gold" disabled={isBusy} onClick={() => advance.mutate(data.id)}>  
              Advance  
            </button>  
          )}  
          {user?.role !== 'client' && isOpen && data.current_step === 'Decision Advised' && (  
            <>  
              <button className="btn-sm success" disabled={isBusy} onClick={() => resolve.mutate({ claimId: data.id, outcome: 'Payment Confirmed' })}>  
                Approve  
              </button>  
              <button className="btn-sm danger" disabled={isBusy} onClick={() => resolve.mutate({ claimId: data.id, outcome: 'Authorization Denied' })}>  
                Deny  
              </button>  
              <button className="btn-sm gold" disabled={isBusy} onClick={() => resolve.mutate({ claimId: data.id, outcome: 'Partially Approved' })}>  
                Partial  
              </button>  
            </>  
          )}  
          <button className="btn-sm outline" onClick={() => navigate('/claims')}>Close</button>  
        </>  
      }  
    >  
      <div className="space-y-5">  
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">  
          <div><span className="font-semibold">Client:</span> {data.client_name}</div>  
          <div><span className="font-semibold">Product:</span> {data.product_label}</div>  
          <div><span className="font-semibold">Claim Type:</span> {data.type}</div>  
          <div><span className="font-semibold">Amount:</span> {data.currency} {data.amount.toLocaleString()}</div>  
          <div><span className="font-semibold">Current Step:</span> {data.current_step}</div>  
          <div><span className="font-semibold">Status:</span> {isOpen ? 'Open' : 'Closed'}</div>  
          <div><span className="font-semibold">Reserve:</span> {data.currency} {data.reserve_amount.toLocaleString()}</div>  
          <div><span className="font-semibold">Approved:</span> {data.currency} {data.approved_amount.toLocaleString()}</div>  
          <div className="sm:col-span-2"><span className="font-semibold">Description:</span> {data.description}</div>  
        </div>  
  
        {data.timeline.length > 0 && (  
          <div>  
            <h3 className="font-semibold mb-2">Timeline</h3>  
            <div className="space-y-2">  
              {data.timeline.map((item, index) => (  
                <div key={`${item.time}-${index}`} className="border-b border-gray-100 pb-2 text-sm">  
                  <div>{item.event}</div>  
                  <div className="text-xs text-gray-400">{new Date(item.time).toLocaleString()} · {item.user}</div>  
                </div>  
              ))}  
            </div>  
          </div>  
        )}  
      </div>  
    </DetailPanel>  
  );  
};
