import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';  
import { login as apiLogin, getMe, logout as apiLogout } from '../api/auth';  
import { useQueryClient } from '@tanstack/react-query';  
  
interface User {  
  id: string;  
  full_name: string;  
  email: string;  
  role: string;  
  client_id: string | null;  
}  
  
interface AuthContextType {  
  user: User | null;  
  isAuthenticated: boolean;  
  login: (email: string, password: string) => Promise<void>;  
  logout: () => void;  
  loading: boolean;  
}  
  
const AuthContext = createContext<AuthContextType | undefined>(undefined);  
  
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {  
  const [user, setUser] = useState<User | null>(null);  
  const [loading, setLoading] = useState(true);  
  const queryClient = useQueryClient();  
  
  useEffect(() => {  
    const token = localStorage.getItem('access_token');  
    if (token) {  
      getMe()  
        .then((data) => {  
          setUser({  
            id: data.id,  
            full_name: data.full_name,  
            email: data.email,  
            role: data.role,  
            client_id: data.client_id,  
          });  
        })  
        .catch(() => {  
          localStorage.removeItem('access_token');  
          localStorage.removeItem('user');  
        })  
        .finally(() => setLoading(false));  
    } else {  
      setLoading(false);  
    }  
  }, []);  
  
  const login = async (email: string, password: string) => {  
    const response = await apiLogin({ email, password });  
    const userData: User = {  
      id: response.user_id,  
      full_name: response.full_name,  
      email,  
      role: response.role,  
      client_id: response.client_id,  
    };  
    localStorage.setItem('access_token', response.access_token);  
    localStorage.setItem('user', JSON.stringify(userData));  
    setUser(userData);  
  };  
  
  const logout = () => {  
    apiLogout();  
    setUser(null);  
    queryClient.clear();  
  };  
  
  return (  
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>  
      {children}  
    </AuthContext.Provider>  
  );  
};  
  
export const useAuth = () => {  
  const context = useContext(AuthContext);  
  if (!context) throw new Error('useAuth must be used within AuthProvider');  
  return context;  
};
