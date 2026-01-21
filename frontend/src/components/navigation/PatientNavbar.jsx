const PatientNavbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">CareQueue</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900">
              Notifications
            </button>
            <button className="text-gray-600 hover:text-gray-900">
              Profile
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PatientNavbar;
