import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  FolderOpen,
  Pill,
  ShieldAlert,
  CalendarDays,
  User,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const DoctorSidebar = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/doctor/queue', label: 'Queue', icon: Clock },
    { to: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/doctor/shared-records', label: 'Shared Records', icon: FolderOpen },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/doctor/emergency-requests', label: 'Emergency Access', icon: ShieldAlert },
    { to: '/doctor/profile', label: 'Profile', icon: User },
    { to: '/doctor/help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <aside className="h-full flex flex-col bg-white">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary-600 mb-1">CareQueue</h1>
        <p className="text-sm text-gray-500">Doctor Portal</p>
        {user?.personalInfo?.fullName && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            Dr. {user.personalInfo.fullName}
          </p>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
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

export default DoctorSidebar;
