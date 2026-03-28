import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach fresh Firebase ID token to every request automatically
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── Projects ──────────────────────────────────────────
export const projectsApi = {
  getAll:   (params)     => api.get('/projects', { params }),
  getById:  (id)         => api.get(`/projects/${id}`),
  create:   (data)       => api.post('/projects', data),
  update:   (id, data)   => api.put(`/projects/${id}`, data),
  delete:   (id)         => api.delete(`/projects/${id}`),
};

// ── Tasks ─────────────────────────────────────────────
export const tasksApi = {
  getByProject: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  getById:      (id)                => api.get(`/tasks/${id}`),
  create:       (projectId, data)   => api.post(`/projects/${projectId}/tasks`, data),
  update:       (id, data)          => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status)        => api.patch(`/tasks/${id}/status`, { status }),
  delete:       (id)                => api.delete(`/tasks/${id}`),
  // Fetch all tasks across all user projects (for due-date reminders)
  getAllDue: () => api.get('/tasks/due-soon'),
};

export default api;
