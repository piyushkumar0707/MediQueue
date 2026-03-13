import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send httpOnly cookies with every request
  timeout: 15000,
});

// Flag to prevent multiple simultaneous refresh attempts
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

// Clears the failed request queue on logout — call from useAuthStore
export const clearAuthQueue = () => {
  processQueue(new Error('Logged out'));
};

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        const token = state?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh on 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh on auth endpoints — let the form handle the error
      const url = originalRequest?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh-token');

      if (isAuthEndpoint) {
        return Promise.reject(error.response?.data || error.message);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const authStorage = localStorage.getItem('auth-storage');

      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          const { refreshToken } = state;

          if (!refreshToken) throw new Error('No refresh token available');

          const response = await axios.post(
            `${API_URL}/auth/refresh-token`,
            { refreshToken }
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

          const updatedState = { ...state, accessToken: newAccessToken, refreshToken: newRefreshToken };
          localStorage.setItem('auth-storage', JSON.stringify({ state: updatedState }));

          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          isRefreshing = false;

          return api(originalRequest);

        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          localStorage.removeItem('auth-storage');
          failedQueue = [];
          // Lazy import to avoid circular deps
          import('react-hot-toast').then(({ default: toast }) => {
            toast.error('Session expired. Please log in again.', { id: 'session-expired', duration: 3000 });
          });
          setTimeout(() => { window.location.href = '/login'; }, 1500);
          return Promise.reject(refreshError);
        }
      } else {
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error.response?.data || error.message);
  }
);

// ============================================
// Consent Management API Methods
// ============================================

// Get my consents (patient)
export const getMyConsents = async () => {
  return api.get('/consent/my-consents');
};

// Get doctor consents (for my patients)
export const getDoctorConsents = async () => {
  return api.get('/consent/for-my-patients');
};

// Grant consent to a doctor
export const grantConsent = async (data) => {
  return api.post('/consent/grant', data);
};

// Revoke consent
export const revokeConsent = async (consentId, data) => {
  return api.delete(`/consent/${consentId}`, { data });
};

// Update consent
export const updateConsent = async (consentId, data) => {
  return api.patch(`/consent/${consentId}`, data);
};

// Get consent history
export const getConsentHistory = async (consentId) => {
  return api.get(`/consent/${consentId}/history`);
};

// Get consent stats
export const getConsentStats = async () => {
  return api.get('/consent/stats');
};

// Check if doctor has consent
export const checkConsent = async (patientId, recordId) => {
  return api.get(`/consent/check/${patientId}/${recordId}`);
};

// ============================================
// Emergency Access API Methods
// ============================================

// Request emergency access (doctor)
export const requestEmergencyAccess = async (data) => {
  return api.post('/emergency-access/request', data);
};

// Get my emergency requests (doctor)
export const getMyEmergencyRequests = async (params = {}) => {
  return api.get('/emergency-access/my-requests', { params });
};

// Get emergency accesses for review (admin)
export const getEmergencyAccessForReview = async (params = {}) => {
  return api.get('/emergency-access/for-review', { params });
};

// Review emergency access (admin)
export const reviewEmergencyAccess = async (accessId, data) => {
  return api.patch(`/emergency-access/${accessId}/review`, data);
};

// Revoke emergency access (admin or requesting doctor)
export const revokeEmergencyAccess = async (accessId, data) => {
  return api.delete(`/emergency-access/${accessId}`, { data });
};

// Get emergency access statistics (admin)
export const getEmergencyAccessStats = async () => {
  return api.get('/emergency-access/stats');
};

// Check if doctor has emergency access to patient
export const checkEmergencyAccess = async (patientId) => {
  return api.get(`/emergency-access/check/${patientId}`);
};

// ============================================
// User Management API Methods
// ============================================

// Get doctors list
export const getDoctors = async () => {
  return api.get('/users/doctors');
};

// ============================================
// Notification API Methods
// ============================================

// Get all notifications for current user
export const getNotifications = async (params = {}) => {
  return api.get('/notifications', { params });
};

// Get unread count
export const getUnreadCount = async () => {
  return api.get('/notifications/unread-count');
};

// Get notification statistics
export const getNotificationStats = async () => {
  return api.get('/notifications/stats');
};

// Mark all as read
export const markAllNotificationsAsRead = async () => {
  return api.patch('/notifications/mark-all-read');
};

// Clear all read notifications
export const clearReadNotifications = async () => {
  return api.delete('/notifications/clear-read');
};

// Create notification (admin/system)
export const createNotification = async (data) => {
  return api.post('/notifications', data);
};

// Get notification by ID
export const getNotificationById = async (id) => {
  return api.get(`/notifications/${id}`);
};

// Mark as read
export const markNotificationAsRead = async (id) => {
  return api.patch(`/notifications/${id}/read`);
};

// Mark as unread
export const markNotificationAsUnread = async (id) => {
  return api.patch(`/notifications/${id}/unread`);
};

// Delete notification
export const deleteNotification = async (id) => {
  return api.delete(`/notifications/${id}`);
};

export default api;
