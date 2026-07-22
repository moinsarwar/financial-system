import React, { useState } from 'react';  
import { useNavigate, useParams } from 'react-router-dom';  
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';  
import { advanceApplication, decideApplication, getApplication, getApplicationMessages, sendMessage, requestInformation, submitInformationRequests, resolveInformationRequests, respondToInformationRequest, uploadAppDocument } from '../api/applications';
import { getDocuments, downloadDocument } from '../api/documents';
import { can } from '../utils/permissions';  
import { Badge } from '../components/common/Badge';  
import { DetailPanel } from '../components/common/DetailPanel';  
import { useAuth } from '../contexts/AuthContext';  
import { ErrorBoundary } from '../components/ErrorBoundary';
import toast from 'react-hot-toast';  
  
export const ApplicationDetail: React.FC = () => {  
  const { id } = useParams<{ id: string }>();  
  const navigate = useNavigate();  
  const queryClient = useQueryClient();  
  const { user } = useAuth();  
  const [requestKind, setRequestKind] = useState('text');
  const [requestLabel, setRequestLabel] = useState('');
  const [requestDoc, setRequestDoc] = useState('');
  const [msgText, setMsgText] = useState('');
  
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
  
  const { data: messages } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => getApplicationMessages(id as string),
    enabled: Boolean(id)
  });

  const advance = useMutation({  
    mutationFn: advanceApplication,  
    onSuccess: () => {  
      toast.success('Application advanced');  
      queryClient.invalidateQueries({ queryKey: ['application', id] });  
      queryClient.invalidateQueries({ queryKey: ['applications'] });  
    }
  });  

  const decision = useMutation({
    mutationFn: ({ outcome, reasonCode, notes }: any) => decideApplication(id!, { outcome, reason_code: reasonCode, notes }),
    onSuccess: () => {
      toast.success('Application decision recorded');
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const uploadDoc = useMutation({
    mutationFn: ({ code, file }: { code: string, file: File }) => uploadAppDocument(id!, code, file),
    onSuccess: () => {
      toast.success('Document uploaded');
      queryClient.invalidateQueries({ queryKey: ['documents', { ref_id: id }] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    }
  });

  const sendMsg = useMutation({
    mutationFn: () => sendMessage(id!, msgText),
    onSuccess: () => {
      setMsgText('');
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    }
  });

  const reqInfo = useMutation({
    mutationFn: () => requestInformation(id!, [requestKind === 'document' ? { kind: 'document', label: requestLabel || 'Requested document', document_requirement_code: requestDoc } : { kind: 'text', label: requestLabel }]),
    onSuccess: () => {
      setRequestLabel('');
      setRequestDoc('');
      toast.success('Information requested');
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    }
  });
  
  const resInfo = useMutation({
    mutationFn: ({ publicId, text }: { publicId: string, text: string }) => respondToInformationRequest(id!, publicId, text),
    onSuccess: () => {
      toast.success('Response submitted');
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    }
  });

  const submitInfo = useMutation({
    mutationFn: () => submitInformationRequests(id!),
    onSuccess: () => {
      toast.success('Information submitted');
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    }
  });

  const resolveInfo = useMutation({
    mutationFn: () => resolveInformationRequests(id!),
    onSuccess: () => {
      toast.success('Requests resolved');
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    }
  });
  
  if (isLoading) return <div>Loading...</div>;  
  if (isError || !data) return <div>Application not found</div>;  
  
  const isActive = data.status === 'in-progress' && data.step_index < data.steps.length - 1;  
  const infoRequests = (data as any).info_requests || [];
  
  return (  
    <ErrorBoundary>
    <DetailPanel  
      isOpen={true}  
      onClose={() => navigate('/dashboard/applications')}  
      title={data.id}  
      subhead={`${data.product_label} · ${data.department}`}  
      actions={  
        <>  
          {can(user?.role, 'application.advance') && isActive && (
            <button className="btn-sm gold" disabled={advance.isPending} onClick={() => advance.mutate(data.id)}>Advance</button>
          )}

          {can(user?.role, 'application.decide') && data.status === 'in-progress' && (
              <>
                <button className="btn-sm success" disabled={decision.isPending} onClick={() => decision.mutate({ outcome: 'approved', reasonCode: 'criteria_satisfied', notes: 'Approved.' })}>Approve</button>
                <button className="btn-sm danger" disabled={decision.isPending} onClick={() => decision.mutate({ outcome: 'declined', reasonCode: 'criteria_not_met', notes: 'Declined.' })}>Decline</button>
              </>
            )}
          {(can(user?.role, 'application.decide') || user?.role === 'client') && data.status === 'in-progress' && (
                <button className="btn-sm outline" disabled={decision.isPending} onClick={() => decision.mutate({ outcome: 'withdrawn', reasonCode: 'customer_withdrawal', notes: 'Withdrawn.' })}>Withdraw</button>
            )}
          <button className="btn-sm outline" onClick={() => navigate('/dashboard/applications')}>Close</button>  
        </>  
      }  
    >  
      <div className="space-y-5">  
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">  
          <div><span className="font-semibold">Client:</span> {data.client_id}</div>  
          <div><span className="font-semibold">Product:</span> {data.product_label}</div>  
          <div><span className="font-semibold">Amount:</span> {data.currency} {data.amount?.toLocaleString() || ''}</div>  
          <div><span className="font-semibold">Status:</span> <Badge type={data.status}>{data.status}</Badge></div>  
          <div><span className="font-semibold">Current Step:</span> {data.current_step}</div>  
          <div><span className="font-semibold">Created:</span> {new Date(data.created_at).toLocaleString()}</div>  
          <div><span className="font-semibold">Updated:</span> {new Date(data.updated_at).toLocaleString()}</div>  
        </div>  
  
        <div>  
          <h3 className="font-semibold mb-2">Workflow</h3>  
          <div className="progressline">  
            {data.steps.map((step, index) => (  
              <div key={step} className={(index < data.step_index ? 'done ' : index === data.step_index ? 'active ' : '') + 'progressstep'}>  
                <span>{index + 1}</span>
                <small>{step}</small>
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
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Documents</h3>
            <label className="btn-sm primary cursor-pointer mb-0">
              Upload New
              <input type="file" accept="application/pdf,image/png,image/jpeg" hidden onChange={e => {
                const file = e.target.files?.[0];
                if(file) {
                  const t = prompt('Document Type (e.g. KYC, INCORPORATION)');
                  const n = prompt('Document Name');
                  if (t && n) uploadDoc.mutate({ code: t, file });
                }
              }}/>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(() => {
              const reqDocs = ['cnicFront', 'cnicBack', 'utilityBill', 'drivingLicence'];
              const allDocs = [...(documentsData || [])];
              const uploadedTypes = new Set(allDocs.map(d => d.type));
              reqDocs.forEach(rd => {
                if (!uploadedTypes.has(rd)) {
                  allDocs.push({
                    id: 'req-' + rd,
                    name: 'KYC - ' + rd,
                    type: rd,
                    uploaded_at: '',
                    is_missing: true
                  } as any);
                }
              });

              if (allDocs.length === 0) return <p className="text-sm text-gray-500">No documents.</p>;

              return allDocs.map(doc => (
                <div key={doc.id} className="rounded-md border border-gray-200 p-3 bg-white flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{doc.name}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {doc.type} {!doc.is_missing ? `· ${new Date(doc.uploaded_at).toLocaleDateString()}` : '· Required'}
                    </div>
                    {!doc.is_missing && (
                      <button onClick={() => downloadDocument(doc.id, doc.original_filename || doc.name || 'document.pdf')} className="text-sm text-blue-600 hover:underline">Download</button>
                    )}
                  </div>
                  <label className="upload text-sm text-blue-600 cursor-pointer">
                    {!doc.is_missing ? 'Replace' : 'Upload'}
                    <input type="file" accept="application/pdf,image/png,image/jpeg" hidden onChange={e => {
                      const file = e.target.files?.[0];
                      if(file) uploadDoc.mutate({ code: doc.type, file });
                    }}/>
                  </label>
                </div>
              ));
            })()}
          </div>
        </div>

        <div>
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-2 gap-2">
            <h3 className="font-semibold">Information Requests</h3>
            {user?.role !== 'client' && data.status === 'in-progress' && (
              <div className="flex flex-wrap gap-2 text-sm">
                <select className="border p-1 rounded" value={requestKind} onChange={e => setRequestKind(e.target.value)}>
                  <option value="text">Text clarification</option>
                  <option value="document">Document</option>
                </select>
                <input 
                  className="border p-1 rounded flex-1 min-w-[150px]" 
                  value={requestLabel} 
                  onChange={e => setRequestLabel(e.target.value)} 
                  placeholder={requestKind === 'document' ? "Document name" : "Information required"}
                />
                {requestKind === 'document' && (
                  <input 
                    className="border p-1 rounded w-32" 
                    value={requestDoc} 
                    onChange={e => setRequestDoc(e.target.value.toUpperCase().replace(/\s+/g, '_'))} 
                    placeholder="Code (e.g. ID_CARD)"
                  />
                )}
                <button 
                  className="btn-sm primary mb-0 whitespace-nowrap" 
                  disabled={!requestLabel.trim() || (requestKind === 'document' && !requestDoc.trim())} 
                  onClick={() => reqInfo.mutate()}
                >
                  Request Info
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {infoRequests.length === 0 && <p className="text-sm text-gray-500">None.</p>}
            {infoRequests.map((r: any) => (
              <div className="request border border-gray-200 rounded p-3 bg-white" key={r.public_id}>
                <b>{r.label}</b>
                <div className="text-xs text-gray-500 mb-2">{r.kind} · {r.status}</div>
                {user?.role === 'client' && r.kind === 'text' && r.status === 'open' && (
                  <textarea 
                    className="w-full mt-2 p-2 border rounded" 
                    placeholder="Your response" 
                    defaultValue={r.response_text || ''} 
                    onBlur={e => {
                      if(e.target.value.trim()) resInfo.mutate({ publicId: r.public_id, text: e.target.value });
                    }}
                  />
                )}
                {user?.role === 'client' && r.kind === 'document' && r.status === 'open' && (
                  <div className="mt-2">
                    <label className="btn-sm primary cursor-pointer mb-0 inline-block">
                      Upload Document
                      <input type="file" accept="application/pdf,image/png,image/jpeg" hidden onChange={e => {
                        const file = e.target.files?.[0];
                        if(file) {
                          const code = r.document_requirement_code || r.label.toUpperCase().replace(/\s+/g, '_');
                          uploadDoc.mutate({ code, file }, {
                            onSuccess: () => {
                              resInfo.mutate({ publicId: r.public_id, text: `Uploaded ${file.name}` });
                            }
                          });
                        }
                      }}/>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
          {user?.role === 'client' && data.status === 'additional-info' && (
            <button className="btn-sm primary mt-2" onClick={() => submitInfo.mutate()}>Submit Info</button>
          )}
          {user?.role !== 'client' && data.status === 'additional-info' && (
            <button className="btn-sm primary mt-2" onClick={() => resolveInfo.mutate()}>Resolve submitted info</button>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Communication</h3>
          <div className="card border rounded p-4 bg-white">
            <div className="thread space-y-3 mb-4">
              {messages?.map(m => (
                <div key={m.id} className={`p-3 rounded-md max-w-[80%] ${m.sender_role === user?.role ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}>
                  <div className="font-semibold text-xs mb-1">{m.sender_name}</div>
                  <p className="text-sm">{m.message}</p>
                  <div className="text-xs text-gray-500 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                className="flex-1 p-2 border rounded" 
                value={msgText} 
                onChange={e => setMsgText(e.target.value)} 
                placeholder="Write a message" 
                onKeyDown={e => { if (e.key === 'Enter' && msgText.trim()) sendMsg.mutate(); }}
              />
              <button className="btn-sm primary mb-0" disabled={!msgText.trim()} onClick={() => sendMsg.mutate()}>Send</button>
            </div>
          </div>
        </div>
      </div>  
    </DetailPanel>  
    </ErrorBoundary>
  );  
};
