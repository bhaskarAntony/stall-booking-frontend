import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  Route,
  TrendingUp,
  MapPin,
  Clock,
  Download,
  Calendar
} from 'lucide-react';
import HRLayout from '../../components/layouts/HRLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { dashboardAPI } from '../../services/api';

const HRDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getHRDashboard();
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <HRLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </HRLayout>
    );
  }

  const {
    totalCounts,
    tripStats,
    liveStats,
    activeTrips,
    upcomingTrips,
    monthlyKilometers,
    employeeAttendance
  } = dashboardData;

  return (
    <HRLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-4 pb-20 space-y-5">
          {/* Header */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-sky-500 text-white px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold">
                  HR transport overview
                </h1>
                <p className="text-xs sm:text-[13px] text-emerald-50/90">
                  Monitor daily trips, vehicles and employees in real time
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <div className="px-2 py-1 rounded-2xl bg-white/10 backdrop-blur">
                  Today: {tripStats.today} trips
                </div>
                <div className="px-2 py-1 rounded-2xl bg-white/10 backdrop-blur">
                  Active: {liveStats.activeTripsCount}
                </div>
              </div>
            </div>
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                  Employees
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {totalCounts.employees}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                  Drivers
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {totalCounts.drivers}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                  Vehicles
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {totalCounts.vehicles}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center">
                <Car className="w-5 h-5 text-sky-600" />
              </div>
            </div>
          </div>

          {/* Trip stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-500">Today&apos;s trips</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {tripStats.today}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-sky-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-500">Weekly trips</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {tripStats.weekly}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-500">Active trips</p>
                  <p className="text-xl font-semibold text-amber-600">
                    {liveStats.activeTripsCount}
                  </p>
                </div>
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-500">Monthly km</p>
                  <p className="text-xl font-semibold text-emerald-600">
                    {monthlyKilometers.toFixed(0)}
                  </p>
                </div>
                <Route className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Active / Upcoming trips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Active trips */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Active trips
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Trips currently on the road
                  </p>
                </div>
                <span className="px-2 py-1 rounded-2xl bg-emerald-50 text-[11px] font-medium text-emerald-700">
                  {activeTrips.length} live
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeTrips.length > 0 ? (
                  activeTrips.map((trip) => (
                    <div
                      key={trip._id}
                      className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">
                          {trip.tripName}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {trip.routeName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Driver:{' '}
                          {trip.assignedDriver?.driverId ||
                            trip.assignedDriver?.user?.name}
                          {' · '}
                          Vehicle: {trip.assignedVehicle?.vehicleNumber}
                        </p>
                      </div>
                      <span className="inline-flex px-2 py-1 rounded-full bg-emerald-100 text-[11px] font-medium text-emerald-700">
                        Live
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No active trips
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming trips */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Upcoming trips
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Scheduled for later today or this week
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {upcomingTrips.length > 0 ? (
                  upcomingTrips.map((trip) => (
                    <div
                      key={trip._id}
                      className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {trip.tripName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {trip.schedule?.startTime} – {trip.schedule?.endTime}
                        </p>
                      </div>
                      <span className="inline-flex px-2 py-1 rounded-full bg-sky-100 text-[11px] font-medium text-sky-700">
                        Scheduled
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No upcoming trips
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Attendance & quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Employee attendance */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Employee attendance (this month)
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {employeeAttendance && employeeAttendance.length > 0 ? (
                  employeeAttendance.slice(0, 5).map((att) => (
                    <div
                      key={att._id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {att.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          ID: {att.employeeId}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">
                        {att.tripsCompleted} trips
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No attendance data yet
                  </p>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Quick actions
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2.5 hover:bg-sky-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-sky-600" />
                    <span className="text-sm font-medium text-slate-900">
                      Create new trip
                    </span>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 hover:bg-emerald-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-900">
                      Open live tracking
                    </span>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between rounded-xl bg-violet-50 px-3 py-2.5 hover:bg-violet-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-medium text-slate-900">
                      Export reports
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Live status strip */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Live status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                <span className="text-xs text-emerald-700">
                  Drivers online
                </span>
                <span className="text-sm font-semibold text-emerald-700">
                  {liveStats.driversOnline}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
                <span className="text-xs text-amber-700">
                  Active trips
                </span>
                <span className="text-sm font-semibold text-amber-700">
                  {liveStats.activeTripsCount}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2">
                <span className="text-xs text-sky-700">
                  Completed today
                </span>
                <span className="text-sm font-semibold text-sky-700">
                  {tripStats.completedToday}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRDashboard;
