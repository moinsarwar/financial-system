import {useMemo,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api/client';
import {useAuth} from '../context/AuthContext';

const products=['car-loan','personal-loan','mortgage','health-insurance','accident-insurance','life-insurance','credit-card','bank-account'];
const docs={
  individual:['CNIC Copy','Application Form','Proof of Address','Income Proof','Source of Funds Declaration','Tax Residency & FATCA/CRS','Specimen Signature','Nominee Information'],
  joint:['CNIC Copy','Application Form','Proof of Address','Income Proof','Source of Funds Declaration','Tax Residency & FATCA/CRS','Specimen Signature','Nominee Information','Joint Applicant Details'],
  business:['CNIC Copy','Application Form','Business Registration Certificate','Constitutional Documents','Tax Registration (NTN)','Beneficial Owner Declaration','Authority Mandates','Proof of Address (Business)']
};
const initial={product_type:'car-loan',applicant_cnic:'35202-1234567-1',amount:'',details:'',account_type:'savings',account_holder:'individual',account_mode:'islamic',expected_turnover:'',preferred_branch:'',cheque_book:true,debit_card:true,digital_banking:true,purpose:''};

export default function NewApplication(){
  const {user}=useAuth();
  const nav=useNavigate();
  const [f,setF]=useState(initial);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const bank=f.product_type==='bank-account';
  const requiredDocs=useMemo(()=>bank?docs[f.account_holder]:[],[bank,f.account_holder]);
  const update=(key,value)=>setF(x=>({...x,[key]:value}));

  async function submit(e){
    e.preventDefault(); setError(''); setSaving(true);
    try{
      const payload={product_type:f.product_type,amount:f.amount===''?null:f.amount,details:f.details||null};
      if(user.role==='admin')payload.applicant_cnic=f.applicant_cnic;
      if(bank)payload.account_data={account_type:f.account_type,account_holder:f.account_holder,account_mode:f.account_mode,expected_turnover:f.expected_turnover||0,preferred_branch:f.preferred_branch,cheque_book:f.cheque_book,debit_card:f.debit_card,digital_banking:f.digital_banking,purpose:f.purpose};
      const r=await api.post('/applications',payload);
      nav('/applications/'+r.data.application_number);
    }catch(err){setError(err.response?.data?.detail?.[0]?.msg||err.response?.data?.detail||'Could not create application.');}
    finally{setSaving(false);}
  }

  return <form className="card form" onSubmit={submit}>
    <h2>New application</h2>
    {error&&<p className="error">{String(error)}</p>}
    <div className="formgrid">
      <label>Product<select value={f.product_type} onChange={e=>update('product_type',e.target.value)}>{products.map(x=><option key={x} value={x}>{x.replaceAll('-',' ')}</option>)}</select></label>
      {user.role==='admin'&&<label>Applicant CNIC<input pattern="\d{5}-\d{7}-\d" maxLength="15" value={f.applicant_cnic} onChange={e=>update('applicant_cnic',e.target.value)} required/></label>}
      <label>{bank?'Expected initial deposit':'Amount / limit'}<input type="number" min={bank?0:1} value={f.amount} required={!bank} onChange={e=>update('amount',e.target.value)}/></label>
    </div>
    {bank&&<>
      <div className="formgrid">
        <label>Account type<select value={f.account_type} onChange={e=>update('account_type',e.target.value)}>{['savings','current','basic','salary','freelancer','business'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Account holder<select value={f.account_holder} onChange={e=>update('account_holder',e.target.value)}>{['individual','joint','business'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Mode<select value={f.account_mode} onChange={e=>update('account_mode',e.target.value)}><option value="conventional">Conventional</option><option value="islamic">Islamic</option></select></label>
        <label>Expected monthly turnover<input type="number" min="0" value={f.expected_turnover} onChange={e=>update('expected_turnover',e.target.value)}/></label>
        <label>Preferred branch<input value={f.preferred_branch} onChange={e=>update('preferred_branch',e.target.value)}/></label>
      </div>
      <div className="checks">
        <label><input type="checkbox" checked={f.cheque_book} onChange={e=>update('cheque_book',e.target.checked)}/> Cheque book</label>
        <label><input type="checkbox" checked={f.debit_card} onChange={e=>update('debit_card',e.target.checked)}/> Debit card</label>
        <label><input type="checkbox" checked={f.digital_banking} onChange={e=>update('digital_banking',e.target.checked)}/> Digital banking</label>
      </div>
      <label>Purpose<textarea value={f.purpose} onChange={e=>update('purpose',e.target.value)}/></label>
      <div className="docpreview"><b>Required documents</b>{requiredDocs.map(x=><span key={x}>✓ {x}</span>)}</div>
    </>}
    <label>Additional details<textarea value={f.details} onChange={e=>update('details',e.target.value)}/></label>
    <button disabled={saving}>{saving?'Creating…':'Create application'}</button>
  </form>;
}
