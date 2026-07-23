import React from 'react';  
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';  
import Layout from './components/Layout/Layout';  
import Public from './components/Public/Public';  
import AdminDashboard from './components/Admin/AdminDashboard';  
import OwnerDashboard from './components/Owner/OwnerDashboard';  
import Login from './components/Auth/Login';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {  
  return (  
    <BrowserRouter>  
      <Routes>  
        <Route path="/" element={<Layout />}>  
          <Route index element={<Public />} />  
          <Route path="login" element={<Login />} />
          
          <Route path="admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />  
          
          <Route path="owner/:id" element={
            <ProtectedRoute allowedRoles={['reseller', 'owner']}>
              <OwnerDashboard />
            </ProtectedRoute>
          } />  
          
          <Route path="*" element={<Navigate to="/" />} />  
        </Route>  
      </Routes>  
    </BrowserRouter>  
  );  
}  
  
export default App;
