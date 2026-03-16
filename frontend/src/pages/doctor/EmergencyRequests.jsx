import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Clock, CheckCircle, XCircle, Calendar, User, AlertTriangle, Plus, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyEmergencyRequests, revokeEmergencyAccess, requestEmergencyAccess } from '../../services/api';
import api from '../../services/api';

const EMERGENCY_TYPES = [
  { value: 'life-threatening', label: 'Life Threatening' },
  { value: 'critical-care', label: 'Critical Care' },
  { value: 'trauma', label: 'Trauma' },
  { value: 'cardiac-emergency', label: 'Cardiac Emergency' },
  { value: 'stroke', label: 'Stroke' },
  { value: 'severe-allergic-reaction', label: 'Severe Allergic Reaction' },
  { value: 'unconscious-patient', label: 'Unconscious Patient' },
  { value: 'other-emergency', label: 'Other Emergency' },
];

const EmergencyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const searchTimeout = useRef(null);
  const [form, setForm] = useState({
    patientId: '',
    emergencyType: '',
    justification: '',
    location: '',
    facilityName: '',
  });

  useEffect(() => {
    fetchRequests();
  }, [filter, page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await getMyEmergencyRequests({ 
        status: filter === 'all' ? undefined : filter,
        page,
        limit: 10
      });
      
      // Handle both response structures
      const emergencyAccesses = response.data?.emergencyAccesses || response.data || [];
      const paginationData = response.data?.pagination || response.pagination || {};
      
      setRequests(emergencyAccesses);
      setPagination(paginationData);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch emergency requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (accessId) => {
    if (!confirm('Are you sure you want to revoke this emergency access?')) return;
    
    try {
      await revokeEmergencyAccess(accessId, { 
        reason: 'Revoked by requesting doctor' 
      });
      toast.success('Emergency access revoked successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to revoke emergency access');
    }
  };

  const [searching, setSearching] = useState(false);

  const handlePatientSearch = (value) => {
    setPatientSearch(value);
    setSelectedPatient(null);
    setForm(f => ({ ...f, patientId: '' }));
    clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) { setPatientResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/patients/search?q=${encodeURIComponent(value.trim())}`);
        console.log('[PatientSearch] results:', res.data);
        setPatientResults(res.data || []);
      } catch (err) {
        toast.error('Patient search failed: ' + (err.response?.data?.message || err.message));
        setPatientResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.personalInfo?.firstName} ${patient.personalInfo?.lastName} — ${patient.email}`);
    setPatientResults([]);
    setForm(f => ({ ...f, patientId: patient._id }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.emergencyType || !form.justification.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.justification.trim().length < 20) {
      toast.error('Justification must be at least 20 characters — please describe the emergency in more detail');
      return;
    }
    try {
      setSubmitting(true);
      await requestEmergencyAccess(form);
      toast.success('Emergency access request submitted. Pending admin approval.');
      setShowForm(false);
      setForm({ patientId: '', emergencyType: '', justification: '', location: '', facilityName: '' });
      setPatientSearch('');
      setSelectedPatient(null);
      setPatientResults([]);
      fetchRequests();
    } catch (error) {
      const msg = error.response?.data?.errors?.map(e => e.msg).join(', ')
        || error.response?.data?.message
        || error.message
        || 'Failed to submit emergency access request';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Expired' },
      revoked: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Revoked' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const formatEmergencyType = (type) => {
    return type?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Unknown';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading && !requests.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Emergency Access Requests</h1>
          <p className="mt-2 text-gray-600">
            View and manage your emergency break-glass access requests
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Request Emergency Access
        </button>
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Request Emergency Access</h2>
              </div>
              <button onClick={() => { setShowForm(false); setPatientSearch(''); setSelectedPatient(null); setPatientResults([]); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                This request will be logged and reviewed by an administrator. Use only in genuine emergencies.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => handlePatientSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${selectedPatient ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                    autoComplete="off"
                  />
                  {searching && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                      Searching...
                    </div>
                  )}
                  {!searching && patientSearch.trim().length >= 2 && !selectedPatient && patientResults.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                      No patients found for "{patientSearch}"
                    </div>
                  )}
                  {!searching && patientResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {patientResults.map(p => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b last:border-0"
                        >
                          <span className="font-medium text-gray-900">
                            {p.personalInfo?.firstName} {p.personalInfo?.lastName}
                          </span>
                          <span className="text-gray-500 ml-2">{p.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPatient && (
                  <p className="text-xs text-green-600 mt-1">✓ Patient selected</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type <span className="text-red-500">*</span></label>
                <select
                  value={form.emergencyType}
                  onChange={e => setForm(f => ({ ...f, emergencyType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select type...</option>
                  {EMERGENCY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification <span className="text-red-500">*</span></label>
                <textarea
                  value={form.justification}
                  onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
                  rows={3}
                  placeholder="Describe the emergency situation in detail (min 20 characters)..."
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    form.justification.length > 0 && form.justification.length < 20 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <p className={`text-xs mt-1 ${form.justification.length < 20 ? 'text-red-500' : 'text-green-600'}`}>
                  {form.justification.length}/20 min characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. ER Room 3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                  <input
                    type="text"
                    value={form.facilityName}
                    onChange={e => setForm(f => ({ ...f, facilityName: e.target.value }))}
                    placeholder="e.g. City Hospital"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setPatientSearch(''); setSelectedPatient(null); setPatientResults([]); }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          {['all', 'active', 'expired', 'revoked'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => {
                setFilter(filterOption);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No emergency requests found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'You have not made any emergency access requests yet'
                : `No ${filter} emergency access requests`
              }
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div 
              key={request._id} 
              className={`bg-white rounded-lg shadow p-6 ${
                request.flaggedForReview ? 'border-l-4 border-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Patient Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.patient?.personalInfo?.firstName} {request.patient?.personalInfo?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{request.patient?.email}</p>
                    </div>
                  </div>

                  {/* Emergency Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Emergency Type</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatEmergencyType(request.emergencyType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        {request.status === 'active' && (
                          <span className="text-xs text-gray-600">
                            {getTimeRemaining(request.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Justification</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {request.justification}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Requested: {formatDate(request.requestedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Expires: {formatDate(request.expiresAt)}</span>
                    </div>
                  </div>

                  {/* Flagged Warning */}
                  {request.flaggedForReview && (
                    <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Flagged for Review:</strong> {request.flaggedReason || 'This access has been flagged for administrator review'}
                      </div>
                    </div>
                  )}

                  {/* Review Status */}
                  {request.reviewedBy && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Admin Review</p>
                      <p className="text-sm text-gray-900">
                        <strong>Decision:</strong> {request.reviewDecision}
                      </p>
                      {request.reviewNotes && (
                        <p className="text-sm text-gray-700 mt-1">{request.reviewNotes}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        Reviewed on {formatDate(request.reviewedAt)}
                      </p>
                    </div>
                  )}

                  {/* Access Log */}
                  {request.accessLog && request.accessLog.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 mb-2">
                        Access Log ({request.accessLog.length} {request.accessLog.length === 1 ? 'entry' : 'entries'})
                      </p>
                      <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {request.accessLog.slice(0, 3).map((log, index) => (
                            <div key={index} className="text-xs text-gray-700">
                              {formatDate(log.accessedAt)} - {log.action} - {log.recordType}
                            </div>
                          ))}
                          {request.accessLog.length > 3 && (
                            <p className="text-xs text-gray-600 italic">
                              +{request.accessLog.length - 3} more entries
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div>
                  {request.status === 'active' && (
                    <button
                      onClick={() => handleRevoke(request._id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Revoke Access
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyRequests;
