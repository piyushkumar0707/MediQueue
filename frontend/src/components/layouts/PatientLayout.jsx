import { Outlet } from 'react-router-dom';
import PatientNavbar from '../navigation/PatientNavbar';

const PatientLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PatientNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PatientLayout;
