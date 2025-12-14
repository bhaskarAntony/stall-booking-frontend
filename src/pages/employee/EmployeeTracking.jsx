// src/pages/employee/EmployeeTracking.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin, Navigation, Clock, Car, User, Phone, AlertCircle, ArrowLeft
} from 'lucide-react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import EmployeeLayout from '../../components/layouts/EmployeeLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSocket } from '../../context/SocketContext';
import { locationAPI, tripAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

const EmployeeTracking = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinTripRoom, leaveTripRoom } = useSocket();

  const [trip, setTrip] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [eta, setEta] = useState('--');
  const [distance, setDistance] = useState('--');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);

  // Load trip + initial location
  useEffect(() => {
    if (!tripId || !user?.employeeId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [tripRes, locRes] = await Promise.all([
          tripAPI.getById(tripId),
          locationAPI.getCurrent(tripId).catch(() => ({ data: { location: null } }))
        ]);

        const foundTrip = tripRes.data.trip || tripRes.data;
        if (!foundTrip) {
          toast.error('Trip not found');
          setTrip(null);
          return;
        }

        const myEntry = foundTrip.employees?.find(
          e => e.employee?._id?.toString() === user.employeeId
        );

        const enrichedTrip = {
          ...foundTrip,
          myPickup: myEntry?.pickupLocation,
          myDrop: myEntry?.dropLocation,
          officeLocation: foundTrip.officeLocation
        };

        setTrip(enrichedTrip);

        if (locRes.data.location) {
          setDriverLocation(locRes.data.location);
        }
      } catch (err) {
        toast.error('Failed to load tracking data');
        console.error(err);
        setTrip(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [tripId, user?.employeeId]);

  // Socket updates
  useEffect(() => {
    if (!socket || !tripId) return;

    const handleUpdate = (data) => {
      if (data.tripId === tripId) {
        setDriverLocation({
          location: { coordinates: data.location },
          timestamp: data.timestamp || new Date(),
          speed: data.speed || 0
        });
      }
    };

    socket.on(`location-update-${tripId}`, handleUpdate);
    joinTripRoom(tripId);

    return () => {
      socket.off(`location-update-${tripId}`, handleUpdate);
      leaveTripRoom(tripId);
    };
  }, [socket, tripId, joinTripRoom, leaveTripRoom]);

  // Markers
  const markers = useMemo(() => {
    if (!trip) return [];

    const marks = [];
    const isValidCoord = (coord) =>
      coord && typeof coord.lat === 'number' && typeof coord.lng === 'number';

    if (trip.myPickup?.coordinates && isValidCoord(trip.myPickup.coordinates)) {
      marks.push({
        position: trip.myPickup.coordinates,
        title: 'Your Pickup',
        type: 'pickup',
        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });
    }

    const dropCoord =
      trip.tripType === 'login'
        ? trip.officeLocation?.coordinates
        : trip.myDrop?.coordinates;
    if (dropCoord && isValidCoord(dropCoord)) {
      marks.push({
        position: dropCoord,
        title: trip.tripType === 'login' ? 'Office' : 'Your Drop',
        type: 'drop',
        icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
      });
    }

    if (
      driverLocation?.location?.coordinates &&
      isValidCoord(driverLocation.location.coordinates)
    ) {
      marks.push({
        position: driverLocation.location.coordinates,
        title: `${trip.assignedDriver?.user?.name || 'Driver'} (Live)`,
        type: 'driver',
        icon: {
          url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
          scaledSize: new window.google.maps.Size(50, 50)
        }
      });
    }

    return marks;
  }, [trip, driverLocation]);

  // ETA + distance
  useEffect(() => {
    if (!driverLocation?.location?.coordinates || !trip) return;

    const dest =
      trip.tripType === 'login'
        ? trip.officeLocation?.coordinates
        : trip.myDrop?.coordinates;

    if (!dest) return;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(dest.lat - driverLocation.location.coordinates.lat);
    const dLon = toRad(dest.lng - driverLocation.location.coordinates.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(driverLocation.location.coordinates.lat)) *
        Math.cos(toRad(dest.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    const avgSpeed = 30;
    const timeMin = Math.max(1, Math.round((distanceKm / avgSpeed) * 60));

    setDistance(`${distanceKm.toFixed(1)} km`);
    setEta(`${timeMin} min`);
  }, [driverLocation, trip]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    setMapLoading(false);
  }, []);

  const handleCallDriver = () => {
    if (trip?.assignedDriver?.user?.phone) {
      window.location.href = `tel:${trip.assignedDriver.user.phone}`;
    }
  };

  const handleRecenter = () => {
    const center =
      driverLocation?.location?.coordinates ||
      trip?.myPickup?.coordinates ||
      defaultCenter;
    if (map && center) {
      map.panTo(center);
      map.setZoom(15);
    }
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </EmployeeLayout>
    );
  }

  if (!trip) {
    return (
      <EmployeeLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] text-center">
          <MapPin className="w-20 h-20 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Trip</h2>
          <p className="text-gray-600">Check back when your trip starts.</p>
        </div>
      </EmployeeLayout>
    );
  }

  const mapCenter =
    driverLocation?.location?.coordinates ||
    trip.myPickup?.coordinates ||
    defaultCenter;

  const pickupLabel =
    trip.tripType === 'login' ? trip.myPickup?.address : 'Office';
  const dropLabel =
    trip.tripType === 'login' ? 'Office' : trip.myDrop?.address;

  return (
    <EmployeeLayout>
      <div className="h-[calc(100vh-64px)] w-full relative bg-black/5">
        {/* Map */}
        <div className="absolute inset-0">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={14}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false
            }}
          >
            {markers.map((m, i) => (
              <Marker
                key={i}
                position={m.position}
                icon={m.icon}
                onClick={() => setSelectedMarker(m)}
              />
            ))}

            {driverLocation?.location?.coordinates && (trip.myDrop || trip.officeLocation) && (
              <Polyline
                path={[
                  driverLocation.location.coordinates,
                  trip.tripType === 'login'
                    ? trip.officeLocation.coordinates
                    : trip.myDrop.coordinates
                ]}
                options={{
                  strokeColor: '#2563EB',
                  strokeOpacity: 0.8,
                  strokeWeight: 5
                }}
              />
            )}

            {selectedMarker && (
              <InfoWindow
                position={selectedMarker.position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <p className="font-semibold text-sm">{selectedMarker.title}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {/* Top bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium truncate">
              {trip.tripName || 'Your Trip'}
            </span>
          </button>

          <div className="px-3 py-2 rounded-full bg-white/90 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium">Live tracking</span>
          </div>
        </div>

        {/* Floating buttons */}
        <div className="absolute right-3 bottom-[120px] flex flex-col gap-3">
          <button
            onClick={handleRecenter}
            className="w-11 h-11 rounded-full bg-white shadow flex items-center justify-center"
          >
            <Navigation className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleCallDriver}
            className="w-11 h-11 rounded-full bg-white shadow flex items-center justify-center"
          >
            <Phone className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-11 h-11 rounded-full bg-red-600 shadow flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Bottom sheet */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-2 mb-2 rounded-t-3xl bg-white shadow-2xl pb-safe">
            <div className="pt-2 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-300" />
            </div>

            <div className="p-4 space-y-4">
              {/* Time + status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {trip.schedule?.startTime} - {trip.schedule?.endTime}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-base font-semibold">{eta}</p>
                  <p className="text-xs text-gray-500">{distance}</p>
                </div>
              </div>

              {/* Driver + car */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase text-gray-500">Driver</p>
                  <p className="text-sm font-semibold">
                    {trip.assignedDriver?.user?.name || 'Assigned driver'}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {trip.assignedDriver?.driverId || '--'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Car className="w-4 h-4" />
                  <span className="font-medium">
                    {trip.assignedVehicle?.vehicleNumber || '--'}
                  </span>
                </div>
              </div>

              {/* Route summary */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs uppercase text-gray-500">Pickup</p>
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {pickupLabel || '--'}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase text-gray-500">Drop-off</p>
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {dropLabel || '--'}
                  </p>
                </div>
              </div>

              {/* Last updated + speed */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Last update:{' '}
                  {driverLocation?.timestamp
                    ? new Date(driverLocation.timestamp).toLocaleTimeString()
                    : 'Waiting for driver...'}
                </span>
                <span>
                  Speed: {driverLocation?.speed || '--'} km/h
                </span>
              </div>

              {/* Primary actions */}
              <button
                onClick={handleCallDriver}
                className="w-full mt-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold"
              >
                <Phone className="w-4 h-4" />
                Call driver
              </button>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeTracking;
