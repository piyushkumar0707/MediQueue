import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Send httpOnly cookies with every request
  timeout: 15000 // 15 seconds
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

export const clearAuthQueue = () => {
  processQueue(new Error('Logged out'));
};

// Request interceptor - Attach access token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (Zustand persist)
    const authStorage = localStorage.getItem('auth-storage');
    
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        const { accessToken } = state;
        
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      // Get refresh token
      const authStorage = localStorage.getItem('auth-storage');
      
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          const { refreshToken } = state;
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          // Call refresh token endpoint
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
            { refreshToken }
          );
          
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          
          // Update localStorage
          const updatedState = {
            ...state,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          };
          
          localStorage.setItem('auth-storage', JSON.stringify({ state: updatedState }));
          
          // Update the failed requests
          processQueue(null, newAccessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          isRefreshing = false;
          
          return api(originalRequest);
          
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Refresh failed (expired/invalid) — force full logout
          localStorage.removeItem('auth-storage');
          failedQueue = [];
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        }
      } else {
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
