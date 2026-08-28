import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import DoctorSidebar from '../navigation/DoctorSidebar';
import NotificationBell from '../navigation/NotificationBell';
import useAuthStore from '../../store/useAuthStore';

const DoctorLayout = () => {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Mobile/Tablet overlay backdrop (< lg) ────────────────────── */}
      <div
        className={`fixed inset-0 z-20 bg-black/40 lg:hidden transition-opacity duration-200
                    ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      {/*
        Mobile/Tablet (< lg): off-canvas, slides in from left with CSS transform.
        Desktop (≥ lg):       permanently visible, part of the normal flow.
      */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200
                    transform transition-transform duration-200 ease-in-out
                    lg:relative lg:translate-x-0 lg:flex-shrink-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <DoctorSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger — visible on mobile & tablet (< lg) */}
              <button
                className="lg:hidden p-2 -ml-1 rounded-md text-gray-500 hover:text-gray-900
                           hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]
                           flex items-center justify-center flex-shrink-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="min-w-0">
                <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  Welcome, Dr. {user?.personalInfo?.firstName || 'Doctor'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {user?.professionalInfo?.specialty ||
                   user?.professionalInfo?.specialization ||
                   'Medical Professional'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
