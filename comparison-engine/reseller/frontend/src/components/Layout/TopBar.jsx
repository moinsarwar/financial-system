import React, { useState } from 'react';  
import { useNavigate, useLocation } from 'react-router-dom';  
import { useAuth } from '../../context/AuthContext';  
  
const TopBar = () => {  
  const { token, role, currentUser, logout } = useAuth();  
  const navigate = useNavigate();  
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);  
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'reseller' || role === 'owner') return `/owner/${currentUser?.reseller_id || 1}`;
    return '/';
  };

  const isDashboardActive = () => {
    return location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner');
  };
  
  return (  
    <header className="topbar">  
      <div className="container">  
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>  
          The Comparison <span>Engine</span>  
          <span className="badge-pk">PK</span>  
        </div>  
        <button   
          className={`hamburger ${isMenuOpen ? 'open' : ''}`}   
          onClick={() => setIsMenuOpen(!isMenuOpen)}  
          aria-label="Toggle navigation"  
        >  
          <span></span><span></span><span></span>  
        </button>  
        <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>  
          <li className={location.pathname === '/' ? 'active' : ''} onClick={() => navigate('/')}>Home</li>  
          
          {!token && (
            <li className={location.pathname === '/login' ? 'active' : ''} onClick={() => navigate('/login')}>Login</li>  
          )}

          {token && (
            <li className={isDashboardActive() ? 'active' : ''} onClick={() => navigate(getDashboardPath())}>My Dashboard</li>  
          )}
        </ul>  
        <div className="nav-actions">  
          {token && (
            <>
              <span className="badge-role" style={{ marginRight: '15px' }}>
                {role === 'admin' ? '🛡️ Admin' : '👤 Reseller'}
              </span>  
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>  
                Logout  
              </button>  
            </>
          )}
        </div>  
      </div>  
    </header>  
  );  
};  
  
export default TopBar;
