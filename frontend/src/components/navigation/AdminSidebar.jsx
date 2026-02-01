import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import NotificationBell from './NotificationBell';

const AdminSidebar = () => {
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-primary-600">CareQueue</h1>
          <NotificationBell />
        </div>
        <p className="text-sm text-gray-600">Admin Portal</p>
        {user?.personalInfo?.fullName && (
          <p className="text-xs text-gray-500 mt-2">
            {user.personalInfo.fullName}
          </p>
        )}
      </div>
      <nav className="mt-6 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
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
