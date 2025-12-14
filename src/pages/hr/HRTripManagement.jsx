import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Play,
  Square,
  MapPin,
  Users,
  Clock
} from 'lucide-react';
import HRLayout from '../../components/layouts/HRLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { tripAPI } from '../../services/api';
import toast from 'react-hot-toast';

const HRTripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tripTypeFilter, setTripTypeFilter] = useState('');

  useEffect(() => {
    fetchTrips();
  }, [searchTerm, statusFilter, tripTypeFilter]);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const params = {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        tripType: tripTypeFilter || undefined
      };
      const response = await tripAPI.getAll(params);
      setTrips(response.data.trips || []);
    } catch (error) {
      toast.error('Error fetching trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      await tripAPI.start(tripId, {});
      toast.success('Trip started successfully');
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error starting trip');
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await tripAPI.complete(tripId, {});
      toast.success('Trip completed successfully');
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error completing trip');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await tripAPI.delete(tripId);
      toast.success('Trip deleted successfully');
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting trip');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'bg-slate-50 text-slate-700',
      active: 'bg-emerald-50 text-emerald-700',
      completed: 'bg-sky-50 text-sky-700',
      cancelled: 'bg-rose-50 text-rose-700'
    };
    return (
      <span
        className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${
          statusClasses[status] || 'bg-slate-50 text-slate-700'
        }`}
      >
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const getTripTypeBadge = (type) => (
    <span
      className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${
        type === 'login'
          ? 'bg-sky-50 text-sky-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {type === 'login' ? 'Login trip' : 'Logout trip'}
    </span>
  );

  if (isLoading) {
    return (
      <HRLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-4 pb-20 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Trips
              </h1>
              <p className="text-xs text-slate-500">
                Monitor and control office transport trips
              </p>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-200 text-slate-500 text-sm font-semibold px-4 py-2 cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Create trip (admin only)
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All status</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={tripTypeFilter}
                onChange={(e) => setTripTypeFilter(e.target.value)}
                className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All types</option>
                <option value="login">Login trip</option>
                <option value="logout">Logout trip</option>
              </select>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 text-[11px] text-slate-500 px-2 py-1 rounded-2xl border border-dashed border-slate-200 hover:bg-slate-50"
            >
              <Filter className="w-3.5 h-3.5" />
              More filters (coming soon)
            </button>
          </div>

          {/* Trips cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {trips.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
                No trips found. Try adjusting your filters.
              </div>
            )}

            {trips.map((trip) => (
              <div
                key={trip._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 space-y-3">
                  {/* Top: name + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {trip.tripName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {trip.routeName || 'No route name'}
                      </p>
                      {getTripTypeBadge(trip.tripType)}
                    </div>
                    {getStatusBadge(trip.status)}
                  </div>

                  {/* Middle: counts & schedule */}
                  <div className="space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">
                        {trip.employees?.length || 0} employees
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {trip.schedule?.startTime} – {trip.schedule?.endTime}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Days:</span>{' '}
                      {trip.schedule?.days?.length
                        ? trip.schedule.days.join(', ')
                        : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Driver:</span>{' '}
                      {trip.assignedDriver?.driverId ||
                        trip.assignedDriver?.user?.name ||
                        'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Vehicle:</span>{' '}
                      {trip.assignedVehicle?.vehicleNumber || 'N/A'}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400">
                      Last status: {trip.status}
                    </p>
                    <div className="flex items-center gap-2">
                      {trip.status === 'scheduled' && (
                        <button
                          onClick={() => handleStartTrip(trip._id)}
                          className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-50"
                          title="Start trip"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {trip.status === 'active' && (
                        <button
                          onClick={() => handleCompleteTrip(trip._id)}
                          className="p-1.5 rounded-full text-sky-600 hover:bg-sky-50"
                          title="Complete trip"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTrip(trip._id)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50"
                        title="Delete trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {trip.status === 'active' && (
                        <button
                          type="button"
                          className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-50"
                          title="Track live"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRTripManagement;
