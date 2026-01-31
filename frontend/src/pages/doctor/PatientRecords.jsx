import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientRecords = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('records'); // records, prescriptions, appointments, overview

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Fetch patient details
      const patientRes = await api.get(`/users/${patientId}`);
      console.log('Patient response:', patientRes);
      if (patientRes.success) {
        setPatient(patientRes.data);
      }

      // Fetch medical records
      const recordsRes = await api.get(`/records/patient/${patientId}`);
      console.log('Records response:', recordsRes);
      if (recordsRes.success) {
        setRecords(recordsRes.data || []);
      }

      // Fetch prescriptions
      const prescriptionsRes = await api.get(`/prescriptions/patient/${patientId}`);
      console.log('Prescriptions response:', prescriptionsRes);
      if (prescriptionsRes.success) {
        setPrescriptions(prescriptionsRes.data || []);
      }

      // Fetch appointments
      const appointmentsRes = await api.get(`/appointments/patient/${patientId}`);
      console.log('Appointments response:', appointmentsRes);
      if (appointmentsRes.success) {
        setAppointments(appointmentsRes.data || []);
      }

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRecordTypeLabel = (type) => {
    const types = {
      'lab-report': 'Lab Report',
      'prescription': 'Prescription',
      'radiology': 'Radiology',
      'consultation-notes': 'Consultation Notes',
      'discharge-summary': 'Discharge Summary',
      'medical-history': 'Medical History',
      'insurance': 'Insurance',
      'vaccination': 'Vaccination',
      'allergy-info': 'Allergy Information',
      'other': 'Other'
    };
    return types[type] || type;
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

  const downloadRecord = async (recordId, filename) => {
    try {
      const response = await api.get(`/records/${recordId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found</p>
        <button
          onClick={() => navigate('/doctor/prescriptions')}
          className="mt-4 text-indigo-600 hover:text-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{patient.email}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {patient.phoneNumber}
                </div>
                {patient.personalInfo?.dateOfBirth && (
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(patient.personalInfo.dateOfBirth)}
                  </div>
                )}
                {patient.personalInfo?.bloodGroup && (
                  <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Blood: {patient.personalInfo.bloodGroup}
                  </div>
                )}
                {patient.personalInfo?.gender && (
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {patient.personalInfo.gender}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'records'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Medical Records ({records.length})
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prescriptions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointments ({appointments.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                  </div>
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Prescriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
                  </div>
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                  </div>
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Medical Records Tab */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              {records.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-gray-500">No medical records shared with you</p>
                </div>
              ) : (
                records.map((record) => (
                  <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{record.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecordTypeBadge(record.recordType)}`}>
                            {getRecordTypeLabel(record.recordType)}
                          </span>
                        </div>
                        {record.description && (
                          <p className="text-sm text-gray-600 mb-3">{record.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(record.recordDate)}
                          </span>
                          <span>📎 {record.files?.length || 0} file(s)</span>
                          {record.uploadedBy && (
                            <span>Uploaded by: {record.uploadedBy.personalInfo?.firstName} {record.uploadedBy.personalInfo?.lastName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`${import.meta.env.VITE_API_URL.replace('/api', '')}${record.files[0]?.fileUrl}`, '_blank')}
                          className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition"
                        >
                          View
                        </button>
                        {record.sharedWith?.find(s => s.canDownload) && (
                          <button
                            onClick={() => downloadRecord(record._id, record.files[0]?.fileName)}
                            className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition"
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-4 text-gray-500">No prescriptions found</p>
                </div>
              ) : (
                prescriptions.map((prescription) => (
                  <div key={prescription._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-indigo-600">{prescription.prescriptionNumber}</h3>
                        <p className="text-sm text-gray-500 mt-1">Diagnosis: {prescription.diagnosis}</p>
                        <p className="text-sm text-gray-500">Date: {formatDate(prescription.createdAt)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        prescription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {prescription.status}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Medications:</h4>
                      <div className="space-y-2">
                        {prescription.medications?.map((med, idx) => (
                          <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium">{med.name}</span> - {med.dosage} | {med.frequency} | {med.duration}
                          </div>
                        ))}
                      </div>
                    </div>
                    {prescription.notes && (
                      <p className="mt-3 text-sm text-gray-600 border-t pt-3">
                        <span className="font-medium">Notes:</span> {prescription.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-4 text-gray-500">No appointments found</p>
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Time: {appointment.timeSlot?.startTime} - {appointment.timeSlot?.endTime}
                        </p>
                        <p className="text-sm text-gray-600">Reason: {appointment.reasonForVisit}</p>
                        {appointment.symptoms?.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">Symptoms: {appointment.symptoms.join(', ')}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRecords;
