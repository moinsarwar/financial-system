import React from 'react';  
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';  
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';  
import { Toaster } from 'react-hot-toast';  
import { AuthProvider, useAuth } from './contexts/AuthContext';  
import { Layout } from './components/layout/Layout';  
import { Login } from './pages/Login';  
import { Dashboard } from './pages/Dashboard';  
import { Clients } from './pages/Clients';  
import { ClientDetail } from './pages/ClientDetail';  
import { Applications } from './pages/Applications';  
import { ApplicationDetail } from './pages/ApplicationDetail';  
import { Claims } from './pages/Claims';  
import { ClaimDetail } from './pages/ClaimDetail';  
import { Products } from './pages/Products';  
import { ProductDetail } from './pages/ProductDetail';  
import { Documents } from './pages/Documents';  
import { DocumentDetail } from './pages/DocumentDetail';  
import { Activity } from './pages/Activity';  
import { UnifiedApplication } from './pages/UnifiedApplication';
  
const queryClient = new QueryClient({  
  defaultOptions: {  
    queries: {  
      retry: 1,  
      refetchOnWindowFocus: false,  
      staleTime: 15_000,  
    },  
  },  
});  
  
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
  const { isAuthenticated, loading } = useAuth();  
  if (loading) return <div className="p-8 text-center">Loading...</div>;  
  if (!isAuthenticated) return <Navigate to="/login" replace />;  
  return <>{children}</>;  
};  
  
export const App: React.FC = () => (  
  <QueryClientProvider client={queryClient}>  
    <AuthProvider>  
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />  
      <BrowserRouter>  
        <Routes>  
          <Route path="/login" element={<Login />} />  
          <Route  
            path="/*"  
            element={  
              <ProtectedRoute>  
                <Layout />  
              </ProtectedRoute>  
            }  
          >  
            <Route index element={<Dashboard />} />  
            <Route path="clients" element={<Clients />} />  
            <Route path="clients/:id" element={<ClientDetail />} />  
            <Route path="applications" element={<Applications />} />  
            <Route path="applications/:id" element={<ApplicationDetail />} />  
            <Route path="claims" element={<Claims />} />  
            <Route path="claims/:id" element={<ClaimDetail />} />  
            <Route path="products" element={<Products />} />  
            <Route path="products/:id" element={<ProductDetail />} />  
            <Route path="documents" element={<Documents />} />  
            <Route path="documents/:id" element={<DocumentDetail />} />  
            <Route path="activity" element={<Activity />} />  
            <Route path="unified-application" element={<UnifiedApplication />} />
            <Route path="*" element={<Navigate to="/" replace />} />  
          </Route>  
        </Routes>  
      </BrowserRouter>  
    </AuthProvider>  
  </QueryClientProvider>  
);
