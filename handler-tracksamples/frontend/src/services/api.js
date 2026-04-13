const API_URL = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.getToken() && { Authorization: `Bearer ${this.getToken()}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }

    return data;
  }

  auth = {
    login: (username, password) => 
      this.request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    
    register: (username, password, secretPassword, role) =>
      this.request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, secretPassword, role }) }),
    
    recovery: (username, secretPassword, newPassword, confirmPassword) =>
      this.request('/auth/recovery', { method: 'POST', body: JSON.stringify({ username, secretPassword, newPassword, confirmPassword }) }),
  };

  marketLines = {
    getAll: () => this.request('/market-lines'),
    create: (data) => this.request('/market-lines', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => this.request(`/market-lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => this.request(`/market-lines/${id}`, { method: 'DELETE' }),
  };

  shelves = {
    getAll: (marketLineId) => 
      this.request(`/shelves${marketLineId ? `?market_line_id=${marketLineId}` : ''}`),
    getById: (id) => this.request(`/shelves/${id}`),
    create: (data) => this.request('/shelves', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => this.request(`/shelves/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => this.request(`/shelves/${id}`, { method: 'DELETE' }),
  };

  globalSamples = {
    getAll: (marketLineId, search) => {
      let url = '/global-samples';
      const params = [];
      if (marketLineId) params.push(`market_line_id=${marketLineId}`);
      if (search) params.push(`search=${search}`);
      if (params.length > 0) url += '?' + params.join('&');
      return this.request(url);
    },
    getById: (id) => this.request(`/global-samples/${id}`),
    create: (data) => this.request('/global-samples', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => this.request(`/global-samples/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => this.request(`/global-samples/${id}`, { method: 'DELETE' }),
  };

  dispensedSamples = {
    getAll: (shelfId, status, globalSampleId) => {
      let url = '/dispensed-samples';
      const params = [];
      if (shelfId) params.push(`shelf_id=${shelfId}`);
      if (status) params.push(`status=${status}`);
      if (globalSampleId) params.push(`global_sample_id=${globalSampleId}`);
      if (params.length > 0) url += '?' + params.join('&');
      return this.request(url);
    },
    getPending: () => this.request('/dispensed-samples/pending'),
    dispense: (globalSampleId, subdivisions, weightPerSubdivision) =>
      this.request('/dispensed-samples/dispense', { 
        method: 'POST', 
        body: JSON.stringify({ global_sample_id: globalSampleId, subdivisions, weight_per_subdivision: weightPerSubdivision }) 
      }),
    autoOrganize: (marketLineId) =>
      this.request('/dispensed-samples/auto-organize', { 
        method: 'POST', 
        body: JSON.stringify({ market_line_id: marketLineId }) 
      }),
    relocate: (id, shelfId, positionX, positionY) =>
      this.request(`/dispensed-samples/${id}/relocate`, { 
        method: 'PUT', 
        body: JSON.stringify({ shelf_id: shelfId, position_x: positionX, position_y: positionY }) 
      }),
    dispatch: (qrCode) =>
      this.request('/dispensed-samples/dispatch', { 
        method: 'POST', 
        body: JSON.stringify({ qr_code: qrCode }) 
      }),
    getByFefo: (name) => this.request(`/dispensed-samples/fefo/${encodeURIComponent(name)}`),
  };

  movements = {
    getAll: (sampleId, userId, limit = 100) => {
      let url = '/movements';
      const params = [];
      if (sampleId) params.push(`sample_id=${sampleId}`);
      if (userId) params.push(`user_id=${userId}`);
      if (limit) params.push(`limit=${limit}`);
      if (params.length > 0) url += '?' + params.join('&');
      return this.request(url);
    },
  };
}

export const api = new ApiService();
export default api;