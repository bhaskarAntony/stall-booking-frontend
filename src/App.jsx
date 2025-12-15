import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LocationProvider } from './context/LocationContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TripManagement from './pages/admin/TripManagement';
import CompanyManagement from './pages/admin/CompanyManagement';
import UserManagement from './pages/admin/UserManagement';
import VehicleManagement from './pages/admin/VehicleManagement';

// HR Pages
import HRDashboard from './pages/hr/HRDashboard';
import HRTripManagement from './pages/hr/HRTripManagement';
import LiveTracking from './pages/hr/LiveTracking';
import Reports from './pages/hr/Reports';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverTrips from './pages/driver/DriverTrips';
import DriverMap from './pages/driver/DriverMap';
import DriverProfile from './pages/driver/DriverProfile';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeTrips from './pages/employee/EmployeeTrips';
import EmployeeTracking from './pages/employee/EmployeeTracking';
import EmployeeProfile from './pages/employee/EmployeeProfile';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <LocationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected Routes with Role-based Access */}
                
                {/* RSR Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['rsr_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/trips" element={
                  <ProtectedRoute allowedRoles={['rsr_admin']}>
                    <TripManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/companies" element={
                  <ProtectedRoute allowedRoles={['rsr_admin']}>
                    <CompanyManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['rsr_admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/vehicles" element={
                  <ProtectedRoute allowedRoles={['rsr_admin']}>
                    <VehicleManagement />
                  </ProtectedRoute>
                } />

                {/* Office HR Routes */}
                <Route path="/hr/dashboard" element={
                  <ProtectedRoute allowedRoles={['office_hr']}>
                    <HRDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/hr/trips" element={
                  <ProtectedRoute allowedRoles={['office_hr']}>
                    <HRTripManagement />
                  </ProtectedRoute>
                } />
                <Route path="/hr/tracking" element={
                  <ProtectedRoute allowedRoles={['office_hr']}>
                    <LiveTracking />
                  </ProtectedRoute>
                } />
                <Route path="/hr/reports" element={
                  <ProtectedRoute allowedRoles={['office_hr']}>
                    <Reports />
                  </ProtectedRoute>
                } />

                {/* Driver Routes */}
                <Route path="/driver/dashboard" element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/driver/trips" element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverTrips />
                  </ProtectedRoute>
                } />
                <Route path="/driver/map" element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverMap />
                  </ProtectedRoute>
                } />
                <Route path="/driver/profile" element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverProfile />
                  </ProtectedRoute>
                } />

                {/* Employee Routes */}
                <Route path="/employee/dashboard" element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/employee/trips" element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeTrips />
                  </ProtectedRoute>
                } />
                <Route path="/employee/track/:tripId" element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeTracking />
                  </ProtectedRoute>
                } />
                 <Route path="/employee/track" element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeTracking />
                  </ProtectedRoute>
                } />
                <Route path="/employee/profile" element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeProfile />
                  </ProtectedRoute>
                } />

                {/* Default Route - Redirect to appropriate dashboard based on role */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                } />

                {/* 404 Route */}
                <Route path="*" element={<div className="p-8 text-center">Page Not Found</div>} />
              </Routes>

              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </Router>
        </LocationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

// Component to redirect to appropriate dashboard based on role
function DashboardRedirect() {
  const { user } = useAuth();
  
  switch (user?.role) {
    case 'rsr_admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'office_hr':
      return <Navigate to="/hr/dashboard" replace />;
    case 'driver':
      return <Navigate to="/driver/dashboard" replace />;
    case 'employee':
      return <Navigate to="/employee/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App;