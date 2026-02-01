import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useNotificationStore from '../../store/notificationStore';
import { io } from 'socket.io-client';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    setUnreadCount,
  } = useNotificationStore();

  // Get user from auth store
  const authStorage = localStorage.getItem('auth-storage');
  const user = authStorage ? JSON.parse(authStorage).state.user : null;

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: {
        token: JSON.parse(localStorage.getItem('auth-storage')).state.accessToken,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket.io connected');
      // Join user-specific room
      newSocket.emit('join', {
        userId: user.id,
        role: user.role,
      });
    });

    // Listen for notifications
    newSocket.on('notification', (data) => {
      console.log('Notification received:', data);

      if (data.type === 'new_notification') {
        // Add notification to store
        addNotification(data.data);
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.data.title, {
            body: data.data.message,
            icon: '/logo.png',
            tag: data.data._id,
          });
        }
      } else if (data.type === 'unread_count_update') {
        // Update unread count
        setUnreadCount(data.data.unreadCount);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    setSocket(newSocket);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (isOpen && (!notifications || notifications.length === 0)) {
      fetchNotifications(true);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    
    if (notification.actionUrl) {
      setIsOpen(false);
      // Navigation handled by Link component
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getNotificationIcon = (type) => {
    // Return appropriate icon based on notification type
    return '🔔';
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get recent 5 notifications
  const recentNotifications = Array.isArray(notifications) ? notifications.slice(0, 5) : [];

  // Get notification center URL based on user role
  const notificationCenterUrl = user ? `/${user.role}/notifications` : '/notifications';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    {notification.actionUrl ? (
                      <Link
                        to={notification.actionUrl}
                        onClick={() => handleNotificationClick(notification)}
                        className="block"
                      >
                        <NotificationContent notification={notification} />
                      </Link>
                    ) : (
                      <div
                        onClick={() => handleNotificationClick(notification)}
                        className="cursor-pointer"
                      >
                        <NotificationContent notification={notification} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Link
              to={notificationCenterUrl}
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// Notification Content Component
const NotificationContent = ({ notification }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex gap-3">
      <div className={`flex-shrink-0 w-2 rounded-full ${getPriorityColor(notification.priority)}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
            {notification.title}
          </h4>
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default NotificationBell;
