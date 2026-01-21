import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      
      /**
       * Initialize registration (send OTP)
       */
      initiateRegistration: async (phoneNumber, email, countryCode = '+91') => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register/initiate', {
            phoneNumber,
            email,
            countryCode
          });
          
          console.log('API response (full):', response);
          console.log('API response.data:', response.data);
          
          // Handle both wrapped and unwrapped responses
          const data = response.data || response;
          
          set({ isLoading: false });
          return data;
        } catch (error) {
          console.error('API call error:', error);
          const errorMsg = error.response?.data?.message || error.message || 'Registration failed';
          set({ isLoading: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      /**
       * Complete registration (verify OTP + create account)
       */
      completeRegistration: async (sessionId, otp, role, personalInfo, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register/complete', {
            sessionId,
            otp,
            role,
            personalInfo,
            password
          });
          
          const data = response.data || response;
          const { user, accessToken, refreshToken } = data.data || data;
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return response.data;
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'Registration failed';
          set({ isLoading: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      /**
       * Login user
       */
      login: async (phoneOrEmail, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', {
            phoneOrEmail,
            password
          });
          
          const data = response.data || response;
          const { user, accessToken, refreshToken } = data.data || data;
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return response.data;
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'Login failed';
          set({ isLoading: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        const { refreshToken } = get();
        
        try {
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null
          });
        }
      },

      /**
       * Logout from all devices
       */
      logoutAll: async () => {
        try {
          await api.post('/auth/logout-all');
        } catch (error) {
          console.error('Logout all error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null
          });
        }
      },

      /**
       * Refresh access token
       */
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        try {
          const response = await api.post('/auth/refresh-token', {
            refreshToken
          });
          
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          
          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          });
          
          return newAccessToken;
        } catch (error) {
          // Refresh token expired or invalid, logout user
          get().logout();
          throw error;
        }
      },

      /**
       * Get current user
       */
      getCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/auth/me');
          const data = response.data || response;
          const { user } = data.data || data;
          
          set({
            user,
            isLoading: false
          });
          
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      /**
       * Forgot password (send OTP)
       */
      forgotPassword: async (phoneOrEmail) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/forgot-password', {
            phoneOrEmail
          });
          
          set({ isLoading: false });
          return response.data;
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'Failed to send reset code';
          set({ isLoading: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      /**
       * Reset password with OTP
       */
      resetPassword: async (sessionId, otp, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/reset-password', {
            sessionId,
            otp,
            newPassword
          });
          
          set({ isLoading: false });
          return response.data;
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'Password reset failed';
          set({ isLoading: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      /**
       * Update user in store (after profile edit, etc.)
       */
      updateUser: (userData) => {
        set({ user: userData });
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
