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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch current queue status
      try {
        const queueRes = await api.get('/queue/my-status');
        if (queueRes.data.success) {
          setQueueStatus(queueRes.data.data);
        }
      } catch (err) {
        // No queue status is okay
        if (err.response?.status !== 404) {
          console.error('Error fetching queue status:', err);
        }
      }

      // Fetch upcoming appointments
      const appointmentsRes = await api.get('/appointments/my-appointments?upcoming=true');
      if (appointmentsRes.data.success) {
        setUpcomingAppointments(appointmentsRes.data.data.slice(0, 3));
        setStats(prev => ({
          ...prev,
          upcomingCount: appointmentsRes.data.data.length
        }));
      }

      // Fetch all appointments for stats
      const allAppointmentsRes = await api.get('/appointments/my-appointments');
      if (allAppointmentsRes.data.success) {
        const completed = allAppointmentsRes.data.data.filter(apt => apt.status === 'completed').length;
        setStats(prev => ({
          ...prev,
          totalAppointments: allAppointmentsRes.data.data.length,
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
    return timeString;
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
          Welcome back, {user?.personalInfo?.fullName?.split(' ')[0]}!
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
                Dr. {queueStatus.doctor.personalInfo.fullName}
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
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.upcomingCount}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Visits</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedVisits}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Appointments</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalAppointments}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
          <Link 
            to="/patient/appointments/book" 
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            Book New →
          </Link>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div 
                key={appointment._id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Dr. {appointment.doctor.personalInfo.fullName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.doctor.professionalInfo?.specialization || 'General Physician'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {appointment.reasonForVisit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                  <p className="text-sm text-gray-600">{formatTime(appointment.timeSlot.startTime)}</p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-gray-600">No upcoming appointments</p>
            <Link 
              to="/patient/appointments/book" 
              className="mt-4 inline-block bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition"
            >
              Book Appointment
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/patient/queue/join" 
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Join Queue</h3>
              <p className="text-sm text-gray-600">Join a doctor's queue</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/patient/appointments/book" 
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Book Appointment</h3>
              <p className="text-sm text-gray-600">Schedule with a doctor</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Health Records Quick Action */}
      <div className="grid grid-cols-1 gap-6">
        <Link 
          to="/patient/records" 
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Health Records</h3>
              <p className="text-sm text-gray-600">View your medical history</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PatientDashboard;
