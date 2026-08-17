import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
