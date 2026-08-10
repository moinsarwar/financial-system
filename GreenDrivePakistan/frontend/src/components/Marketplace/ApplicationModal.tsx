import { useRef, useState } from 'react';
import type { Product } from '../../types';
import { api, formatCurrency, uploadDocuments } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../Common/Modal';
import Button from '../Common/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  monthly: number;
  down: number;
  onSubmitted: () => void;
}

export default function ApplicationModal({
  open,
  onClose,
  product,
  monthly,
  down,
  onSubmitted,
}: Props) {
  const { refreshScoped } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [income, setIncome] = useState('');
  const [employment, setEmployment] = useState('');
  const [bills, setBills] = useState('15000');
  const [notes, setNotes] = useState('');
  const [fileMsg, setFileMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (!product) return null;

  const submit = async () => {
    const incomeNum = parseFloat(income) || 0;
    if (incomeNum <= 0) {
      alert('Please enter your monthly income.');
      return;
    }
    setBusy(true);
    try {
      const created = await api<{ id: number }>('/applications/', {
        method: 'POST',
        body: {
          product_id: product.id,
          application_details: {
            monthly_income: incomeNum,
            employment: employment.trim() || 'Not specified',
            existing_bills: bills.trim() || 'Not specified',
            notes: notes.trim() || '',
          },
        },
      });
      const files = fileRef.current?.files;
      if (files && files.length) {
        try {
          await uploadDocuments(files, 'application', created.id);
        } catch (ue) {
          console.warn(ue);
        }
      }
      setIncome('');
      setEmployment('');
      setBills('15000');
      setNotes('');
      setFileMsg('');
      if (fileRef.current) fileRef.current.value = '';
      await refreshScoped();
      alert(`✅ Application submitted for "${product.name}". Your journey has started!`);
      onSubmitted();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to submit application');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2>
        <i className="fas fa-file-invoice" style={{ color: 'var(--primary)' }} /> Complete Application
      </h2>
      <p className="text-muted">Provide additional details for financing approval.</p>
      <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 12, margin: '8px 0' }}>
        <strong>{product.name}</strong>
        <br />
        Price: {formatCurrency(product.price)} | Down: {formatCurrency(down)} | Installment:{' '}
        {formatCurrency(monthly)}/mo
        <br />
        <span className="text-muted">{product.description}</span>
      </div>
      <input
        type="number"
        placeholder="Monthly Income (PKR)"
        value={income}
        onChange={(e) => setIncome(e.target.value)}
      />
      <input
        placeholder="Employment Status (e.g. Salaried, Business)"
        value={employment}
        onChange={(e) => setEmployment(e.target.value)}
      />
      <input
        placeholder="Existing Monthly Bills (Electricity, Fuel, etc.)"
        value={bills}
        onChange={(e) => setBills(e.target.value)}
      />
      <textarea
        placeholder="Additional notes"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div style={{ margin: '8px 0' }}>
        <label style={{ fontWeight: 500 }}>Upload Additional Documents (optional)</label>
        <div className="file-upload">
          {fileMsg ? (
            <p>
              <i className="fas fa-check-circle" style={{ color: 'var(--primary)' }} /> {fileMsg}
            </p>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: 24, color: 'var(--gray)' }} />
              <p>Any supporting documents</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.png"
            onChange={(e) => {
              if (e.target.files?.length) {
                setFileMsg(`${e.target.files.length} file(s) selected.`);
              }
            }}
          />
          <Button variant="secondary" size="sm" type="button" onClick={() => fileRef.current?.click()}>
            Select Files
          </Button>
        </div>
      </div>
      <Button
        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        onClick={submit}
        disabled={busy}
      >
        <i className="fas fa-paper-plane" /> Submit Application
      </Button>
    </Modal>
  );
}
