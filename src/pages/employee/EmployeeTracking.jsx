// src/pages/employee/EmployeeTracking.jsx - OLD CLEAN UI + FIXED ACCESS
import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Clock, Users, Car, Phone, AlertCircle, ArrowLeft, Navigation, User,
  Calendar, CheckCircle, ChevronRight
} from 'lucide-react';
import EmployeeLayout from '../../components/layouts/EmployeeLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { employeeAPI, tripAPI, locationAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LiveTrackingMap from '../../components/LiveTrackingMap';

const EmployeeTracking = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [viewMode, setViewMode] = useState('list');
  const [activeTrips, setActiveTrips] = useState([]);
  const [trip, setTrip] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [addresses, setAddresses] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapModal, setMapModal] = useState(false);

  const employeeId = user?._id;

  const geocodeAddress = useCallback((lat, lng, key) => {
    const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    setAddresses(prev => ({ ...prev, [key]: coords }));

    if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]?.formatted_address) {
          setAddresses(prev => ({ ...prev, [key]: results[0].formatted_address }));
        }
      });
    }
  }, []);

  // FIXED: Same logic as EmployeeTrips
  const fetchActiveTrips = async () => {
    if (!employeeId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await employeeAPI.getTrips(employeeId, { limit: 50 });
      
      const tripsWithMyEntry = (response.data.trips || []).map(trip => {
        const myEntry = trip.employees.find(e => 
          e.employee?._id?.toString() === employeeId.toString() ||
          e.employee?.user?.toString() === employeeId.toString()
        );
        
        return {
          ...trip,
          myEntry,
          myPickup: myEntry?.pickupLocation,
          myDrop: myEntry?.dropLocation || trip.officeLocation
        };
      });

      const activeTrips = tripsWithMyEntry.filter(trip => trip.status === 'active');
      setActiveTrips(activeTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setActiveTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTripData = async (id) => {
    try {
      setIsLoading(true);
      const tripRes = await tripAPI.getById(id);
      const foundTrip = tripRes.data.trip;

      if (!foundTrip) {
        toast.error('Trip not found');
        setViewMode('list');
        return;
      }

      const myEntry = foundTrip.employees.find(e => 
        e.employee?._id?.toString() === employeeId.toString() ||
        e.employee?.user?.toString() === employeeId.toString()
      );

      const enrichedTrip = {
        ...foundTrip,
        myEntry: myEntry || foundTrip.employees[0],
        myPickup: myEntry?.pickupLocation || foundTrip.employees[0]?.pickupLocation,
        myDrop: myEntry?.dropLocation || foundTrip.officeLocation
      };

      setTrip(enrichedTrip);
      setViewMode('tracking');

      // Geocode
      if (enrichedTrip.myPickup?.coordinates) {
        geocodeAddress(enrichedTrip.myPickup.coordinates.lat, enrichedTrip.myPickup.coordinates.lng, 'pickup');
      }
      if (enrichedTrip.myDrop?.coordinates) {
        geocodeAddress(enrichedTrip.myDrop.coordinates.lat, enrichedTrip.myDrop.coordinates.lng, 'drop');
      }
      if (foundTrip.officeLocation?.coordinates) {
        geocodeAddress(foundTrip.officeLocation.coordinates.lat, foundTrip.officeLocation.coordinates.lng, 'office');
      }

      // Current location
      try {
        const currentRes = await locationAPI.getCurrent(id);
        if (currentRes.data.success && currentRes.data.location) {
          setCurrentLocation(currentRes.data.location);
          setLastUpdate(new Date(currentRes.data.location.timestamp));
          const coords = currentRes.data.location.location.coordinates;
          geocodeAddress(coords.lat, coords.lng, 'current');
        }
      } catch (err) {
        console.log('No current location');
      }
    } catch (err) {
      toast.error('Failed to load trip');
      setViewMode('list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!employeeId) {
      setIsLoading(false);
      return;
    }

    if (tripId) {
      loadTripData(tripId);
    } else {
      fetchActiveTrips();
    }
  }, [tripId, employeeId]);

  useEffect(() => {
    if (!socket || !tripId || viewMode !== 'tracking') return;

    const handleLocationUpdate = (data) => {
      setCurrentLocation({
        location: { coordinates: data.location },
        speed: data.speed || 0,
        timestamp: data.timestamp
      });
      setLastUpdate(new Date());
      geocodeAddress(data.location.lat, data.location.lng, 'current');
    };

    socket.on(`location-update-${tripId}`, handleLocationUpdate);
    return () => socket.off(`location-update-${tripId}`, handleLocationUpdate);
  }, [socket, tripId, viewMode, geocodeAddress]);

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const getAddress = (key, coords) => addresses[key] || (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Loading...');

  const handleCallEmergency = () => {
    const phone = trip?.company?.contactDetails?.phone;
    if (phone) window.location.href = `tel:${phone.replace(/[^0-9]/g, '')}`;
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <LoadingSpinner size="lg" />
        </div>
      </EmployeeLayout>
    );
  }

  // LIST VIEW - OLD CLEAN UI
  if (viewMode === 'list' || !tripId) {
    return (
      <EmployeeLayout>
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Active Trips</h1>
            <p className="text-sm text-slate-600 mt-1">Tap to track live location</p>
          </div>

          {activeTrips.length === 0 ? (
            <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 mb-1">No Active Trips</h3>
              <p className="text-sm text-slate-600">
                No ongoing trips right now
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrips.map((trip) => (
                <div 
                  key={trip._id} 
                  onClick={() => navigate(`/employee/track/${trip._id}`)}
                  className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Navigation className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 leading-tight">{trip.tripName}</h3>
                        <p className="text-xs text-slate-600">{trip.routeName}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Pickup</p>
                      <p className="text-sm text-slate-900 font-medium truncate">{trip.myPickup?.address || 'Home'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        {trip.tripType === 'login' ? 'Office' : 'Dropoff'}
                      </p>
                      <p className="text-sm text-slate-900 font-medium truncate">
                        {trip.officeLocation?.address || trip.myDrop?.address || 'Office'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-700 pt-2 border-t border-slate-200">
                    <Car className="w-3.5 h-3.5" />
                    <span className="font-medium">{trip.assignedVehicle?.vehicleNumber || 'Vehicle'}</span>
                    <span className="text-slate-500 ml-1">•</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-full ml-auto">
                      LIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </EmployeeLayout>
    );
  }

  // TRACKING VIEW - OLD CLEAN UI
  return (
    <EmployeeLayout>
      <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
        {/* Top Bar - OLD STYLE */}
        <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-lg hover:bg-slate-100 w-10 h-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            
            <div className="flex-1 min-w-0 px-3">
              <p className="text-sm font-semibold text-slate-900 truncate">{trip?.tripName}</p>
              <p className="text-xs text-slate-600 truncate">{trip?.routeName}</p>
            </div>
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              currentLocation 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${currentLocation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {currentLocation ? 'LIVE' : 'WAIT'}
            </div>
          </div>
        </div>

        {/* OLD CLEAN CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-20">
          {/* KPIs - OLD STYLE */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{trip?.employees?.length || 0}</p>
              <p className="text-sm font-semibold text-slate-900">Passengers</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {trip?.employees?.filter(e => e.status === 'picked_up')?.length || 0}
              </p>
              <p className="text-sm font-semibold text-slate-900">Picked</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {trip?.employees?.filter(e => e.status === 'dropped')?.length || 0}
              </p>
              <p className="text-sm font-semibold text-slate-900">Dropped</p>
            </div>
          </div>

          {/* Current Location - OLD STYLE */}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Driver Location</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                currentLocation ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {currentLocation ? 'LIVE' : 'OFF'}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 mb-2 leading-tight max-h-10 overflow-hidden">
              {getAddress('current', currentLocation?.location?.coordinates)}
            </p>
            <div className="flex justify-between text-xs text-slate-600">
              <span>{currentLocation?.speed || 0} km/h</span>
              <span>{lastUpdate ? formatTime(lastUpdate) : '--:--'}</span>
            </div>
          </div>

          {/* Driver & Vehicle - OLD STYLE */}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Driver & Vehicle</p>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{trip?.assignedDriver?.driverId || 'Driver'}</p>
                <p className="text-xs text-slate-600">{trip?.assignedVehicle?.vehicleNumber || '—'}</p>
              </div>
            </div>
          </div>

          {/* Route Cards - OLD STYLE */}
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pickup</p>
              <p className="text-sm font-medium text-slate-900 leading-tight max-h-12 overflow-hidden mb-2">
                {getAddress('pickup', trip?.myEntry?.pickupLocation?.coordinates)}
              </p>
              <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${
                trip?.myEntry?.status === 'picked_up' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {trip?.myEntry?.status?.replace('_', ' ')?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                {trip?.tripType === 'login' ? 'Office' : 'Dropoff'}
              </p>
              <p className="text-sm font-medium text-slate-900 leading-tight max-h-16 overflow-hidden">
                {trip?.tripType === 'login' 
                  ? getAddress('office', trip?.officeLocation?.coordinates)
                  : getAddress('drop', trip?.myDrop?.coordinates)}
              </p>
            </div>
          </div>

          {/* Emergency - OLD STYLE */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Emergency</p>
            </div>
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-semibold text-slate-900 truncate">Company HR</p>
                <p className="text-xs text-slate-600 truncate">{trip?.company?.contactDetails?.phone || 'Not available'}</p>
              </div>
              <button
                onClick={handleCallEmergency}
                className="p-2 bg-rose-100 hover:bg-rose-200 rounded-lg border border-rose-200 text-rose-600 flex-shrink-0"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* OLD STYLE BOTTOM BUTTONS */}
        <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-50">
          <button 
            onClick={() => setMapModal(true)}
            disabled={!currentLocation}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
              currentLocation
                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button 
            onClick={handleCallEmergency}
            className="w-12 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl border-2 border-rose-600 shadow-md flex items-center justify-center transition-all"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>

        {/* OLD STYLE FULLSCREEN MAP */}
        {mapModal && currentLocation && (
          <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4">
            <div className="w-full h-[90vh] bg-white rounded-2xl overflow-hidden border border-slate-200 relative">
              <LiveTrackingMap
                trip={trip}
                currentLocation={currentLocation}
                locationHistory={locationHistory}
                onClose={() => setMapModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeTracking;
