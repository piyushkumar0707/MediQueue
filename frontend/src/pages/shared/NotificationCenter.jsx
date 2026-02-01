import { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useNotificationStore from '../../store/notificationStore';
import toast from 'react-hot-toast';

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    filters,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    clearRead,
    setFilters,
  } = useNotificationStore();

  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    fetchNotifications(true);
    fetchUnreadCount();
  }, [filters]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearRead = async () => {
    if (confirm('Are you sure you want to delete all read notifications?')) {
      try {
        await clearRead();
        toast.success('Read notifications cleared');
      } catch (error) {
        toast.error('Failed to clear notifications');
      }
    }
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters = { type: null, priority: null, isRead: null };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          <Bell className="w-8 h-8 text-blue-600" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-600 text-blue-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}

          <button
            onClick={handleClearRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Read
          </button>

          <button
            onClick={() => fetchNotifications(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Filter Notifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={localFilters.priority || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      priority: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={
                    localFilters.isRead === null ? '' : localFilters.isRead ? 'read' : 'unread'
                  }
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      isRead:
                        e.target.value === ''
                          ? null
                          : e.target.value === 'read'
                          ? true
                          : false,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={localFilters.type || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, type: e.target.value || null })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="consent_request">Consent Request</option>
                  <option value="consent_granted">Consent Granted</option>
                  <option value="emergency_access">Emergency Access</option>
                  <option value="appointment_booked">Appointment Booked</option>
                  <option value="appointment_reminder">Appointment Reminder</option>
                  <option value="prescription_created">Prescription Created</option>
                  <option value="record_shared">Record Shared</option>
                  <option value="system_alert">System Alert</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {(!notifications || notifications.length === 0) && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
          </div>
        )}

        {notifications && notifications.map((notification) => (
          <div
            key={notification._id}
            className={`bg-white rounded-lg shadow-sm p-6 transition-colors ${
              !notification.isRead ? 'border-l-4 border-blue-600 bg-blue-50' : 'border-l-4 border-transparent'
            }`}
          >
            {notification.actionUrl ? (
              <Link
                to={notification.actionUrl}
                onClick={() => handleNotificationClick(notification)}
                className="block"
              >
                <NotificationItem notification={notification} />
              </Link>
            ) : (
              <div
                onClick={() => handleNotificationClick(notification)}
                className="cursor-pointer"
              >
                <NotificationItem notification={notification} />
              </div>
            )}
          </div>
        ))}

        {/* Load More Button */}
        {hasMore && notifications && notifications.length > 0 && (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    </div>
  );
};

// Notification Item Component
const NotificationItem = ({ notification }) => {
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
    <div className="flex gap-4">
      {/* Icon */}
      <div className="flex-shrink-0">{getPriorityIcon(notification.priority)}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
          {!notification.isRead && (
            <span className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full" />
          )}
        </div>

        <p className="text-gray-700 mb-3">{notification.message}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            {getPriorityIcon(notification.priority)}
            {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
          </span>
          <span>•</span>
          <span>{getTypeLabel(notification.type)}</span>
          <span>•</span>
          <span>{formatTimeAgo(notification.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
