import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const AdminSidebar = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();
  
  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/audit', label: 'Audit Logs', icon: '🧾' },
    { to: '/admin/emergency-cases', label: 'Emergency Cases', icon: '🚨' },
    { to: '/admin/emergency-access', label: 'Emergency Access', icon: '🔐' },
    { to: '/admin/users', label: 'User Management', icon: '👥' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📊' },
    { to: '/admin/profile', label: 'Profile', icon: '👤' },
    { to: '/admin/help', label: 'Help', icon: '❓' },
  ];

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <aside className="w-full h-full bg-white flex flex-col">
      <div className="p-4 sm:p-6">
        <h1 className="text-lg sm:text-xl font-bold text-primary-600 mb-2">CareQueue</h1>
        <p className="text-xs sm:text-sm text-gray-600">Admin Portal</p>
        {user?.personalInfo?.fullName && (
          <p className="text-xs text-gray-500 mt-2 truncate">
            {user.personalInfo.fullName}
          </p>
        )}
      </div>
      <nav className="mt-4 sm:mt-6 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span className="mr-2">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
