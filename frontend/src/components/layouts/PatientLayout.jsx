import { Outlet } from 'react-router-dom';
import PatientNavbar from '../navigation/PatientNavbar';

const PatientLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PatientNavbar />
      {/*
        pb-20: offset for the bottom tab bar on mobile (≈56px bar + breathing room)
        lg:pb-0: remove that offset on desktop (no bottom bar)
      */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PatientLayout;
