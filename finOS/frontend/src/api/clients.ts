import api from './client';  
  
export interface Client {  
  id: string;  
  name: string;  
  email: string;  
  phone: string;  
  lifecycle_stage: 'lead' | 'applicant' | 'customer';  
  has_open_claim: boolean;  
  assigned_department: string;  
  created_at: string;  
  last_activity: string;  
  engagement_score: number;  
}  
  
export async function getClients(params?: {  
  stage?: string;  
  search?: string;  
  department?: string;  
}): Promise<Client[]> {  
  const { data } = await api.get<Client[]>('/clients', { params });  
  return data;  
}  
  
export async function getClient(id: string): Promise<Client> {  
  const { data } = await api.get<Client>(`/clients/${id}`);  
  return data;  
}  
  
export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'last_activity' | 'engagement_score' | 'lifecycle_stage' | 'has_open_claim'>): Promise<Client> {  
  const { data } = await api.post<Client>('/clients', client);  
  return data;  
}
