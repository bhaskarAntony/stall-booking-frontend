// src/components/layouts/HRLayout.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Route,
  BarChart3,
  MapPin,
  FileText,
  LogOut,
  Menu,
  X,
  RefreshCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HRLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/hr/dashboard' },
    { icon: Route, label: 'Trips', path: '/hr/trips' },
    { icon: MapPin, label: 'Live Tracking', path: '/hr/tracking' },
    { icon: FileText, label: 'Reports', path: '/hr/reports' },
  ];

  const activeItem =
    menuItems.find((item) => item.path === location.pathname) || menuItems[0];

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/95 border-r border-slate-200 shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                HR
              </p>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {user?.company?.name || 'Company'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <item.icon
                  className={`w-4 h-4 mr-3 ${
                    isActive ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/90 px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-700">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name || 'HR Manager'}
              </p>
              <p className="text-[11px] text-slate-500">HR Manager</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {activeItem.label}
                </p>
               
              </div>
            </div>
 <button
                onClick={() => window.location.reload()}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
            
            
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default HRLayout;
