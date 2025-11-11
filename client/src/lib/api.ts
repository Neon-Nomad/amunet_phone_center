import axios, { AxiosError } from 'axios';
import { buildApiUrl } from './apiBase';

const api = axios.create({
  timeout: 30000,
});

// Request interceptor: Add token and build proper API URLs
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Build proper API URL using apiBase utility
    if (config.url) {
      config.url = buildApiUrl(config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors and token expiration
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('amunet-tenant');
      
      // Only redirect if not already on login/signup pages
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
