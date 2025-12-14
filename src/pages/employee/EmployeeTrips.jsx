// src/pages/employee/EmployeeTrips.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, Car, User, Phone, Navigation,
  CheckCircle, AlertCircle
} from 'lucide-react';
import EmployeeLayout from '../../components/layouts/EmployeeLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { employeeAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const EmployeeTrips = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (user?.employeeId) fetchTrips();
  }, [statusFilter, user]);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const response = await employeeAPI.getTrips(user.employeeId, {
        status: statusFilter || undefined,
        limit: 100
      });

      const fetchedTrips = (response.data.trips || []).map(trip => {
        const myEntry = trip.employees.find(
          e => e.employee?._id?.toString() === user.employeeId
        );
        return {
          ...trip,
          myPickup: myEntry?.pickupLocation,
          myDrop: myEntry?.dropLocation
        };
      });

      setTrips(fetchedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Navigation className="w-6 h-6 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'cancelled': return <AlertCircle className="w-6 h-6 text-red-600" />;
      default: return <Calendar className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors[status] || colors.scheduled}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getTripTypeBadge = (type) => (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${type === 'login' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
      {type === 'login' ? 'To Office' : 'To Home'}
    </span>
  );

  const handleCallDriver = (phone) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="text-gray-600 mt-2">View and track your cab trips</p>
        </div>

        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Trips</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="grid gap-6">
          {trips.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900">No Trips Found</h3>
              <p className="text-gray-500 mt-2">You have no trips matching the selected filter.</p>
            </div>
          ) : (
            trips.map((trip) => (
              <div key={trip._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(trip.status)}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{trip.tripName}</h3>
                        <p className="text-gray-600">{trip.routeName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getTripTypeBadge(trip.tripType)}
                      {getStatusBadge(trip.status)}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <Clock className="w-5 h-5" />
                        <span>{trip.schedule.startTime} - {trip.schedule.endTime}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Calendar className="w-5 h-5" />
                        <span>{trip.schedule.days.join(', ')}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {trip.tripType === 'login' ? 'Pickup:' : 'Drop:'}
                          </p>
                          <p className="text-sm">
                            {trip.tripType === 'login' 
                              ? trip.myPickup?.address || 'Your Home'
                              : trip.myDrop?.address || 'Your Home'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <User className="w-5 h-5" />
                        <span>{trip.assignedDriver?.user?.name || 'Driver not assigned'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Car className="w-5 h-5" />
                        <span>{trip.assignedVehicle?.vehicleNumber || 'Vehicle not assigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setSelectedTrip(trip);
                        setShowDetailsModal(true);
                      }}
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      View Details
                    </button>

                    {trip.status === 'active' && (
                      <button
                        onClick={() => navigate(`/employee/track/${trip._id}`)}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Track Live
                      </button>
                    )}

                    {trip.assignedDriver?.user?.phone && (
                      <button
                        onClick={() => handleCallDriver(trip.assignedDriver.user.phone)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Call Driver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Trip Details Modal */}
        {showDetailsModal && selectedTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Trip Details</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600">Trip Name</p>
                  <p className="text-xl font-semibold">{selectedTrip.tripName}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{selectedTrip.tripType === 'login' ? 'To Office' : 'To Home'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div>{getStatusBadge(selectedTrip.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Schedule</p>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {selectedTrip.schedule.startTime} - {selectedTrip.schedule.endTime}</p>
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {selectedTrip.schedule.days.join(', ')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Route</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Pickup</p>
                        <p>{selectedTrip.tripType === 'login' ? selectedTrip.myPickup?.address : 'Office'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Drop</p>
                        <p>{selectedTrip.tripType === 'login' ? 'Office' : selectedTrip.myDrop?.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Driver & Vehicle</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{selectedTrip.assignedDriver?.user?.name || 'Not Assigned'}</p>
                        <p className="text-sm text-gray-600">Phone: {selectedTrip.assignedDriver?.user?.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{selectedTrip.assignedVehicle?.vehicleNumber || 'Not Assigned'}</p>
                        <p className="text-sm text-gray-600">{selectedTrip.assignedVehicle?.brand} {selectedTrip.assignedVehicle?.model}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeTrips;