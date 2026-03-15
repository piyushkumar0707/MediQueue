import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScrollText,
  AlertTriangle,
  ShieldOff,
  Users,
  BarChart2,
  User,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const AdminSidebar = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/emergency-cases', label: 'Emergency Cases', icon: AlertTriangle },
    { to: '/admin/emergency-access', label: 'Emergency Access', icon: ShieldOff },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/admin/profile', label: 'Profile', icon: User },
    { to: '/admin/help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <aside className="w-full h-full bg-white flex flex-col">
      <div className="p-4 sm:p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div>
            <h1 className="text-base font-bold text-gray-900">MediQueue</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>
        {user?.personalInfo?.firstName && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-lg px-3 py-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.personalInfo.firstName} {user.personalInfo.lastName}
            </p>
            <p className="text-xs text-violet-500 truncate">System Administrator</p>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 border-r-4 border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
