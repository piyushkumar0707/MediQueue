import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const JoinQueue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    reasonForVisit: '',
    priority: 'normal'
  });
  const [joining, setJoining] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/doctors');
      console.log('Doctors API Response:', response);
      if (response.success) {
        console.log('Doctors data:', response.data);
        console.log('First doctor sample:', response.data[0]);
        setDoctors(response.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    if (!formData.reasonForVisit.trim()) {
      toast.error('Please provide reason for visit');
      return;
    }

    try {
      setJoining(true);
      const response = await api.post('/queue/join', {
        doctorId: selectedDoctor._id,
        reasonForVisit: formData.reasonForVisit,
        priority: formData.priority
      });

      if (response.success) {
        toast.success('Successfully joined the queue!');
        navigate('/patient/queue');
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to join queue');
      }
    } finally {
      setJoining(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => 
    `${doctor.personalInfo?.firstName} ${doctor.personalInfo?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.professionalInfo?.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.professionalInfo?.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Join Queue</h1>
        <p className="text-indigo-100">Select a doctor and join their queue for consultation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctors List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Doctors</h2>
          
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, specialization, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Doctor Cards */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <div
                  key={doctor._id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedDoctor?._id === doctor._id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        Dr. {doctor.personalInfo?.firstName} {doctor.personalInfo?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {doctor.professionalInfo?.specialization || 'General Physician'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {doctor.professionalInfo?.department || ''}
                      </p>
                    </div>
                    {selectedDoctor?._id === doctor._id && (
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No doctors found</p>
              </div>
            )}
          </div>
        </div>

        {/* Queue Details Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Queue Details</h2>
            
            <form onSubmit={handleJoinQueue} className="space-y-4">
              {/* Selected Doctor Display */}
              {selectedDoctor ? (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Selected Doctor</p>
                  <p className="font-semibold text-gray-900">
                    Dr. {selectedDoctor.personalInfo?.firstName} {selectedDoctor.personalInfo?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedDoctor.professionalInfo?.specialization || 'General Physician'}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 text-center">
                    Select a doctor to continue
                  </p>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Choose priority based on urgency
                </p>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit *
                </label>
                <textarea
                  value={formData.reasonForVisit}
                  onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe your symptoms or reason for visit..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedDoctor || joining}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  !selectedDoctor || joining
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {joining ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Queue'
                )}
              </button>

              {/* Info Note */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-800">
                    After joining, you'll be able to track your queue position in real-time on the Queue Tracking page.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinQueue;
