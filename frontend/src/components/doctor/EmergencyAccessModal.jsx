import { useState } from 'react';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { requestEmergencyAccess } from '../../services/api';

const EmergencyAccessModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const [formData, setFormData] = useState({
    patientId: patient?._id || '',
    emergencyType: 'life-threatening',
    justification: '',
    location: '',
    facilityName: ''
  });
  const [loading, setLoading] = useState(false);

  const emergencyTypes = [
    { value: 'life-threatening', label: 'Life-Threatening Emergency' },
    { value: 'critical-care', label: 'Critical Care Required' },
    { value: 'trauma', label: 'Trauma Case' },
    { value: 'cardiac-emergency', label: 'Cardiac Emergency' },
    { value: 'stroke', label: 'Stroke' },
    { value: 'severe-allergic-reaction', label: 'Severe Allergic Reaction' },
    { value: 'unconscious-patient', label: 'Unconscious Patient' },
    { value: 'other-emergency', label: 'Other Emergency' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.justification.length < 20) {
      toast.error('Justification must be at least 20 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await requestEmergencyAccess(formData);
      
      toast.success('Emergency access granted successfully');
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to request emergency access');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Request Emergency Access</h2>
                <p className="text-sm text-gray-600 mt-1">Break-glass access for emergency situations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Warning */}
          <div className="mb-6 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Important Notice</p>
              <p>Emergency access is automatically granted for immediate care but will be reviewed by administrators. 
              Please provide detailed justification. Inappropriate use may result in disciplinary action.</p>
            </div>
          </div>

          {/* Patient Info */}
          {patient && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Patient Information</h3>
              <p className="text-gray-900 font-medium">
                {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
              </p>
              <p className="text-sm text-gray-600">{patient.email}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Type <span className="text-red-600">*</span>
              </label>
              <select
                name="emergencyType"
                value={formData.emergencyType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {emergencyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification <span className="text-red-600">*</span>
                <span className="text-xs text-gray-500 ml-2">
                  (minimum 20 characters, recommended 50+)
                </span>
              </label>
              <textarea
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                required
                rows={6}
                minLength={20}
                maxLength={1000}
                placeholder="Provide a detailed explanation of the emergency situation and why immediate access to this patient's records is necessary. Include relevant clinical details, time-sensitive factors, and any attempts made to obtain consent."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>
                  {formData.justification.length < 20 && 'Must be at least 20 characters'}
                  {formData.justification.length >= 20 && formData.justification.length < 50 && (
                    <span className="text-yellow-600">Warning: Short justifications are automatically flagged for review</span>
                  )}
                  {formData.justification.length >= 50 && (
                    <span className="text-green-600">Good justification length</span>
                  )}
                </span>
                <span>{formData.justification.length} / 1000</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="E.g., Emergency Room, ICU"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Name (Optional)
                </label>
                <input
                  type="text"
                  name="facilityName"
                  value={formData.facilityName}
                  onChange={handleChange}
                  placeholder="E.g., City General Hospital"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Access Details */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Access Details</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Access will be granted immediately upon submission</li>
                <li>✓ Default expiry: 24 hours from request</li>
                <li>✓ All record access will be logged and audited</li>
                <li>✓ Administrators will review this request post-facto</li>
                <li>✓ You can revoke access at any time from your emergency requests page</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.justification.length < 20}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Requesting...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Request Emergency Access
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccessModal;
