import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

// Attach the saved JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('brandflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is invalid/expired, bounce back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('brandflow_token');
      localStorage.removeItem('brandflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
