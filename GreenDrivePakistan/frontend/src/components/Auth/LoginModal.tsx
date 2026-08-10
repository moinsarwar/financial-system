import { useState } from 'react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ open, onClose, onSuccess }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(false);
    const ok = await login(email.trim(), password.trim());
    setBusy(false);
    if (ok) {
      setEmail('');
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2>
        <i className="fas fa-lock" style={{ color: 'var(--primary)' }} /> Access Portal
      </h2>
      <p className="text-muted">Sign in with your account</p>
      <div className="demo-creds">
        Demo: <code>user@demo.com</code> / <code>vendor@demo.com</code> / <code>admin@demo.com</code>{' '}
        (password in seed)
      </div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <Button
        className="w-full"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        onClick={submit}
        disabled={busy}
      >
        <i className="fas fa-arrow-right" /> Sign In
      </Button>
      {error && (
        <p style={{ color: '#b91c1c', marginTop: 10, fontSize: 14 }}>Invalid credentials.</p>
      )}
    </Modal>
  );
}
