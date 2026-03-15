import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Shield,
  Pill,
  Clock,
  FolderHeart,
  Menu,
  X,
  HelpCircle,
  User,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import NotificationBell from './NotificationBell';

const PatientNavbar = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/patient', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
    { path: '/patient/queue', label: 'Queue', icon: Clock },
    { path: '/patient/records', label: 'Health Vault', icon: FolderHeart },
    { path: '/patient/consent', label: 'Consent', icon: Shield },
    { path: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-bold text-primary-600">MediQueue</h1>
          </div>

          {/* Desktop nav tabs */}
          <div className="hidden lg:flex items-center space-x-1 h-full -mb-px">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-5 text-sm font-medium border-b-2 transition-colors
                    ${active
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-gray-600">
              {user?.personalInfo?.firstName || user?.email}
            </span>
            <NotificationBell />
            <Link to="/patient/help" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md" aria-label="Help">
              <HelpCircle className="w-5 h-5" />
            </Link>
            <Link to="/patient/profile" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md" aria-label="Profile">
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors
                  ${active
                    ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default PatientNavbar;

