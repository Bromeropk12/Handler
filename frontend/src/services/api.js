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
  changePassword: apiCircuitBreaker.wrap('auth/change-password', data => api.post('/auth/change-password', data)),
  changeUsername: apiCircuitBreaker.wrap('auth/change-username', data => api.put('/auth/change-username', data)),
  listUsers: apiCircuitBreaker.wrap('auth/users', () => api.get('/auth/users')),
  createUser: apiCircuitBreaker.wrap('auth/users', data => api.post('/auth/users', data)),
  changeUserPassword: apiCircuitBreaker.wrap('auth/change-user-password', (userId, data) => api.put(`/auth/users/${userId}/password`, data)),
  deleteUser: apiCircuitBreaker.wrap('auth/delete-user', userId => api.delete(`/auth/users/${userId}`)),
};

export const samplesAPI = {
  getBulkSamples: params => api.get('/samples', { params }),
  getBulkSample: id => api.get(`/samples/${id}`),
  createBulkSample: (data, coaFile) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Serializar arrays como JSON para que multer no los pierda
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });
    if (coaFile) {
      formData.append('coa_file', coaFile);
    }
    return api.post('/samples', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateBulkSample: (id, data) => api.put(`/samples/${id}`, data),
  updateBulkSampleWithCoA: (id, data, coaFile) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });
    if (coaFile) {
      formData.append('coa_file', coaFile);
    }
    return api.put(`/samples/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteBulkSample: (id, confirmDelete = false) => api.delete(`/samples/${id}`, { data: { confirm_delete: confirmDelete } }),
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
  uploadLogo: (id, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post(`/suppliers/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const dispensingAPI = {
  dispense: data => api.post('/dispensing/subdivide', data),
  getDispensedSamples: params => api.get('/dispensing', { params }),
  reassignShelf: data => api.put('/dispensing/reassign-shelf', data),
};

export const dispatchAPI = {
  getFefoRecommendation: params => api.get('/dispatch/fefo', { params }),
  dispatch: data => api.post('/dispatch/execute', data),
  getHistory: params => api.get('/dispatch/history', { params }),
};

export const movementsAPI = {
  getMovements: params => api.get('/movements', { params }),
  getMovementTypes: () => api.get('/movements/types'),
  getMovementsSummary: params => api.get('/movements/summary', { params }),
  exportToCSV: params => api.get('/movements', { params: { ...params, export_csv: 'true' }, responseType: 'blob' }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export const alertsAPI = {
  getExpired: () => api.get('/alerts/expired'),
  getExpiring: (days) => api.get('/alerts/expiring', { params: { days } }),
  getSummary: () => api.get('/alerts/summary'),
};

export const marketLinesAPI = {
  getAll: () => api.get('/market-lines'),
  getById: (id) => api.get(`/market-lines/${id}`),
  create: (data) => api.post('/market-lines', data),
  update: (id, data) => api.put(`/market-lines/${id}`, data),
  delete: (id) => api.delete(`/market-lines/${id}`),
};

export const shelfSuppliersAPI = {
  getByShelf: (shelfId) => api.get(`/shelf-suppliers/shelf/${shelfId}`),
  add: (data) => api.post('/shelf-suppliers', data),
  update: (id, data) => api.put(`/shelf-suppliers/${id}`, data),
  remove: (id) => api.delete(`/shelf-suppliers/${id}`),
};

export const backupAPI = {
  getStatus: () => api.get('/backup/status'),
  listBackups: () => api.get('/backup/list'),
  createBackup: () => api.post('/backup/create'),
  restoreBackup: (data) => api.post('/backup/restore', data),
  deleteBackup: (filename) => api.delete(`/backup/${encodeURIComponent(filename)}`),
  syncToOneDrive: () => api.post('/backup/sync-onedrive'),
};

export default api;

