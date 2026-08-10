import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserDashboard from '../components/Dashboard/UserDashboard';
import VendorDashboard from '../components/Dashboard/VendorDashboard';
import AdminDashboard from '../components/Dashboard/AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'vendor') return <VendorDashboard />;
  if (user.role === 'admin') return <AdminDashboard />;
  return <UserDashboard />;
}
