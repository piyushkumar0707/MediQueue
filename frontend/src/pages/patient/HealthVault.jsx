import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const HealthVault = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [shareForm, setShareForm] = useState({
    doctorId: '',
    expiresAt: '',
    canDownload: true
  });

  // AI summary state
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);   // { summary, keyFindings, followUpNeeded, generatedAt }
  const [summaryError, setSummaryError] = useState(null);
  
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    recordType: 'other',
    recordDate: new Date().toISOString().split('T')[0],
    files: []
  });

  const recordTypes = [
    { value: 'lab-report', label: 'Lab Report' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'consultation-notes', label: 'Consultation Notes' },
    { value: 'discharge-summary', label: 'Discharge Summary' },
    { value: 'medical-history', label: 'Medical History' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'allergy-info', label: 'Allergy Information' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchRecords();
    fetchStats();
    fetchDoctors();
  }, [filter]);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/users/doctors');
      console.log('Doctors API response:', response);
      if (response.success) {
        console.log('Doctors data:', response.data);
        setDoctors(response.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors list');
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/records/my-records', {
        params: { recordType: filter }
      });
      if (response.success) {
        setRecords(response.data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/records/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    setUploadForm(prev => ({ ...prev, files }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (uploadForm.files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('recordType', uploadForm.recordType);
      formData.append('recordDate', uploadForm.recordDate);
      
      // Get current user ID from auth store or API
      const profileResponse = await api.get('/users/profile');
      if (profileResponse.success) {
        formData.append('patientId', profileResponse.data._id);
      }
      
      uploadForm.files.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post('/records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.success) {
        toast.success('Record uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({
          title: '',
          description: '',
          recordType: 'other',
          recordDate: new Date().toISOString().split('T')[0],
          files: []
        });
        fetchRecords();
        fetchStats();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload record');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await api.delete(`/records/${recordId}`);
      if (response.success) {
        toast.success('Record deleted successfully');
        fetchRecords();
        fetchStats();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleShareClick = (record) => {
    setSelectedRecord(record);
    setShareForm({
      doctorId: '',
      expiresAt: '',
      canDownload: true
    });
    setShowShareModal(true);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!shareForm.doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    try {
      const response = await api.post(`/records/${selectedRecord._id}/share`, shareForm);
      if (response.success) {
        toast.success('Record shared successfully!');
        setShowShareModal(false);
        fetchRecords();
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error(error.response?.data?.message || 'Failed to share record');
    }
  };

  const handleRevokeAccess = async (recordId, doctorId) => {
    if (!window.confirm('Are you sure you want to revoke access for this doctor?')) {
      return;
    }

    try {
      const response = await api.delete(`/records/${recordId}/share/${doctorId}`);
      if (response.success) {
        toast.success('Access revoked successfully');
        fetchRecords();
        if (selectedRecord && selectedRecord._id === recordId) {
          // Update selected record
          const updatedRecord = await api.get(`/records/${recordId}`);
          if (updatedRecord.success) {
            setSelectedRecord(updatedRecord.data);
          }
        }
      }
    } catch (error) {
      console.error('Revoke error:', error);
      toast.error('Failed to revoke access');
    }
  };

  const handleViewFile = async (recordId, fileIndex = 0) => {
    try {
      const response = await api.get(`/records/${recordId}/view-file?fileIndex=${fileIndex}`);
      if (response.success) {
        window.open(response.url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to get file URL');
    }
  };

  const handleViewDetails = async (record) => {
    try {
      const response = await api.get(`/records/${record._id}`);
      if (response.success) {
        setSelectedRecord(response.data);
        setAiSummary(null);
        setSummaryError(null);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching record details:', error);
      toast.error('Failed to load record details');
    }
  };

  const downloadRecordReport = async (record) => {
    try {
      const authStorage = JSON.parse(localStorage.getItem('auth-storage'));
      const token = authStorage?.state?.accessToken;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/records/${record._id}/download-report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medical-record-${record._id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Medical record report downloaded');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummaryError(null);
    setAiSummary(null);
    try {
      const response = await api.post(`/records/${selectedRecord._id}/summarize`);
      if (response.success) {
        setAiSummary(response);
      } else {
        const msg =
          response.code === 'IMAGE_ONLY'
            ? 'This PDF appears to be a scanned image. AI summarization requires a text-based PDF.'
            : response.code === 'UNSUPPORTED_TYPE'
            ? 'This file type is not supported for AI analysis.'
            : response.code === 'AI_UNAVAILABLE'
            ? 'AI summarization is currently unavailable.'
            : response.message || 'Summarization failed.';
        setSummaryError(msg);
      }
    } catch (err) {
      const code = err.response?.data?.code || err.code;
      const msg =
        code === 'IMAGE_ONLY'
          ? 'This PDF appears to be a scanned image. AI summarization requires a text-based PDF.'
          : code === 'UNSUPPORTED_TYPE'
          ? 'This file type is not supported for AI analysis.'
          : err.response?.status === 429
          ? 'Summarization limit reached (10/hour). Please try again later.'
          : err.response?.status === 408
          ? 'Summary took too long. Please try again.'
          : err.response?.status === 502
          ? (err.response?.data?.message || 'Failed to fetch PDF from storage.')
          : err.message || 'AI summarization is currently unavailable.';
      setSummaryError(msg);
    } finally {
      setSummarizing(false);
    }
  };

  const getRecordTypeLabel = (type) => {
    const found = recordTypes.find(rt => rt.value === type);
    return found ? found.label : type;
  };

  const getRecordTypeBadge = (type) => {
    const colors = {
      'lab-report': 'bg-blue-100 text-blue-800',
      'prescription': 'bg-green-100 text-green-800',
      'radiology': 'bg-purple-100 text-purple-800',
      'consultation-notes': 'bg-yellow-100 text-yellow-800',
      'discharge-summary': 'bg-red-100 text-red-800',
      'medical-history': 'bg-indigo-100 text-indigo-800',
      'insurance': 'bg-orange-100 text-orange-800',
      'vaccination': 'bg-teal-100 text-teal-800',
      'allergy-info': 'bg-pink-100 text-pink-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Vault</h1>
          <p className="text-gray-600 mt-1">Manage your medical records securely</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Record</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRecords}</p>
              </div>
              <div className="p-4 bg-indigo-100 rounded-full">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Shared Records</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.sharedCount}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Record Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.byType.length}</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center space-x-4">
          <label className="text-gray-700 font-medium">Filter by Type:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Records</option>
            {recordTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 mt-4">No medical records found</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Upload your first record
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {records.map((record) => (
              <div key={record._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecordTypeBadge(record.recordType)}`}>
                        {getRecordTypeLabel(record.recordType)}
                      </span>
                    </div>
                    {record.description && (
                      <p className="text-gray-600 mb-3">{record.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {new Date(record.recordDate).toLocaleDateString()}</span>
                      <span>📎 {record.files.length} file(s)</span>
                      {record.sharedWith.length > 0 && (
                        <span>👥 Shared with {record.sharedWith.length} doctor(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(record)}
                      className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium text-sm"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleShareClick(record)}
                      className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleViewFile(record._id, 0)}
                      className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => downloadRecordReport(record)}
                      className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium text-sm"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDelete(record._id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Record Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedRecord.title}</h3>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getRecordTypeBadge(selectedRecord.recordType)}`}>
                    {getRecordTypeLabel(selectedRecord.recordType)}
                  </span>
                </div>

                {selectedRecord.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-600">{selectedRecord.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Record Date</label>
                    <p className="mt-1 text-gray-900">{new Date(selectedRecord.recordDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Uploaded On</label>
                    <p className="mt-1 text-gray-900">{new Date(selectedRecord.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Attached Files ({selectedRecord.files.length})</label>
                  <div className="mt-2 space-y-2">
                    {selectedRecord.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                            <p className="text-xs text-gray-500">{(file.fileSize / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewFile(selectedRecord._id, index)}
                          className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Summary section — shown for PDF, PNG, and JPEG records */}
                {selectedRecord.files?.some(f =>
                  f.fileType === 'application/pdf' ||
                  f.fileType === 'image/png' ||
                  f.fileType === 'image/jpeg' ||
                  f.fileType === 'image/jpg' ||
                  f.fileName?.toLowerCase().endsWith('.pdf')
                ) && (
                  <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm font-semibold text-purple-700">AI Summary</span>
                      </div>
                      {!aiSummary && (
                        <button
                          onClick={handleSummarize}
                          disabled={summarizing}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            summarizing
                              ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {summarizing ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Summarizing…
                            </>
                          ) : (
                            'Summarize with AI'
                          )}
                        </button>
                      )}
                      {aiSummary && (
                        <button
                          onClick={handleSummarize}
                          disabled={summarizing}
                          className="text-xs text-purple-600 hover:underline"
                        >
                          Regenerate
                        </button>
                      )}
                    </div>

                    {summaryError && (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{summaryError}</p>
                    )}

                    {aiSummary && (
                      <div className="space-y-3">
                        {/* Transcription confidence warnings for image-based records */}
                        {aiSummary.transcriptionConfidence === 'low' && (
                          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <span><strong>Handwriting was difficult to read.</strong> Key details may be incomplete — verify with your original document.</span>
                          </div>
                        )}
                        {aiSummary.transcriptionConfidence === 'medium' && (
                          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Some text was unclear. Review key findings against your original document.</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-800">{aiSummary.summary}</p>
                        {aiSummary.keyFindings?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1">Key Findings</p>
                            <ul className="space-y-1">
                              {aiSummary.keyFindings.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiSummary.followUpNeeded && (
                          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            Follow-up with your doctor is recommended.
                          </div>
                        )}
                        <p className="text-xs text-gray-400">Generated {new Date(aiSummary.generatedAt).toLocaleString()}</p>
                        {/* Non-dismissable disclaimer */}
                        <div className="border-t border-purple-200 pt-3">
                          <p className="text-xs text-purple-700">
                            <span className="font-semibold">⚕ Disclaimer: </span>
                            AI-generated summary. Always consult your doctor for medical advice.
                          </p>
                        </div>
                      </div>
                    )}

                    {!aiSummary && !summaryError && !summarizing && (
                      <p className="text-xs text-gray-500">Click "Summarize with AI" to get a plain-English summary of this document.</p>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Shared With</label>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleShareClick(selectedRecord);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      + Share with doctor
                    </button>
                  </div>
                  {selectedRecord.sharedWith && selectedRecord.sharedWith.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRecord.sharedWith.map((share, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Dr. {share.doctor?.firstName} {share.doctor?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Shared on {new Date(share.sharedAt).toLocaleDateString()}
                              {share.expiresAt && ` • Expires ${new Date(share.expiresAt).toLocaleDateString()}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRevokeAccess(selectedRecord._id, share.doctor._id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-3">Not shared with any doctors yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Share Record</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">Share "{selectedRecord.title}" with a doctor</p>

              <form onSubmit={handleShare} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Select Doctor *</label>
                  <select
                    value={shareForm.doctorId}
                    onChange={(e) => setShareForm(prev => ({ ...prev, doctorId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map(doctor => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.personalInfo?.firstName} {doctor.personalInfo?.lastName} 
                        {doctor.professionalInfo?.specialization && ` - ${doctor.professionalInfo.specialization}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Access Expiry (Optional)</label>
                  <input
                    type="date"
                    value={shareForm.expiresAt}
                    onChange={(e) => setShareForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for permanent access</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canDownload"
                    checked={shareForm.canDownload}
                    onChange={(e) => setShareForm(prev => ({ ...prev, canDownload: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="canDownload" className="ml-2 text-sm text-gray-700">
                    Allow doctor to download files
                  </label>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Share
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Medical Record</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Blood Test Results"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Record Type *</label>
                  <select
                    value={uploadForm.recordType}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, recordType: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    {recordTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Record Date *</label>
                  <input
                    type="date"
                    value={uploadForm.recordDate}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, recordDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes or details..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Files * (Max 5 files, 10MB each)</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  {uploadForm.files.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {uploadForm.files.map(f => f.name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthVault;
