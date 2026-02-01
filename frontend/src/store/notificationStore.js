import { create } from 'zustand';
import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, clearReadNotifications } from '../services/api';

const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  
  // Filters
  filters: {
    type: null,
    priority: null,
    isRead: null,
  },

  // Actions
  setNotifications: (notifications) => set({ notifications }),
  
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  addNotification: (notification) => {
    const { notifications, unreadCount } = get();
    // Defensive check: ensure notifications is always an array
    const notificationsList = Array.isArray(notifications) ? notifications : [];
    set({
      notifications: [notification, ...notificationsList],
      unreadCount: !notification.isRead ? unreadCount + 1 : unreadCount,
    });
  },
  
  updateNotification: (id, updates) => {
    const { notifications, unreadCount } = get();
    // Defensive check: ensure notifications is always an array
    const notificationsList = Array.isArray(notifications) ? notifications : [];
    const notification = notificationsList.find(n => n._id === id);
    const wasUnread = notification && !notification.isRead;
    const isNowRead = updates.isRead === true;
    
    set({
      notifications: notificationsList.map(n =>
        n._id === id ? { ...n, ...updates } : n
      ),
      unreadCount: wasUnread && isNowRead ? unreadCount - 1 : unreadCount,
    });
  },
  
  removeNotification: (id) => {
    const { notifications } = get();
    // Defensive check: ensure notifications is always an array
    const notificationsList = Array.isArray(notifications) ? notifications : [];
    const notification = notificationsList.find(n => n._id === id);
    set({
      notifications: notificationsList.filter(n => n._id !== id),
      unreadCount: notification && !notification.isRead 
        ? get().unreadCount - 1 
        : get().unreadCount,
    });
  },
  
  setFilters: (filters) => set({ filters, page: 1, hasMore: true }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  // Fetch notifications
  fetchNotifications: async (reset = false) => {
    const { page, filters, loading, hasMore } = get();
    
    if (loading || (!reset && !hasMore)) return;
    
    set({ loading: true, error: null });
    
    try {
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== null)
        ),
      };
      
      const response = await getNotifications(params);
      
      if (response.success) {
        const newNotifications = response.data.notifications;
        
        set({
          notifications: reset 
            ? newNotifications 
            : [...get().notifications, ...newNotifications],
          page: currentPage + 1,
          hasMore: response.data.currentPage < response.data.totalPages,
          loading: false,
        });
      }
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch notifications',
        loading: false,
      });
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        set({ unreadCount: response.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  // Mark as read
  markAsRead: async (id) => {
    try {
      const response = await markNotificationAsRead(id);
      if (response.success) {
        get().updateNotification(id, { isRead: true, readAt: new Date() });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.success) {
        const currentNotifications = get().notifications || [];
        set({
          notifications: currentNotifications.map(n => ({ 
            ...n, 
            isRead: true, 
            readAt: new Date() 
          })),
          unreadCount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  },

  // Clear read notifications
  clearRead: async () => {
    try {
      const response = await clearReadNotifications();
      if (response.success) {
        set({
          notifications: get().notifications.filter(n => !n.isRead),
        });
      }
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
      throw error;
    }
  },

  // Reset store
  reset: () => set({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    hasMore: true,
    page: 1,
    filters: {
      type: null,
      priority: null,
      isRead: null,
    },
  }),
}));

export default useNotificationStore;
