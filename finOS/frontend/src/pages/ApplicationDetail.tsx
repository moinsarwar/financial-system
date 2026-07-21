import React from 'react';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';  
import { advanceApplication, decideApplication, getApplication } from '../api/applications';
import { getDocuments } from '../api/documents';
import { Link } from 'react-router-dom';
import { can } from '../utils/permissions';  
import { Badge } from '../components/common/Badge';  
import { DetailPanel } from '../components/common/DetailPanel';  
import { useAuth } from '../contexts/AuthContext';  
import toast from 'react-hot-toast';  
  
export const ApplicationDetail: React.FC = () => {  
  const { id } = useParams<{ id: string }>();  
  const navigate = useNavigate();  
  const queryClient = useQueryClient();  
  const { user } = useAuth();  
  
  const { data, isLoading, isError } = useQuery({  
    queryKey: ['application', id],  
    queryFn: () => getApplication(id as string),  
    enabled: Boolean(id),  
  });  
  
  const { data: documentsData } = useQuery({
    queryKey: ['documents', { ref_id: id }],
    queryFn: () => getDocuments({ ref_id: id }),
    enabled: Boolean(id),
  });
  const advance = useMutation({  
    mutationFn: advanceApplication,  
    onSuccess: () => {  
      toast.success('Application advanced');  
      queryClient.invalidateQueries({ queryKey: ['application', id] });  
      queryClient.invalidateQueries({ queryKey: ['applications'] });  
    },  
    onError: (error: unknown) => {  
      const message = error instanceof Error ? error.message : 'Advance failed';  
      toast.error(message);  
    },  
  });  

  const decision = useMutation({
    mutationFn: ({
      outcome,
      reasonCode,
      notes,
    }: {
      outcome: 'approved' | 'declined' | 'withdrawn';
      reasonCode: string;
      notes?: string;
    }) =>
      decideApplication(data!.id, {
        outcome,
        reason_code: reasonCode,
        notes,
      }),

    onSuccess: () => {
      toast.success('Application decision recorded');
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
  
  if (isLoading) return <div>Loading...</div>;  
  if (isError || !data) return <div>Application not found</div>;  
  
  const isActive = data.status === 'in-progress' && data.step_index < data.steps.length - 1;  
  
  return (  
    <DetailPanel  
      isOpen={true}  
      onClose={() => navigate('/dashboard/applications')}  
      title={data.id}  
      subhead={`${data.product_label} · ${data.department}`}  
      actions={  
        <>  
          {can(user?.role, 'application.advance') && isActive && (
            <button
              className="btn-sm gold"
              disabled={advance.isPending}
              onClick={() => advance.mutate(data.id)}
            >
              Advance
            </button>
          )}

          {can(user?.role, 'application.decide') &&
            data.status === 'in-progress' && (
              <>
                <button
                  className="btn-sm success"
                  disabled={decision.isPending}
                  onClick={() =>
                    decision.mutate({
                      outcome: 'approved',
                      reasonCode: 'criteria_satisfied',
                      notes: 'Application satisfies the applicable criteria.',
                    })
                  }
                >
                  Approve
                </button>
                <button
                  className="btn-sm danger"
                  disabled={decision.isPending}
                  onClick={() =>
                    decision.mutate({
                      outcome: 'declined',
                      reasonCode: 'criteria_not_met',
                      notes: 'Application does not satisfy the applicable criteria.',
                    })
                  }
                >
                  Decline
                </button>
              </>
            )}
          {(can(user?.role, 'application.decide') || user?.role === 'client') &&
            data.status === 'in-progress' && (
                <button
                  className="btn-sm outline"
                  disabled={decision.isPending}
                  onClick={() =>
                    decision.mutate({
                      outcome: 'withdrawn',
                      reasonCode: 'customer_withdrawal',
                      notes: 'Application withdrawn at the customer’s request.',
                    })
                  }
                >
                  Withdraw
                </button>
            )}
          <button className="btn-sm outline" onClick={() => navigate('/dashboard/applications')}>Close</button>  
        </>  
      }  
    >  
      <div className="space-y-5">  
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">  
          <div><span className="font-semibold">Client:</span> {data.client_id}</div>  
          <div><span className="font-semibold">Product:</span> {data.product_label}</div>  
          <div><span className="font-semibold">Amount:</span> {data.currency} {data.amount.toLocaleString()}</div>  
          <div><span className="font-semibold">Status:</span> <Badge type={data.status}>{data.status}</Badge></div>  
          <div><span className="font-semibold">Current Step:</span> {data.current_step}</div>  
          <div><span className="font-semibold">Created:</span> {new Date(data.created_at).toLocaleString()}</div>  
          <div><span className="font-semibold">Updated:</span> {new Date(data.updated_at).toLocaleString()}</div>  
        </div>  
  
        <div>  
          <h3 className="font-semibold mb-2">Workflow</h3>  
          <div className="space-y-2">  
            {data.steps.map((step, index) => (  
              <div key={step} className={`rounded-md border p-2 text-sm ${index === data.step_index ? 'border-accent bg-accent-soft' : index < data.step_index ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>  
                {index + 1}. {step}  
              </div>  
            ))}  
          </div>  
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
        
        {documentsData && documentsData.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documentsData.map(doc => (
                <div key={doc.id} className="rounded-md border border-gray-200 p-3 bg-white">
                  <div className="font-semibold text-sm">{doc.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{doc.type} · {new Date(doc.uploaded_at).toLocaleDateString()}</div>
                  <Link to={`/dashboard/documents/${doc.id}`} className="text-sm text-blue-600 hover:underline">View Document</Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>  
    </DetailPanel>  
  );  
};
