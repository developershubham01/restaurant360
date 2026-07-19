import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Prevent redirect loop if the user is already on the login page or the endpoint is public
      const isLoginOrPublic = window.location.pathname === '/' || 
                              (error.config && error.config.url && (
                                error.config.url.includes('/api/brands') || 
                                error.config.url.includes('/api/outlets') || 
                                error.config.url.includes('/api/auth/login')
                              ));
      if (!isLoginOrPublic) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
