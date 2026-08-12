import React, { createContext, useState, useContext, useEffect } from 'react';  
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();  
  
export const AuthProvider = ({ children }) => {  
  const [currentUser, setCurrentUser] = useState(null); // stores the decoded user object  
  const [role, setRole] = useState('public'); // 'public', 'admin', 'reseller'
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  
  useEffect(() => {
    // If token exists on load, we assume it's valid for now.
    // In a real app, you'd want to verify it against an endpoint.
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setRole(user.role);
      } catch (e) {
        logout();
      }
    }
  }, [token]);

  const login = (newToken, userObj) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userObj));
    setToken(newToken);
    setCurrentUser(userObj);
    setRole(userObj.role);
  };
  
  const logout = () => {  
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);  
    setRole('public');  
  };  
  
  return (  
    <AuthContext.Provider value={{ currentUser, role, token, login, logout }}>  
      {children}  
    </AuthContext.Provider>  
  );  
};  
  
export const useAuth = () => useContext(AuthContext);
