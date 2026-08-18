import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const TOKEN_KEY = 'homecompare_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const login = async (email, password) => {
  const body = new URLSearchParams();
  body.append('username', email);
  body.append('password', password);
  const response = await api.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export const register = async ({ email, password, name, phone }) => {
  const response = await api.post('/auth/register', { email, password, name, phone });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getAppliances = async (params = {}) => {
  const response = await api.get('/appliances/', { params });
  return response.data;
};

export const getAppliance = async (key) => {
  const response = await api.get(`/appliances/${key}`);
  return response.data;
};

export const compareAppliances = async (keyA, keyB) => {
  const response = await api.get(`/comparison/${keyA}/${keyB}`);
  return response.data;
};

export const calculateCosts = async (key) => {
  const response = await api.get(`/costs/${key}`);
  return response.data;
};

export const getServices = async () => {
  const response = await api.get('/services/');
  return response.data;
};

export const createInquiry = async (payload) => {
  const response = await api.post('/inquiries/', payload);
  return response.data;
};

export const createApplication = async (payload) => {
  const response = await api.post('/applications/', payload);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getDashboardInquiries = async () => {
  const response = await api.get('/dashboard/inquiries');
  return response.data;
};

export const getDashboardApplications = async () => {
  const response = await api.get('/dashboard/applications');
  return response.data;
};

export const updateApplicationStatus = async (id, status) => {
  const response = await api.patch(`/applications/${id}/status`, { status });
  return response.data;
};

export const updateInquiryStatus = async (id, status) => {
  const response = await api.patch(`/inquiries/${id}/status`, { status });
  return response.data;
};

export default api;
