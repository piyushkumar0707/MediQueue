import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Download, Calendar, TrendingUp, Users, Activity } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [period, setPeriod] = useState('30');
  const [overview, setOverview] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [appointmentTrends, setAppointmentTrends] = useState([]);
  const [queuePerformance, setQueuePerformance] = useState([]);
  const [doctorPerformance, setDoctorPerformance] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [overviewRes, userGrowthRes, appointmentTrendsRes, queuePerfRes, doctorPerfRes] = await Promise.all([
        api.get('/analytics/overview', { params: { period } }),
        api.get('/analytics/user-growth', { params: { days: period } }),
        api.get('/analytics/appointment-trends', { params: { days: period } }),
        api.get('/analytics/queue-performance', { params: { days: period } }),
        api.get('/analytics/doctor-performance', { params: { days: period } })
      ]);

      setOverview(overviewRes.data);
      setUserGrowth(processUserGrowth(userGrowthRes.data));
      setAppointmentTrends(processAppointmentTrends(appointmentTrendsRes.data));
      setQueuePerformance(queuePerfRes.data);
      setDoctorPerformance(doctorPerfRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processUserGrowth = (data) => {
    const groupedByDate = {};
    data.forEach(item => {
      const date = item._id.date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, patient: 0, doctor: 0, admin: 0 };
      }
      groupedByDate[date][item._id.role] = item.count;
    });
    return Object.values(groupedByDate);
  };

  const processAppointmentTrends = (data) => {
    const groupedByDate = {};
    data.forEach(item => {
      const date = item._id.date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date, scheduled: 0, completed: 0, cancelled: 0, pending: 0 };
      }
      groupedByDate[date][item._id.status] = item.count;
    });
    return Object.values(groupedByDate);
  };

  const getUserRoleData = () => {
    if (!overview) return [];
    return overview.users.byRole.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count
    }));
  };

  const getAppointmentStatusData = () => {
    if (!overview) return [];
    return overview.appointments.byStatus.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count
    }));
  };

  const getAppointmentTypeData = () => {
    if (!overview) return [];
    return overview.appointments.byType.map(item => ({
      name: item._id || 'Not Specified',
      value: item.count
    }));
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Overview Data
      const overviewCSV = [
        '=== ANALYTICS OVERVIEW ===',
        `Period: Last ${period} days`,
        `Generated: ${new Date().toLocaleString()}`,
        '',
        '--- User Statistics ---',
        `Total Users: ${overview?.users?.total || 0}`,
        `New Users in Period: ${overview?.users?.newInPeriod || 0}`,
        ...overview?.users?.byRole.map(r => `${r._id}: ${r.count}`) || [],
        '',
        '--- Appointment Statistics ---',
        `Total Appointments: ${overview?.appointments?.total || 0}`,
        ...overview?.appointments?.byStatus.map(s => `${s._id}: ${s.count}`) || [],
        '',
        '--- Queue Statistics ---',
        `Total Queue Entries: ${overview?.queue?.total || 0}`,
        `Average Wait Time: ${Math.round((overview?.queue?.avgWaitTime || 0) / 60000)} minutes`,
        '',
        '--- Doctor Performance ---',
        'Doctor,Specialization,Total Appointments,Completed,Cancelled,Completion Rate',
        ...doctorPerformance.map(d => 
          `"${d.doctorName}","${d.specialization || 'N/A'}",${d.totalAppointments},${d.completed},${d.cancelled},${d.completionRate.toFixed(1)}%`
        )
      ].join('\n');

      const blob = new Blob([overviewCSV], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Analytics report exported successfully!');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics report');
    } finally {
      setExporting(false);
    }
  };

  const exportDoctorPerformance = () => {
    try {
      const headers = ['Doctor Name', 'Specialization', 'Total Appointments', 'Completed', 'Cancelled', 'Completion Rate (%)'];
      const csvData = doctorPerformance.map(d => [
        d.doctorName,
        d.specialization || 'N/A',
        d.totalAppointments,
        d.completed,
        d.cancelled,
        d.completionRate.toFixed(1)
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `doctor-performance-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Doctor performance exported successfully!');
    } catch (error) {
      console.error('Error exporting doctor performance:', error);
      toast.error('Failed to export doctor performance');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive system insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={exportToCSV}
            disabled={exporting || !overview}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Users</h3>
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-4xl font-bold">{overview.users.total}</p>
            <p className="text-sm mt-2 opacity-90">
              <span className="font-semibold">+{overview.users.newInPeriod}</span> in last {period} days
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Appointments</h3>
              <Calendar className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-4xl font-bold">{overview.appointments.total}</p>
            <p className="text-sm mt-2 opacity-90">
              In selected period
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Queue Entries</h3>
              <Activity className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-4xl font-bold">{overview.queue.total}</p>
            <p className="text-sm mt-2 opacity-90">
              In selected period
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Avg Wait Time</h3>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-4xl font-bold">
              {Math.round(overview.queue.avgWaitTime / 60000)}m
            </p>
            <p className="text-sm mt-2 opacity-90">
              Minutes average
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Growth Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="patient" stroke="#10B981" name="Patients" />
              <Line type="monotone" dataKey="doctor" stroke="#3B82F6" name="Doctors" />
              <Line type="monotone" dataKey="admin" stroke="#8B5CF6" name="Admins" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Appointment Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="scheduled" fill="#3B82F6" name="Scheduled" />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
              <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution by Role */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Distribution by Role</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getUserRoleData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getUserRoleData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Appointment Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getAppointmentStatusData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getAppointmentStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Queue Performance */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Queue Performance Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={queuePerformance}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id.date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="totalEntries" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTotal)" name="Total Entries" />
              <Area type="monotone" dataKey="completed" stroke="#10B981" fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
              <Line type="monotone" dataKey="cancelled" stroke="#EF4444" name="Cancelled" />
              <Line type="monotone" dataKey="emergency" stroke="#F59E0B" name="Emergency" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Metrics */}
        {overview && (
          <>
            {/* Appointment Type Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Appointment Types</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getAppointmentTypeData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getAppointmentTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Queue Priority Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Queue Priority Levels</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overview.queue.byPriority || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8B5CF6" name="Queue Entries">
                    {(overview.queue.byPriority || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry._id === 'emergency' ? '#EF4444' :
                        entry._id === 'urgent' ? '#F59E0B' :
                        entry._id === 'normal' ? '#3B82F6' : '#10B981'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Key Insights Section */}
      {overview && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">User Growth Rate</h3>
              <p className="text-2xl font-bold text-blue-600">
                {overview.users.total > 0 
                  ? ((overview.users.newInPeriod / overview.users.total) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-gray-600 mt-1">New users vs total users</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Appointment Success Rate</h3>
              <p className="text-2xl font-bold text-green-600">
                {overview.appointments.total > 0 
                  ? ((overview.appointments.byStatus.find(s => s._id === 'completed')?.count || 0) / overview.appointments.total * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Completed appointments</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Queue Completion Rate</h3>
              <p className="text-2xl font-bold text-purple-600">
                {overview.queue.total > 0 
                  ? ((overview.queue.byPriority.reduce((sum, p) => sum + p.count, 0) / overview.queue.total) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Queue entries processed</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Appointments per Day</h3>
              <p className="text-2xl font-bold text-orange-600">
                {overview.period.days > 0 
                  ? Math.round(overview.appointments.total / overview.period.days)
                  : 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Daily appointment rate</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Active Doctors</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {overview.users.byRole.find(r => r._id === 'doctor')?.count || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Registered doctors</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Patients</h3>
              <p className="text-2xl font-bold text-pink-600">
                {overview.users.byRole.find(r => r._id === 'patient')?.count || 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">Registered patients</p>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Performance Table */}
      {doctorPerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold">Doctor Performance</h2>
              <p className="text-sm text-gray-600 mt-1">Performance metrics for all doctors in selected period</p>
            </div>
            <button
              onClick={exportDoctorPerformance}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Table
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Appointments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cancelled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctorPerformance.map((doctor) => (
                <tr key={doctor._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{doctor.doctorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{doctor.specialization || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doctor.totalAppointments}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600">{doctor.completed}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-red-600">{doctor.cancelled}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.completionRate.toFixed(1)}%
                      </div>
                      <div className="ml-3 w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            doctor.completionRate >= 80
                              ? 'bg-green-600'
                              : doctor.completionRate >= 60
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${doctor.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Analytics;
