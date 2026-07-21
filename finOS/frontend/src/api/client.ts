import axios from 'axios';  
import toast from 'react-hot-toast';  
  
const api = axios.create({  
  baseURL: import.meta.env.VITE_API_URL || '/api',  
  headers: { 'Content-Type': 'application/json' },  
});  
  
api.interceptors.request.use((config) => {  
  const token = localStorage.getItem('access_token');  
  if (token) config.headers.Authorization = `Bearer ${token}`;  
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;  
});  
  
api.interceptors.response.use(  
  (response) => response,  
  (error) => {  
    if (error.response?.status === 401) {  
      localStorage.removeItem('access_token');  
      localStorage.removeItem('user');  
      window.location.href = '/login';  
    }  
    if (error.response?.data?.detail) {  
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        toast.error(detail.map(d => d.msg || d.type).join(', '));
      } else {
        toast.error(String(detail));
      }
    } else if (error.message) {  
      toast.error(error.message);  
    }  
    return Promise.reject(error);  
  }  
);  
  
export default api;
