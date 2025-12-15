import React, { useState, useEffect } from 'react';
import { 
  Route, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Car,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import EmployeeLayout from '../../components/layouts/EmployeeLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getEmployeeDashboard();
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </EmployeeLayout>
    );
  }

  if (!dashboardData) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-[80vh] text-gray-500">
          Unable to load dashboard.
        </div>
      </EmployeeLayout>
    );
  }

  const {
    employeeInfo,
    tripStats,
    todayTrips,
    upcomingTrips,
    activeTrip,
    tripHistory
  } = dashboardData;

  const handleTrackActiveTrip = () => {
    if (activeTrip?._id) {
      navigate(`/employee/track/${activeTrip._id}`);
    }
  };

  const handleQuickTrack = () => {
    if (activeTrip?._id) {
      navigate(`/employee/track/${activeTrip._id}`);
    } else if (todayTrips?.length) {
      navigate(`/employee/track/${todayTrips[0]._id}`);
    }
  };

  const handleViewAllTrips = () => {
    navigate('/employee/trips');
  };

  const handleUpdateProfile = () => {
    navigate('/employee/profile');
  };

  return (
    <EmployeeLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="mx-auto max-w-md px-4 py-4 space-y-5">
          {/* Top welcome + compact stats */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <span className="text-2xl font-semibold">
                  {user?.name?.charAt(0) || 'E'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-indigo-100">Good to see you</p>
                <h1 className="text-xl font-semibold leading-snug">
                  {user?.name || 'Employee'}
                </h1>
                <p className="text-[11px] text-indigo-100 mt-1">
                  ID: {employeeInfo.employeeId} • {employeeInfo.department}
                </p>
                <p className="text-[11px] text-indigo-100">
                  {employeeInfo.designation}
                </p>
              </div>
            </div>

            {/* Mini stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white/10 rounded-2xl px-3 py-2 flex flex-col">
                <span className="text-indigo-100">Today</span>
                <span className="text-sm font-semibold">
                  {tripStats.todayTripsCount}
                </span>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 flex flex-col">
                <span className="text-indigo-100">This month</span>
                <span className="text-sm font-semibold">
                  {tripStats.completedThisMonth}
                </span>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 flex flex-col">
                <span className="text-indigo-100">Total</span>
                <span className="text-sm font-semibold">
                  {tripStats.totalCompleted}
                </span>
              </div>
            </div>
          </div>

          {/* Active trip card */}
          {activeTrip && (
            <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Car className="w-4 h-4 text-emerald-700" />
                  </span>
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">
                      Active trip
                    </p>
                    <p className="text-sm font-semibold text-emerald-900">
                      {activeTrip.tripName}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[11px] font-medium text-emerald-800">
                  Live
                </span>
              </div>

              <p className="text-xs text-emerald-700">
                {activeTrip.routeName}
              </p>

              <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {activeTrip.schedule?.startTime} – {activeTrip.schedule?.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5" />
                  <span>{activeTrip.assignedVehicle?.vehicleNumber}</span>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-700">
                <User className="w-3.5 h-3.5" />
                <span>Driver ID: {activeTrip.assignedDriver?.driverId}</span>
              </div>

              <button
                onClick={handleTrackActiveTrip}
                className="mt-3 w-full rounded-2xl bg-emerald-600 text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
              >
                <MapPin className="w-4 h-4" />
                Track live location
              </button>
            </div>
          )}

          {/* Stats grid as mobile cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Today&apos;s trips</p>
                  <p className="text-xl font-semibold text-gray-900 leading-tight">
                    {tripStats.todayTripsCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-4.5 h-4.5 text-green-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">This month</p>
                  <p className="text-xl font-semibold text-gray-900 leading-tight">
                    {tripStats.completedThisMonth}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-2xl flex items-center justify-center">
                  <Route className="w-4.5 h-4.5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Total trips</p>
                  <p className="text-xl font-semibold text-gray-900 leading-tight">
                    {tripStats.totalCompleted}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-orange-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Department</p>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {employeeInfo.department}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Today’s trips list */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Today&apos;s trips
              </h3>
              <span className="text-[11px] text-gray-500">
                {todayTrips.length} total
              </span>
            </div>
            <div className="divide-y">
              {todayTrips.length > 0 ? (
                todayTrips.map((trip) => (
                  <div key={trip._id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {trip.tripName}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {trip.routeName}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {trip.schedule?.startTime} – {trip.schedule?.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Car className="w-3.5 h-3.5" />
                            <span>{trip.assignedVehicle?.vehicleNumber}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                            trip.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : trip.status === 'completed'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {trip.status.charAt(0).toUpperCase() +
                            trip.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No trips scheduled for today
                </div>
              )}
            </div>
          </div>

          {/* Upcoming trips */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Upcoming trips
              </h3>
              <span className="text-[11px] text-gray-500">
                {upcomingTrips.length} scheduled
              </span>
            </div>
            <div className="divide-y">
              {upcomingTrips.length > 0 ? (
                upcomingTrips.slice(0, 3).map((trip) => (
                  <div key={trip._id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {trip.tripName}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {trip.routeName}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {trip.schedule?.startTime} – {trip.schedule?.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{trip.schedule?.days?.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex px-2 py-1 rounded-full bg-gray-50 text-gray-700 text-[11px] font-medium">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  <Route className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No upcoming trips
                </div>
              )}
            </div>
          </div>

          {/* Recent history */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent trip history
              </h3>
              <span className="text-[11px] text-gray-500">
                Last {Math.min(tripHistory.length, 5)}
              </span>
            </div>
            <div className="divide-y">
              {tripHistory.length > 0 ? (
                tripHistory.slice(0, 5).map((trip) => (
                  <div key={trip._id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {trip.tripName}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {trip.routeName}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(trip.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                          trip.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : trip.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {trip.status.charAt(0).toUpperCase() +
                          trip.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No trip history available
                </div>
              )}
            </div>
          </div>

          {/* Quick actions as bottom sheet-style buttons */}
          <div className="pb-4">
            <div className="bg-white rounded-3xl shadow-sm border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Quick actions
              </h3>
              <button
                onClick={handleQuickTrack}
                className="w-full flex items-center justify-between px-3 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 flex items-center justify-center">
                    <MapPin className="w-4.5 h-4.5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Track current trip
                  </span>
                </div>
              </button>

              <button
                onClick={handleViewAllTrips}
                className="w-full flex items-center justify-between px-3 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    View all trips
                  </span>
                </div>
              </button>

              <button
                onClick={handleUpdateProfile}
                className="w-full flex items-center justify-between px-3 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <User className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Update profile
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
