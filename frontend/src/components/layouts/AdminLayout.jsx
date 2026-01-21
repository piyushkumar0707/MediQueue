import { Outlet } from 'react-router-dom';
import AdminSidebar from '../navigation/AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
