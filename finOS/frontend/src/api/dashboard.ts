import api from './client';  
  
export interface FunnelStats {  
  leads: number;  
  applicants: number;  
  customers: number;  
  openClaims: number;  
}  
  
export interface DashboardStats {  
  totalClients: number;  
  activeProducts: number;  
  openClaims: number;  
  applications: number;  
}  
  
export async function getFunnelStats(): Promise<FunnelStats> {  
  const { data } = await api.get<FunnelStats>('/dashboard/funnel');  
  return data;  
}  
  
export async function getDashboardStats(): Promise<DashboardStats> {  
  const { data } = await api.get<DashboardStats>('/dashboard/stats');  
  return data;  
}
