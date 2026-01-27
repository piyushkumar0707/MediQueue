import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const HealthVault = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  
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
  }, [filter]);

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
                      onClick={() => window.open(`${import.meta.env.VITE_API_URL.replace('/api', '')}${record.files[0].fileUrl}`, '_blank')}
                      className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(record._id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
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
