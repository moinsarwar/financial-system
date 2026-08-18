import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const TOKEN_KEY = 'drive2earn_token';

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

export const getVehicles = async () => {
  const { data } = await api.get('/vehicles/');
  return data;
};

export const getAssumptions = async () => {
  const { data } = await api.get('/assumptions/');
  return data;
};

export const estimateAffordability = async (payload) => {
  const { data } = await api.post('/affordability/', payload);
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

export const getDashboardApplications = async () => {
  const { data } = await api.get('/dashboard/applications');
  return data;
};

export const getDashboardEstimates = async () => {
  const { data } = await api.get('/dashboard/estimates');
  return data;
};

export const updateApplicationStatus = async (id, status) => {
  const { data } = await api.patch(`/applications/${id}/status`, { status });
  return data;
};

export const updateEstimateFollowUp = async (id, status) => {
  const { data } = await api.patch(`/dashboard/estimates/${id}/status`, { status });
  return data;
};

export default api;
