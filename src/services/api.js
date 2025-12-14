import axios from 'axios';

const API_BASE_URL = 'https://stall-bookings-backend.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: (data) => api.post('/auth/logout', data),
  refreshToken: (data) => api.post('/auth/refresh', data),
  getProfile: () => api.get('/auth/profile'),
};

// Dashboard API
export const dashboardAPI = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getHRDashboard: () => api.get('/dashboard/hr'),
  getDriverDashboard: () => api.get('/dashboard/driver'),
  getEmployeeDashboard: () => api.get('/dashboard/employee'),
  getLiveTrips: () => api.get('/dashboard/live-trips'),
};

// Company API
export const companyAPI = {
  getAll: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  toggleStatus: (id) => api.patch(`/companies/${id}/toggle-status`),
};

// User API
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  changePassword: (id, data) => api.patch(`/users/${id}/change-password`, data),
};

// Vehicle API
export const vehicleAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  toggleStatus: (id) => api.patch(`/vehicles/${id}/toggle-status`),
  getAvailable: (companyId) => api.get(`/vehicles/available/${companyId || ''}`),
};

// Employee API
export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  toggleStatus: (id) => api.patch(`/employees/${id}/toggle-status`),
  getTrips: (id, params) => api.get(`/employees/${id}/trips`, { params }),
  getAvailable: (companyId) => api.get(`/employees/available/${companyId || ''}`),
};

// Driver API
export const driverAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
  toggleStatus: (id) => api.patch(`/drivers/${id}/toggle-status`),
  getTrips: (params) => api.get('/drivers/my-trips', { params }),
  updateLocation: (data) => api.patch('/drivers/my-location', data),
  updateStatus: (data) => api.patch('/drivers/my-status', data),
  getAvailable: (companyId) => api.get(`/drivers/available/${companyId || ''}`),
};

// Trip API
export const tripAPI = {
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  delete: (id) => api.delete(`/trips/${id}`),
  start: (id, data) => api.patch(`/trips/${id}/start`, data),
  complete: (id, data) => api.patch(`/trips/${id}/complete`, data),
  updateEmployeeStatus: (tripId, employeeId, data) => 
    api.patch(`/trips/${tripId}/employees/${employeeId}/status`, data),
};

// Location API
export const locationAPI = {
  updateLocation: (data) => api.post('/location/update', data),
  getHistory: (tripId, params) => api.get(`/location/history/${tripId}`, { params }),
  getCurrent: (tripId) => api.get(`/location/current/${tripId}`),
};

export default api;