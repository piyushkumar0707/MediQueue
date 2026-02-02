import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  Calendar, 
  UserPlus, 
  AlertCircle, 
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Server,
  Zap,
  X
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    activeQueue: 0,
    flaggedEmergency: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activities, setActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    serverStatus: 'online',
    databaseStatus: 'connected',
    socketConnections: 0,
    apiResponseTime: 0,
    uptime: 0,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    return saved ? JSON.parse(saved) : {
      showStats: true,
      showActivityFeed: true,
      showRecentUsers: true,
      showQuickActions: true,
      showSystemHealth: true,
    };
  });
  const [refreshing, setRefreshing] = useState(false);
  
  const socketRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    connectSocket();
    
    // Fetch stats every 30 seconds
    const statsInterval = setInterval(fetchDashboardData, 30000);
    
    // Fetch health metrics every 10 seconds
    const healthInterval = setInterval(fetchSystemHealth, 10000);
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(healthInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectSocket = () => {
    // Socket.io uses base URL without /api suffix
    const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      path: '/socket.io',
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setSocketConnected(true);
      toast.success('Real-time monitoring active', { duration: 2000 });
      
      // Join admin room
      socketRef.current.emit('join', { role: 'admin' });
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
      toast.error('Real-time monitoring disconnected', { duration: 2000 });
    });

    // Listen for stats updates
    socketRef.current.on('stats-update', (newStats) => {
      console.log('Stats updated:', newStats);
      setStats(prevStats => ({ ...prevStats, ...newStats }));
    });

    // Listen for activity events
    socketRef.current.on('activity-event', (activity) => {
      console.log('New activity:', activity);
      setActivities(prev => [activity, ...prev].slice(0, 20));
    });

    // Listen for system health updates
    socketRef.current.on('health-update', (health) => {
      console.log('Health updated:', health);
      setSystemHealth(prevHealth => ({ ...prevHealth, ...health }));
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });
  };

  const fetchDashboardData = async () => {
    try {
      const startTime = Date.now();
      
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/recent-users?limit=5')
      ]);

      const responseTime = Date.now() - startTime;
      
      console.log('Stats API Response:', statsRes.data);
      console.log('Users API Response:', usersRes.data);
      
      // Map backend response to frontend state - handle both nested and flat structures
      const backendData = statsRes.data?.data || statsRes.data;
      
      if (!backendData || !backendData.users) {
        console.error('Invalid stats data structure:', backendData);
        throw new Error('Invalid stats data received from server');
      }
      
      setStats({
        totalUsers: backendData.users?.total || 0,
        totalPatients: backendData.users?.patients || 0,
        totalDoctors: backendData.users?.doctors || 0,
        totalAppointments: backendData.appointments?.total || 0,
        activeQueue: backendData.queue?.active || 0,
        flaggedEmergency: backendData.emergencyAccess?.flagged || 0
      });
      
      // Handle users response structure
      const usersData = usersRes.data?.data || usersRes.data;
      setRecentUsers(Array.isArray(usersData) ? usersData : []);
      
      setSystemHealth(prev => ({ ...prev, apiResponseTime: responseTime }));
      setLoading(false);
      
      if (refreshing) {
        toast.success('Dashboard refreshed');
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();
      const { uptime } = data;
      
      setSystemHealth(prev => ({
        ...prev,
        serverStatus: 'online',
        databaseStatus: 'connected',
        uptime: uptime,
      }));
    } catch (error) {
      console.error('Error fetching system health:', error);
      setSystemHealth(prev => ({
        ...prev,
        serverStatus: 'offline',
      }));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    fetchSystemHealth();
  };

  const saveWidgetSettings = (newSettings) => {
    setWidgetSettings(newSettings);
    localStorage.setItem('dashboardWidgets', JSON.stringify(newSettings));
    toast.success('Dashboard layout saved');
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return <UserPlus className="w-4 h-4" />;
      case 'appointment_booked':
        return <Calendar className="w-4 h-4" />;
      case 'queue_entry':
        return <Activity className="w-4 h-4" />;
      case 'emergency_access':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_registration':
        return 'text-blue-600 bg-blue-100';
      case 'appointment_booked':
        return 'text-green-600 bg-green-100';
      case 'queue_entry':
        return 'text-purple-600 bg-purple-100';
      case 'emergency_access':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
        <span className="ml-4 text-lg text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time system monitoring and management</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Socket Connection Indicator */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            socketConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {socketConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </>
            )}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Enhanced with gradients */}
      {widgetSettings.showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Users</p>
                <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm text-indigo-100">All system users</span>
            </div>
          </div>

          {/* Total Patients */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Patients</p>
                <p className="text-4xl font-bold mt-2">{stats.totalPatients}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm text-blue-100">Registered patients</span>
            </div>
          </div>

          {/* Total Doctors */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Doctors</p>
                <p className="text-4xl font-bold mt-2">{stats.totalDoctors}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm text-green-100">Active doctors</span>
            </div>
          </div>

          {/* Total Appointments */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Appointments</p>
                <p className="text-4xl font-bold mt-2">{stats.totalAppointments}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-sm text-purple-100">Total bookings</span>
            </div>
          </div>

          {/* Active Queue */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Active Queue</p>
                <p className="text-4xl font-bold mt-2">{stats.activeQueue}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Activity className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              <span className="text-sm text-orange-100">In queue now</span>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Activity Feed */}
        {widgetSettings.showActivityFeed && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Live Activity Feed</h2>
                {socketConnected && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>
            </div>
            
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent activities</p>
                <p className="text-sm text-gray-400 mt-1">System events will appear here in real-time</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Users */}
        {widgetSettings.showRecentUsers && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Registrations</h2>
              <Link to="/admin/users" className="text-indigo-600 text-sm font-medium hover:underline">
                View all
              </Link>
            </div>
            
            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p>No recent registrations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {user.personalInfo?.firstName?.[0]}{user.personalInfo?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.personalInfo?.firstName} {user.personalInfo?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'doctor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {widgetSettings.showQuickActions && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">User Management</p>
                  <p className="text-sm text-gray-600">Manage users</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/audit"
              className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Audit Logs</p>
                  <p className="text-sm text-gray-600">View activity</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/analytics"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">View reports</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/emergency-access"
              className="flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-red-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Emergencies</p>
                  <p className="text-sm text-gray-600">Review cases</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* System Health */}
      {widgetSettings.showSystemHealth && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Server className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">System Health</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Server Status */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                systemHealth.serverStatus === 'online' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Server className={`w-8 h-8 ${
                  systemHealth.serverStatus === 'online' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <p className={`text-lg font-bold ${
                systemHealth.serverStatus === 'online' ? 'text-green-600' : 'text-red-600'
              }`}>
                {systemHealth.serverStatus === 'online' ? 'Online' : 'Offline'}
              </p>
              <p className="text-sm text-gray-600">Server Status</p>
            </div>

            {/* Database Status */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                systemHealth.databaseStatus === 'connected' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Database className={`w-8 h-8 ${
                  systemHealth.databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <p className={`text-lg font-bold ${
                systemHealth.databaseStatus === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>
                {systemHealth.databaseStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-sm text-gray-600">Database</p>
            </div>

            {/* Socket Connections */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                {socketConnected ? (
                  <Wifi className="w-8 h-8 text-blue-600" />
                ) : (
                  <WifiOff className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <p className="text-lg font-bold text-gray-900">
                {socketConnected ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-gray-600">WebSocket</p>
            </div>

            {/* API Response Time */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                systemHealth.apiResponseTime < 500 ? 'bg-green-100' : 
                systemHealth.apiResponseTime < 1000 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Zap className={`w-8 h-8 ${
                  systemHealth.apiResponseTime < 500 ? 'text-green-600' : 
                  systemHealth.apiResponseTime < 1000 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <p className="text-lg font-bold text-gray-900">{systemHealth.apiResponseTime}ms</p>
              <p className="text-sm text-gray-600">Response Time</p>
            </div>

            {/* Uptime */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{formatUptime(systemHealth.uptime)}</p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Customize Dashboard</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={widgetSettings.showStats}
                  onChange={(e) => saveWidgetSettings({ ...widgetSettings, showStats: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-900 font-medium">Show Statistics Cards</span>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={widgetSettings.showActivityFeed}
                  onChange={(e) => saveWidgetSettings({ ...widgetSettings, showActivityFeed: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-900 font-medium">Show Activity Feed</span>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={widgetSettings.showRecentUsers}
                  onChange={(e) => saveWidgetSettings({ ...widgetSettings, showRecentUsers: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-900 font-medium">Show Recent Users</span>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={widgetSettings.showQuickActions}
                  onChange={(e) => saveWidgetSettings({ ...widgetSettings, showQuickActions: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-900 font-medium">Show Quick Actions</span>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={widgetSettings.showSystemHealth}
                  onChange={(e) => saveWidgetSettings({ ...widgetSettings, showSystemHealth: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-900 font-medium">Show System Health</span>
              </label>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
