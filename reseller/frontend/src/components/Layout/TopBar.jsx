import React, { useState } from 'react';  
import { Link, useNavigate, useLocation } from 'react-router-dom';  
import { useAuth } from '../../context/AuthContext';  
  
const TopBar = () => {  
  const { role, logout } = useAuth();  
  const navigate = useNavigate();  
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);  
  
  const handleSwitchView = () => {  
    if (role === 'public') navigate('/admin');  
    else if (role === 'admin') navigate('/owner/1'); // default to Ahmed  
    else if (role === 'owner') navigate('/');  
  };  
  
  const getRoleLabel = () => {  
    if (role === 'public') return '🌐 Public';  
    if (role === 'admin') return '🛡️ Admin';  
    if (role === 'owner') return '👤 Reseller Owner';  
    return '🌐 Public';  
  };  
  
  return (  
    <header className="topbar">  
      <div className="container">  
        <div className="logo">  
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
          <li className={location.pathname.startsWith('/admin') ? 'active' : ''} onClick={() => navigate('/admin')}>Admin</li>  
          <li className={location.pathname.startsWith('/owner') ? 'active' : ''} onClick={() => navigate('/owner/1')}>My Dashboard</li>  
        </ul>  
        <div className="nav-actions">  
          <span className="badge-role">{getRoleLabel()}</span>  
          <button className="btn btn-secondary btn-sm" onClick={handleSwitchView}>  
            Switch View  
          </button>  
        </div>  
      </div>  
    </header>  
  );  
};  
  
export default TopBar;
