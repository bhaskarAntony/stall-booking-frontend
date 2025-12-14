import React, { useState, useEffect } from 'react';
import { 
  Route, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Car,
  Star,
  Calendar,
  Navigation,
  Phone,
  MapPinned
} from 'lucide-react';
import DriverLayout from '../../components/layouts/DriverLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { dashboardAPI, driverAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DriverDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDriverDashboard();
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!dashboardData) return;
    const current = dashboardData.driverInfo.status;
    const next =
      current === 'available'
        ? 'offline'
        : current === 'offline'
        ? 'available'
        : 'available';

    try {
      await driverAPI.updateStatus({ status: next });
      setDashboardData(prev => ({
        ...prev,
        driverInfo: { ...prev.driverInfo, status: next }
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleContinueTrip = () => {
    if (dashboardData?.activeTrip?._id) {
      navigate(`/driver/map?tripId=${dashboardData.activeTrip._id}`);
    }
  };

  const handleOpenNavigation = () => {
    navigate('/driver/map');
  };

  if (isLoading) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </DriverLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-[80vh] text-gray-500">
          Unable to load dashboard.
        </div>
      </DriverLayout>
    );
  }

  const { driverInfo, tripStats, todayTrips, upcomingTrips, activeTrip } =
    dashboardData;

  const statusLabel =
    driverInfo.status === 'available'
      ? 'Available'
      : driverInfo.status === 'on_trip'
      ? 'On Trip'
      : 'Offline';

  const statusColor =
    driverInfo.status === 'available'
      ? 'bg-emerald-100 text-emerald-700'
      : driverInfo.status === 'on_trip'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-700';

  return (
    <DriverLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-24">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-2xl font-semibold">
                  {user?.name?.charAt(0) || 'D'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-orange-100">Driver dashboard</p>
                <h1 className="text-xl font-semibold leading-snug">
                  {user?.name}
                </h1>
                <p className="text-[11px] text-orange-100 mt-1">
                  ID: {driverInfo.driverId}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  <Star className="w-3.5 h-3.5 text-yellow-300" />
                  <span>
                    {driverInfo.rating.average.toFixed(1)} •{' '}
                    {driverInfo.rating.count} reviews
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${statusColor}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                  {statusLabel}
                </span>
                <button
                  onClick={handleToggleStatus}
                  className="mt-1 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium hover:bg-white/25 active:scale-[0.97] transition"
                >
                  {driverInfo.status === 'available' ? 'Go Offline' : 'Go Online'}
                </button>
              </div>
            </div>

            {/* Small stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white/10 rounded-2xl px-3 py-2 flex flex-col">
                <span className="text-orange-100">Today</span>
                <span className="text-sm font-semibold">
                  {tripStats.todayTripsCount}
                </span>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 flex flex-col">
                <span className="text-orange-100">This month</span>
                <span className="text-sm font-semibold">
                  {tripStats.completedThisMonth}
                </span>
              </div>
              <div className="bg-white/10 rounded-2xl px-3 py-2 flex flex-col">
                <span className="text-orange-100">Distance</span>
                <span className="text-sm font-semibold">
                  {tripStats.monthlyDistance.toFixed(0)} km
                </span>
              </div>
            </div>
          </div>

          {/* Active trip card */}
          {activeTrip && (
            <div className="bg-blue-50 rounded-3xl border border-blue-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <Car className="w-4 h-4 text-blue-600" />
                  </span>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">
                      Active trip
                    </p>
                    <p className="text-sm font-semibold text-blue-900">
                      {activeTrip.tripName}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-[11px] font-medium text-blue-800">
                  Live
                </span>
              </div>

              <p className="text-[11px] text-blue-700">
                {activeTrip.routeName}
              </p>

              <div className="mt-2 flex items-center justify-between text-[11px] text-blue-700">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {activeTrip.schedule?.startTime} –{' '}
                    {activeTrip.schedule?.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activeTrip.employees?.length} stops</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleContinueTrip}
                  className="flex-1 rounded-2xl bg-blue-600 text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
                >
                  <Navigation className="w-4 h-4" />
                  Continue trip
                </button>
                <button
                  onClick={handleOpenNavigation}
                  className="w-11 h-11 rounded-2xl bg-white text-blue-600 flex items-center justify-center border border-blue-100 active:scale-[0.98] transition"
                >
                  <MapPinned className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Stat cards */}
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
                  <p className="text-[11px] text-gray-500">Trips this month</p>
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
                <div className="w-9 h-9 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <Navigation className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Distance this month</p>
                  <p className="text-xl font-semibold text-gray-900 leading-tight">
                    {tripStats.monthlyDistance.toFixed(0)} km
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Today’s trips */}
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
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{trip.employees?.length} stops</span>
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
                            <span>{trip.employees?.length} stops</span>
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

          {/* Quick actions */}
          <div className="pb-4">
            <div className="bg-white rounded-3xl shadow-sm border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Quick actions
              </h3>
              <button
                onClick={handleOpenNavigation}
                className="w-full flex items-center justify-between px-3 py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <Navigation className="w-4.5 h-4.5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Open navigation
                  </span>
                </div>
              </button>

              <button className="w-full flex items-center justify-between px-3 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 active:scale-[0.99] transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Phone className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Call office
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
};

export default DriverDashboard;
