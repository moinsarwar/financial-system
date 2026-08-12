import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClaim, advanceClaim, resolveClaim, addClaimMessage, resetClaim } from '../api/claims';
import { getDocuments, uploadDocument, downloadDocument } from '../api/documents';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';
import toast from 'react-hot-toast';
import { getProducts } from '../api/products';

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
    { name: 'Policy Document', type: 'policy', icon: 'fa-file-pdf' },
    { name: 'Application Form', type: 'application', icon: 'fa-file-alt' },
    { name: 'CNIC Copy', type: 'cnic', icon: 'fa-id-card' },
  ];
  const extra: Record<string, Array<{ name: string; type: string; icon: string }>> = {
    'Health': [{ name: 'Medical Records', type: 'medical', icon: 'fa-notes-medical' }],
    'Critical Health': [{ name: 'Diagnosis Report', type: 'diagnosis', icon: 'fa-file-medical' }],
    'Car / Motorcycle': [
      { name: 'Accident Report', type: 'report', icon: 'fa-file-alt' },
      { name: 'Photos', type: 'photos', icon: 'fa-images' },
    ],
    'Home': [{ name: 'Damage Assessment', type: 'assessment', icon: 'fa-clipboard-list' }],
    'Accident': [{ name: 'Police Report', type: 'police', icon: 'fa-file-invoice' }],
    'Accidental Death': [
      { name: 'Death Certificate', type: 'certificate', icon: 'fa-certificate' },
      { name: 'Police Report', type: 'police', icon: 'fa-file-invoice' },
    ],
    'Other': [{ name: 'Supporting Documents', type: 'support', icon: 'fa-folder-open' }],
  };
  return [...base, ...(extra[type] || [])];
};

const STAGES = [
  { label: 'Event Reported', short: 'Reported' },
  { label: 'Evidence Collated', short: 'Validation' },
  { label: 'Submitted to Insurer', short: 'Submitted' },
  { label: 'Under Review', short: 'Review' },
  { label: 'Decision Advised', short: 'Decision' },
  { label: 'Payment Confirmed', short: 'Settled' },
];

export const ClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  const { data: claim, isLoading: isClaimLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => getClaim(id!),
    enabled: !!id,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', { ref_id: id }],
    queryFn: () => getDocuments({ ref_id: id }),
    enabled: !!id,
  });

  const { data: productData = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({}),
  });

  const advance = useMutation({
    mutationFn: () => advanceClaim(id!),
    onSuccess: () => {
      toast.success('Claim advanced');
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Advance failed'),
  });

  const resetClaimMut = useMutation({
    mutationFn: () => resetClaim(id!),
    onSuccess: () => { toast.success('Claim reset to Draft'); queryClient.invalidateQueries({ queryKey: ['claim', id] }); queryClient.invalidateQueries({ queryKey: ['documents', { ref_id: id }] }); },
    onError: (err: any) => { toast.error(err.response?.data?.detail || 'Failed to reset claim'); }
  });

  const resolve = useMutation({
    mutationFn: (resolution: any) => resolveClaim(id!, resolution),
    onSuccess: () => {
      toast.success('Claim resolved');
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Resolve failed'),
  });

  const sendMessage = useMutation({
    mutationFn: () => addClaimMessage(id!, message),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['claim', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Message failed'),
  });

  const uploadDoc = async (file: File, type: string, name: string) => {
    if (!claim) return;
    try {
      setIsUploading(prev => ({ ...prev, [type]: true }));
      await uploadDocument({
        client_id: claim.client_id,
        name: name,
        type: type,
        ref_id: claim.id,
        ref_type: 'claim',
        file: file,
      });
      toast.success(`${name} uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: ['documents', { ref_id: id, ref_type: 'claim' }] });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  if (isClaimLoading || !claim) {
    return <div className="p-8 text-center text-gray-500">Loading claim details...</div>;
  }

  const isRejected = claim.current_step === 'Authorization Denied' || claim.current_step === 'Fraud Review';
  const isSettled = claim.current_step === 'Payment Confirmed';
  const isPartiallyApproved = claim.current_step === 'Partially Approved';
  
  // Calculate Timeline
  let currentIdx = STAGES.findIndex(s => s.label === claim.current_step);
  if (isRejected || isPartiallyApproved) {
    // If resolved but not fully settled normally, we just highlight up to 'Decision Advised'
    currentIdx = 4;
  }
  
  const progressPercent = currentIdx >= 0 ? Math.min(100, (currentIdx / (STAGES.length - 1)) * 100) : 100;

  const flag = getFlag(claim);
  const flagMap = { ontrack: { bg: 'bg-green-100', text: 'text-green-800', label: 'On Track' }, delayed: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Delayed' }, overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' } };
  const currentFlag = flagMap[flag as keyof typeof flagMap];

  const requiredDocs = getDefaultDocs(claim.type || 'Other');
  
  // Get product info
  const product = productData.find(p => p.id === claim.policy_id);
  const insurer = product?.product_label || 'State Life';

  return (
    <div className="bg-[#f4f7fc] min-h-screen -m-6 p-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 text-sm mb-2 flex items-center gap-1">
            <i className="fas fa-arrow-left"></i> Back to Claims
          </button>
          <h2 className="text-2xl font-bold text-[#0f1a2e] flex items-center gap-3">
            {claim.id} 
            <span className={`text-xs px-3 py-1 rounded-full ${currentFlag.bg} ${currentFlag.text} uppercase tracking-wider font-semibold`}>
              {currentFlag.label}
            </span>
          </h2>
          <div className="text-gray-500 text-sm mt-1">
            {claim.client_name} &bull; {claim.type} &bull; Policy: {product?.policy_number || claim.policy_id}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stage Timeline Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0f1a2e] mb-6 flex items-center gap-2">
              <i className="fas fa-tasks text-blue-500"></i> Claim Progress Tracker
            </h3>
            
            <div className="relative mb-2 mt-4 px-4">
              <div className="absolute top-3.5 left-8 right-8 h-1 bg-gray-100 rounded z-0"></div>
              <div className="absolute top-3.5 left-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded z-0 transition-all duration-700" style={{ width: `calc(${progressPercent}% - 4rem)` }}></div>
              
              <div className="flex justify-between relative z-10">
                {STAGES.map((stage, idx) => {
                  const isDone = isRejected ? idx <= currentIdx : idx < currentIdx || (isSettled && idx === 5);
                  const isActive = !isDone && idx === currentIdx;
                  
                  let dotClass = "w-8 h-8 rounded-full border-4 flex items-center justify-center text-[10px] font-bold bg-white transition-all duration-300 ";
                  if (isDone) dotClass += "border-green-500 text-green-500";
                  else if (isActive) dotClass += "border-blue-500 bg-blue-500 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)]";
                  else dotClass += "border-gray-200 text-gray-400";

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={dotClass}>
                        {isDone ? <i className="fas fa-check"></i> : (idx + 1)}
                      </div>
                      <div className={`text-[10px] font-semibold mt-3 max-w-[60px] text-center leading-tight ${isActive ? 'text-[#0f1a2e]' : 'text-gray-400'}`}>
                        {stage.short}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {isRejected && (
              <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r flex items-start gap-3">
                <i className="fas fa-times-circle text-red-500 mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-bold text-red-800">Outcome: {claim.current_step}</h4>
                  <p className="text-xs text-red-600 mt-1">{claim.resolution_notes || 'This claim was rejected.'}</p>
                </div>
              </div>
            )}
            
            {isPartiallyApproved && (
              <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r flex items-start gap-3">
                <i className="fas fa-exclamation-triangle text-yellow-600 mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-bold text-yellow-800">Outcome: Partially Approved</h4>
                  <p className="text-xs text-yellow-700 mt-1">{claim.resolution_notes || 'This claim was partially approved.'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Next Action Box */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0f1a2e] mb-4 flex items-center gap-2">
              <i className="fas fa-arrow-right text-blue-500"></i> Action Center
            </h3>
            <div className="p-4 bg-[#f8faff] border border-blue-100 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-gray-700 flex-1 min-w-[200px]">
                {CLOSED_STEPS.has(claim.current_step) ? (
                  <span><strong>Status:</strong> Claim is closed. No further actions required.</span>
                ) : user?.role === 'client' ? (
                  <span><strong>Instruction:</strong> Upload missing documents and reply to any messages.</span>
                ) : (
                  <span><strong>Next action:</strong> Advance claim from "{claim.current_step}" to the next stage.</span>
                )}
              </div>
              <div className="flex gap-2">
                {can(user?.role, 'claim.advance') && !CLOSED_STEPS.has(claim.current_step) && (
                  <>
                    {claim.current_step === 'Decision Advised' ? (
                      <>
                        <button onClick={() => resolve.mutate({ outcome: 'Payment Confirmed', reason_code: 'approved' })} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded shadow-sm hover:bg-green-600">
                          Approve
                        </button>
                        <button onClick={() => resolve.mutate({ outcome: 'Authorization Denied', reason_code: 'denied' })} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded shadow-sm hover:bg-red-600">
                          Reject
                        </button>
                      </>
                    ) : (
                      <button onClick={() => advance.mutate()} className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-600">
                        Advance Stage <i className="fas fa-arrow-right ml-1"></i>
                      </button>
                    )}
                  </>
                )}
                {can(user?.role, 'claim.advance') && (
                  <button onClick={() => {
                    if (window.confirm(`Reset claim ${claim.id} to Draft?`)) {
                      resetClaimMut.mutate();
                    }
                  }} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded shadow-sm hover:bg-gray-300">
                    <i className="fas fa-undo"></i> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Communications Box */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0f1a2e] mb-4 flex items-center gap-2">
              <i className="fas fa-comments text-blue-500"></i> Communications
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {claim.timeline && claim.timeline.length > 0 ? (
                claim.timeline.map((event, idx) => {
                  const isMessage = event.event.startsWith('Message: ');
                  const msgText = isMessage ? event.event.substring(9) : event.event;
                  
                  // Simple heuristic for message direction
                  // Since all we have is the 'user' ID, we'll format based on message type
                  const isSystem = !isMessage;
                  
                  return (
                    <div key={idx} className={`p-4 rounded-xl border-l-4 text-sm ${isSystem ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-500'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[#0f1a2e]">{isSystem ? 'System Log' : event.user}</span>
                        <span className="text-xs text-gray-500">{new Date(event.time).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-700">{msgText}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">No communications yet.</div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type a message to add to the timeline..."
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => { if (e.key === 'Enter' && message) sendMessage.mutate(); }}
              />
              <button 
                onClick={() => sendMessage.mutate()} 
                disabled={!message || sendMessage.isPending}
                className="px-6 py-2 bg-blue-500 text-white font-bold text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
          
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Summary Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0f1a2e] mb-4 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-500"></i> Claim Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm">Claim Amount</span>
                <span className="font-bold text-[#0f1a2e] text-sm">PKR {Number(claim.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm">Incident Date</span>
                <span className="font-bold text-[#0f1a2e] text-sm">{new Date(claim.incident_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm">Insurer</span>
                <span className="font-bold text-[#0f1a2e] text-sm">{insurer}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm">Created At</span>
                <span className="font-bold text-[#0f1a2e] text-sm">{new Date(claim.created_at).toLocaleDateString()}</span>
              </div>
              <div className="pt-2">
                <span className="text-gray-500 text-sm block mb-1">Description</span>
                <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {claim.description}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Box */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0f1a2e] mb-4 flex items-center gap-2">
              <i className="fas fa-folder-open text-blue-500"></i> Documents
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {requiredDocs.map((reqDoc, idx) => {
                const uploadedDoc = docs.find(d => d.type === reqDoc.type);
                const isUploaded = !!uploadedDoc;
                
                return (
                  <div key={idx} className={`p-3 rounded-xl border text-center transition-colors ${isUploaded ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                    <i className={`fas ${reqDoc.icon} text-2xl mb-2 ${isUploaded ? 'text-blue-500' : 'text-gray-300'}`}></i>
                    <div className="text-[11px] font-bold text-gray-800 leading-tight mb-1">{reqDoc.name}</div>
                    {isUploaded ? (
                      <div className="mt-2 flex flex-col items-center gap-1">
                        <button onClick={() => downloadDocument(uploadedDoc.id, uploadedDoc.original_filename || uploadedDoc.name || 'document.pdf')} className="text-[10px] text-blue-600 hover:underline flex items-center justify-center gap-1">
                          <i className="fas fa-download"></i> Download / View
                        </button>
                        <label className="text-[9px] bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-gray-500 cursor-pointer hover:bg-gray-50 inline-block uppercase font-semibold">
                          {isUploading[reqDoc.type] ? 'Uploading...' : 'Replace'}
                          <input 
                            type="file" 
                            className="hidden" 
                            disabled={isUploading[reqDoc.type]}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                uploadDoc(e.target.files[0], reqDoc.type, reqDoc.name);
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="text-[9px] bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-blue-500 cursor-pointer hover:bg-gray-50 inline-block mt-1 uppercase font-semibold">
                        {isUploading[reqDoc.type] ? 'Uploading...' : 'Upload'}
                        <input 
                          type="file" 
                          className="hidden" 
                          disabled={isUploading[reqDoc.type]}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              uploadDoc(e.target.files[0], reqDoc.type, reqDoc.name);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
