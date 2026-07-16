import React, { useState } from 'react';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';  
import { advanceClaim, getClaim, resolveClaim, addClaimMessage } from '../api/claims';  
import { getDocuments, uploadDocument } from '../api/documents';
import { DetailPanel } from '../components/common/DetailPanel';  
import { Badge } from '../components/common/Badge';
import { useAuth } from '../contexts/AuthContext';  
import toast from 'react-hot-toast';  
  
const CLOSED_STEPS = new Set([  
  'Payment Confirmed',  
  'Authorization Denied',  
  'Partially Approved',  
  'Fraud Review',  
]);  

const getFlag = (claim: any) => {
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
  
export const ClaimDetail: React.FC = () => {  
  const { id } = useParams<{ id: string }>();  
  const navigate = useNavigate();  
  const queryClient = useQueryClient();  
  const { user } = useAuth();  
  const [chatMessage, setChatMessage] = useState('');
  
  const { data, isLoading, isError } = useQuery({  
    queryKey: ['claim', id],  
    queryFn: () => getClaim(id as string),  
    enabled: Boolean(id),  
  });  

  const { data: documents = [] } = useQuery({
    queryKey: ['claim-documents', id],
    queryFn: () => getDocuments(),
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

  const uploadDoc = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['claim-documents', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Upload failed');
    }
  });

  const sendChat = useMutation({
    mutationFn: ({ claimId, message }: { claimId: string; message: string }) => addClaimMessage(claimId, message),
    onSuccess: () => {
      toast.success('Message sent');
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    },
    onError: () => toast.error('Failed to send message'),
  });
  
  if (isLoading) return <div>Loading...</div>;  
  if (isError || !data) return <div>Claim not found</div>;  
  
  const isOpen = !CLOSED_STEPS.has(data.current_step);  
  const isBusy = advance.isPending || resolve.isPending || uploadDoc.isPending || sendChat.isPending;  
  
  const claimDocuments = documents.filter((doc: any) => doc.ref_id === id && doc.ref_type === 'claim');
  const requiredDocs = getDefaultDocs(data.type);

  const flag = getFlag(data);
  const flagColors: Record<string, string> = {
    ontrack: 'bg-green-100 text-green-800 border-green-200',
    delayed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
  };
  const flagLabels: Record<string, string> = {
    ontrack: 'On Track',
    delayed: 'Delayed',
    overdue: 'Overdue',
  };

  const claimSteps = ['Event Reported', 'Evidence Collated', 'Submitted to Insurer', 'Under Review', 'Decision Advised', 'Resolved'];
  const activeIndex = isOpen ? claimSteps.indexOf(data.current_step) : 5;

  const handleFileUpload = (docType: string, docName: string, file: File) => {
    uploadDoc.mutate({
      client_id: data.client_id,
      name: docName,
      type: docType,
      ref_id: data.id,
      ref_type: 'claim',
      file
    });
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    sendChat.mutate({ claimId: data.id, message: chatMessage.trim() });
  };
  
  return (  
    <DetailPanel  
      isOpen={true}  
      onClose={() => navigate('/dashboard/claims')}  
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
              <button className="btn-sm success" disabled={isBusy} onClick={() => resolve.mutate({ claimId: data.id, outcome: { outcome: 'Payment Confirmed', reason_code: 'verified' } })}>  
                Approve  
              </button>  
              <button className="btn-sm danger" disabled={isBusy} onClick={() => resolve.mutate({ claimId: data.id, outcome: { outcome: 'Authorization Denied', reason_code: 'denied' } })}>  
                Deny  
              </button>  
              <button className="btn-sm gold" disabled={isBusy} onClick={() => resolve.mutate({ claimId: data.id, outcome: { outcome: 'Partially Approved', reason_code: 'partial' } })}>  
                Partial  
              </button>  
            </>  
          )}  
          <button className="btn-sm outline" onClick={() => navigate('/dashboard/claims')}>Close</button>  
        </>  
      }  
    >  
      <div className="space-y-6">  
        {/* Flag and Severity status */}
        <div className="flex gap-2 items-center">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${flagColors[flag]}`}>
            {flagLabels[flag]}
          </span>
          <span className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 text-xs font-semibold rounded-full">
            Severity: {data.severity}
          </span>
        </div>

        {/* Step progress tracker */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Claim Progress</h4>
          <div className="flex justify-between items-center relative">
            {claimSteps.map((stepName, idx) => {
              const isDone = idx < activeIndex;
              const isActive = idx === activeIndex;
              return (
                <div key={stepName} className="flex flex-col items-center flex-1 relative z-10">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${
                    isDone ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'bg-blue-500 border-blue-500 text-white ring-4 ring-blue-50' :
                    'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[9px] mt-1 text-center font-medium leading-tight max-w-[65px] ${
                    isActive ? 'text-blue-600 font-bold' : 'text-gray-400'
                  }`}>
                    {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formatted details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">  
          <div><span className="font-semibold text-gray-500">Client:</span> {data.client_name}</div>  
          <div><span className="font-semibold text-gray-500">Product:</span> {data.product_label}</div>  
          <div><span className="font-semibold text-gray-500">Claim Type:</span> {data.type}</div>  
          <div><span className="font-semibold text-gray-500">Amount:</span> {data.currency} {Number(data.amount).toLocaleString()}</div>  
          <div><span className="font-semibold text-gray-500">Current Step:</span> {data.current_step}</div>  
          <div><span className="font-semibold text-gray-500">Status:</span> {isOpen ? 'Open' : 'Closed'}</div>  
          <div><span className="font-semibold text-gray-500">Reserve:</span> {data.currency} {Number(data.reserve_amount).toLocaleString()}</div>  
          <div><span className="font-semibold text-gray-500">Approved:</span> {data.currency} {Number(data.approved_amount).toLocaleString()}</div>  
          {data.payment_ref && <div><span className="font-semibold text-gray-500">Payment Ref:</span> {data.payment_ref}</div>}
          {data.insurer_ref && <div><span className="font-semibold text-gray-500">Insurer Ref:</span> {data.insurer_ref}</div>}
          <div className="sm:col-span-2"><span className="font-semibold text-gray-500">Description:</span> {data.description}</div>  
        </div>  
  
        {/* Document Checklist with file uploaders */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <i className="fas fa-folder-open text-blue-500"></i> Required Documents Checklist
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requiredDocs.map((docReq) => {
              const uploadedDoc = claimDocuments.find((d: any) => d.type === docReq.type);
              return (
                <div key={docReq.type} className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 block">{docReq.name}</span>
                      <span className="text-[10px] text-gray-400">Code: {docReq.type}</span>
                    </div>
                    {uploadedDoc ? (
                      <Badge type={uploadedDoc.status === 'verified' ? 'approved' : uploadedDoc.status === 'rejected' ? 'rejected' : 'pending'}>
                        {uploadedDoc.status.toUpperCase()}
                      </Badge>
                    ) : (
                      <Badge type="closed">PENDING UPLOAD</Badge>
                    )}
                  </div>

                  {uploadedDoc ? (
                    <div className="flex gap-2 mt-2">
                      <button
                        className="btn-sm outline text-xs flex-1 py-1"
                        onClick={() => window.open(`http://localhost:8000/api/documents/${uploadedDoc.id}/download`, '_blank')}
                      >
                        <i className="fas fa-download mr-1"></i> Download
                      </button>
                      <label className="btn-sm gold text-xs flex-1 py-1 text-center cursor-pointer">
                        <i className="fas fa-sync mr-1"></i> Replace
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(docReq.type, docReq.name, e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="btn-sm primary text-xs mt-2 text-center cursor-pointer py-1">
                      <i className="fas fa-upload mr-1"></i> Upload File
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(docReq.type, docReq.name, e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline & Messaging Chat Log */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <i className="fas fa-comments text-blue-500"></i> Timeline & Message Log
          </h3>
          
          {/* Chat / Timeline message history */}
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 max-h-60 overflow-y-auto space-y-3 mb-4">
            {data.timeline && data.timeline.length > 0 ? (
              data.timeline.map((item: any, index: number) => {
                const isMsg = item.event.startsWith('Message: ');
                const displayEvent = isMsg ? item.event.substring(9) : item.event;
                
                if (isMsg) {
                  // Message styling
                  const isCurrentUserSender = item.user === (user?.full_name || user?.id);
                  return (
                    <div key={index} className={`flex flex-col ${isCurrentUserSender ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-lg text-xs max-w-[85%] ${
                        isCurrentUserSender ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                      }`}>
                        <div className="font-bold mb-1 text-[10px] opacity-80">{item.user}</div>
                        <div>{displayEvent}</div>
                      </div>
                      <span className="text-[9px] text-gray-400 mt-0.5">{new Date(item.time).toLocaleString()}</span>
                    </div>
                  );
                } else {
                  // Standard system event log styling
                  return (
                    <div key={index} className="flex gap-2 items-start border-l-2 border-gray-300 pl-3 py-1 text-xs">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-600">{displayEvent}</span>
                        <div className="text-[9px] text-gray-400">{new Date(item.time).toLocaleString()} · {item.user}</div>
                      </div>
                    </div>
                  );
                }
              })
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No events logged yet.</p>
            )}
          </div>

          {/* New message input box */}
          {isOpen && (
            <div className="flex gap-2">
              <input
                type="text"
                className="form-input flex-1 text-xs"
                placeholder="Type a message or updates to append to the log..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              />
              <button
                className="btn-sm primary py-1"
                disabled={isBusy}
                onClick={handleSendMessage}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>  
    </DetailPanel>  
  );  
};
