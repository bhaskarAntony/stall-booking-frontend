// src/components/LiveTrackingMap.jsx - FIXED GEOCODING + REAL ADDRESSES
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, Polyline, Circle } from '@react-google-maps/api';
import { Navigation, ArrowLeft, MapPin, Activity, Car, Phone, Users } from 'lucide-react';

const LiveTrackingMap = ({ trip, currentLocation, locationHistory = [], onClose }) => {
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 12.9716, lng: 77.5946 });
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [tracePath, setTracePath] = useState([]);
  const [stats, setStats] = useState({
    eta: '--', distance: '--', speed: 0, accuracy: 25, direction: 'N',
    lastUpdate: '--', totalDistance: 0
  });

  const [addresses, setAddresses] = useState({ 
    current: 'Loading address...', 
    pickup: 'Loading address...', 
    drop: 'Loading address...', 
    office: 'Loading address...' 
  });
  
  const geocodeQueue = useRef([]);
  const isGeocoding = useRef(false);

  // 🗺️ FIXED GEOCODING - MULTIPLE CALLS SUPPORT
  const geocodeAddress = useCallback(async (lat, lng, key) => {
    // Skip if already has real address
    if (addresses[key] && !addresses[key].includes('Loading') && !addresses[key].match(/^\d+\.\d+,\s*\d+\.\d+$/)) {
      return;
    }

    // Add to queue
    geocodeQueue.current.push({ lat, lng, key });
    
    // Process queue
    if (!isGeocoding.current) {
      processGeocodeQueue();
    }
  }, [addresses]);

  const processGeocodeQueue = async () => {
    isGeocoding.current = true;
    
    while (geocodeQueue.current.length > 0) {
      const { lat, lng, key } = geocodeQueue.current.shift();
      
      // Show coordinates immediately as fallback
      const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddresses(prev => ({ ...prev, [key]: coords }));

      try {
        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          
          // Use Promise wrapper for callback-based geocoder
          const geocodePromise = new Promise((resolve) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              resolve({ results, status });
            });
          });

          const { results, status } = await geocodePromise;
          
          if (status === 'OK' && results?.[0]?.formatted_address) {
            const fullAddress = results[0].formatted_address;
            setAddresses(prev => ({ ...prev, [key]: fullAddress }));
            
            // Cache for future use
            sessionStorage.setItem(`addr_${lat.toFixed(6)}_${lng.toFixed(6)}`, fullAddress);
          }
        }
      } catch (error) {
        console.warn('Geocoding failed for', key, error);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    isGeocoding.current = false;
  };

  // ✅ MAIN EFFECT
  useEffect(() => {
    if (currentLocation?.location?.coordinates) {
      const coords = currentLocation.location.coordinates;
      
      setCenter(coords);
      setPulseAnimation(true);
      
      const pulseTimeout = setTimeout(() => setPulseAnimation(false), 1500);
      setTracePath(prev => [{ lat: coords.lat, lng: coords.lng }, ...prev.slice(0, 19)]);

      geocodeAddress(coords.lat, coords.lng, 'current');

      // Stats calculation
      const speed = Math.round(currentLocation.speed || 0);
      const accuracy = Math.round(currentLocation.location?.accuracy || 25);
      const bearing = currentLocation.location?.bearing || 0;
      
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const dirIndex = Math.max(0, Math.min(7, Math.round(bearing / 45)));
      const direction = directions[dirIndex];

      const nextStop = trip?.myEntry?.pickupLocation?.coordinates || 
                      (trip?.tripType === 'login' ? trip?.officeLocation?.coordinates : trip?.myEntry?.dropLocation?.coordinates);
      
      let distance = '--', eta = '--';
      if (nextStop) {
        const distKm = (getDistance(coords.lat, coords.lng, nextStop.lat, nextStop.lng) / 1000).toFixed(1);
        const etaMin = speed > 0 ? Math.max(1, Math.round((distKm * 60) / speed)) : 0;
        distance = `${distKm}km`;
        eta = etaMin <= 2 ? 'Soon' : `${etaMin}min`;
      }

      let totalDist = 0;
      if (tracePath.length > 1) {
        for (let i = 1; i < tracePath.length; i++) {
          totalDist += getDistance(tracePath[i-1].lat, tracePath[i-1].lng, tracePath[i].lat, tracePath[i].lng);
        }
      }

      setStats({
        eta, distance, speed, accuracy, direction,
        lastUpdate: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
        totalDistance: (totalDist / 1000).toFixed(1)
      });

      if (map) {
        map.panTo({ lat: coords.lat, lng: coords.lng });
        map.setZoom(16);
      }

      return () => {
        clearTimeout(pulseTimeout);
      };
    }
  }, [currentLocation, trip, map, tracePath, geocodeAddress]);

  // ✅ STATIC LOCATIONS - ON TRIP CHANGE
  useEffect(() => {
    if (trip?.myEntry?.pickupLocation?.coordinates) {
      // Check cache first
      const cacheKey = `addr_${trip.myEntry.pickupLocation.coordinates.lat.toFixed(6)}_${trip.myEntry.pickupLocation.coordinates.lng.toFixed(6)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAddresses(prev => ({ ...prev, pickup: cached }));
      } else {
        geocodeAddress(trip.myEntry.pickupLocation.coordinates.lat, trip.myEntry.pickupLocation.coordinates.lng, 'pickup');
      }
    }
    
    if (trip?.myEntry?.dropLocation?.coordinates) {
      const cacheKey = `addr_${trip.myEntry.dropLocation.coordinates.lat.toFixed(6)}_${trip.myEntry.dropLocation.coordinates.lng.toFixed(6)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAddresses(prev => ({ ...prev, drop: cached }));
      } else {
        geocodeAddress(trip.myEntry.dropLocation.coordinates.lat, trip.myEntry.dropLocation.coordinates.lng, 'drop');
      }
    }
    
    if (trip?.tripType === 'login' && trip?.officeLocation?.coordinates) {
      const cacheKey = `addr_${trip.officeLocation.coordinates.lat.toFixed(6)}_${trip.officeLocation.coordinates.lng.toFixed(6)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAddresses(prev => ({ ...prev, office: cached }));
      } else {
        geocodeAddress(trip.officeLocation.coordinates.lat, trip.officeLocation.coordinates.lng, 'office');
      }
    }
  }, [trip, geocodeAddress]);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const panToCurrent = useCallback(() => {
    if (map && currentLocation?.location?.coordinates) {
      map.panTo(currentLocation.location.coordinates);
      map.setZoom(16);
    }
  }, [map, currentLocation]);

  const getNextStopAddress = () => {
    if (trip?.tripType === 'login') return addresses.office;
    if (trip?.myEntry?.pickupLocation?.coordinates) return addresses.pickup;
    if (trip?.myEntry?.dropLocation?.coordinates) return addresses.drop;
    return 'Destination';
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-white">
      {/* 🗺️ TOP HALF - SAME DESIGN */}
      <div className="h-[55vh] relative">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={16}
          onLoad={setMap}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
          }}
        >
          {tracePath.length > 1 && (
            <Polyline path={tracePath} options={{ strokeColor: '#10B981', strokeOpacity: 0.8, strokeWeight: 4, geodesic: true }} />
          )}

          {currentLocation?.location?.coordinates && (
            <>
              <Marker
                position={currentLocation.location.coordinates}
                icon={{
                  url: 'https://maps.google.com/mapfiles/kml/shapes/truck_red.png',
                  scaledSize: new window.google.maps.Size(42, 42),
                  anchor: new window.google.maps.Point(21, 21)
                }}
                animation={pulseAnimation ? 1 : 2}
                title={`Driver: ${addresses.current}`}
              />
              <Circle
                center={currentLocation.location.coordinates}
                radius={pulseAnimation ? 90 : stats.accuracy}
                options={{
                  strokeColor: pulseAnimation ? '#10B981' : '#D1D5DB',
                  strokeOpacity: pulseAnimation ? 1 : 0.6,
                  strokeWeight: 3,
                  fillColor: pulseAnimation ? '#10B981' : '#E5E7EB',
                  fillOpacity: pulseAnimation ? 0.25 : 0.1,
                  clickable: false
                }}
              />
            </>
          )}

          {trip?.myEntry?.pickupLocation?.coordinates && (
            <Marker 
              position={trip.myEntry.pickupLocation.coordinates} 
              icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(36, 36) }}
              title={`Pickup: ${addresses.pickup}`}
            />
          )}

          {trip?.tripType === 'login' && trip?.officeLocation?.coordinates ? (
            <Marker 
              position={trip.officeLocation.coordinates} 
              icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png', scaledSize: new window.google.maps.Size(36, 36) }}
              title={`Office: ${addresses.office}`}
            />
          ) : trip?.myEntry?.dropLocation?.coordinates ? (
            <Marker 
              position={trip.myEntry.dropLocation.coordinates} 
              icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new window.google.maps.Size(36, 36) }}
              title={`Dropoff: ${addresses.drop}`}
            />
          ) : null}
        </GoogleMap>

        <button
          onClick={panToCurrent}
          className={`absolute top-4 left-4 z-20 w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all bg-white ${
            pulseAnimation ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Navigation className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* 📊 BOTTOM - SAME PERFECT DESIGN */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 border-t border-slate-200">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">Driver Location</h3>
          </div>
          <div className="text-[13px] font-medium text-slate-800 mb-2 max-h-12 overflow-y-auto leading-tight">
            {addresses.current}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>GPS: {stats.accuracy}m • {stats.direction}</span>
            <span>{stats.lastUpdate}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="flex items-start gap-3 mb-1">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 mb-1 truncate">
                {trip?.assignedDriver?.driverId || 'Driver'}
              </p>
              <p className="text-[12px] text-slate-600">{trip?.assignedVehicle?.brand || ''} {trip?.assignedVehicle?.model || ''}</p>
              <p className="text-[12px] font-medium text-slate-800 mt-0.5">{trip?.assignedVehicle?.vehicleNumber || 'Vehicle'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-slate-900">{stats.speed}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Speed</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-slate-900">{stats.eta}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">ETA</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-sm font-bold text-slate-900">{stats.distance}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Distance</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-sm font-bold text-slate-900">{stats.totalDistance}km</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">Travelled</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-900 mb-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Route Details
          </div>
          
          {trip?.myEntry?.pickupLocation?.coordinates && (
            <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[12px] text-slate-900 mb-0.5">Pickup</div>
                <div className="text-[11px] text-slate-600 max-h-8 overflow-hidden leading-tight">{addresses.pickup}</div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[12px] text-emerald-800 mb-0.5">Next Stop ({stats.distance})</div>
              <div className="text-[11px] text-emerald-700 max-h-8 overflow-hidden leading-tight">{getNextStopAddress()}</div>
            </div>
          </div>

          {(trip?.myEntry?.dropLocation?.coordinates || (trip?.tripType === 'login' && trip?.officeLocation?.coordinates)) && (
            <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[12px] text-slate-900 mb-0.5">{trip?.tripType === 'login' ? 'Office' : 'Dropoff'}</div>
                <div className="text-[11px] text-slate-600 max-h-8 overflow-hidden leading-tight">
                  {trip?.tripType === 'login' ? addresses.office : addresses.drop}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
          <div>GPS Points: {locationHistory.length || 0}</div>
          <div>Last Update: {stats.lastUpdate}</div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-900">
            <Phone className="w-4 h-4 text-red-500" />
            Emergency Contacts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="h-12 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 bg-white hover:bg-slate-50 flex items-center justify-center gap-2 transition-all">
              <Phone className="w-4 h-4" />Call Driver
            </button>
            <button className="h-12 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 bg-white hover:bg-slate-50 flex items-center justify-center gap-2 transition-all">
              <Users className="w-4 h-4" />Call Support
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>
    </div>
  );
};

export default LiveTrackingMap;
