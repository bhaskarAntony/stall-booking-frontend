import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Route, 
  MapPin, 
  User,
  Menu,
  LogOut,
  RefreshCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeLayout = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const bottomNavItems = [
    { icon: Home, label: 'Home', path: '/employee/dashboard' },
    { icon: Route, label: 'Trips', path: '/employee/trips' },
    { icon: MapPin, label: 'Track', path: '/employee/track' },
    { icon: User, label: 'Profile', path: '/employee/profile' }
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <p className="text-[11px] tracking-wide text-slate-400 uppercase">
              RSR Employee
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {user?.company?.name || 'Tech Solutions Pvt Ltd'}
            </p>
          </div>
          {/* <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0) || 'E'}
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
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl rounded-r-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-semibold">
                  {user?.name?.charAt(0) || 'E'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-purple-100">
                    {user?.email}
                  </p>
                  <p className="text-[11px] text-purple-100 mt-1">
                    Employee • {user?.company?.code}
                  </p>
                </div>
              </div>
            </div>

            <nav className="mt-3">
              {bottomNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`mx-3 mb-1 flex items-center px-3 py-3 rounded-2xl text-sm font-medium ${
                      active
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="mx-3 mt-2 mb-3 flex items-center px-3 py-3 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="max-w-md mx-auto">{children}</div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-slate-200">
        <div className="max-w-md mx-auto flex justify-between px-2 py-1.5">
          {bottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div
                  className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-2xl transition ${
                    active
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-slate-500'
                  }`}
                >
                  <item.icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default EmployeeLayout;
