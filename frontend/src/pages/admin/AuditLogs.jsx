import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [securityEvents, setSecurityEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'stats', 'security'
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    category: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const actionTypes = [
    'LOGIN', 'LOGOUT',
    'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_STATUS_CHANGED',
    'APPOINTMENT_CREATED', 'APPOINTMENT_UPDATED', 'APPOINTMENT_CANCELLED',
    'QUEUE_ENTRY_CREATED', 'QUEUE_ENTRY_UPDATED',
    'PRESCRIPTION_CREATED',
    'PASSWORD_CHANGED', 'PROFILE_UPDATED',
    'RECORD_ACCESSED', 'RECORD_CREATED', 'RECORD_UPDATED'
  ];

  const categoryTypes = [
    'AUTH', 'USER_MANAGEMENT', 'APPOINTMENT', 'QUEUE', 'PRESCRIPTION', 'RECORD', 'PROFILE'
  ];

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'security') {
      fetchSecurityEvents();
    }
  }, [activeTab, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get('/audit/logs', { params });
      setLogs(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/stats', { params: { days: 30 } });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      toast.error('Failed to fetch audit statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/security', { params: { days: 7 } });
      setSecurityEvents(response.data);
    } catch (error) {
      console.error('Error fetching security events:', error);
      toast.error('Failed to fetch security events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      category: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-100';
      case 'FAILURE': return 'text-red-600 bg-red-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'AUTH': 'bg-blue-100 text-blue-800',
      'USER_MANAGEMENT': 'bg-purple-100 text-purple-800',
      'APPOINTMENT': 'bg-green-100 text-green-800',
      'QUEUE': 'bg-yellow-100 text-yellow-800',
      'PRESCRIPTION': 'bg-pink-100 text-pink-800',
      'RECORD': 'bg-indigo-100 text-indigo-800',
      'PROFILE': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'security' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Security Events
          </button>
        </div>
      </div>

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categoryTypes.map(category => (
                  <option key={category} value={category}>{category.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No audit logs found</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {log.userId?.personalInfo?.firstName} {log.userId?.personalInfo?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{log.userId?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(log.category)}`}>
                              {log.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                            {log.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ipAddress || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFilterChange('page', pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handleFilterChange('page', pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-8 text-center bg-white rounded-lg shadow">Loading statistics...</div>
          ) : stats ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 mb-1">Total Logs</div>
                  <div className="text-3xl font-bold text-blue-600">{stats.totalLogs}</div>
                  <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
                </div>
                {stats.logsByStatus.map(item => (
                  <div key={item._id} className="bg-white p-6 rounded-lg shadow">
                    <div className="text-sm text-gray-600 mb-1">{item._id} Logs</div>
                    <div className={`text-3xl font-bold ${item._id === 'SUCCESS' ? 'text-green-600' : item._id === 'FAILURE' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {item.count}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{((item.count / stats.totalLogs) * 100).toFixed(1)}% of total</div>
                  </div>
                ))}
              </div>

              {/* Logs by Category */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Activity by Category</h2>
                <div className="space-y-3">
                  {stats.logsByCategory.map(item => (
                    <div key={item._id} className="flex items-center">
                      <div className="w-40 text-sm font-medium">{item._id.replace(/_/g, ' ')}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 flex items-center justify-end pr-2 text-white text-sm font-medium"
                            style={{ width: `${(item.count / stats.totalLogs) * 100}%` }}
                          >
                            {item.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Actions */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Top 10 Actions</h2>
                <div className="space-y-2">
                  {stats.logsByAction.map((item, index) => (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="font-medium">{item._id.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-blue-600 font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Active Users */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Most Active Users</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity Count</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.activeUsers.map((user) => (
                        <tr key={user.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.activityCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Security Events Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-8 text-center bg-white rounded-lg shadow">Loading security events...</div>
          ) : securityEvents ? (
            <>
              {/* Suspicious Activities */}
              {securityEvents.suspiciousActivities.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                  <h2 className="text-xl font-bold text-red-800 mb-4">⚠️ Suspicious Activities (3+ Failed Logins)</h2>
                  <div className="space-y-3">
                    {securityEvents.suspiciousActivities.map((activity) => (
                      <div key={activity._id} className="bg-white p-4 rounded-lg border border-red-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {activity.user.personalInfo.firstName} {activity.user.personalInfo.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{activity.user.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">{activity.failedAttempts}</div>
                            <div className="text-xs text-gray-500">Failed attempts</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Last attempt: {formatDate(activity.lastAttempt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Logins */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Recent Failed Login Attempts</h2>
                {securityEvents.failedLogins.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No failed login attempts in the last 7 days</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {securityEvents.failedLogins.map((log) => (
                          <tr key={log._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(log.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {log.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.ipAddress || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Account Status Changes */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Recent Account Status Changes</h2>
                {securityEvents.statusChanges.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No status changes in the last 7 days</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {securityEvents.statusChanges.map((log) => (
                          <tr key={log._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(log.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.userId?.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.targetUserId?.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {log.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
