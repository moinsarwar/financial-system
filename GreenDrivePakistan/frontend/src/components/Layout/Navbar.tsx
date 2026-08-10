import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../Auth/LoginModal';
import SignupModal from '../Auth/SignupModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-btn${isActive ? ' active' : ''}`;

  const closeMenu = () => setMenuOpen(false);

  const goDashboard = () => {
    closeMenu();
    if (!user) {
      setLoginOpen(true);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <i className="fas fa-leaf" /> GreenDrive
          <span style={{ color: 'var(--secondary)' }}>.pk</span>
        </div>
        <div className="nav-actions">
          {user && (
            <span className="user-badge">
              <i className="fas fa-user-check" /> <span>{user.name}</span>
            </span>
          )}
          {!user && (
            <>
              <button
                type="button"
                className="nav-btn"
                style={{
                  padding: '6px 16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: 40,
                  fontWeight: 600,
                }}
                onClick={() => setLoginOpen(true)}
              >
                <i className="fas fa-sign-in-alt" /> <span className="hide-mobile">Login</span>
              </button>
              <button
                type="button"
                className="nav-btn"
                style={{
                  padding: '6px 16px',
                  background: 'var(--secondary)',
                  color: '#fff',
                  borderRadius: 40,
                  fontWeight: 600,
                }}
                onClick={() => setSignupOpen(true)}
              >
                <i className="fas fa-user-plus" /> <span className="hide-mobile">Sign Up</span>
              </button>
            </>
          )}
          {user && (
            <button
              type="button"
              className="nav-btn"
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: 40,
                padding: '6px 14px',
              }}
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <i className="fas fa-sign-out-alt" />
            </button>
          )}
          <button
            type="button"
            className="hamburger"
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <i className="fas fa-bars" /> <span className="menu-label">Menu</span>
          </button>
        </div>
        <div className={`nav-links${menuOpen ? ' open' : ''}`}>
          <NavLink to="/" end className={linkClass} onClick={closeMenu}>
            <i className="fas fa-home" /> Home
          </NavLink>
          <NavLink to="/about" className={linkClass} onClick={closeMenu}>
            <i className="fas fa-info-circle" /> About
          </NavLink>
          <NavLink to="/marketplace" className={linkClass} onClick={closeMenu}>
            <i className="fas fa-boxes" /> Marketplace
          </NavLink>
          <NavLink to="/compare" className={linkClass} onClick={closeMenu}>
            <i className="fas fa-chart-line" /> Compare
          </NavLink>
          <NavLink to="/faq" className={linkClass} onClick={closeMenu}>
            <i className="fas fa-question-circle" /> FAQ
          </NavLink>
          <NavLink to="/ecosystem" className={linkClass} onClick={closeMenu}>
            <i className="fas fa-sitemap" /> Ecosystem
          </NavLink>
          <NavLink to="/legal" className={linkClass} onClick={closeMenu}>
            <i className="fas fa-gavel" /> Legal
          </NavLink>
          {user && (
            <>
              <hr style={{ margin: '4px 0', borderColor: '#eef2f6' }} />
              {user.role === 'user' && (
                <button type="button" className="nav-btn" onClick={goDashboard}>
                  <i className="fas fa-user-circle" /> My Journey
                </button>
              )}
              {user.role === 'vendor' && (
                <button type="button" className="nav-btn" onClick={goDashboard}>
                  <i className="fas fa-store" /> Vendor
                </button>
              )}
              {user.role === 'admin' && (
                <button type="button" className="nav-btn" onClick={goDashboard}>
                  <i className="fas fa-crown" /> Super Admin
                </button>
              )}
            </>
          )}
        </div>
      </nav>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          navigate('/dashboard');
        }}
      />
      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSuccess={() => {
          setSignupOpen(false);
          navigate('/dashboard');
        }}
      />
    </>
  );
}
