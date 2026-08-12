import axios from 'axios';  
  
const apiClient = axios.create({  
  baseURL: process.env.REACT_APP_API_URL || '/api',  
  headers: {  
    'Content-Type': 'application/json',  
  },  
});  
  
// Add a response interceptor for error handling  
apiClient.interceptors.response.use(  
  response => response,  
  error => {  
    console.error('API Error:', error.response?.data || error.message);  
    return Promise.reject(error);  
  }  
);  
  
export default apiClient;
