// src/pages/employee/EmployeeTrips.jsx - CLEAN APP-STYLE UI
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, Car, User, Phone, Navigation,
  CheckCircle, AlertCircle, X, ChevronDown
} from 'lucide-react';
import EmployeeLayout from '../../components/layouts/EmployeeLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { employeeAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const EmployeeTrips = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const employeeId = user._id;

  useEffect(() => {
    if (authLoading) return;
    if (!employeeId) {
      setIsLoading(false);
      return;
    }
    fetchTrips();
  }, [employeeId, authLoading]);

  const fetchTrips = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    try {
      const response = await employeeAPI.getTrips(employeeId, { limit: 100 });
      const fetchedTrips = (response.data.trips || []).map(trip => {
        const myEntry = trip.employees.find(
          e => e.employee?._id?.toString() === employeeId.toString()
        );
        return {
          ...trip,
          myStatus: myEntry?.status || 'not_started',
          myPickup: myEntry?.pickupLocation,
          myDrop: myEntry?.dropLocation || trip.officeLocation
        };
      });
      setTrips(fetchedTrips);
      applyDayFilter(fetchedTrips, dayFilter);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load your trips');
      setTrips([]);
      setFilteredTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyDayFilter = (tripsList, day) => {
    if (day === 'all') {
      setFilteredTrips(tripsList);
      return;
    }
    const filtered = tripsList.filter(trip =>
      trip.schedule?.days?.includes(day)
    );
    setFilteredTrips(filtered);
  };

  useEffect(() => {
    if (trips.length > 0) {
      applyDayFilter(trips, dayFilter);
    }
  }, [dayFilter, trips]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Navigation className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Calendar className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: 'bg-slate-100 text-slate-800 border-slate-200',
      active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${colors[status] || colors.scheduled}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getTripTypeBadge = (type) => (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${type === 'login' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
      {type === 'login' ? 'To Office' : 'To Home'}
    </span>
  );

  const handleCallDriver = (phone) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const formatDays = (days) => {
    const dayNames = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
    return days?.map(d => dayNames[d] || d).join(', ') || '—';
  };

  const dayOptions = [
    { value: 'all', label: 'All Days' },
    { value: 'mon', label: 'Monday' },
    { value: 'tue', label: 'Tuesday' },
    { value: 'wed', label: 'Wednesday' },
    { value: 'thu', label: 'Thursday' },
    { value: 'fri', label: 'Friday' },
    { value: 'sat', label: 'Saturday' },
    { value: 'sun', label: 'Sunday' }
  ];

  if (authLoading || isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </EmployeeLayout>
    );
  }

  if (!employeeId) {
    return (
      <EmployeeLayout>
        <div className="p-6 text-center">
          <p className="text-slate-600 text-base">Unable to load employee profile.</p>
          <p className="text-sm text-slate-500 mt-2">Please log in again or contact support.</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Trips</h1>
          <p className="text-sm text-slate-600 mt-1">View and track your scheduled cab rides</p>
        </div>

        {/* Day Filter */}
        <div className="mb-4 p-3 bg-white border border-slate-200 rounded-xl">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-xs font-medium text-slate-700">Filter by day:</label>
            <div className="flex-1 min-w-0">
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-white"
              >
                {dayOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-3">
          {filteredTrips.length === 0 ? (
            <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 mb-1">No Trips Found</h3>
              <p className="text-sm text-slate-600">
                {dayFilter === 'all' 
                  ? 'You have no trips assigned yet.' 
                  : `No trips scheduled for ${dayOptions.find(d => d.value === dayFilter)?.label || 'selected day'}.`
                }
              </p>
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <div key={trip._id} className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(trip.status)}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 leading-tight">{trip.tripName}</h3>
                        <p className="text-xs text-slate-600">{trip.routeName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getTripTypeBadge(trip.tripType)}
                      {getStatusBadge(trip.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{trip.schedule.startTime} - {trip.schedule.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="truncate">{formatDays(trip.schedule.days)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-emerald-600" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-xs">Pickup</p>
                          <p className="text-xs text-slate-600 truncate">{trip.myPickup?.address || 'Home'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-red-600" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-xs">Drop</p>
                          <p className="text-xs text-slate-600 truncate">{trip.myDrop?.address || 'Office'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <User className="w-3.5 h-3.5" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{trip.assignedDriver?.user?.name || 'Driver'}</p>
                          <p className="text-xs text-slate-500 truncate">{trip.assignedDriver?.user?.phone || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <Car className="w-3.5 h-3.5" />
                        <span className="font-medium truncate">{trip.assignedVehicle?.vehicleNumber || 'Vehicle'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedTrip(trip);
                        setShowDetailsModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg border border-slate-900 hover:bg-slate-800 flex items-center gap-1 transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      Details
                    </button>

                    {trip.status === 'active' && (
                      <button
                        onClick={() => navigate(`/employee/track/${trip._id}`)}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg border border-emerald-600 hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        Track
                      </button>
                    )}

                    {trip.assignedDriver?.user?.phone && (
                      <button
                        onClick={() => handleCallDriver(trip.assignedDriver.user.phone)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg border border-blue-600 hover:bg-blue-700 flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tiny Modal */}
        {showDetailsModal && selectedTrip && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm max-h-[85vh] overflow-hidden border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Trip Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              
              <div className="p-4 space-y-4 max-h-[calc(85vh-80px)] overflow-y-auto">
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider">Trip</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedTrip.tripName}</p>
                  <p className="text-xs text-slate-600">{selectedTrip.routeName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-600">Type</p>
                    <p className="text-xs font-medium">{selectedTrip.tripType === 'login' ? 'To Office' : 'To Home'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Status</p>
                    <div>{getStatusBadge(selectedTrip.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Schedule</p>
                  <div className="space-y-1 text-xs">
                    <p className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-3 h-3" />
                      {selectedTrip.schedule.startTime} - {selectedTrip.schedule.endTime}
                    </p>
                    <p className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-3 h-3" />
                      {formatDays(selectedTrip.schedule.days)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Route</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-slate-900">Pickup</p>
                        <p className="text-xs text-slate-700 truncate">{selectedTrip.myPickup?.address || 'Home'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-red-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-slate-900">Drop</p>
                        <p className="text-xs text-slate-700 truncate">{selectedTrip.myDrop?.address || 'Office'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Driver & Vehicle</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{selectedTrip.assignedDriver?.user?.name || 'Driver'}</p>
                        <p className="text-slate-600 truncate">{selectedTrip.assignedDriver?.user?.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{selectedTrip.assignedVehicle?.vehicleNumber || 'Vehicle'}</p>
                        <p className="text-slate-600">{selectedTrip.assignedVehicle?.brand} {selectedTrip.assignedVehicle?.model}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTrip.status === 'active' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      navigate(`/employee/track/${selectedTrip._id}`);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm border border-emerald-600 transition-colors mt-2"
                  >
                    Track Live
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeTrips;
