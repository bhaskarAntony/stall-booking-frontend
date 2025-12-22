import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Eye, EyeOff, Loader2, MapPin, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(formData);
      toast.success('Login successful!');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleCredentials = [
    { role: 'Super Admin', email: 'admin@rsrtours.com', password: 'Admin@123' },
    { role: 'Office HR', email: 'hr@techsolutions.com', password: 'Hr@123456' },
    { role: 'Driver', email: 'rajesh.driver@rsrtours.com', password: 'Driver@123' },
    { role: 'Employee', email: 'priya.patel@techsolutions.com', password: 'Employee@123' }
  ];

  const fillSample = (email, password) => setFormData({ email, password });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-5">
        {/* App header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-white shadow-md flex items-center justify-center border border-blue-100">
              <img src="https://www.rsr-tours.com/static/media/logoRSR.520d3b5c1fbc05c845d5.jpg" alt="rsr cabs" className="w-full rounded-xl" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
              RSR Cabs 
            </h1>
            <p className="mt-1 text-xs sm:text-[13px] text-slate-500">
              Smart employee transportation & live cab tracking
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
              Sign in to manage rides, track cabs and view trips.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] sm:text-xs font-medium text-slate-700">
                Work email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] sm:text-xs font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full flex justify-center items-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-50 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
            <center>
               <button
                            onClick={() => window.location.reload()}
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
                          >
                            <RefreshCcw className="w-5 h-5" />
                          </button>
            </center>
          </form>

          {/* Sample creds */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-medium text-slate-600 mb-2">
              Quick demo logins
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleCredentials.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillSample(cred.email, cred.password)}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100 active:scale-[0.99] transition"
                >
                  <p className="text-[11px] font-semibold text-slate-900">
                    {cred.role}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {cred.email}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] text-slate-400">
            © 2025 RSR Tours and Travel · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
