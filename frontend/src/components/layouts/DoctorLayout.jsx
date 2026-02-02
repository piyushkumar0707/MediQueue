import { Outlet } from 'react-router-dom';
import DoctorSidebar from '../navigation/DoctorSidebar';
import NotificationBell from '../navigation/NotificationBell';
import useAuthStore from '../../store/useAuthStore';

const DoctorLayout = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome, Dr. {user?.personalInfo?.fullName || 'Doctor'}
              </h2>
              <p className="text-sm text-gray-500">
                {user?.professionalInfo?.specialization || 'Medical Professional'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
