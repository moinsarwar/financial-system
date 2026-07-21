import React from 'react';  
import { useNavigate } from 'react-router-dom';  
import { useAuth } from '../../contexts/AuthContext';  
import { getInitials } from '../../utils/helpers';  
  
interface User { full_name: string; role: string; id: string; }  
interface Props { user: User | null; onMenuToggle: () => void; }  
  
export const Header: React.FC<Props> = ({ user, onMenuToggle }) => {  
  const { logout } = useAuth();  
  const navigate = useNavigate();  
  if (!user) return null;  
  return (  
    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">  
      <div className="flex items-center gap-3">  
        <button onClick={onMenuToggle} className="sm:hidden text-2xl text-gray-600">☰</button>  
        <span className="text-xl font-extrabold text-primary">FinOS <span className="text-gray-400 font-normal">v9.0</span></span>  
        <span className="bg-accent-soft text-accent px-3 py-0.5 rounded-full text-xs font-semibold hidden sm:inline">  
          {user.role === 'client' ? 'Client Portal' : user.role === 'super_admin' ? 'Company Admin Portal' : 'Operations Portal'}  
        </span>  
      </div>  
      <div className="flex items-center gap-4 text-sm">  
        <span className="hidden sm:inline">{user.full_name}</span>  
        <span className="bg-gray-200 px-3 py-0.5 rounded-full text-xs font-semibold">{user.role}</span>  
        <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">  
          {getInitials(user.full_name)}  
        </div>  
        <button onClick={() => { logout(); navigate('/login'); }} className="text-danger font-semibold hover:underline">Logout</button>  
      </div>  
    </div>  
  );  
};
