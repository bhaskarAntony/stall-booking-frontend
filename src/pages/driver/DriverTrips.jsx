// src/pages/driver/DriverTrips.jsx - PERFECT CLEAN MOBILE UI
import React, { useState, useEffect } from 'react';
import {
  Play, Square, MapPin, Clock, Users, Car, Navigation, CheckCircle, 
  AlertCircle, X, Calendar
} from 'lucide-react';
import DriverLayout from '../../components/layouts/DriverLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { driverAPI, tripAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DriverTrips = () => {
  const [recurringTrips, setRecurringTrips] = useState([]);
  const [todaysScheduled, setTodaysScheduled] = useState([]);
  const [todaysActive, setTodaysActive] = useState([]);
  const [allCompletedTrips, setAllCompletedTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);

  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  const todayDayName = today.toLocaleString('en-us', { weekday: 'short' }).toLowerCase().slice(0, 3);

  useEffect(() => {
    fetchRecurringTrips();
  }, []);

  const fetchRecurringTrips = async () => {
    try {
      setIsLoading(true);
      const response = await driverAPI.getTrips();
      const trips = response.data.trips || [];

      setRecurringTrips(trips);

      const scheduled = [];
      const active = [];
      const completed = [];

      trips.forEach(trip => {
        const isScheduledToday = trip.schedule?.days?.includes(todayDayName);

        if (isScheduledToday) {
          const todayInstance = trip.tripInstances?.find(instance => {
            const instanceDate = new Date(instance.date).toISOString().split('T')[0];
            return instanceDate === todayDateString;
          });

          if (!todayInstance) {
            scheduled.push(trip);
          } else if (todayInstance.status === 'started' || trip.status === 'active') {
            active.push(trip);
          } else if (todayInstance.status === 'completed') {
            completed.push(trip);
          }
        }

        const hasCompletedInstance = trip.tripInstances?.some(
          instance => instance.status === 'completed'
        );
        if (hasCompletedInstance && !completed.includes(trip)) {
          completed.push(trip);
        }
      });

      setTodaysScheduled(scheduled);
      setTodaysActive(active);
      setAllCompletedTrips(completed);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      await tripAPI.start(tripId, {});
      toast.success('Trip started');
      fetchRecurringTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start trip');
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await tripAPI.complete(tripId, {});
      toast.success('Trip completed');
      fetchRecurringTrips();
      setShowTripModal(false);
    } catch (error) {
      toast.error('Failed to complete trip');
    }
  };

  const handleEmployeePickup = async (tripId, employeeId) => {
    try {
      await tripAPI.updateEmployeeStatus(tripId, employeeId, { status: 'picked_up' });
      toast.success('Picked up');
      fetchRecurringTrips();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleEmployeeDrop = async (tripId, employeeId) => {
    try {
      await tripAPI.updateEmployeeStatus(tripId, employeeId, { status: 'dropped' });
      toast.success('Dropped off');
      fetchRecurringTrips();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const getStatusBadge = (trip) => {
    const status = trip.status;
    const colors = {
      scheduled: 'bg-slate-100 text-slate-800 border-slate-200',
      active: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[status] || colors.scheduled}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTripTypeBadge = (type) => (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
      type === 'login' 
        ? 'bg-blue-100 text-blue-800 border-blue-200' 
        : 'bg-orange-100 text-orange-800 border-orange-200'
    }`}>
      {type === 'login' ? 'TO OFFICE' : 'TO HOME'}
    </span>
  );

  const getEmployeeStatusIcon = (status) => {
    switch (status) {
      case 'picked_up': return <CheckCircle className="w-3 h-3 text-emerald-600" />;
      case 'dropped': return <CheckCircle className="w-3 h-3 text-blue-600" />;
      default: return <AlertCircle className="w-3 h-3 text-slate-400" />;
    }
  };

  const formatDays = (days) => {
    const dayNames = { mon: 'M', tue: 'T', wed: 'W', thu: 'Th', fri: 'F', sat: 'S', sun: 'Su' };
    return days?.map(d => dayNames[d]).join(' ') || '—';
  };

  const getCurrentTrips = () => {
    switch (activeTab) {
      case 'active': return todaysActive;
      case 'scheduled': return todaysScheduled;
      case 'completed': return allCompletedTrips;
      default: return [];
    }
  };

  const currentTrips = getCurrentTrips();

  if (isLoading) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-[85vh] bg-slate-50">
          <LoadingSpinner size="lg" />
        </div>
      </DriverLayout>
    );
  }

  const totalToday = todaysScheduled.length + todaysActive.length;
  const totalCompleted = allCompletedTrips.length;

  return (
    <DriverLayout>
      <div className="bg-slate-50 min-h-screen p-4 space-y-4">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-slate-900">My Trips</h1>
            <Calendar className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-xs text-slate-600 mb-2">
            {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-3 h-3" />
            <span>{totalToday} today</span>
            <span className="text-slate-500">•</span>
            <span>{totalCompleted} done</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1">
          {[
            { key: 'scheduled', label: `Scheduled (${todaysScheduled.length})`, icon: Calendar },
            { key: 'active', label: `Active (${todaysActive.length})`, icon: Navigation },
            { key: 'completed', label: `Done (${totalCompleted})`, icon: CheckCircle }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === key
                  ? 'bg-orange-600 text-white border-2 border-orange-600' 
                  : 'text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Trips List */}
        <div className="space-y-3 flex-1">
          {currentTrips.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900 mb-1">
                {activeTab === 'scheduled' ? 'No trips today' :
                 activeTab === 'active' ? 'No active trips' :
                 'No completed trips'}
              </p>
              <p className="text-xs text-slate-600">Check back later</p>
            </div>
          ) : (
            currentTrips.map((trip) => (
              <div key={trip._id} className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Navigation className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-slate-900 leading-tight truncate">{trip.tripName}</h3>
                        <p className="text-xs text-slate-600">{trip.routeName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      {getTripTypeBadge(trip.tripType)}
                      {getStatusBadge(trip)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-slate-700">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{trip.schedule.startTime} - {trip.schedule.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>{trip.employees?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5" />
                      <span className="font-mono">{trip.assignedVehicle?.vehicleNumber || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDays(trip.schedule.days)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {activeTab === 'scheduled' && (
                      <button
                        onClick={() => handleStartTrip(trip._id)}
                        className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg border border-orange-600 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start
                      </button>
                    )}

                    {activeTab === 'active' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTrip(trip);
                            setShowTripModal(true);
                          }}
                          className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg border border-blue-600 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Manage
                        </button>
                        <button
                          onClick={() => handleCompleteTrip(trip._id)}
                          className="w-12 h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Square className="w-4 h-4 text-slate-700" />
                        </button>
                      </>
                    )}

                    {activeTab === 'completed' && (
                      <div className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 text-center flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Done
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tiny Clean Modal */}
        {showTripModal && selectedTrip && activeTab === 'active' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm max-h-[85vh] overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Manage Trip</h3>
                <button 
                  onClick={() => setShowTripModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                <h4 className="text-base font-semibold text-slate-900 mb-3">{selectedTrip.tripName}</h4>

                <div className="space-y-2">
                  {selectedTrip.employees?.map((emp) => (
                    <div key={emp._id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {getEmployeeStatusIcon(emp.status)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{emp.employee?.user?.name || 'Employee'}</p>
                          <p className="text-xs text-slate-600">ID: {emp.employee?.employeeId || '—'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {emp.status === 'not_started' && (
                          <button
                            onClick={() => handleEmployeePickup(selectedTrip._id, emp.employee?._id)}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg border border-orange-600 transition-colors whitespace-nowrap"
                          >
                            Pickup
                          </button>
                        )}
                        {emp.status === 'picked_up' && (
                          <button
                            onClick={() => handleEmployeeDrop(selectedTrip._id, emp.employee?._id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg border border-blue-600 transition-colors whitespace-nowrap"
                          >
                            Dropoff
                          </button>
                        )}
                        {emp.status === 'dropped' && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200">
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCompleteTrip(selectedTrip._id)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-sm font-medium border border-orange-600 transition-colors"
                >
                  Complete Trip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DriverLayout>
  );
};

export default DriverTrips;
