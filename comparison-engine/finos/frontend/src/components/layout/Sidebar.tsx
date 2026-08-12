import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { can } from '../../utils/permissions';

interface User { role: string; }
interface Props { user: User | null; currentPath: string; open: boolean; onClose: () => void; }

const navItems = {
  operations: [
    { to: '/dashboard', label: '📊 Dashboard' },
    { to: '/dashboard/clients', label: '👤 Clients' },
    { to: '/dashboard/applications', label: '📋 Applications' },
    { to: '/dashboard/claims', label: '📄 Claims' },
    { to: '/dashboard/products', label: '📦 Products' },
    { to: '/dashboard/documents', label: '📁 Documents' },
    { to: '/dashboard/activity', label: '📜 Activity' },
    // { to: '/dashboard/claim-vault', label: '🧪 ClaimVault Simulation' },
  ],
  client: [
    { to: '/dashboard', label: '📊 Dashboard' },
    { to: '/dashboard/applications', label: '📋 My Applications' },
    { to: '/dashboard/claims', label: '📄 My Claims' },
    { to: '/dashboard/products', label: '📦 My Products' },
    { to: '/dashboard/documents', label: '📁 My Documents' },
    { to: '/dashboard/activity', label: '📜 Activity' },
  ],
};

export const Sidebar: React.FC<Props> = ({ user, currentPath, open, onClose }) => {
  // removed unused navigate  
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!user) return null;
  const role = user?.role?.toLowerCase() === 'client' ? 'client' : 'operations';
  const rawItems = navItems[role] || [];
  const filtered = rawItems.filter(item => {
    if (item.to === '/dashboard/activity') {
      return can(user.role, 'activity.read_all');
    }
    return true;
  });

  const content = (
    <div className="bg-gray-50 border-r border-gray-200 h-full w-48 p-3">
      {filtered.map(item => {
        const isExternal = item.to === '/dashboard/claim-vault';
        const linkClass = clsx(
          'block px-3 py-2 rounded-md text-sm font-medium transition',
          currentPath === item.to ? 'bg-accent-soft text-primary border-r-2 border-accent' : 'text-gray-600 hover:bg-gray-100'
        );
        if (isExternal) {
          return (
            <a key={item.to} href={item.to} onClick={onClose} className={linkClass}>
              {item.label}
            </a>
          );
        }
        return (
          <Link key={item.to} to={item.to} onClick={onClose} className={linkClass}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  if (window.innerWidth < 640) {
    return (
      <>
        <div className={clsx('fixed inset-0 bg-black/30 z-40', open ? 'block' : 'hidden')} onClick={onClose} />
        <div className={clsx('fixed left-0 top-0 h-full z-50 transform transition-transform duration-300', open ? 'translate-x-0' : '-translate-x-full')}>
          {content}
        </div>
      </>
    );
  }
  return content;
};
