import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'react-router-dom';
import api from '../api/client';
import {useAuth} from '../context/AuthContext';

const labels={draft:'Draft',submitted:'Submitted',review:'Under Review','eligibility-check':'Eligibility Check','credit-assessment':'Credit Assessment','offer-issued':'Offer Issued',accepted:'Accepted',disbursed:'Disbursed',underwriting:'Underwriting',quoted:'Quoted','policy-issued':'Policy Issued','identity-check':'Identity Check',approved:'Approved','card-issued':'Card Issued',activated:'Activated','kyc-validation':'KYC Validation','compliance-screening':'Compliance Screening','account-created':'Account Created','additional-info':'Additional Information Required',rejected:'Rejected'};
const flows={loan:['draft','submitted','review','eligibility-check','credit-assessment','offer-issued','accepted','disbursed'],insurance:['draft','submitted','review','underwriting','quoted','accepted','policy-issued'],card:['draft','submitted','review','identity-check','credit-assessment','approved','card-issued','activated'],bank:['draft','submitted','review','kyc-validation','compliance-screening','approved','account-created','activated']};

export default function ApplicationDetail(){
  const {number}=useParams(); const {user}=useAuth();
  const [a,setA]=useState(null),[messages,setMessages]=useState([]),[msg,setMsg]=useState(''),[error,setError]=useState('');
  const [requestKind,setRequestKind]=useState('text'),[requestLabel,setRequestLabel]=useState(''),[requestDoc,setRequestDoc]=useState('');
  const load=async()=>{try{const [appRes,msgRes]=await Promise.all([api.get('/applications/'+number),api.get(`/applications/${number}/messages`)]);setA(appRes.data);setMessages(msgRes.data);await api.post(`/applications/${number}/messages/read`);}catch(e){setError(e.response?.data?.detail||'Could not load application.')}};
  useEffect(()=>{load()},[number]);
  const flow=useMemo(()=>{if(!a)return[];const key=a.product_type==='bank-account'?'bank':a.product_type==='credit-card'?'card':a.product_type.includes('insurance')?'insurance':'loan';return flows[key]},[a]);
  if(error&&!a)return <p className="error">{String(error)}</p>; if(!a)return <p>Loading…</p>;
  const idx=flow.indexOf(a.status),terminal=['disbursed','policy-issued','activated','rejected'].includes(a.status);
  const pendingDocs=a.documents.filter(d=>!['uploaded','verified'].includes(d.status));
  async function act(fn){setError('');try{await fn();await load()}catch(e){setError(typeof e.response?.data?.detail==='string'?e.response.data.detail:JSON.stringify(e.response?.data?.detail||'Action failed.'))}}
  async function advance(){if(idx>=0&&idx<flow.length-1)await act(()=>api.post(`/applications/${number}/status`,{status:flow[idx+1],expected_version:a.version}));}
  async function requestInfo(){const item=requestKind==='document'?{kind:'document',label:a.documents.find(d=>d.requirement_code===requestDoc)?.display_name||'Requested document',document_requirement_code:requestDoc}:{kind:'text',label:requestLabel};await act(()=>api.post(`/applications/${number}/information-requests`,{items:[item]}));setRequestLabel('');setRequestDoc('');}
  async function send(){await act(()=>api.post(`/applications/${number}/messages`,{message:msg}));setMsg('');}
  async function downloadDoc(d){try{const r=await api.get(`/applications/${number}/documents/${d.requirement_code}/download`,{responseType:'blob'});const url=URL.createObjectURL(r.data);const link=document.createElement('a');link.href=url;link.download=d.original_name||d.display_name;link.click();URL.revokeObjectURL(url)}catch(e){setError(e.response?.data?.detail||'Download failed.')}}
  return <>
    <div className="detailhead"><div><h2>{a.application_number}</h2><p>{a.product_label} · {a.applicant_name}</p></div><span className="badge big">{labels[a.status]||a.status}</span></div>
    {error&&<p className="error">{String(error)}</p>}
    <div className="progressline">{flow.map((s,i)=><div key={s} className={(i<idx?'done ':i===idx?'active ':'')+'progressstep'}><span>{i+1}</span><small>{labels[s]}</small></div>)}</div>
    {user.role==='admin'&&<div className="actions">
      <button disabled={terminal||a.status==='additional-info'||idx<0||idx===flow.length-1} onClick={advance}>Advance</button>
      <button className="danger" disabled={terminal} onClick={()=>act(()=>api.post(`/applications/${number}/status`,{status:'rejected',expected_version:a.version,reason:'Rejected by administrator'}))}>Reject</button>
      <select value={requestKind} onChange={e=>setRequestKind(e.target.value)}><option value="text">Text clarification</option><option value="document">Document</option></select>
      {requestKind==='text'?<input value={requestLabel} onChange={e=>setRequestLabel(e.target.value)} placeholder="Information required"/>:<select value={requestDoc} onChange={e=>setRequestDoc(e.target.value)}><option value="">Choose document</option>{a.documents.map(d=><option value={d.requirement_code} key={d.id}>{d.display_name} · {d.status}</option>)}</select>}
      <button disabled={terminal||a.status==='additional-info'||(requestKind==='text'?!requestLabel.trim():!requestDoc)} onClick={requestInfo}>Request information</button>
      {a.status==='additional-info'&&<button onClick={()=>act(()=>api.post(`/applications/${number}/information-requests/resolve`))}>Resolve submitted info</button>}
    </div>}
    {user.role==='applicant'&&a.status==='draft'&&<button onClick={()=>act(()=>api.post(`/applications/${number}/submit`))}>Submit application</button>}
    {user.role==='applicant'&&a.status==='additional-info'&&<button onClick={()=>act(()=>api.post(`/applications/${number}/information-requests/submit`))}>Submit additional information</button>}
    <div className="grid">
      <div className="card"><h3>Application</h3><p><b>Amount:</b> {a.amount?`PKR ${Number(a.amount).toLocaleString()}`:'Not specified'}</p><p><b>Details:</b> {a.details||'—'}</p>{a.account_data&&Object.entries(a.account_data).map(([k,v])=><p key={k}><b>{k.replaceAll('_',' ')}:</b> {typeof v==='boolean'?(v?'Yes':'No'):String(v)}</p>)}</div>
      <div className="card"><h3>Status history</h3>{a.status_events.map(e=><div className="event" key={e.id}><b>{labels[e.to_status]||e.to_status}</b><small>{new Date(e.created_at).toLocaleString()}</small><span>{e.reason||''}</span></div>)}</div>
      <div className="card"><h3>Documents</h3>{a.documents.map(d=><div className="doc" key={d.id}><div><b>{d.display_name}</b><small>{d.status}</small>{d.original_name&&<button className="textbutton" type="button" onClick={()=>downloadDoc(d)}>Download</button>}</div><label className="upload">{d.status==='required'?'Upload':'Replace'}<input type="file" accept="application/pdf,image/png,image/jpeg" hidden onChange={e=>{const file=e.target.files?.[0];if(file)act(async()=>{const fd=new FormData();fd.append('file',file);await api.post(`/applications/${number}/documents/${d.requirement_code}`,fd)})}}/></label></div>)}</div>
      <div className="card"><h3>Information requests</h3>{a.info_requests.length===0&&<p>None.</p>}{a.info_requests.map(r=><div className="request" key={r.public_id}><b>{r.label}</b><small>{r.kind} · {r.status}</small>{user.role==='applicant'&&r.kind==='text'&&r.status==='open'&&<textarea placeholder="Your response" defaultValue={r.response_text||''} onBlur={e=>{if(e.target.value.trim())act(()=>api.post(`/applications/${number}/information-requests/${r.public_id}/response`,{response_text:e.target.value}))}}/>}</div>)}</div>
    </div>
    <div className="card"><h3>Communication</h3><div className="thread">{messages.map(m=><div key={m.id} className={'bubble '+(m.sender_role===user.role?'outgoing':'incoming')}><b>{m.sender_name}</b><p>{m.message}</p><small>{new Date(m.created_at).toLocaleString()}</small></div>)}</div><div className="row"><input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Write a message" onKeyDown={e=>{if(e.key==='Enter'&&msg.trim())send()}}/><button disabled={!msg.trim()} onClick={send}>Send</button></div></div>
  </>;
}
