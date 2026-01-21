import { Outlet } from 'react-router-dom';
import DoctorSidebar from '../navigation/DoctorSidebar';

const DoctorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DoctorSidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorLayout;
