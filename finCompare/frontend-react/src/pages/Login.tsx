import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy login
    navigate('/dashboard');
  };

  return (
    <div className="login-container" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <div className="login-box" style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#0a1e2f' }}>FinCompare Admin</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dce2ec' }}
              placeholder="admin@fincompare.pk"
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dce2ec' }}
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" style={{ background: '#0088cc', color: 'white', padding: '14px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
