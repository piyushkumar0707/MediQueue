import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{overview.users.total}</p>
            <p className="text-sm text-gray-600 mt-2">
              +{overview.users.newInPeriod} in last {period} days
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Appointments</h3>
            <p className="text-3xl font-bold text-green-600">{overview.appointments.total}</p>
            <p className="text-sm text-gray-600 mt-2">
              In selected period
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Queue Entries</h3>
            <p className="text-3xl font-bold text-purple-600">{overview.queue.total}</p>
            <p className="text-sm text-gray-600 mt-2">
              In selected period
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Avg Wait Time</h3>
            <p className="text-3xl font-bold text-orange-600">
              {Math.round(overview.queue.avgWaitTime / 60000)}m
            </p>
            <p className="text-sm text-gray-600 mt-2">
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
          <h2 className="text-xl font-semibold mb-4">Queue Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={queuePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id.date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalEntries" stroke="#3B82F6" name="Total Entries" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
              <Line type="monotone" dataKey="cancelled" stroke="#EF4444" name="Cancelled" />
              <Line type="monotone" dataKey="emergency" stroke="#F59E0B" name="Emergency" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doctor Performance Table */}
      {doctorPerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Doctor Performance</h2>
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
