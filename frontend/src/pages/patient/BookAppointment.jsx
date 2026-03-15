import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  // Form data
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    reasonForVisit: '',
    symptoms: '',
    type: 'consultation'
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialization, searchQuery]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSpecialization !== 'all') params.append('specialization', selectedSpecialization);
      if (searchQuery) params.append('search', searchQuery);
      
      const res = await api.get(`/users/doctors?${params.toString()}`);
      if (res.success) {
        setDoctors(res.data);
        
        // Extract unique specializations
        const specs = [...new Set(res.data
          .map(d => d.professionalInfo?.specialization)
          .filter(Boolean))];
        setSpecializations(specs);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments/available-slots/${doctorId}?date=${date}`);
      if (res.success) {
        let slots = res.data.slots;
        
        // Filter out past time slots if the selected date is today
        const selectedDate = new Date(date);
        const today = new Date();
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate.getTime() === today.getTime()) {
          const currentTime = new Date();
          const currentHour = currentTime.getHours();
          const currentMinute = currentTime.getMinutes();
          
          slots = slots.map(slot => {
            const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
            const isPast = slotHour < currentHour || 
                          (slotHour === currentHour && slotMinute <= currentMinute);
            
            return {
              ...slot,
              available: slot.available && !isPast
            };
          });
        }
        
        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep(2);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date && selectedDoctor) {
      fetchAvailableSlots(selectedDoctor._id, date);
    }
  };

  const handleSlotSelect = (slot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !formData.reasonForVisit) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const appointmentData = {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        timeSlot: {
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        },
        reasonForVisit: formData.reasonForVisit,
        symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(Boolean),
        type: formData.type
      };

      const res = await api.post('/appointments', appointmentData);
      
      if (res.success) {
        toast.success('Appointment booked successfully!');
        navigate('/patient');
      }
    } catch (error) {
      const message = error.message || 'Failed to book appointment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
        <p className="text-gray-600">Schedule a consultation with our healthcare professionals</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Select Doctor' },
            { num: 2, label: 'Choose Date & Time' },
            { num: 3, label: 'Details' },
            { num: 4, label: 'Confirm' }
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.num 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.num}
                </div>
                <span className={`text-sm mt-2 ${
                  currentStep >= step.num ? 'text-indigo-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`h-1 flex-1 mx-2 ${
                  currentStep > step.num ? 'bg-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Step 1: Select Doctor */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Select a Doctor</h2>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Doctor
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Doctors List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          Dr. {doctor.personalInfo?.firstName} {doctor.personalInfo?.lastName}
                        </h3>
                        <p className="text-sm text-indigo-600 font-medium">
                          {doctor.professionalInfo?.specialization || 'General Physician'}
                        </p>
                        {doctor.professionalInfo?.experience && (
                          <p className="text-sm text-gray-600 mt-1">
                            {doctor.professionalInfo.experience} years experience
                          </p>
                        )}
                        {doctor.professionalInfo?.qualification && (
                          <p className="text-xs text-gray-500 mt-1">
                            {doctor.professionalInfo.qualification}
                          </p>
                        )}
                      </div>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="mt-2 text-gray-600">No doctors found</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose Date & Time */}
        {currentStep === 2 && selectedDoctor && (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center mb-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Change Doctor
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Select Date & Time</h2>
              <p className="text-gray-600 mt-1">
                Booking with Dr. {selectedDoctor.personalInfo?.firstName} {selectedDoctor.personalInfo?.lastName}
              </p>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Time Slots
                </label>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {availableSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.available}
                        className={`py-3 px-4 rounded-lg font-medium text-sm transition ${
                          selectedSlot?.startTime === slot.startTime
                            ? 'bg-indigo-600 text-white'
                            : slot.available
                            ? 'bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-500'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No slots available for this date</p>
                )}
              </div>
            )}

            {selectedSlot && (
              <button
                onClick={() => setCurrentStep(3)}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Continue
              </button>
            )}
          </div>
        )}

        {/* Step 3: Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center mb-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="routine-checkup">Routine Checkup</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reasonForVisit}
                onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                rows={3}
                placeholder="Brief description of your health concern..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms (comma separated)
              </label>
              <input
                type="text"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="e.g., fever, cough, headache"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setCurrentStep(4)}
              disabled={!formData.reasonForVisit}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue to Review
            </button>
          </div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center mb-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
            </div>

            {/* Appointment Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex items-start space-x-4 pb-4 border-b">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dr. {selectedDoctor.personalInfo?.firstName} {selectedDoctor.personalInfo?.lastName}</h3>
                  <p className="text-sm text-indigo-600">{selectedDoctor.professionalInfo?.specialization}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{formData.type.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Reason:</span>
                  <span className="font-medium text-right max-w-xs">{formData.reasonForVisit}</span>
                </div>
                {formData.symptoms && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Symptoms:</span>
                    <span className="font-medium text-right max-w-xs">{formData.symptoms}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Please note:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Arrive 10 minutes early for your appointment</li>
                    <li>Bring any relevant medical records or test results</li>
                    <li>You can cancel or reschedule up to 24 hours before</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
