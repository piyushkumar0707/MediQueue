import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [queueStatus, setQueueStatus] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedVisits: 0,
    upcomingCount: 0
  });

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds to update queue status
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch current queue status
      try {
        const queueRes = await api.get('/queue/my-status');
        console.log('Queue status response:', queueRes);
        if (queueRes.success) {
          // Only show queue status if it's active (not completed/cancelled)
          const queueData = queueRes.data;
          if (queueData && !['completed', 'cancelled'].includes(queueData.status)) {
            setQueueStatus(queueData);
          } else {
            setQueueStatus(null);
          }
        }
      } catch (err) {
        // No queue status is okay (404 means not in queue)
        if (err.response?.status !== 404) {
          console.error('Error fetching queue status:', err);
        }
        setQueueStatus(null);
      }

      // Fetch upcoming appointments
      const appointmentsRes = await api.get('/appointments/my-appointments?upcoming=true');
      console.log('Upcoming appointments response:', appointmentsRes);
      if (appointmentsRes.success) {
        const upcomingData = appointmentsRes.data || [];
        setUpcomingAppointments(upcomingData.slice(0, 3));
        setStats(prev => ({
          ...prev,
          upcomingCount: upcomingData.length
        }));
      }

      // Fetch all appointments for stats
      const allAppointmentsRes = await api.get('/appointments/my-appointments');
      console.log('All appointments response:', allAppointmentsRes);
      if (allAppointmentsRes.success) {
        const allData = allAppointmentsRes.data || [];
        const completed = allData.filter(apt => apt.status === 'completed').length;
        setStats(prev => ({
          ...prev,
          totalAppointments: allData.length,
          completedVisits: completed
        }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'checked-in':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.personalInfo?.firstName || 'Patient'}!
        </h1>
        <p className="text-indigo-100">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Current Queue Status */}
      {queueStatus && (
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">You're in Queue</h2>
              <p className="text-sm text-gray-600">
                Dr. {queueStatus.doctor?.personalInfo?.firstName} {queueStatus.doctor?.personalInfo?.lastName}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(queueStatus.priority)}`}>
              {queueStatus.priority.charAt(0).toUpperCase() + queueStatus.priority.slice(1)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">#{queueStatus.currentPosition}</p>
              <p className="text-xs text-gray-600 mt-1">Position</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{queueStatus.estimatedWaitTime}</p>
              <p className="text-xs text-gray-600 mt-1">Est. Wait (min)</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{queueStatus.waitDuration}</p>
              <p className="text-xs text-gray-600 mt-1">Waited (min)</p>
            </div>
          </div>

          <Link 
            to="/patient/queue" 
            className="mt-4 block text-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            View Queue Details
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/patient/appointments" className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-md p-6 hover:shadow-xl transition cursor-pointer text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-100 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-white">{stats.upcomingCount}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-indigo-100 mt-2">Click to view all →</p>
        </Link>

        <Link to="/patient/appointments" className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md p-6 hover:shadow-xl transition cursor-pointer text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-100 mb-1">Total Visits</p>
              <p className="text-3xl font-bold text-white">{stats.completedVisits}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-emerald-100 mt-2">Completed visits</p>
        </Link>

        <Link to="/patient/appointments" className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-md p-6 hover:shadow-xl transition cursor-pointer text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100 mb-1">Appointments</p>
              <p className="text-3xl font-bold text-white">{stats.totalAppointments}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-purple-100 mt-2">All appointments</p>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
          <div className="flex gap-3">
            <Link 
              to="/patient/appointments" 
              className="text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              View All
            </Link>
            <Link 
              to="/patient/appointments/book" 
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              Book New →
            </Link>
          </div>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div 
                key={appointment._id} 
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Dr. {appointment.doctor?.personalInfo?.firstName} {appointment.doctor?.personalInfo?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.doctor?.professionalInfo?.specialty || 'General Physician'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {appointment.reasonForVisit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                  <p className="text-sm text-gray-600">{formatTime(appointment.timeSlot?.startTime)}</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <svg className="h-10 w-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">No upcoming appointments</h3>
            <p className="text-sm text-gray-400 mb-5">Schedule a visit with a doctor to get started</p>
            <Link 
              to="/patient/appointments/book" 
              className="inline-flex items-center gap-2 bg-indigo-600 text-white py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Book Appointment
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          to="/patient/queue/join" 
          className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all text-white group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-white text-base">Join Queue</h3>
          <p className="text-sm text-amber-100 mt-1">Join a doctor's queue</p>
        </Link>

        <Link 
          to="/patient/appointments/book" 
          className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all text-white group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="font-bold text-white text-base">Book Appointment</h3>
          <p className="text-sm text-indigo-100 mt-1">Schedule with a doctor</p>
        </Link>

        <Link 
          to="/patient/records" 
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all text-white group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-white text-base">Health Records</h3>
          <p className="text-sm text-emerald-100 mt-1">View your medical history</p>
        </Link>

        <Link 
          to="/patient/prescriptions" 
          className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all text-white group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="font-bold text-white text-base">My Prescriptions</h3>
          <p className="text-sm text-rose-100 mt-1">View all prescriptions</p>
        </Link>
      </div>
    </div>
  );
};

export default PatientDashboard;
