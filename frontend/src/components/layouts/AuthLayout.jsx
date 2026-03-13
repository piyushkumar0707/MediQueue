import { Outlet } from 'react-router-dom';
import logo from '../../assets/logo.png';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="MediQueue" className="h-16 w-auto mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-primary-600">MediQueue</h1>
          <p className="text-gray-600 mt-2">Secure Healthcare Operations</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
