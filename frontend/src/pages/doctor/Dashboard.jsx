import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [stats, setStats] = useState({
    waiting: 0,
    inProgress: 0,
    completed: 0,
    todayTotal: 0
  });
  const [currentPatient, setCurrentPatient] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch today's queue
      const queueRes = await api.get('/queue/doctor-queue?status=all');
      console.log('Queue response:', queueRes);
      if (queueRes.success) {
        const queueData = queueRes.data || [];
        const summary = queueRes.summary || {};
        setQueue(queueData);
        setStats({
          waiting: summary.waiting || queueData.filter(q => q.status === 'waiting').length,
          inProgress: summary.inProgress || queueData.filter(q => q.status === 'in-progress').length,
          completed: summary.completed || queueData.filter(q => q.status === 'completed').length,
          todayTotal: 0
        });
        
        // Find current patient
        const current = queueData.find(q => q.status === 'in-progress');
        setCurrentPatient(current || null);
      }

      // Fetch today's appointments
      const appointmentsRes = await api.get('/appointments/doctor-appointments');
      console.log('Appointments response:', appointmentsRes);
      if (appointmentsRes.success) {
        const appointmentsData = appointmentsRes.data || [];
        setTodayAppointments(appointmentsData);
        setStats(prev => ({
          ...prev,
          todayTotal: appointmentsData.length
        }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      const res = await api.post('/queue/call-next', {
        consultationRoom: 'Room 1'
      });
      
      if (res.success) {
        const patientData = res.data || {};
        const patientName = patientData.patient?.personalInfo?.fullName || 'Next patient';
        toast.success(`Calling ${patientName}`);
        fetchDashboardData();
      }
    } catch (error) {
      const message = error.message || 'Failed to call next patient';
      toast.error(message);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!currentPatient) return;

    try {
      await api.patch(`/queue/${currentPatient._id}/status`, {
        status: 'completed'
      });
      
      toast.success('Consultation completed');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to complete consultation');
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const waitingQueue = queue.filter(q => q.status === 'waiting');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Dr. {user?.personalInfo?.fullName?.split(' ')[user?.personalInfo?.fullName?.split(' ').length - 1]}!
        </h1>
        <p className="text-indigo-100">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link to="/doctor/queue" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Waiting</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Click to view queue →</p>
        </Link>

        <Link to="/doctor/queue" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-green-600">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Active consultations</p>
        </Link>

        <Link to="/doctor/queue" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.completed}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Today's completed</p>
        </Link>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Appointments</p>
              <p className="text-3xl font-bold text-purple-600">{stats.todayTotal}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Scheduled today</p>
        </div>
      </div>

      {/* Current Patient */}
      {currentPatient ? (
        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Current Patient</h2>
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
              In Progress
            </span>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold mb-1">
                  {currentPatient.patient.personalInfo.fullName}
                </p>
                <p className="text-green-100 mb-2">
                  {currentPatient.patient.phoneNumber} • {currentPatient.patient.email}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Reason:</span> {currentPatient.reasonForVisit}
                </p>
                {currentPatient.consultationRoom && (
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Room:</span> {currentPatient.consultationRoom}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">#{currentPatient.queueNumber}</p>
                <p className="text-sm text-green-100">Queue Number</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleCompleteConsultation}
            className="mt-4 w-full bg-white text-green-600 py-3 px-6 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Complete Consultation
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Consultation</h3>
          <p className="text-gray-600 mb-4">Call the next patient from the queue</p>
          {waitingQueue.length > 0 && (
            <button
              onClick={handleCallNext}
              className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Call Next Patient
            </button>
          )}
        </div>
      )}

      {/* Waiting Queue */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Waiting Queue ({waitingQueue.length})</h2>
          <Link 
            to="/doctor/queue" 
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>

        {waitingQueue.length > 0 ? (
          <div className="space-y-3">
            {waitingQueue.slice(0, 5).map((patient) => (
              <div 
                key={patient._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-indigo-600">#{patient.queueNumber}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {patient.patient.personalInfo.fullName}
                    </p>
                    <p className="text-sm text-gray-600">{patient.reasonForVisit}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(patient.priority)}`}>
                        {patient.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        Waiting {patient.waitDuration} min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="text-2xl font-bold text-indigo-600">#{patient.position}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-2 text-gray-600">No patients in queue</p>
          </div>
        )}
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Appointments</h2>
        
        {todayAppointments.length > 0 ? (
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div 
                key={appointment._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {appointment.patient.personalInfo.fullName}
                    </p>
                    <p className="text-sm text-gray-600">{appointment.reasonForVisit}</p>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-4">
                  <div>
                    <p className="font-medium text-gray-900">{formatTime(appointment.timeSlot.startTime)}</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No appointments scheduled for today</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          to="/doctor/prescriptions/create" 
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create Prescription</h3>
              <p className="text-sm text-gray-600">Write new prescription</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/doctor/prescriptions" 
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Prescriptions</h3>
              <p className="text-sm text-gray-600">All prescriptions history</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/doctor/queue" 
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Queue</h3>
              <p className="text-sm text-gray-600">Full queue management</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DoctorDashboard;
