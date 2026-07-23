import React, { createContext, useState, useContext } from 'react';  
  
const AuthContext = createContext();  
  
export const AuthProvider = ({ children }) => {  
  const [currentUser, setCurrentUser] = useState(null); // stores the reseller object  
  const [role, setRole] = useState('public'); // 'public', 'admin', 'owner'  
  
  const loginAsReseller = (reseller) => {  
    setCurrentUser(reseller);  
    setRole('owner');  
  };  
  
  const loginAsAdmin = () => {  
    setRole('admin');  
    setCurrentUser(null);  
  };  
  
  const logout = () => {  
    setCurrentUser(null);  
    setRole('public');  
  };  
  
  return (  
    <AuthContext.Provider value={{ currentUser, role, loginAsReseller, loginAsAdmin, logout }}>  
      {children}  
    </AuthContext.Provider>  
  );  
};  
  
export const useAuth = () => useContext(AuthContext);
