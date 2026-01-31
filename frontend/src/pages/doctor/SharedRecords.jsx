import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SharedRecords = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
    fetchSharedRecords();
  }, []);

  const fetchSharedRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/records/shared-with-me');
      console.log('Shared records response:', response);
      if (response.success) {
        setRecords(response.data);
      }
    } catch (error) {
      console.error('Error fetching shared records:', error);
      toast.error('Failed to load shared records');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (record) => {
    try {
      const response = await api.get(`/records/${record._id}`);
      if (response.success) {
        setSelectedRecord(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching record details:', error);
      toast.error('Failed to load record details');
    }
  };

  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patient/${patientId}`);
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

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(record => record.recordType === filter);

  // Group records by patient
  const recordsByPatient = filteredRecords.reduce((acc, record) => {
    const patientId = record.patient._id;
    if (!acc[patientId]) {
      acc[patientId] = {
        patient: record.patient,
        records: []
      };
    }
    acc[patientId].records.push(record);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shared Medical Records</h1>
          <p className="text-gray-600 mt-1">Access medical records shared with you by patients</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Shared Records</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{records.length}</p>
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
              <p className="text-gray-600 text-sm font-medium">Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{Object.keys(recordsByPatient).length}</p>
            </div>
            <div className="p-4 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Record Types</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {new Set(records.map(r => r.recordType)).size}
              </p>
            </div>
            <div className="p-4 bg-purple-100 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
      </div>

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

      {/* Records by Patient */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : Object.keys(recordsByPatient).length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 mt-4 text-lg">No medical records shared with you yet</p>
            <p className="text-gray-400 text-sm mt-2">Patients can share their records with you from their Health Vault</p>
          </div>
        ) : (
          Object.values(recordsByPatient).map(({ patient, records: patientRecords }) => (
            <div key={patient._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Patient Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                      {patient.firstName?.[0]}{patient.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {patient.firstName} {patient.lastName}
                      </h2>
                      <p className="text-indigo-100">{patient.email}</p>
                      <p className="text-indigo-100 text-sm">{patientRecords.length} record(s) shared</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewPatient(patient._id)}
                    className="px-6 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 font-semibold transition"
                  >
                    View Full History
                  </button>
                </div>
              </div>

              {/* Patient's Records */}
              <div className="divide-y">
                {patientRecords.map((record) => (
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
                          <span>📤 Shared on {new Date(record.sharedWith.find(s => s.doctor)?.sharedAt || record.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(record)}
                          className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => window.open(`${import.meta.env.VITE_API_URL.replace('/api', '')}${record.files[0].fileUrl}`, '_blank')}
                          className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium"
                        >
                          View File
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
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
                    <label className="text-sm font-medium text-gray-700">Patient</label>
                    <p className="mt-1 text-gray-900">
                      {selectedRecord.patient.firstName} {selectedRecord.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Record Date</label>
                    <p className="mt-1 text-gray-900">{new Date(selectedRecord.recordDate).toLocaleDateString()}</p>
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
                        <a
                          href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedRecords;
