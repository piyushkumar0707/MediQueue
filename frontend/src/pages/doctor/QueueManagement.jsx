import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QueueManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState([]);
  const [stats, setStats] = useState({
    waiting: 0,
    inProgress: 0,
    totalToday: 0
  });
  const [callingPatient, setCallingPatient] = useState(null);
  const [completingPatient, setCompletingPatient] = useState(null);

  useEffect(() => {
    fetchQueue();
    fetchStats();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchQueue();
      fetchStats();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await api.get('/queue/doctor-queue?status=all');
      if (response.success) {
        setQueueData(response.data);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/queue/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCallNext = async () => {
    try {
      setCallingPatient(true);
      const response = await api.post('/queue/call-next');
      if (response.success) {
        toast.success('Patient called successfully!');
        fetchQueue();
        fetchStats();
      }
    } catch (error) {
      console.error('Error calling next patient:', error);
      toast.error(error.message || 'Failed to call next patient');
    } finally {
      setCallingPatient(false);
    }
  };

  const handleComplete = async (queueId) => {
    if (!window.confirm('Mark this consultation as complete?')) {
      return;
    }

    try {
      setCompletingPatient(queueId);
      const response = await api.patch(`/queue/${queueId}/status`, {
        status: 'completed'
      });
      if (response.success) {
        toast.success('Consultation marked as complete!');
        fetchQueue();
        fetchStats();
      }
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast.error(error.message || 'Failed to complete consultation');
    } finally {
      setCompletingPatient(null);
    }
  };

  const handleCancel = async (queueId) => {
    if (!window.confirm('Cancel this queue entry?')) {
      return;
    }

    try {
      const response = await api.delete(`/queue/${queueId}`);
      if (response.success) {
        toast.success('Queue entry cancelled');
        fetchQueue();
        fetchStats();
      }
    } catch (error) {
      console.error('Error cancelling queue:', error);
      toast.error(error.message || 'Failed to cancel queue entry');
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      normal: 'bg-blue-100 text-blue-800 border-blue-300',
      urgent: 'bg-orange-100 text-orange-800 border-orange-300',
      emergency: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[priority] || styles.normal;
  };

  const getStatusBadge = (status) => {
    const styles = {
      waiting: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.waiting;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWaitTime = (checkInTime) => {
    const now = new Date();
    const checkIn = new Date(checkInTime);
    const diff = Math.floor((now - checkIn) / 1000 / 60);
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const waitingQueue = queueData.filter(q => q.status === 'waiting');
  const inProgressQueue = queueData.filter(q => q.status === 'in-progress');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
          <p className="text-gray-600 mt-1">Manage your patient queue efficiently</p>
        </div>
        <button
          onClick={handleCallNext}
          disabled={callingPatient || waitingQueue.length === 0}
          className={`px-6 py-3 rounded-lg font-semibold transition flex items-center space-x-2 ${
            callingPatient || waitingQueue.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>{callingPatient ? 'Calling...' : 'Call Next Patient'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Waiting</p>
              <p className="text-4xl font-bold mt-2">{stats.waiting}</p>
            </div>
            <div className="p-4 bg-white bg-opacity-30 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">In Progress</p>
              <p className="text-4xl font-bold mt-2">{stats.inProgress}</p>
            </div>
            <div className="p-4 bg-white bg-opacity-30 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Today's Total</p>
              <p className="text-4xl font-bold mt-2">{stats.totalToday}</p>
            </div>
            <div className="p-4 bg-white bg-opacity-30 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* In Progress Section */}
      {inProgressQueue.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-green-50 border-l-4 border-green-500 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Currently Consulting
            </h2>
          </div>
          <div className="p-6">
            {inProgressQueue.map((patient) => (
              <div key={patient._id} className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 bg-green-200 rounded-full">
                      <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.patient?.personalInfo?.firstName} {patient.patient?.personalInfo?.lastName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(patient.priority)}`}>
                          {patient.priority.toUpperCase()}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          #{patient.queueNumber}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {patient.reasonForVisit}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Check-in: {formatTime(patient.checkInTime)}</span>
                        <span>Called: {formatTime(patient.calledTime)}</span>
                        <span>Duration: {formatWaitTime(patient.calledTime)} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/doctor/prescriptions/create?patientId=${patient.patient._id}&queueEntryId=${patient._id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                      Create Prescription
                    </button>
                    <button
                      onClick={() => handleComplete(patient._id)}
                      disabled={completingPatient === patient._id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {completingPatient === patient._id ? 'Completing...' : 'Mark Complete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Queue */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Waiting Queue ({waitingQueue.length})
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Auto-refreshing every 15 seconds
            </div>
          </div>
        </div>

        <div className="p-6">
          {waitingQueue.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600 font-medium">No patients in waiting queue</p>
              <p className="text-sm text-gray-500 mt-1">Patients will appear here when they join your queue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {waitingQueue.map((patient, index) => (
                <div
                  key={patient._id}
                  className={`border rounded-lg p-4 transition hover:shadow-md ${
                    patient.priority === 'emergency' ? 'border-red-300 bg-red-50' :
                    patient.priority === 'urgent' ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`text-3xl font-bold ${
                        patient.priority === 'emergency' ? 'text-red-600' :
                        patient.priority === 'urgent' ? 'text-orange-600' :
                        'text-indigo-600'
                      }`}>
                        #{patient.queueNumber}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient.patient?.personalInfo?.firstName} {patient.patient?.personalInfo?.lastName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(patient.priority)}`}>
                            {patient.priority.toUpperCase()}
                          </span>
                          {index === 0 && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              NEXT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Reason:</strong> {patient.reasonForVisit}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Check-in: {formatTime(patient.checkInTime)}</span>
                          <span>Waiting: {formatWaitTime(patient.checkInTime)} min</span>
                          <span>Position: {index + 1}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancel.bind(null, patient._id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueManagement;

