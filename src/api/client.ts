import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { getApiBase } from '@/services/ConnectionManager';

export const api = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Dynamic base URL — resolved at request time so it follows connection mode changes
api.interceptors.request.use((config) => {
  config.baseURL = getApiBase();
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
