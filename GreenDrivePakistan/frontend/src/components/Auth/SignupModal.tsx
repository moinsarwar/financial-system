import { useRef, useState } from 'react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { registerVendorRequest, uploadDocuments } from '../../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'user' | 'vendor';

export default function SignupModal({ open, onClose, onSuccess }: Props) {
  const { register, login } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('user');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cnic: '',
    phone: '',
    address: '',
    salary: '',
    description: '',
  });
  const [fileList, setFileList] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submitUser = async () => {
    const salary = parseFloat(form.salary) || 0;
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.cnic.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      salary <= 0
    ) {
      alert('Please fill all fields with valid values.');
      return;
    }
    setBusy(true);
    try {
      const ok = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        cnic: form.cnic.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        salary,
      });
      const files = fileRef.current?.files;
      if (ok && files && files.length) {
        try {
          await uploadDocuments(files, 'signup');
        } catch (ue) {
          console.warn(ue);
        }
      }
      if (ok) {
        reset();
        alert('Registration successful!');
        onSuccess();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const submitVendor = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      alert('Business name, email, and password are required.');
      return;
    }
    setBusy(true);
    try {
      await registerVendorRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        description: form.description.trim() || undefined,
      });
      const ok = await login(form.email.trim(), form.password.trim());
      if (ok) {
        reset();
        alert('Vendor registration successful!');
        onSuccess();
      } else {
        alert('Vendor created. Please log in.');
        onClose();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Vendor registration failed');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      cnic: '',
      phone: '',
      address: '',
      salary: '',
      description: '',
    });
    setFileList('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2>
        <i className="fas fa-user-plus" style={{ color: 'var(--primary)' }} /> Register
      </h2>
      <p className="text-muted">
        {mode === 'user'
          ? 'Create your account to apply for financing.'
          : 'Register your business to list green products.'}
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Button
          size="sm"
          variant={mode === 'user' ? 'primary' : 'secondary'}
          onClick={() => setMode('user')}
        >
          Customer
        </Button>
        <Button
          size="sm"
          variant={mode === 'vendor' ? 'primary' : 'secondary'}
          onClick={() => setMode('vendor')}
        >
          Register as vendor
        </Button>
      </div>

      {mode === 'user' ? (
        <>
          <input placeholder="Full Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
          />
          <input
            placeholder="CNIC (e.g. 42101-1234567-8)"
            value={form.cnic}
            onChange={(e) => set('cnic', e.target.value)}
          />
          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
          <input
            placeholder="Home Address"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
          />
          <input
            type="number"
            placeholder="Monthly Salary (PKR)"
            value={form.salary}
            onChange={(e) => set('salary', e.target.value)}
          />
          <div style={{ margin: '8px 0' }}>
            <label style={{ fontWeight: 500 }}>Upload Documents</label>
            <div className="file-upload">
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: 24, color: 'var(--gray)' }} />
              <p>CNIC Copy, Bank Statement, Salary Slip</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.png"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) {
                    setFileList(
                      Array.from(files)
                        .map((f) => `${f.name} (${(f.size / 1024).toFixed(0)} KB)`)
                        .join(', '),
                    );
                  }
                }}
              />
              <Button variant="secondary" size="sm" type="button" onClick={() => fileRef.current?.click()}>
                Select Files
              </Button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray)' }}>{fileList}</div>
          </div>
          <Button
            className="w-full"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={submitUser}
            disabled={busy}
          >
            <i className="fas fa-user-check" /> Register
          </Button>
        </>
      ) : (
        <>
          <input
            placeholder="Business / Vendor Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
          <input
            type="email"
            placeholder="Business Email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
          />
          <textarea
            placeholder="Short description of your business"
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
          <Button
            className="w-full"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={submitVendor}
            disabled={busy}
          >
            <i className="fas fa-store" /> Register as Vendor
          </Button>
        </>
      )}
    </Modal>
  );
}
