import api from './client';  
  
export interface Activity {  
  id: string;  
  time: string;  
  actor_user_id: string | null;  
  client_id: string | null;  
  subject_type: string | null;  
  subject_id: string | null;  
  event: string;  
  details: string;  
  department: string | null;  
  ip_address: string | null;  
  request_id: string | null;  
  extra_data: Record<string, unknown>;  
}  
  
export async function getActivity(params?: {  
  search?: string;  
  event_type?: string;  
  limit?: number;  
}): Promise<Activity[]> {  
  const { data } = await api.get<Activity[]>('/activity', { params });  
  return data;  
}
