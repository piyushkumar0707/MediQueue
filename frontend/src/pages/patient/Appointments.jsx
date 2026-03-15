import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Appointments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    appointmentDate: '',
    timeSlot: { startTime: '', endTime: '' }
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments/my-appointments');
      if (response.success) {
        setAppointments(response.data || []);
      }
    } catch (err) {
      const status = err?.statusCode || err?.status;
      if (status === 401 || status === 403) {
        setError({ type: 'auth', message: 'Your session has expired. Please log in again to view your appointments.' });
      } else if (!navigator.onLine) {
        setError({ type: 'network', message: 'No internet connection. Please check your network and try again.' });
      } else {
        setError({ type: 'general', message: err?.message || 'Something went wrong while loading your appointments. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['scheduled', 'confirmed'].includes(apt.status);
    if (filter === 'completed') return apt.status === 'completed';
    if (filter === 'cancelled') return apt.status === 'cancelled';
    return true;
  });

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

  const handleCancelAppointment = async (appointmentId) => {
    setCancellingId(appointmentId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    try {
      await api.delete(`/appointments/${cancellingId}`, {
        data: { cancelReason: cancelReason || 'No reason provided' }
      });
      toast.success('Appointment cancelled successfully');
      setShowCancelModal(false);
      setCancellingId(null);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment. Please try again.');
    }
  };

  const handleRescheduleClick = (appointment) => {
    setSelectedAppointment(appointment);
    const date = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    setRescheduleData({
      appointmentDate: date,
      timeSlot: appointment.timeSlot
    });
    setShowRescheduleModal(true);
  };

  const downloadAppointmentConfirmation = async (appointment) => {
    try {
      const authStorage = JSON.parse(localStorage.getItem('auth-storage'));
      const token = authStorage?.state?.accessToken;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments/${appointment._id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appointment-${appointment._id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Appointment confirmation downloaded');
    } catch (error) {
      toast.error('Failed to download confirmation');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rescheduleData.appointmentDate || !rescheduleData.timeSlot.startTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      await api.patch(`/appointments/${selectedAppointment._id}/reschedule`, rescheduleData);
      toast.success('Appointment rescheduled successfully');
      setShowRescheduleModal(false);
      fetchAppointments();
    } catch (error) {
      console.error('Reschedule error:', error);
      toast.error(error.message || 'Failed to reschedule appointment');
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        slots.push({ startTime, endTime });
      }
    }
    return slots;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    const isAuth = error.type === 'auth';
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md px-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isAuth ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            {isAuth ? (
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isAuth ? 'Session Expired' : 'Unable to Load Appointments'}
          </h3>
          <p className="text-gray-500 mb-6">{error.message}</p>
          <div className="flex gap-3 justify-center">
            {isAuth ? (
              <a href="/login" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Log In Again
              </a>
            ) : (
              <>
                <button
                  onClick={() => { setError(null); fetchAppointments(); }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Try Again
                </button>
                <a href="/login" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                  Log In Again
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">View and manage your appointments</p>
        </div>
        <Link
          to="/patient/appointments/book"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Book New</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'upcoming'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming ({appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'completed'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({appointments.filter(a => a.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'cancelled'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled ({appointments.filter(a => a.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Dr. {appointment.doctor?.personalInfo?.firstName} {appointment.doctor?.personalInfo?.lastName}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      {appointment.doctor?.professionalInfo?.specialty || 'General Physician'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-700">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{formatTime(appointment.timeSlot?.startTime)}</span>
                      </div>
                    </div>
                    
                    {appointment.reasonForVisit && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">Reason:</span> {appointment.reasonForVisit}
                        </p>
                      </div>
                    )}
                    
                    {appointment.notes && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">Notes:</span> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              {['scheduled', 'confirmed'].includes(appointment.status) && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                  <button
                    onClick={() => handleCancelAppointment(appointment._id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                  >
                    Cancel Appointment
                  </button>
                  <button
                    onClick={() => handleRescheduleClick(appointment)}
                    className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => downloadAppointmentConfirmation(appointment)}
                    className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium transition"
                  >
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' ? 'Book your first appointment to get started' : `You don't have any ${filter} appointments`}
          </p>
          <Link
            to="/patient/appointments/book"
            className="inline-block bg-indigo-600 text-white py-3 px-8 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Book Appointment
          </Link>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reschedule Appointment</h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleData.appointmentDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, appointmentDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time Slot
                </label>
                <select
                  value={rescheduleData.timeSlot.startTime}
                  onChange={(e) => {
                    const selected = generateTimeSlots().find(slot => slot.startTime === e.target.value);
                    setRescheduleData({ ...rescheduleData, timeSlot: selected });
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="">Select time slot</option>
                  {generateTimeSlots().map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Appointment</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for cancellation (optional).</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowCancelModal(false); setCancellingId(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Keep Appointment
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Appointments;
