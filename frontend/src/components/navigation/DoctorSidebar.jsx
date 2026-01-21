import { NavLink } from 'react-router-dom';

const DoctorSidebar = () => {
  const navItems = [
    { to: '/doctor', label: 'Dashboard', icon: '🏠' },
    { to: '/doctor/queue', label: 'Queue', icon: '⏱️' },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary-600">CareQueue</h1>
        <p className="text-sm text-gray-600">Doctor Portal</p>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/doctor'}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default DoctorSidebar;
