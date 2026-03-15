import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import * as apiService from '../../services/api';

const ConsentManagement = () => {
  const [consents, setConsents] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({
    activeConsents: 0,
    totalConsents: 0,
    revokedConsents: 0
  });
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState(null);
  const [consentHistory, setConsentHistory] = useState(null);

  const [grantForm, setGrantForm] = useState({
    doctorId: '',
    scope: 'all-records',
    recordTypes: [],
    permissions: {
      canView: true,
      canDownload: true,
      canShare: false
    },
    expiresAt: '',
    purpose: ''
  });

  const [revokeReason, setRevokeReason] = useState('');

  const recordTypeOptions = [
    { value: 'lab-report', label: 'Lab Reports' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'radiology', label: 'Radiology/Imaging' },
    { value: 'consultation-notes', label: 'Consultation Notes' },
    { value: 'discharge-summary', label: 'Discharge Summary' },
    { value: 'medical-history', label: 'Medical History' },
    { value: 'vaccination', label: 'Vaccination Records' },
    { value: 'allergy-info', label: 'Allergy Information' },
    { value: 'other', label: 'Other Documents' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [consentsRes, doctorsRes, statsRes] = await Promise.all([
        apiService.getMyConsents(),
        apiService.getDoctors(),
        apiService.getConsentStats()
      ]);

      setConsents(consentsRes.data);
      setDoctors(doctorsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load consent data');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    
    if (!grantForm.doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    if (grantForm.scope === 'record-types' && grantForm.recordTypes.length === 0) {
      toast.error('Please select at least one record type');
      return;
    }

    try {
      const payload = {
        doctorId: grantForm.doctorId,
        scope: grantForm.scope,
        recordTypes: grantForm.scope === 'record-types' ? grantForm.recordTypes : undefined,
        permissions: grantForm.permissions,
        expiresAt: grantForm.expiresAt || null,
        purpose: grantForm.purpose
      };

      await apiService.grantConsent(payload);
      toast.success('Consent granted successfully');
      setShowGrantModal(false);
      resetGrantForm();
      fetchData();
    } catch (error) {
      console.error('Error granting consent:', error);
      toast.error(error.response?.data?.message || 'Failed to grant consent');
    }
  };

  const handleRevokeConsent = async () => {
    if (!selectedConsent) return;

    if (!revokeReason.trim()) {
      toast.error('Please provide a reason for revoking consent');
      return;
    }

    try {
      await apiService.revokeConsent(selectedConsent._id, { reason: revokeReason });
      toast.success('Consent revoked successfully');
      setShowRevokeModal(false);
      setSelectedConsent(null);
      setRevokeReason('');
      fetchData();
    } catch (error) {
      console.error('Error revoking consent:', error);
      toast.error(error.response?.data?.message || 'Failed to revoke consent');
    }
  };

  const handleViewHistory = async (consent) => {
    try {
      const response = await apiService.getConsentHistory(consent._id);
      setConsentHistory(response.data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching consent history:', error);
      toast.error('Failed to load consent history');
    }
  };

  const resetGrantForm = () => {
    setGrantForm({
      doctorId: '',
      scope: 'all-records',
      recordTypes: [],
      permissions: {
        canView: true,
        canDownload: true,
        canShare: false
      },
      expiresAt: '',
      purpose: ''
    });
  };

  const getStatusBadge = (consent) => {
    if (consent.status === 'revoked') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Revoked</span>;
    }
    if (consent.status === 'expired') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Expired</span>;
    }
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
  };

  const getScopeText = (consent) => {
    if (consent.scope === 'all-records') return 'All Records';
    if (consent.scope === 'specific-records') return `${consent.specificRecords?.length || 0} Specific Records`;
    if (consent.scope === 'record-types') {
      const types = consent.recordTypes?.map(type => 
        recordTypeOptions.find(opt => opt.value === type)?.label || type
      ) || [];
      return types.length > 0 ? types.join(', ') : 'Record Types';
    }
    return consent.scope;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consent Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage doctor access to your medical records
          </p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Grant Consent
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Consents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeConsents}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Consents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConsents}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revoked</p>
              <p className="text-2xl font-bold text-gray-900">{stats.revokedConsents}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Consents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Consents</h2>
        </div>
        
        {consents.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No consents</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by granting consent to a doctor.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowGrantModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Grant Consent
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consents.map((consent) => (
                  <tr key={consent._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {consent.doctor?.firstName?.[0]}{consent.doctor?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {consent.doctor?.specialization || 'General'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getScopeText(consent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-1">
                        {consent.permissions?.canView && <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">View</span>}
                        {consent.permissions?.canDownload && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Download</span>}
                        {consent.permissions?.canShare && <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">Share</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consent.expiresAt ? new Date(consent.expiresAt).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(consent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewHistory(consent)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        History
                      </button>
                      {consent.status === 'active' && (
                        <button
                          onClick={() => {
                            setSelectedConsent(consent);
                            setShowRevokeModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grant Consent Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Grant Consent to Doctor</h3>
                <button onClick={() => { setShowGrantModal(false); resetGrantForm(); }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleGrantConsent} className="space-y-4">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor *</label>
                  <select
                    value={grantForm.doctorId}
                    onChange={(e) => setGrantForm({ ...grantForm, doctorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.personalInfo?.firstName} {doctor.personalInfo?.lastName} - {doctor.professionalInfo?.specialization || 'General'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scope Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Scope *</label>
                  <select
                    value={grantForm.scope}
                    onChange={(e) => setGrantForm({ ...grantForm, scope: e.target.value, recordTypes: [] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all-records">All Records</option>
                    <option value="record-types">Specific Record Types</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose what records the doctor can access
                  </p>
                </div>

                {/* Record Types Selection (only show if scope is record-types) */}
                {grantForm.scope === 'record-types' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Record Types *</label>
                    <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {recordTypeOptions.map((type) => (
                          <label key={type.value} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={grantForm.recordTypes.includes(type.value)}
                              onChange={(e) => {
                                const newTypes = e.target.checked
                                  ? [...grantForm.recordTypes, type.value]
                                  : grantForm.recordTypes.filter(t => t !== type.value);
                                setGrantForm({ ...grantForm, recordTypes: newTypes });
                              }}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {grantForm.recordTypes.length === 0 && (
                      <p className="mt-1 text-xs text-red-500">Please select at least one record type</p>
                    )}
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={grantForm.permissions.canView}
                        onChange={(e) => setGrantForm({
                          ...grantForm,
                          permissions: { ...grantForm.permissions, canView: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can View Records</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={grantForm.permissions.canDownload}
                        onChange={(e) => setGrantForm({
                          ...grantForm,
                          permissions: { ...grantForm.permissions, canDownload: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can Download Files</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={grantForm.permissions.canShare}
                        onChange={(e) => setGrantForm({
                          ...grantForm,
                          permissions: { ...grantForm.permissions, canShare: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can Share with Other Doctors</span>
                    </label>
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={grantForm.expiresAt}
                    onChange={(e) => setGrantForm({ ...grantForm, expiresAt: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for no expiry
                  </p>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose (Optional)</label>
                  <textarea
                    value={grantForm.purpose}
                    onChange={(e) => setGrantForm({ ...grantForm, purpose: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason for granting consent..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => { setShowGrantModal(false); resetGrantForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Grant Consent
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Consent Modal */}
      {showRevokeModal && selectedConsent && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revoke Consent</h3>
                <button onClick={() => { setShowRevokeModal(false); setSelectedConsent(null); setRevokeReason(''); }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to revoke consent for <strong>Dr. {selectedConsent.doctor?.firstName} {selectedConsent.doctor?.lastName}</strong>?
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Revocation *</label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide a reason..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowRevokeModal(false); setSelectedConsent(null); setRevokeReason(''); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeConsent}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Revoke Consent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && consentHistory && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Consent History</h3>
                <button onClick={() => { setShowHistoryModal(false); setConsentHistory(null); }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Consent Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Consent Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Doctor:</span>
                    <span className="ml-2 text-gray-900">
                      Dr. {consentHistory.doctor?.personalInfo?.firstName} {consentHistory.doctor?.personalInfo?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2">{getStatusBadge(consentHistory)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Granted:</span>
                    <span className="ml-2 text-gray-900">{new Date(consentHistory.createdAt).toLocaleString()}</span>
                  </div>
                  {consentHistory.expiresAt && (
                    <div>
                      <span className="text-gray-600">Expires:</span>
                      <span className="ml-2 text-gray-900">{new Date(consentHistory.expiresAt).toLocaleString()}</span>
                    </div>
                  )}
                  {consentHistory.revokedAt && (
                    <>
                      <div>
                        <span className="text-gray-600">Revoked:</span>
                        <span className="ml-2 text-gray-900">{new Date(consentHistory.revokedAt).toLocaleString()}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Reason:</span>
                        <span className="ml-2 text-gray-900">{consentHistory.revocationReason}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Access Log */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Access Log</h4>
                {consentHistory.accessLog && consentHistory.accessLog.length > 0 ? (
                  <div className="space-y-3">
                    {consentHistory.accessLog.map((log, index) => (
                      <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.action}</p>
                              {log.recordId && (
                                <p className="text-xs text-gray-600">
                                  Record: {log.recordId.title || log.recordId._id}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(log.accessedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No access history yet</p>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => { setShowHistoryModal(false); setConsentHistory(null); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentManagement;
