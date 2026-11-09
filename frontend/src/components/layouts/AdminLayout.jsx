import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import AdminSidebar from '../navigation/AdminSidebar';
import NotificationBell from '../navigation/NotificationBell';
import useAuthStore from '../../store/useAuthStore';

const AdminLayout = () => {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Mobile/Tablet overlay backdrop (< lg) ────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300
                    ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
                    transform transition-transform duration-300 ease-in-out
                    lg:relative lg:translate-x-0 lg:flex-shrink-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile/Tablet hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 transition-colors
                         min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="Toggle menu"
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen
                ? <X className="w-6 h-6 text-gray-700" />
                : <Menu className="w-6 h-6 text-gray-700" />
              }
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Welcome,{' '}
                {user?.personalInfo?.firstName
                  ? `${user.personalInfo.firstName} ${user.personalInfo.lastName || ''}`.trim()
                  : 'Administrator'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">System Administrator</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
