import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import NotificationsDropdown from '../common/NotificationsDropdown';

const PatientNavbar = () => {
  const { user } = useAuthStore();
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">CareQueue</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.personalInfo?.fullName || user?.email}
            </span>
            <NotificationsDropdown />
            <Link to="/patient/help" className="text-gray-600 hover:text-gray-900">
              Help
            </Link>
            <Link to="/patient/profile" className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PatientNavbar;
