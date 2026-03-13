import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Help = () => {
  const { user } = useAuthStore();
  const role = user?.role;
  const faqs = [
    {
      question: 'How do I book an appointment?',
      answer: 'Navigate to the "Book Appointment" page, select your preferred doctor, choose a date and time slot, and confirm your booking.'
    },
    {
      question: 'How do I join the queue?',
      answer: 'Go to "Join Queue", select a doctor, specify your reason for visit, and choose priority level. You\'ll receive updates on your queue position.'
    },
    {
      question: 'How can I view my prescriptions?',
      answer: 'Access your prescriptions from the "Prescriptions" page in your dashboard. You can view, download, and print them.'
    },
    {
      question: 'How do I upload medical records?',
      answer: 'Visit the "Health Vault" section, click "Upload Record", fill in the details, and attach your files (PDF, images, or documents).'
    },
    {
      question: 'Can I cancel an appointment?',
      answer: 'Yes, go to your appointments list, select the appointment you want to cancel, and click the "Cancel" button.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to your Profile page and click "Change Password". Enter your current password and your new password to update it.'
    }
  ];

  const contactMethods = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email Support',
      detail: 'support@mediqueue.com',
      description: 'We\'ll respond within 24 hours'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone Support',
      detail: '+1 (555) 123-4567',
      description: 'Mon-Fri, 9AM-6PM EST'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Live Chat',
      detail: 'Chat with us',
      description: 'Available 24/7'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
        <p className="text-indigo-100">Find answers to common questions or contact our support team</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {role === 'patient' && (
          <>
            <Link to="/patient/appointments/book" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Book Appointment</h3>
              <p className="text-sm text-gray-600">Schedule a consultation with a doctor</p>
            </Link>
            <Link to="/patient/queue/join" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Join Queue</h3>
              <p className="text-sm text-gray-600">Join a doctor's queue for quick consultation</p>
            </Link>
            <Link to="/patient/records" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Health Vault</h3>
              <p className="text-sm text-gray-600">Access your medical records and documents</p>
            </Link>
          </>
        )}
        {role === 'doctor' && (
          <>
            <Link to="/doctor/queue" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Queue Management</h3>
              <p className="text-sm text-gray-600">Manage your patient queue</p>
            </Link>
            <Link to="/doctor/shared-records" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Shared Records</h3>
              <p className="text-sm text-gray-600">View patient records shared with you</p>
            </Link>
            <Link to="/doctor/prescriptions" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Prescriptions</h3>
              <p className="text-sm text-gray-600">Manage patient prescriptions</p>
            </Link>
          </>
        )}
        {role === 'admin' && (
          <>
            <Link to="/admin/users" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-sm text-gray-600">Manage platform users and roles</p>
            </Link>
            <Link to="/admin/audit" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Audit Logs</h3>
              <p className="text-sm text-gray-600">Review security and compliance logs</p>
            </Link>
            <Link to="/admin/analytics" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600">View platform usage and statistics</p>
            </Link>
          </>
        )}
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details key={index} className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <span className="font-medium text-gray-900">{faq.question}</span>
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 text-gray-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => (
            <div key={index} className="text-center p-6 border border-gray-200 rounded-lg hover:border-indigo-300 transition">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-4 text-indigo-600">
                {method.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
              <p className="text-indigo-600 font-medium mb-1">{method.detail}</p>
              <p className="text-sm text-gray-600">{method.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition">
            <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">User Guide</p>
              <p className="text-sm text-gray-600">Complete guide to using MediQueue</p>
            </div>
          </a>

          <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition">
            <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Video Tutorials</p>
              <p className="text-sm text-gray-600">Watch step-by-step video guides</p>
            </div>
          </a>

          <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition">
            <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Privacy & Security</p>
              <p className="text-sm text-gray-600">Learn how we protect your data</p>
            </div>
          </a>

          <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition">
            <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Terms of Service</p>
              <p className="text-sm text-gray-600">Read our terms and conditions</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Help;
