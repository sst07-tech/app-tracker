import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000
});

export const getApps = () => api.get('/applications').then(r => r.data);
export const getStats = () => api.get('/applications/stats').then(r => r.data);
export const createApp = (payload) => api.post('/applications', payload).then(r => r.data);
export const updateApp = (id, payload) => api.put(`/applications/${id}`, payload).then(r => r.data);
export const deleteApp = (id) => api.delete(`/applications/${id}`).then(r => r.data);

export default api;
