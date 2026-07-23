import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password
        })
      });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await response.json();
      login(data.access_token, data.user);
      
      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(`/owner/${data.user.reseller_id || 1}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px', marginBottom: '100px' }}>
      <div className="card" style={{ padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
        {error && <div className="alert alert-error" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
            Login
          </button>
        </form>

        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>Quick Login For Testing:</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={() => handleQuickLogin('admin@reseller.com', 'admin123')}
              style={{ flex: 1, padding: '8px', fontSize: '13px' }}
            >
              Admin
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={() => handleQuickLogin('ahmed@fincompare.pk', 'ahmed123')}
              style={{ flex: 1, padding: '8px', fontSize: '13px' }}
            >
              Reseller (Ahmed Khan)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
