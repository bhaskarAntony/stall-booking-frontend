// src/pages/driver/DriverMap.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Navigation, MapPin, Clock, Phone, AlertCircle, Check, ArrowLeft
} from 'lucide-react';
import DriverLayout from '../../components/layouts/DriverLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useLocation } from '../../context/LocationContext';
import { useSocket } from '../../context/SocketContext';
import { tripAPI, locationAPI, driverAPI } from '../../services/api';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import toast from 'react-hot-toast';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const DriverMap = () => {
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [routeSteps, setRouteSteps] = useState([]);
  const [eta, setEta] = useState('--');
  const [distance, setDistance] = useState('--');
  const [nextStopInstructions, setNextStopInstructions] = useState('');

  const { currentLocation, isTracking, startTracking, stopTracking } = useLocation();
  const { socket, sendLocationUpdate } = useSocket();
  const mapRef = useRef(null);

  // Fetch active trip on mount
  useEffect(() => {
    fetchActiveTrip();
    if (!isTracking) startTracking();

    return () => {
      if (isTracking) stopTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActiveTrip = async () => {
    try {
      const res = await driverAPI.getTrips({ status: 'active', limit: 1 });
      const activeTrips = res.data.trips || [];
      if (activeTrips.length > 0) {
        const fetchedTrip = activeTrips[0];
        setTrip(fetchedTrip);
        generateRouteSteps(fetchedTrip);
      } else {
        setTrip(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your trip');
      setTrip(null);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRouteSteps = (tripData) => {
    const steps = [];

    if (tripData.tripType === 'login') {
      tripData.employees.forEach(emp => {
        steps.push({
          type: 'pickup',
          employee: emp.employee,
          location: emp.pickupLocation,
          status: emp.status,
          completed: emp.status === 'picked_up' || emp.status === 'dropped'
        });
      });
      steps.push({
        type: 'office_drop',
        location: tripData.officeLocation,
        completed: false
      });
    } else {
      steps.push({
        type: 'office_pickup',
        location: tripData.officeLocation,
        completed: false
      });
      tripData.employees.forEach(emp => {
        steps.push({
          type: 'drop',
          employee: emp.employee,
          location: emp.dropLocation,
          status: emp.status,
          completed: emp.status === 'dropped'
        });
      });
    }

    setRouteSteps(steps);
    const firstPending = steps.findIndex(s => !s.completed);
    setCurrentStepIndex(firstPending === -1 ? 0 : firstPending);
  };

  // Send live location when navigating
  useEffect(() => {
    if (currentLocation && trip && isNavigating) {
      const locationData = {
        tripId: trip._id,
        location: {
          coordinates: {
            lat: currentLocation.lat,
            lng: currentLocation.lng
          },
          speed: currentLocation.speed || 0,
          bearing: currentLocation.heading || 0,
          accuracy: currentLocation.accuracy || 0
        }
      };

      if (socket) {
        sendLocationUpdate(trip._id, locationData.location);
      }
      locationAPI.updateLocation(locationData).catch(() => {});
    }
  }, [currentLocation, trip, isNavigating, socket, sendLocationUpdate]);

  // Calculate route & ETA like mobile navigation
  const calculateRoute = useCallback(() => {
    if (!currentLocation || routeSteps.length === 0 || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    const nextStop = routeSteps[currentStepIndex];
    if (!nextStop?.location?.coordinates) return;

    const request = {
      origin: { lat: currentLocation.lat, lng: currentLocation.lng },
      destination: nextStop.location.coordinates,
      travelMode: window.google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        setDirectionsResponse(result);
        const leg = result.routes[0].legs[0];
        setDistance(leg.distance.text);
        setEta(leg.duration.text);
        setNextStopInstructions(leg.steps?.[0]?.instructions || '');

        if (mapRef.current) {
          mapRef.current.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
          mapRef.current.setZoom(16);
        }
      } else {
        toast.error('Unable to load route');
      }
    });
  }, [currentLocation, routeSteps, currentStepIndex]);

  useEffect(() => {
    if (!isNavigating) return;
    calculateRoute();
    const interval = setInterval(calculateRoute, 30000);
    return () => clearInterval(interval);
  }, [isNavigating, calculateRoute]);

  const startNavigation = () => {
    setIsNavigating(true);
    calculateRoute();
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setDirectionsResponse(null);
    setEta('--');
    setDistance('--');
    setNextStopInstructions('');
  };

  const markCurrentStepCompleted = async () => {
    if (!trip || currentStepIndex >= routeSteps.length) return;
    const currentStep = routeSteps[currentStepIndex];

    let newStatus = '';
    if (currentStep.type === 'pickup' || currentStep.type === 'office_pickup') {
      newStatus = 'picked_up';
    } else if (currentStep.type === 'drop' || currentStep.type === 'office_drop') {
      newStatus = 'dropped';
    }

    const employeeId = currentStep.employee?._id;

    try {
      if (employeeId) {
        await tripAPI.updateEmployeeStatus(trip._id, employeeId, { status: newStatus });
      }

      const updatedSteps = [...routeSteps];
      updatedSteps[currentStepIndex].completed = true;
      updatedSteps[currentStepIndex].status = newStatus;
      setRouteSteps(updatedSteps);

      toast.success('Step updated');

      if (currentStepIndex < routeSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        await tripAPI.complete(trip._id, { actualDistance: 0 });
        toast.success('Trip completed');
        setIsNavigating(false);
        fetchActiveTrip();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleRecenter = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
      mapRef.current.setZoom(16);
    }
  };

  const nextStep = routeSteps[currentStepIndex];
  const center = currentLocation || { lat: 13.0405451, lng: 77.5897363 };

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
      <div className="h-[calc(100vh-64px)] w-full relative bg-black/5">
        {/* Map Area */}
        <div className="absolute inset-0">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false
            }}
          >
            {directionsResponse && (
              <DirectionsRenderer
                directions={directionsResponse}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#2563EB',
                    strokeWeight: 6
                  }
                }}
              />
            )}

            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
                  scaledSize: new window.google.maps.Size(50, 50)
                }}
              />
            )}

            {routeSteps.map((step, idx) => (
              <Marker
                key={idx}
                position={step.location.coordinates}
                label={{
                  text: `${idx + 1}`,
                  color: '#ffffff',
                  fontWeight: 'bold'
                }}
                icon={{
                  url: step.completed
                    ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }}
              />
            ))}
          </GoogleMap>
        </div>

        {/* Top overlay: status bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium truncate">
              {trip ? trip.tripName : 'No Active Trip'}
            </span>
          </button>

          <div className="px-3 py-2 rounded-full bg-white/90 shadow-sm flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isTracking ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-medium">
              GPS {isTracking ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        {/* Floating action buttons */}
        <div className="absolute right-3 bottom-[120px] flex flex-col gap-3">
          <button
            onClick={handleRecenter}
            className="w-11 h-11 rounded-full bg-white shadow flex items-center justify-center"
          >
            <Navigation className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-11 h-11 rounded-full bg-white shadow flex items-center justify-center">
            <Phone className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-11 h-11 rounded-full bg-red-600 shadow flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Bottom sheet: navigation card */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-2 mb-2 rounded-t-3xl bg-white shadow-2xl pb-safe">
            <div className="pt-2 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-300" />
            </div>

            {trip && nextStep ? (
              <div className="p-4 space-y-4">
                {/* Trip meta row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {trip.schedule?.startTime} - {trip.schedule?.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{trip.tripType === 'login' ? 'To Office' : 'To Home'}</span>
                  </div>
                </div>

                {/* Next stop */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">
                      {currentStepIndex + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase text-gray-500">
                      Next stop
                    </p>
                    <p className="text-base font-semibold">
                      {nextStep.employee?.user?.name || 'Office'}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {nextStep.location?.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">ETA</p>
                    <p className="text-base font-semibold">{eta}</p>
                    <p className="text-xs text-gray-500">{distance}</p>
                  </div>
                </div>

                {/* Turn-by-turn text */}
                {nextStopInstructions && (
                  <div className="px-3 py-2 rounded-xl bg-blue-50 text-blue-800 text-xs font-medium">
                    <span dangerouslySetInnerHTML={{ __html: nextStopInstructions }} />
                  </div>
                )}

                {/* Primary controls */}
                <div className="flex gap-3">
                  {!isNavigating ? (
                    <button
                      onClick={startNavigation}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white text-sm font-semibold"
                    >
                      <Navigation className="w-4 h-4" />
                      Start navigation
                    </button>
                  ) : (
                    <button
                      onClick={stopNavigation}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-800 text-white text-sm font-semibold"
                    >
                      <Navigation className="w-4 h-4" />
                      Stop navigation
                    </button>
                  )}

                  <button
                    onClick={markCurrentStepCompleted}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold"
                  >
                    <Check className="w-4 h-4" />
                    Mark completed
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <Navigation className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-gray-800">No active trip</p>
                <p className="text-xs text-gray-500">
                  Waiting for your next assignment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DriverLayout>
  );
};

export default DriverMap;
