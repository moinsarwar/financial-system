import api from './client';  
  
export interface LoginCredentials {  
  email: string;  
  password: string;  
}  
  
export interface AuthResponse {  
  access_token: string;  
  token_type: string;  
  user_id: string;  
  full_name: string;  
  role: string;  
  client_id: string | null;  
}  
  
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {  
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);  
  return data;  
}  
  
export async function getMe(): Promise<{  
  id: string;  
  email: string;  
  full_name: string;  
  role: string;  
  client_id: string | null;  
}> {  
  const { data } = await api.get('/auth/me');  
  return data;  
}  
  
export function logout(): void {  
  localStorage.removeItem('access_token');  
  localStorage.removeItem('user');  
}
