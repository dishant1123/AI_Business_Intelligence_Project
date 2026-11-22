import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const datasetService = {
  getSummary: () => api.get('/datasets/summary'),
  getHistory: () => api.get('/datasets/history'),
  upload: (formData) => api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  importSeed: () => api.post('/datasets/import-seed'),
};

export const dashboardService = {
  getKPIs: (params) => api.get('/dashboard/kpis', { params }),
  getTrends: (params) => api.get('/dashboard/trends', { params }),
  getProduction: () => api.get('/dashboard/production'),
  getQuality: () => api.get('/dashboard/quality'),
};

export const productionService = {
  getSummary: (params) => api.get('/production/summary', { params }),
  getLines: () => api.get('/production/lines'),
  getShifts: () => api.get('/production/shifts'),
  getTrends: () => api.get('/production/trends'),
};

export const qualityService = {
  getSummary: () => api.get('/quality/summary'),
  getDefects: () => api.get('/quality/defects'),
  getTrends: () => api.get('/quality/trends'),
};

export const machineService = {
  getSummary: () => api.get('/machines/summary'),
  getDowntime: () => api.get('/machines/downtime'),
};

export const inventoryService = {
  getSummary: () => api.get('/inventory/summary'),
  getAnalytics: () => api.get('/inventory/analytics'),
};

export const financeService = {
  getSummary: () => api.get('/finance/summary'),
  getAnalytics: () => api.get('/finance/analytics'),
};

export const agentService = {
  run: () => api.post('/agents/run'),
  getStatus: (analysisId) => api.get(`/agents/status/${analysisId}`),
  getLogs: (analysisId) => api.get(`/agents/logs/${analysisId}`),
  getHistory: () => api.get('/agents/history'),
};

export const chatService = {
  sendMessage: (message, conversationHistory = []) => api.post('/chat', {
    message,
    conversation_history: conversationHistory,
  }),
};

export const mlService = {
  train: () => api.post('/ml/train'),
  predictProduction: (payload) => api.post('/ml/predict/production', payload),
  predictQuality: (payload) => api.post('/ml/predict/quality', payload),
  predictWastage: (payload) => api.post('/ml/predict/wastage', payload),
  getAnomalies: () => api.get('/ml/anomalies'),
  getEvaluation: () => api.get('/ml/evaluation'),
};

export const reportService = {
  list: () => api.get('/reports'),
  generate: (analysisId) => api.post('/reports/generate', null, { params: { analysis_id: analysisId } }),
  getDownloadUrl: (reportId) => `${API_BASE_URL}/reports/${reportId}/download`,
};

export const approvalService = {
  list: () => api.get('/approvals'),
  getDetails: (id) => api.get(`/approvals/${id}`),
  recordDecision: (id, decision, comments) => api.post(`/approvals/${id}/decision`, { decision, comments }),
};

export const adminService = {
  listUsers: () => api.get('/admin/users'),
  createUser: (user) => api.post('/admin/users', user),
  getSystemActivity: () => api.get('/admin/system-activity'),
};

export default api;
