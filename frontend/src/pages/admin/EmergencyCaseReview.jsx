import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EmergencyReview = () => {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all'
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [casesRes, statsRes, doctorsRes] = await Promise.all([
        api.get('/admin/emergency', { 
          params: { 
            status: filters.status !== 'all' ? filters.status : undefined,
            priority: filters.priority !== 'all' ? filters.priority : undefined
          } 
        }),
        api.get('/admin/emergency/stats'),
        api.get('/admin/emergency/available-doctors')
      ]);

      let filteredCases = casesRes.data || [];
      
      // Apply type filter on frontend
      if (filters.type !== 'all') {
        filteredCases = filteredCases.filter(c => c.type === filters.type);
      }

      setCases(filteredCases);
      setStats(statsRes.data);
      setDoctors(doctorsRes.data || []);
    } catch (error) {
      console.error('Error fetching emergency data:', error);
      toast.error('Failed to fetch emergency cases');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDoctor = async (doctorId) => {
    try {
      if (!selectedCase || selectedCase.type !== 'queue') {
        toast.error('Can only assign doctors to queue entries');
        return;
      }

      await api.patch(`/admin/emergency/${selectedCase._id}/assign`, { doctorId });
      toast.success('Doctor assigned successfully');
      setShowAssignModal(false);
      setSelectedCase(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning doctor:', error);
      toast.error('Failed to assign doctor');
    }
  };

  const handleUpdatePriority = async (priority) => {
    try {
      if (!selectedCase || selectedCase.type !== 'queue') {
        toast.error('Can only update priority for queue entries');
        return;
      }

      await api.patch(`/admin/emergency/${selectedCase._id}/priority`, { priority });
      toast.success('Priority updated successfully');
      setShowPriorityModal(false);
      setSelectedCase(null);
      fetchData();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const handleUpdateStatus = async (caseId, newStatus) => {
    try {
      await api.patch(`/admin/emergency/${caseId}/status`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      5: 'bg-red-100 text-red-800 border-red-300',
      4: 'bg-orange-100 text-orange-800 border-orange-300',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      2: 'bg-blue-100 text-blue-800 border-blue-300',
      1: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      5: 'Critical',
      4: 'High',
      3: 'Medium',
      2: 'Low',
      1: 'Routine'
    };
    return labels[priority] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      'waiting': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'scheduled': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Emergency Review</h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <div className="text-sm text-red-600 mb-1">Recent Emergencies</div>
            <div className="text-3xl font-bold text-red-700">{stats.recentEmergencies}</div>
            <div className="text-xs text-red-500 mt-1">Last 24 hours</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
            <div className="text-sm text-orange-600 mb-1">Active Cases</div>
            <div className="text-3xl font-bold text-orange-700">
              {cases.filter(c => ['waiting', 'in-progress'].includes(c.status)).length}
            </div>
            <div className="text-xs text-orange-500 mt-1">Waiting + In Progress</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Avg Wait Time</div>
            <div className="text-3xl font-bold text-blue-700">{stats.avgWaitTime}m</div>
            <div className="text-xs text-blue-500 mt-1">Last 7 days</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <div className="text-sm text-green-600 mb-1">Available Doctors</div>
            <div className="text-3xl font-bold text-green-700">{doctors.length}</div>
            <div className="text-xs text-green-500 mt-1">Currently active</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="queue">Queue Entries</option>
              <option value="appointment">Appointments</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="waiting">Waiting</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="5">Critical (5)</option>
              <option value="4">High (4)</option>
              <option value="3">Medium (3)</option>
              <option value="2">Low (2)</option>
              <option value="1">Routine (1)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emergency Cases List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading emergency cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No emergency cases found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wait Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.map((emergencyCase) => (
                  <tr key={emergencyCase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        emergencyCase.type === 'queue' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {emergencyCase.type === 'queue' ? 'Queue' : 'Appointment'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{emergencyCase.patient.name}</div>
                      <div className="text-sm text-gray-500">{emergencyCase.patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {emergencyCase.priority ? (
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getPriorityColor(emergencyCase.priority)}`}>
                          {getPriorityLabel(emergencyCase.priority)} ({emergencyCase.priority})
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(emergencyCase.status)}`}>
                        {emergencyCase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emergencyCase.doctor ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{emergencyCase.doctor.name}</div>
                          <div className="text-xs text-gray-500">{emergencyCase.doctor.specialization}</div>
                        </div>
                      ) : (
                        <span className="text-red-600 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {emergencyCase.type === 'queue' ? (
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{emergencyCase.chiefComplaint}</div>
                          {emergencyCase.symptoms && emergencyCase.symptoms.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Symptoms: {emergencyCase.symptoms.join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{emergencyCase.reason}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(emergencyCase.appointmentDate).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {emergencyCase.waitTime !== undefined ? (
                        <span className={`font-medium ${
                          emergencyCase.waitTime > 60 ? 'text-red-600' :
                          emergencyCase.waitTime > 30 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {formatWaitTime(emergencyCase.waitTime)}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-1">
                        {emergencyCase.type === 'queue' && (
                          <>
                            <button
                              onClick={() => { setSelectedCase(emergencyCase); setShowAssignModal(true); }}
                              className="text-blue-600 hover:text-blue-900 text-left"
                            >
                              Assign Doctor
                            </button>
                            <button
                              onClick={() => { setSelectedCase(emergencyCase); setShowPriorityModal(true); }}
                              className="text-orange-600 hover:text-orange-900 text-left"
                            >
                              Change Priority
                            </button>
                            {emergencyCase.status === 'waiting' && (
                              <button
                                onClick={() => handleUpdateStatus(emergencyCase._id, 'in-progress')}
                                className="text-green-600 hover:text-green-900 text-left"
                              >
                                Start Treatment
                              </button>
                            )}
                            {emergencyCase.status === 'in-progress' && (
                              <button
                                onClick={() => handleUpdateStatus(emergencyCase._id, 'completed')}
                                className="text-purple-600 hover:text-purple-900 text-left"
                              >
                                Mark Complete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Doctor Modal */}
      {showAssignModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Assign Doctor</h2>
            <p className="text-gray-600 mb-4">
              Patient: <strong>{selectedCase.patient.name}</strong>
            </p>
            <div className="space-y-2 mb-6">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAssignDoctor(doctor._id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{doctor.name}</div>
                      <div className="text-sm text-gray-600">{doctor.specialization}</div>
                      <div className="text-xs text-gray-500">Experience: {doctor.experience} years</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        Active: {doctor.activePatients}
                      </div>
                      <div className={`text-xs ${
                        doctor.activePatients === 0 ? 'text-green-600' :
                        doctor.activePatients < 3 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {doctor.activePatients === 0 ? 'Available' :
                         doctor.activePatients < 3 ? 'Busy' : 'Very Busy'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedCase(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Priority Modal */}
      {showPriorityModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Change Priority</h2>
            <p className="text-gray-600 mb-4">
              Patient: <strong>{selectedCase.patient.name}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Current Priority: <strong>{getPriorityLabel(selectedCase.priority)} ({selectedCase.priority})</strong>
            </p>
            <div className="space-y-2 mb-6">
              {[5, 4, 3, 2, 1].map((priority) => (
                <button
                  key={priority}
                  onClick={() => handleUpdatePriority(priority)}
                  className={`w-full p-3 rounded-lg border-2 text-left font-medium ${getPriorityColor(priority)} hover:opacity-80`}
                >
                  {getPriorityLabel(priority)} ({priority})
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => { setShowPriorityModal(false); setSelectedCase(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyReview;
