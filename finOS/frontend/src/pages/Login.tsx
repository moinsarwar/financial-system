import React, { useState } from 'react';  
import { useAuth } from '../contexts/AuthContext';  
import { useNavigate } from 'react-router-dom';  
import toast from 'react-hot-toast';  
  
export const Login: React.FC = () => {  
  const [email, setEmail] = useState('client@finos.com');  
  const [password, setPassword] = useState('password123');  
  const [error, setError] = useState('');  
  const [role, setRole] = useState<'client' | 'operations'>('client');  
  const { login } = useAuth();  
  const navigate = useNavigate();  
  
  const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();  
    setError('');  
    try {  
      await login(email, password);  
      toast.success('Welcome back!');  
      navigate('/dashboard');  
    } catch (err: any) {  
      const msg = err.response?.data?.detail || 'Login failed';  
      setError(msg);  
      toast.error(msg);  
    }  
  };  
  
  const quickLogin = async (target: 'client' | 'operations') => {  
    const creds = target === 'client'  
      ? { email: 'client@finos.com', password: 'password123' }  
      : { email: 'ops@finos.com', password: 'password123' };  
    setRole(target === 'client' ? 'client' : 'operations');  
    setEmail(creds.email);  
    setPassword(creds.password);  
    setError('');  
    try {  
      await login(creds.email, creds.password);  
      toast.success('Welcome back!');  
      navigate('/dashboard');  
    } catch (err: any) {  
      const msg = err.response?.data?.detail || 'Login failed';  
      setError(msg);  
      toast.error(msg);  
    }  
  };  
  
  return (  
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">  
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md border-t-4 border-accent p-8">  
        <h1 className="text-2xl font-extrabold text-primary">FinOS</h1>  
        <p className="text-gray-400 mb-6">Client &amp; Operations Portal</p>  
        <div className="flex gap-2 mb-4">  
          <button  
            onClick={() => setRole('client')}  
            className={`flex-1 py-2 px-4 rounded-full border-2 font-semibold text-sm transition ${  
              role === 'client' ? 'border-accent bg-accent-soft text-primary' : 'border-gray-200 text-gray-600'  
            }`}  
          >  
            👤 Client  
          </button>  
          <button  
            onClick={() => setRole('operations')}  
            className={`flex-1 py-2 px-4 rounded-full border-2 font-semibold text-sm transition ${  
              role === 'operations' ? 'border-accent bg-accent-soft text-primary' : 'border-gray-200 text-gray-600'  
            }`}  
          >  
            ⚙️ Operations  
          </button>  
        </div>  
        <form onSubmit={handleSubmit}>  
          <div className="mb-4">  
            <label className="form-label">Email</label>  
            <input  
              type="email"  
              value={email}  
              onChange={(e) => setEmail(e.target.value)}  
              className="form-input"  
            />  
          </div>  
          <div className="mb-6">  
            <label className="form-label">Password</label>  
            <input  
              type="password"  
              value={password}  
              onChange={(e) => setPassword(e.target.value)}  
              className="form-input"  
            />  
          </div>  
          {error && <div className="text-danger text-sm mb-4">{error}</div>}  
          <button type="submit" className="w-full bg-primary text-white py-3 rounded-full font-bold hover:bg-primary-light transition">  
            Sign In  
          </button>  
        </form>  
        <div className="flex gap-2 mt-4">  
          <button  
            onClick={() => quickLogin('client')}  
            className="flex-1 py-2 border-2 border-gray-200 rounded-full font-semibold text-sm hover:border-accent hover:bg-accent-soft transition"  
          >  
            👤 Client Login  
          </button>  
          <button  
            onClick={() => quickLogin('operations')}  
            className="flex-1 py-2 border-2 border-gray-200 rounded-full font-semibold text-sm hover:border-accent hover:bg-accent-soft transition"  
          >  
            ⚙️ Ops Login  
          </button>  
        </div>  
        <div className="mt-4 text-xs text-gray-400 bg-gray-50 p-3 rounded-md border border-gray-200 text-center">  
          <strong>🔑 One‑Click Login</strong><br />  
          Click <strong>Client Login</strong> or <strong>Ops Login</strong> above – no typing required.  
        </div>  
      </div>  
    </div>  
  );  
};
