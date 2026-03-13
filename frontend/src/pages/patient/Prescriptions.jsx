import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Prescriptions = () => {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPrescriptions();
  }, [filterStatus]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const res = await api.get('/prescriptions/my-prescriptions', { params });
      
      if (res.success) {
        setPrescriptions(res.data);
      }
    } catch (error) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const viewPrescription = async (prescriptionId) => {
    try {
      const res = await api.get(`/prescriptions/${prescriptionId}`);
      if (res.success) {
        setSelectedPrescription(res.data);
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Failed to load prescription details');
    }
  };

  const downloadPrescription = async (prescription) => {
    try {
      const authStorage = JSON.parse(localStorage.getItem('auth-storage'));
      const token = authStorage?.state?.accessToken;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/prescriptions/${prescription._id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${prescription.prescriptionNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Prescription downloaded');
    } catch (error) {
      toast.error('Failed to download prescription');
    }
  };

  const generatePrescriptionText = (rx) => {
    return `
==============================================
           MEDICAL PRESCRIPTION
==============================================

Prescription No: ${rx.prescriptionNumber}
Date: ${new Date(rx.createdAt).toLocaleDateString()}

----------------------------------------------
PATIENT INFORMATION
----------------------------------------------
Name: ${rx.patient.personalInfo.firstName} ${rx.patient.personalInfo.lastName}
Phone: ${rx.patient.phoneNumber}
Email: ${rx.patient.email}

----------------------------------------------
DOCTOR INFORMATION
----------------------------------------------
Dr. ${rx.doctor.personalInfo.firstName} ${rx.doctor.personalInfo.lastName}
${rx.doctor.professionalInfo?.specialty || ''}
License: ${rx.doctor.professionalInfo?.licenseNumber || ''}

----------------------------------------------
DIAGNOSIS
----------------------------------------------
${rx.diagnosis}

----------------------------------------------
MEDICINES PRESCRIBED
----------------------------------------------
${rx.medicines.map((med, index) => `
${index + 1}. ${med.name}
   - Dosage: ${med.dosage}
   - Frequency: ${med.frequency}
   - Duration: ${med.duration}
   - Timing: ${med.timing}
   ${med.instructions ? `- Instructions: ${med.instructions}` : ''}
`).join('\n')}

${rx.tests && rx.tests.length > 0 ? `
----------------------------------------------
RECOMMENDED TESTS
----------------------------------------------
${rx.tests.map((test, index) => `${index + 1}. ${test}`).join('\n')}
` : ''}

${rx.notes ? `
----------------------------------------------
ADDITIONAL NOTES
----------------------------------------------
${rx.notes}
` : ''}

${rx.followUpDate ? `
----------------------------------------------
FOLLOW-UP
----------------------------------------------
Date: ${new Date(rx.followUpDate).toLocaleDateString()}
${rx.followUpInstructions ? `Instructions: ${rx.followUpInstructions}` : ''}
` : ''}

----------------------------------------------
Valid Until: ${new Date(rx.validUntil).toLocaleDateString()}

==============================================
    `.trim();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
          <p className="text-gray-600 mt-1">View and download your prescription history</p>
        </div>

        {/* Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Prescriptions</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Prescriptions Found</h3>
          <p className="text-gray-600 mb-6">You don't have any prescriptions yet.</p>
          <Link
            to="/patient/appointments/book"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Book Appointment
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription._id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {prescription.prescriptionNumber}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Doctor:</span>
                      <p className="font-medium text-gray-900">
                        Dr. {prescription.doctor.personalInfo.firstName} {prescription.doctor.personalInfo.lastName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {prescription.doctor.professionalInfo?.specialty}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium text-gray-900">
                        {formatDate(prescription.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Diagnosis:</span>
                    <p className="text-gray-900 font-medium">{prescription.diagnosis}</p>
                  </div>

                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Medicines: </span>
                    <span className="text-gray-900 font-medium">{prescription.medicines.length} prescribed</span>
                  </div>

                  {prescription.followUpDate && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Follow-up on {formatDate(prescription.followUpDate)}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => viewPrescription(prescription._id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => downloadPrescription(prescription)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Prescription Details */}
      {showModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Prescription Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Prescription Info */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Prescription No:</span>
                    <p className="font-semibold text-gray-900">{selectedPrescription.prescriptionNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedPrescription.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Valid Until:</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedPrescription.validUntil)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPrescription.status)}`}>
                      {selectedPrescription.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doctor Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Doctor Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">
                    Dr. {selectedPrescription.doctor.personalInfo.firstName} {selectedPrescription.doctor.personalInfo.lastName}
                  </p>
                  {selectedPrescription.doctor.professionalInfo?.specialty && (
                    <p className="text-sm text-gray-600">{selectedPrescription.doctor.professionalInfo.specialty}</p>
                  )}
                  {selectedPrescription.doctor.professionalInfo?.licenseNumber && (
                    <p className="text-sm text-gray-600">License: {selectedPrescription.doctor.professionalInfo.licenseNumber}</p>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Diagnosis</h3>
                <p className="bg-gray-50 rounded-lg p-4 text-gray-900">{selectedPrescription.diagnosis}</p>
              </div>

              {/* Medicines */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Medicines</h3>
                <div className="space-y-3">
                  {selectedPrescription.medicines.map((medicine, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-blue-900">{index + 1}. {medicine.name}</h4>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          {medicine.timing}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-blue-700">Dosage:</span>
                          <p className="text-blue-900 font-medium">{medicine.dosage}</p>
                        </div>
                        <div>
                          <span className="text-blue-700">Frequency:</span>
                          <p className="text-blue-900 font-medium">{medicine.frequency}</p>
                        </div>
                        <div>
                          <span className="text-blue-700">Duration:</span>
                          <p className="text-blue-900 font-medium">{medicine.duration}</p>
                        </div>
                      </div>
                      {medicine.instructions && (
                        <p className="mt-2 text-sm text-blue-800">
                          <span className="font-medium">Instructions:</span> {medicine.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tests */}
              {selectedPrescription.tests && selectedPrescription.tests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Recommended Tests</h3>
                  <ul className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-1">
                    {selectedPrescription.tests.map((test, index) => (
                      <li key={index} className="text-amber-900">• {test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {selectedPrescription.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
                  <p className="bg-gray-50 rounded-lg p-4 text-gray-900">{selectedPrescription.notes}</p>
                </div>
              )}

              {/* Follow-up */}
              {selectedPrescription.followUpDate && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Follow-up</h3>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <p className="font-medium text-green-900">
                      {formatDate(selectedPrescription.followUpDate)}
                    </p>
                    {selectedPrescription.followUpInstructions && (
                      <p className="text-sm text-green-800 mt-1">{selectedPrescription.followUpInstructions}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  downloadPrescription(selectedPrescription);
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Download Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
