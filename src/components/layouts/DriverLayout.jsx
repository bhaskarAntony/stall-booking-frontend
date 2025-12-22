import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Route, 
  Map, 
  User,
  Menu,
  LogOut,
  RefreshCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DriverLayout = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const bottomNavItems = [
    { icon: Home, label: 'Home', path: '/driver/dashboard' },
    { icon: Route, label: 'Trips', path: '/driver/trips' },
    { icon: Map, label: 'Map', path: '/driver/map' },
    { icon: User, label: 'Profile', path: '/driver/profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">RSR Driver</h1>
          {/* <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.name?.charAt(0)}
            </span>
          </div> */}

           <button
                onClick={() => window.location.reload()}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
        </div>
      </header>

      {/* Drawer */}
      {isDrawerOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">Driver</p>
                </div>
              </div>
            </div>
            <nav className="mt-6">
              {bottomNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <item.icon className="w-6 h-6 mr-4" />
                  <span className="text-lg">{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-6 py-4 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-6 h-6 mr-4" />
                <span className="text-lg">Logout</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 py-3 px-2 text-center transition-colors ${
                location.pathname === item.path
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DriverLayout;