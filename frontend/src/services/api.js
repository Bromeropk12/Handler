import axios from 'axios';
import { apiCircuitBreaker } from './circuitBreaker';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Api config done

// Interceptor para agregar token JWT a las peticiones
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    // Transformar error para mejor manejo
    const customError = {
      message: error.response?.data?.message || error.message || 'Error desconocido',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };

    return Promise.reject(customError);
  }
);

// Funciones de utilidad para las APIs con Circuit Breaker
export const authAPI = {
  login: apiCircuitBreaker.wrap('auth/login', credentials => api.post('/auth/login', credentials)),
  resetPassword: apiCircuitBreaker.wrap('auth/reset-password', data => api.post('/auth/reset-password', data)),
  getCurrentUser: apiCircuitBreaker.wrap('auth/me', () => api.get('/auth/me')),
};

export const samplesAPI = {
  getBulkSamples: params => api.get('/samples', { params }),
  getBulkSample: id => api.get(`/samples/${id}`),
  createBulkSample: data => api.post('/samples', data),
  updateBulkSample: (id, data) => api.put(`/samples/${id}`, data),
  deleteBulkSample: id => api.delete(`/samples/${id}`),
  getMarketLines: () => api.get('/samples/market-lines'),
  getSuppliers: () => api.get('/samples/suppliers'),
};

export const warehouseAPI = {
  getShelves: apiCircuitBreaker.wrap('warehouse/shelves', params => api.get('/warehouse', { params })),
  getShelf: apiCircuitBreaker.wrap('warehouse/shelf', id => api.get(`/warehouse/${id}`)),
  createShelf: apiCircuitBreaker.wrap('warehouse/create', data => api.post('/warehouse', data)),
  updateShelf: apiCircuitBreaker.wrap('warehouse/update', (id, data) => api.put(`/warehouse/${id}`, data)),
  deleteShelf: apiCircuitBreaker.wrap('warehouse/delete', id => api.delete(`/warehouse/${id}`)),
  getShelfMap: apiCircuitBreaker.wrap('warehouse/map', id => api.get(`/warehouse/${id}/map`)),
  placeSample: apiCircuitBreaker.wrap('warehouse/place', (id, data) => api.post(`/warehouse/${id}/place-sample`, data)),
  moveSample: apiCircuitBreaker.wrap('warehouse/move', (id, data) => api.put(`/warehouse/${id}/move-sample`, data)),
  removeSample: apiCircuitBreaker.wrap('warehouse/remove', (id, data) => api.delete(`/warehouse/${id}/remove-sample`, data)),
  defragment: (id, data) => api.post(`/warehouse/${id}/defragment`, data),
  confirmDefragMove: (id, data) => api.post(`/warehouse/${id}/defragment/confirm`, data),
};

export const suppliersAPI = {
  getSuppliers: () => api.get('/suppliers'),
  createSupplier: data => api.post('/suppliers', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}`, data),
  deleteSupplier: id => api.delete(`/suppliers/${id}`),
};

export const dispensingAPI = {
  dispense: data => api.post('/dispensing/subdivide', data),
  getDispensedSamples: params => api.get('/dispensing', { params }),
};

export const dispatchAPI = {
  getFefoRecommendation: params => api.get('/dispatch/fefo', { params }),
  dispatch: data => api.post('/dispatch/execute', data),
  getHistory: params => api.get('/dispatch/history', { params }),
};

export const movementsAPI = {
  getMovements: params => api.get('/movements', { params }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export const alertsAPI = {
  getExpired: () => api.get('/alerts/expired'),
  getExpiring: (days) => api.get('/alerts/expiring', { params: { days } }),
  getSummary: () => api.get('/alerts/summary'),
};

export default api;
