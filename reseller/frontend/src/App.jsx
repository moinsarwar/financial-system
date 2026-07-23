import React from 'react';  
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';  
import Layout from './components/Layout/Layout';  
import Public from './components/Public/Public';  
import AdminDashboard from './components/Admin/AdminDashboard';  
import OwnerDashboard from './components/Owner/OwnerDashboard';  
  
function App() {  
  return (  
    <BrowserRouter>  
      <Routes>  
        <Route path="/" element={<Layout />}>  
          <Route index element={<Public />} />  
          <Route path="admin" element={<AdminDashboard />} />  
          <Route path="owner/:id" element={<OwnerDashboard />} />  
          <Route path="*" element={<Navigate to="/" />} />  
        </Route>  
      </Routes>  
    </BrowserRouter>  
  );  
}  
  
export default App;
