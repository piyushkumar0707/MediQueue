import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QueueTracking = () => {
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchQueueStatus = async () => {
    try {
      const res = await api.get('/queue/my-status');
      if (res.success) {
        setQueueData(res.data);
      }
    } catch (error) {
      if (error.message?.includes('not currently in any queue')) {
        setQueueData(null);
      } else {
        console.error('Error fetching queue status:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!window.confirm('Are you sure you want to leave the queue?')) {
      return;
    }

    try {
      setCancelling(true);
      const res = await api.delete(`/queue/${queueData._id}`);
      if (res.success) {
        toast.success('Successfully left the queue');
        navigate('/patient');
      }
    } catch (error) {
      console.error('Error cancelling queue:', error);
      toast.error(error.message || 'Failed to leave queue');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchQueueStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!queueData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not in Queue</h2>
          <p className="text-gray-600 mb-6">You are not currently in any queue</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/patient')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/patient/queue/join')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Join Queue
            </button>
            <button
              onClick={() => navigate('/patient/appointments/book')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { status, queueNumber, currentPosition, estimatedWaitTime, doctor } = queueData;
  const waitMinutes = Math.ceil(estimatedWaitTime / 60);
  const progress = currentPosition > 0 ? Math.max(0, 100 - (currentPosition * 20)) : 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/patient')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Queue Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor your position in real-time</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className={`px-6 py-4 ${
          status === 'waiting' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
          status === 'in-progress' ? 'bg-green-50 border-l-4 border-green-400' :
          'bg-gray-50 border-l-4 border-gray-400'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {status === 'waiting' && 'Waiting in Queue'}
                {status === 'in-progress' && 'Your Turn - Please Proceed'}
                {status === 'completed' && 'Consultation Completed'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {status === 'waiting' && 'Please wait for your turn'}
                {status === 'in-progress' && 'The doctor is ready to see you now'}
                {status === 'completed' && 'Thank you for visiting'}
              </p>
            </div>
            {status === 'waiting' && (
              <div className="flex items-center">
                <div className="animate-pulse">
                  <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            {status === 'in-progress' && (
              <div className="flex items-center">
                <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Queue Number and Position */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">#{queueNumber}</div>
              <div className="text-sm text-gray-600">Your Queue Number</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{currentPosition}</div>
              <div className="text-sm text-gray-600">
                {currentPosition === 0 ? 'Your Turn!' : `${currentPosition === 1 ? 'Person' : 'People'} Ahead`}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">~{waitMinutes}</div>
              <div className="text-sm text-gray-600">Minutes Wait</div>
            </div>
          </div>

          {/* Progress Bar */}
          {status === 'waiting' && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Doctor Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Information</h3>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Dr. {doctor?.personalInfo?.firstName} {doctor?.personalInfo?.lastName}
                </h4>
                <p className="text-sm text-gray-600">{doctor?.professionalInfo?.specialization}</p>
                {doctor?.professionalInfo?.department && (
                  <p className="text-sm text-gray-500 mt-1">{doctor?.professionalInfo?.department}</p>
                )}
              </div>
            </div>
          </div>

          {/* Auto-refresh indicator */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Auto-refreshing every 10 seconds</span>
              </div>
              <button
                onClick={fetchQueueStatus}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Refresh Now
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {(status === 'waiting' || status === 'in-progress') && (
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={handleCancelQueue}
                disabled={cancelling}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{cancelling ? 'Leaving Queue...' : 'Leave Queue'}</span>
              </button>
              <p className="mt-2 text-sm text-gray-500 text-center">
                You can leave the queue anytime before consultation
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Notes</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Please stay nearby when your position is close</li>
                <li>Wait times are estimates and may vary</li>
                <li>Emergency cases may be prioritized</li>
                <li>You'll receive a notification when it's your turn</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueTracking;
