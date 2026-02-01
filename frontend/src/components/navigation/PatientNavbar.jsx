import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import NotificationBell from './NotificationBell';

const PatientNavbar = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  const navItems = [
    { path: '/patient', label: 'Dashboard', icon: '🏠', exact: true },
    { path: '/patient/appointments', label: 'Appointments', icon: '📅' },
    { path: '/patient/records', label: 'Health Vault', icon: '🏥' },
    { path: '/patient/consent', label: 'Consent', icon: '🔒' },
    { path: '/patient/prescriptions', label: 'Prescriptions', icon: '💊' },
  ];
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">CareQueue</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.personalInfo?.firstName || user?.email}
            </span>
            <NotificationBell />
            <Link to="/patient/help" className="text-gray-600 hover:text-gray-900">
              Help
            </Link>
            <Link to="/patient/profile" className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
          </div>
        </div>
        
        {/* Navigation tabs */}
        <div className="flex space-x-1 -mb-px">
          {navItems.map((item) => {
            const active = item.exact 
              ? location.pathname === item.path
              : isActive(item.path);
              
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${active 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default PatientNavbar;
