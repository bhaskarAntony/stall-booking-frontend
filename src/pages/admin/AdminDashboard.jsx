import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Car, 
  Route, 
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  PieChart
} from 'lucide-react';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { dashboardAPI } from '../../services/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getAdminDashboard();
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  const { 
    totalCounts, 
    tripStats, 
    liveStats, 
    recentTrips,
    tripStatusDistribution,
    monthlyTripTrend
  } = dashboardData;

  const totalTripsThisMonth = monthlyTripTrend?.[0]?.count || 0;

  return (
    <AdminLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-5 pb-20">
          {/* Header / summary */}
          <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-amber-400 rounded-3xl p-4 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-sky-100">Admin dashboard</p>
                <h1 className="text-xl font-semibold mt-1">
                  Today overview
                </h1>
                <p className="text-[11px] text-sky-100 mt-1">
                  {tripStats.today} trips today • {liveStats.activeTrips} active
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-right text-[11px]">
                <div className="bg-white/15 rounded-2xl px-3 py-2">
                  <p className="text-sky-100">Drivers</p>
                  <p className="text-sm font-semibold">
                    {totalCounts.drivers}
                  </p>
                </div>
                <div className="bg-white/15 rounded-2xl px-3 py-2">
                  <p className="text-sky-100">Vehicles</p>
                  <p className="text-sm font-semibold">
                    {totalCounts.vehicles}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Companies</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {totalCounts.companies}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-sky-50 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-sky-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Drivers</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {totalCounts.drivers}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Vehicles</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {totalCounts.vehicles}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Car className="w-4.5 h-4.5 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Employees</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {totalCounts.employees}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-violet-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Trips summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Today&apos;s trips</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {tripStats.today}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-sky-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Weekly trips</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {tripStats.weekly}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Active trips</p>
                  <p className="text-xl font-semibold text-amber-600">
                    {liveStats.activeTrips}
                  </p>
                </div>
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Completed today</p>
                  <p className="text-xl font-semibold text-emerald-600">
                    {tripStats.completedToday}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Middle row: live + distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Live status */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 lg:col-span-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Live status
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-emerald-50">
                  <span className="text-emerald-700">Drivers online</span>
                  <span className="font-semibold text-emerald-700">
                    {liveStats.driversOnline}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-50">
                  <span className="text-amber-700">Vehicles on road</span>
                  <span className="font-semibold text-amber-700">
                    {liveStats.vehiclesOnRoad}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-sky-50">
                  <span className="text-sky-700">Active trips</span>
                  <span className="font-semibold text-sky-700">
                    {liveStats.activeTrips}
                  </span>
                </div>
              </div>
            </div>

            {/* Trip status distribution */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Trip status distribution
                </h3>
                <PieChart className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {tripStatusDistribution?.map((item) => (
                  <div
                    key={item._id}
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-2xl bg-slate-50 flex items-center justify-between"
                  >
                    <span className="capitalize text-slate-600">
                      {item._id}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[11px] text-slate-500">
                This month total trips:{" "}
                <span className="font-semibold text-slate-900">
                  {totalTripsThisMonth}
                </span>
              </div>
            </div>
          </div>

          {/* Recent trips list */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Recent trips
              </h3>
              <span className="text-[11px] text-slate-500">
                {recentTrips?.length || 0} trips
              </span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {recentTrips?.map((trip) => (
                <div
                  key={trip._id}
                  className="px-3 py-2 rounded-2xl bg-slate-50 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {trip.tripName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {trip.company?.name} • {trip.schedule?.startTime}–{trip.schedule?.endTime}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {trip.tripType === 'login' ? 'Login' : 'Logout'} •{" "}
                      {trip.employees?.length || 0} employees
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                        trip.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : trip.status === 'completed'
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      {trip.status}
                    </span>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {trip.assignedVehicle?.vehicleNumber}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentTrips || recentTrips.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-4">
                  No recent trips
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
