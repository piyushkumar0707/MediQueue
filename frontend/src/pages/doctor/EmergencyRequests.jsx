import { useState, useEffect } from 'react';
import { ShieldAlert, Clock, CheckCircle, XCircle, Calendar, User, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyEmergencyRequests, revokeEmergencyAccess } from '../../services/api';

const EmergencyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, expired, revoked
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Emergency Access Requests</h1>
        <p className="mt-2 text-gray-600">
          View and manage your emergency break-glass access requests
        </p>
      </div>

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
