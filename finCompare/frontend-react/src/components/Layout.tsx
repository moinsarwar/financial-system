import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, LogOut, ChevronLeft, Menu } from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { path: '/products', label: 'Products', icon: <PackageSearch size={20} /> },
  ];

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && <h3>FinOS <span style={{color: '#f5a623'}}>v7.1</span></h3>}
          {!sidebarOpen && <h3>F</h3>}
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <ul className="sidebar-menu">
          <li className="menu-category">{sidebarOpen ? 'MAIN MENU' : '---'}</li>
          {menuItems.map(item => (
            <li key={item.path}>
              <Link to={item.path} className={location.pathname === item.path ? 'active' : ''}>
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <Link to="/login" className="logout-btn">
            <LogOut size={20} />
            {sidebarOpen && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <h2>{location.pathname === '/' ? 'Home' : location.pathname.split('/').pop()?.toUpperCase()}</h2>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="avatar">A</div>
              <div className="user-info">
                <span className="user-name">Admin User</span>
                <span className="user-role">System Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
