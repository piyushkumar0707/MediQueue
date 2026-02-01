import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Ban,
  Filter,
  RefreshCw,
  FileText,
  User,
  Calendar,
  MapPin,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getEmergencyAccessForReview, 
  reviewEmergencyAccess, 
  revokeEmergencyAccess,
  getEmergencyAccessStats 
} from '../../services/api';

const EmergencyAccessReview = () => {
  const [emergencyAccesses, setEmergencyAccesses] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeAccesses: 0,
    expiredAccesses: 0,
    revokedAccesses: 0,
    unreviewedCount: 0,
    flaggedCount: 0
  });
  const [filter, setFilter] = useState('all'); // all, unreviewed, flagged, active
  const [loading, setLoading] = useState(true);
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAccessLogModal, setShowAccessLogModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    decision: 'approved',
    reviewNotes: ''
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accessesResponse, statsResponse] = await Promise.all([
        getEmergencyAccessForReview({ filter }),
        getEmergencyAccessStats()
      ]);
      
      // Handle both response structures
      const emergencyAccesses = accessesResponse.data?.emergencyAccesses || accessesResponse.data || [];
      const statsData = statsResponse.data || stats;
      
      setEmergencyAccesses(emergencyAccesses);
      setStats(statsData);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch emergency accesses');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (accessId) => {
    try {
      await reviewEmergencyAccess(accessId, reviewData);
      toast.success('Emergency access reviewed successfully');
      setShowReviewModal(false);
      setSelectedAccess(null);
      setReviewData({ decision: 'approved', reviewNotes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to review emergency access');
    }
  };

  const handleRevoke = async (accessId) => {
    if (!confirm('Are you sure you want to revoke this emergency access?')) return;
    
    try {
      await revokeEmergencyAccess(accessId, { 
        reason: 'Revoked by admin after review' 
      });
      toast.success('Emergency access revoked successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to revoke emergency access');
    }
  };

  const openReviewModal = (access) => {
    setSelectedAccess(access);
    setReviewData({
      decision: access.reviewDecision || 'approved',
      reviewNotes: access.reviewNotes || ''
    });
    setShowReviewModal(true);
  };

  const openAccessLogModal = (access) => {
    setSelectedAccess(access);
    setShowAccessLogModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Expired' },
      revoked: { color: 'bg-red-100 text-red-800', icon: Ban, text: 'Revoked' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getRiskLevelBadge = (riskLevel) => {
    const riskConfig = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskConfig[riskLevel] || riskConfig.medium}`}>
        {riskLevel?.toUpperCase() || 'MEDIUM'}
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

  if (loading && !emergencyAccesses.length) {
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
        <h1 className="text-3xl font-bold text-gray-900">Emergency Access Review</h1>
        <p className="mt-2 text-gray-600">
          Review and manage emergency break-glass access requests
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRequests}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unreviewed</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.unreviewedCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Flagged</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.flaggedCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeAccesses}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex gap-2">
              {['all', 'unreviewed', 'flagged', 'active'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
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
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Emergency Accesses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emergency Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emergencyAccesses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No emergency accesses found</p>
                    <p className="text-sm">Try changing the filter to see more results</p>
                  </td>
                </tr>
              ) : (
                emergencyAccesses.map((access) => (
                  <tr key={access._id} className={access.flaggedForReview ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {access.doctor?.personalInfo?.firstName} {access.doctor?.personalInfo?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {access.doctor?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {access.patient?.personalInfo?.firstName} {access.patient?.personalInfo?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {access.patient?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatEmergencyType(access.emergencyType)}
                      </div>
                      {access.location && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {access.location}
                        </div>
                      )}
                      {access.facilityName && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          {access.facilityName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRiskLevelBadge(access.riskLevel)}
                      {access.flaggedForReview && (
                        <div className="flex items-center text-xs text-red-600 mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Flagged
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(access.status)}
                      {access.reviewDecision && (
                        <div className="text-xs text-gray-500 mt-1">
                          {access.reviewDecision}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(access.requestedAt)}
                      </div>
                      {access.expiresAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {formatDate(access.expiresAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openReviewModal(access)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Review"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {access.accessLog && access.accessLog.length > 0 && (
                          <button
                            onClick={() => openAccessLogModal(access)}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Access Log"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        )}
                        {access.status === 'active' && (
                          <button
                            onClick={() => handleRevoke(access._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Revoke"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedAccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Emergency Access</h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Access Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                    <p className="text-gray-900">
                      {selectedAccess.doctor?.personalInfo?.firstName} {selectedAccess.doctor?.personalInfo?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedAccess.doctor?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                    <p className="text-gray-900">
                      {selectedAccess.patient?.personalInfo?.firstName} {selectedAccess.patient?.personalInfo?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedAccess.patient?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type</label>
                    <p className="text-gray-900">{formatEmergencyType(selectedAccess.emergencyType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                    {getRiskLevelBadge(selectedAccess.riskLevel)}
                  </div>
                </div>

                {(selectedAccess.location || selectedAccess.facilityName) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAccess.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <p className="text-gray-900">{selectedAccess.location}</p>
                      </div>
                    )}
                    {selectedAccess.facilityName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                        <p className="text-gray-900">{selectedAccess.facilityName}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedAccess.justification}</p>
                  </div>
                  {selectedAccess.flaggedForReview && selectedAccess.flaggedReason && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Flagged:</strong> {selectedAccess.flaggedReason}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested At</label>
                    <p className="text-gray-900 text-sm">{formatDate(selectedAccess.requestedAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                    <p className="text-gray-900 text-sm">{formatDate(selectedAccess.expiresAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {getStatusBadge(selectedAccess.status)}
                  </div>
                </div>

                {selectedAccess.accessLog && selectedAccess.accessLog.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Log</label>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {selectedAccess.accessLog.map((log, index) => (
                          <div key={index} className="text-sm">
                            <span className="text-gray-600">{formatDate(log.accessedAt)}</span>
                            <span className="mx-2">-</span>
                            <span className="font-medium text-gray-900">{log.action}</span>
                            <span className="mx-2">-</span>
                            <span className="text-gray-600">{log.recordType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Review Form */}
              {!selectedAccess.reviewedBy && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-gray-900">Submit Review</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision
                    </label>
                    <select
                      value={reviewData.decision}
                      onChange={(e) => setReviewData({ ...reviewData, decision: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="approved">Approved - Legitimate emergency access</option>
                      <option value="flagged">Flagged - Needs further investigation</option>
                      <option value="revoked">Revoked - Inappropriate use</option>
                      <option value="legitimate">Legitimate - Emergency verified</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes
                    </label>
                    <textarea
                      value={reviewData.reviewNotes}
                      onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes about your review decision..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReview(selectedAccess._id)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              )}

              {/* Already Reviewed */}
              {selectedAccess.reviewedBy && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Review Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Reviewed by: </span>
                      <span className="text-sm text-gray-900 font-medium">
                        {selectedAccess.reviewedBy?.personalInfo?.firstName} {selectedAccess.reviewedBy?.personalInfo?.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Decision: </span>
                      <span className="text-sm text-gray-900 font-medium">
                        {selectedAccess.reviewDecision}
                      </span>
                    </div>
                    {selectedAccess.reviewNotes && (
                      <div>
                        <span className="text-sm text-gray-600">Notes: </span>
                        <p className="text-sm text-gray-900 mt-1">{selectedAccess.reviewNotes}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-600">Reviewed at: </span>
                      <span className="text-sm text-gray-900">
                        {formatDate(selectedAccess.reviewedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Access Log Modal */}
      {showAccessLogModal && selectedAccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Access Log</h2>
                <button
                  onClick={() => setShowAccessLogModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedAccess.accessLog && selectedAccess.accessLog.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Record Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedAccess.accessLog.map((log, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatDate(log.accessedAt)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 capitalize">{log.action}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{log.recordType}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{log.ipAddress || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No access log entries found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyAccessReview;
