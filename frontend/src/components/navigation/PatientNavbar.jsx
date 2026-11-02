import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Shield,
  Pill,
  Clock,
  FolderHeart,
  Bell,
  HelpCircle,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import NotificationBell from './NotificationBell';

/* ── Bottom tab items (primary — always visible) ─────────────────── */
const BOTTOM_TABS = [
  { path: '/patient',               label: 'Home',          icon: LayoutDashboard, exact: true },
  { path: '/patient/queue',         label: 'Queue',         icon: Clock },
  { path: '/patient/appointments',  label: 'Appointments',  icon: CalendarDays },
  { path: '/patient/records',       label: 'Records',       icon: FolderHeart },
  { path: '/patient/notifications', label: 'Alerts',        icon: Bell },
];

/* ── Desktop nav tabs ─────────────────────────────────────────────── */
const DESKTOP_TABS = [
  { path: '/patient',               label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { path: '/patient/appointments',  label: 'Appointments',  icon: CalendarDays },
  { path: '/patient/queue',         label: 'Queue',         icon: Clock },
  { path: '/patient/records',       label: 'Health Vault',  icon: FolderHeart },
  { path: '/patient/consent',       label: 'Consent',       icon: Shield },
  { path: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
];

/* ── Account/overflow menu items ─────────────────────────────────── */
// On desktop (lg+): Consent & Prescriptions already show in the top nav,
// so the dropdown only needs Profile and Help.
const ACCOUNT_ITEMS_DESKTOP = [
  { path: '/patient/profile',       label: 'Profile',       icon: User },
  { path: '/patient/help',          label: 'Help',          icon: HelpCircle },
];

// On mobile: Consent & Prescriptions are NOT in the bottom tab bar,
// so they appear here as secondary links.
const ACCOUNT_ITEMS_MOBILE = [
  { path: '/patient/consent',       label: 'Consent',       icon: Shield },
  { path: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
  { path: '/patient/profile',       label: 'Profile',       icon: User },
  { path: '/patient/help',          label: 'Help',          icon: HelpCircle },
];

const PatientNavbar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);

  const isActive = (path, exact = false) =>
    exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* ── Top bar (all screen sizes) ──────────────────────────────── */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">

            {/* Brand */}
            <Link to="/patient" className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary-600">MediQueue</h1>
            </Link>

            {/* Desktop nav tabs — hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-1 h-full -mb-px">
              {DESKTOP_TABS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={`flex items-center gap-1.5 px-3 py-5 text-sm font-medium border-b-2 transition-colors
                      ${active
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Username — sm+ only */}
              <span className="hidden sm:block text-sm text-gray-600 mr-1 max-w-[120px] truncate">
                {user?.personalInfo?.firstName || user?.email}
              </span>

              <NotificationBell />

              {/* Account menu button — all sizes (primary on desktop, secondary on mobile) */}
              <div className="relative">
                <button
                  onClick={() => setAccountOpen(v => !v)}
                  className="flex items-center gap-1 p-2 min-h-[44px] min-w-[44px] justify-center
                             text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md
                             transition-colors"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  <User className="w-5 h-5" />
                  <ChevronDown
                    className={`w-3 h-3 hidden sm:block transition-transform duration-200
                               ${accountOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown */}
                <div
                  className={`absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg
                              border border-gray-200 py-1 z-50
                              transition-all duration-200 origin-top-right
                              ${accountOpen
                                ? 'opacity-100 scale-100 pointer-events-auto'
                                : 'opacity-0 scale-95 pointer-events-none'
                              }`}
                >
                  {/* Desktop: show only Profile + Help (Consent/Prescriptions already in top nav) */}
                  <div className="hidden lg:block">
                    {ACCOUNT_ITEMS_DESKTOP.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                                     hover:bg-gray-50 transition-colors min-h-[44px]"
                        >
                          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                  {/* Mobile: show all secondary items incl. Consent & Prescriptions */}
                  <div className="lg:hidden">
                    {ACCOUNT_ITEMS_MOBILE.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                                     hover:bg-gray-50 transition-colors min-h-[44px]"
                        >
                          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { setAccountOpen(false); logout(); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                                 hover:bg-red-50 transition-colors w-full min-h-[44px]"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Bottom tab bar — mobile only (< lg) ────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200
                   flex items-stretch pb-safe"
        aria-label="Primary navigation"
      >
        {BOTTOM_TABS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={`flex flex-col items-center justify-center flex-1 py-2 min-h-[56px]
                          text-[10px] font-medium gap-0.5 transition-colors
                          ${active
                            ? 'text-primary-600'
                            : 'text-gray-500 hover:text-gray-800'
                          }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Backdrop to close account menu when clicking outside */}
      {accountOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setAccountOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default PatientNavbar;
