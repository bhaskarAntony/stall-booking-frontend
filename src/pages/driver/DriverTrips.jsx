// src/pages/driver/DriverTrips.jsx
import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  MapPin, 
  Clock, 
  Users, 
  Car,
  Navigation,
  CheckCircle,
  AlertCircle,
  Filter,
  X
} from 'lucide-react';
import DriverLayout from '../../components/layouts/DriverLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { driverAPI, tripAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const DriverTrips = () => {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const { updateTripStatus } = useSocket();

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const response = await driverAPI.getTrips({ status: statusFilter || undefined });
      setTrips(response.data.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Error fetching trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      await tripAPI.start(tripId, {});
      toast.success('Trip started');
      updateTripStatus(tripId, 'started');
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error starting trip');
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await tripAPI.complete(tripId, {});
      toast.success('Trip completed');
      updateTripStatus(tripId, 'completed');
      fetchTrips();
      setShowTripModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error completing trip');
    }
  };

  const handleEmployeePickup = async (tripId, employeeId) => {
    try {
      await tripAPI.updateEmployeeStatus(tripId, employeeId, { status: 'picked_up' });
      toast.success('Employee picked up');
      updateTripStatus(tripId, 'pickup', employeeId);
      fetchTrips();
    } catch (error) {
      toast.error('Error updating pickup status');
    }
  };

  const handleEmployeeDrop = async (tripId, employeeId) => {
    try {
      await tripAPI.updateEmployeeStatus(tripId, employeeId, { status: 'dropped' });
      toast.success('Employee dropped');
      updateTripStatus(tripId, 'drop', employeeId);
      fetchTrips();
    } catch (error) {
      toast.error('Error updating drop status');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'bg-gray-100 text-gray-800',
      active: 'bg-emerald-50 text-emerald-700',
      completed: 'bg-blue-50 text-blue-700',
      cancelled: 'bg-rose-50 text-rose-700'
    };
    return (
      <span className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${statusClasses[status] || 'bg-gray-50 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTripTypeBadge = (type) => (
    <span
      className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${
        type === 'login' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
      }`}
    >
      {type === 'login' ? 'Login' : 'Logout'}
    </span>
  );

  const getEmployeeStatusIcon = (status) => {
    switch (status) {
      case 'picked_up':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'dropped':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
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

  return (
    <DriverLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">My trips</h1>
              <p className="text-xs text-gray-500">View and manage today&apos;s trips</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">All</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Trips list */}
          <div className="space-y-3">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <div
                  key={trip._id}
                  className="bg-white rounded-3xl shadow-sm border px-4 py-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {trip.tripName}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {trip.routeName}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {getTripTypeBadge(trip.tripType)}
                      {getStatusBadge(trip.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {trip.schedule?.startTime} – {trip.schedule?.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{trip.employees?.length} employees</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5" />
                      <span>{trip.assignedVehicle?.vehicleNumber || '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{trip.schedule?.days?.join(', ')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {trip.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartTrip(trip._id)}
                        className="flex-1 rounded-2xl bg-emerald-600 text-white py-2 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
                      >
                        <Play className="w-4 h-4" />
                        Start trip
                      </button>
                    )}

                    {trip.status === 'active' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTrip(trip);
                            setShowTripModal(true);
                          }}
                          className="flex-1 rounded-2xl bg-blue-600 text-white py-2 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
                        >
                          <Navigation className="w-4 h-4" />
                          Manage trip
                        </button>
                        <button
                          onClick={() => handleCompleteTrip(trip._id)}
                          className="flex-1 rounded-2xl bg-orange-500 text-white py-2 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
                        >
                          <Square className="w-4 h-4" />
                          End trip
                        </button>
                      </>
                    )}

                    {trip.status === 'completed' && (
                      <div className="flex-1 rounded-2xl bg-gray-50 text-gray-600 py-2 text-sm font-medium flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl border px-4 py-8 text-center text-sm text-gray-500">
                <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                No trips found
              </div>
            )}
          </div>

          {/* Bottom-sheet style trip management */}
          {showTripModal && selectedTrip && (
            <div className="fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setShowTripModal(false)}
              />
              <div className="absolute inset-x-0 bottom-0">
                <div className="mx-auto max-w-md bg-white rounded-t-3xl shadow-2xl pb-4">
                  <div className="pt-2 flex justify-center">
                    <div className="w-10 h-1.5 rounded-full bg-gray-300" />
                  </div>
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedTrip.tripName}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {selectedTrip.routeName}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTripModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-4 pb-2">
                    <p className="text-[11px] text-gray-500 mb-1">
                      Employee status
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedTrip.employees?.map((emp) => (
                        <div
                          key={emp.employee?._id}
                          className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            {getEmployeeStatusIcon(emp.status)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {emp.employee?.user?.name || 'Employee'}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                ID: {emp.employee?.employeeId || '--'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            {emp.status === 'not_started' && (
                              <button
                                onClick={() =>
                                  handleEmployeePickup(
                                    selectedTrip._id,
                                    emp.employee._id
                                  )
                                }
                                className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-medium"
                              >
                                Pick up
                              </button>
                            )}
                            {emp.status === 'picked_up' && (
                              <button
                                onClick={() =>
                                  handleEmployeeDrop(
                                    selectedTrip._id,
                                    emp.employee._id
                                  )
                                }
                                className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-medium"
                              >
                                Drop off
                              </button>
                            )}
                            {emp.status === 'dropped' && (
                              <span className="text-[11px] text-emerald-700 font-medium">
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-4 flex gap-3 pt-3 border-t">
                    <button
                      onClick={() => setShowTripModal(false)}
                      className="flex-1 rounded-2xl bg-slate-100 text-slate-800 py-2.5 text-sm font-semibold"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleCompleteTrip(selectedTrip._id)}
                      className="flex-1 rounded-2xl bg-orange-600 text-white py-2.5 text-sm font-semibold"
                    >
                      Complete trip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
};

export default DriverTrips;
