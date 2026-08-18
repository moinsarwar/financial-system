import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const TOKEN_KEY = 'autocompare_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const login = async (email, password) => {
  const body = new URLSearchParams();
  body.append('username', email);
  body.append('password', password);
  const { data } = await api.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
};

export const register = async ({ email, password, name, phone }) => {
  const { data } = await api.post('/auth/register', { email, password, name, phone });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const getVehicles = async (params = {}) => {
  const { data } = await api.get('/vehicles/', { params });
  return data;
};

export const compareVehicles = async (keyA, keyB) => {
  const { data } = await api.get(`/comparison/${keyA}/${keyB}`);
  return data;
};

export const calculateCosts = async (key) => {
  const { data } = await api.get(`/costs/${key}`);
  return data;
};

export const createInquiry = async (payload) => {
  const { data } = await api.post('/inquiries/', payload);
  return data;
};

export const createApplication = async (payload) => {
  const { data } = await api.post('/applications/', payload);
  return data;
};

export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};

export const getDashboardInquiries = async () => {
  const { data } = await api.get('/dashboard/inquiries');
  return data;
};

export const getDashboardApplications = async () => {
  const { data } = await api.get('/dashboard/applications');
  return data;
};

export const updateApplicationStatus = async (id, status) => {
  const { data } = await api.patch(`/applications/${id}/status`, { status });
  return data;
};

export const updateInquiryStatus = async (id, status) => {
  const { data } = await api.patch(`/inquiries/${id}/status`, { status });
  return data;
};

export default api;
