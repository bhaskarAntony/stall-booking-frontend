// src/components/LiveTrackingMap.jsx - CONTINUOUS BEATING CIRCLE ANIMATION
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, Polyline, Circle, InfoWindow } from '@react-google-maps/api';
import { Navigation, ArrowLeft, MapPin, Activity, Car, Phone, Users } from 'lucide-react';

const LiveTrackingMap = ({ trip, currentLocation, locationHistory = [], onClose }) => {
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 12.9716, lng: 77.5946 });
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [tracePath, setTracePath] = useState([]);
  const [stats, setStats] = useState({
    eta: '--', distance: '--', speed: 0, accuracy: 25, direction: 'N',
    lastUpdate: '--', totalDistance: 0
  });
  const [addresses, setAddresses] = useState({ 
    current: 'Resolving location...', 
    pickup: 'Resolving...', 
    drop: 'Resolving...', 
    office: 'Resolving...' 
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [showCurrentInfo, setShowCurrentInfo] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const rafRef = useRef(null);

  // RESPONSIVE SCREEN DETECTION
  useEffect(() => {
    const updateSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // CONTINUOUS BEATING CIRCLE ANIMATION - REPEATS FOREVER
  useEffect(() => {
    if (pulseAnimation) {
      let startTime = performance.now();
      
      const animatePulse = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = (elapsed / 2000) % 1; // 2s cycle, loops forever
        
        // Smooth beating: 0→1→0.4→0 (heartbeat effect)
        const phase = progress < 0.6 
          ? progress * 1.67  // Grow phase
          : 1 - (progress - 0.6) * 2.5; // Shrink phase
        
        setPulsePhase(phase);
        rafRef.current = requestAnimationFrame(animatePulse);
      };
      
      rafRef.current = requestAnimationFrame(animatePulse);
      
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    } else {
      setPulsePhase(0);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [pulseAnimation]);

  // GEOCODE FUNCTION
  const geocode = useCallback(async (lat, lng, key) => {
    const cacheKey = `addr_${lat.toFixed(6)}_${lng.toFixed(6)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached && cached.length > 20 && !cached.includes('+')) {
      setAddresses((prev) => ({ ...prev, [key]: cached }));
      return cached;
    }

    const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    setAddresses((prev) => ({ ...prev, [key]: coords }));

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode(
          { location: { lat, lng }, region: 'IN', language: 'en' },
          (results, status) => status === 'OK' ? resolve(results) : reject(status)
        );
      });

      const bestAddress = response
        ?.map(r => r.formatted_address)
        ?.filter(a => a && !a.includes('+'))
        ?.sort((a, b) => b.length - a.length)[0] || coords;

      setAddresses((prev) => ({ ...prev, [key]: bestAddress }));
      sessionStorage.setItem(cacheKey, bestAddress);

      if (key === 'current') {
        setToastMessage(bestAddress);
        setTimeout(() => setToastMessage(null), 3500);
      }

      return bestAddress;
    } catch (err) {
      console.warn('Geocode failed:', err);
      return coords;
    }
  }, []);

  // MAIN LIVE UPDATE EFFECT
  useEffect(() => {
    if (currentLocation?.location?.coordinates) {
      const coords = currentLocation.location.coordinates;
      setCenter(coords);
      setPulseAnimation(true); // Enable continuous animation
      setShowCurrentInfo(true);
      
      // Update trace path
      const newPath = [{ lat: coords.lat, lng: coords.lng }];
      if (tracePath.length > 0) {
        newPath.push(...tracePath.slice(0, 48));
      }
      setTracePath(newPath);

      geocode(coords.lat, coords.lng, 'current');

      const speed = Math.round(currentLocation.speed || 0);
      const accuracy = Math.round(currentLocation.location?.accuracy || 25);
      const bearing = currentLocation.location?.bearing || 0;
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const direction = directions[Math.max(0, Math.min(7, Math.round(bearing / 45)))];

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
      if (newPath.length > 1) {
        for (let i = 1; i < newPath.length; i++) {
          totalDist += getDistance(newPath[i-1].lat, newPath[i-1].lng, newPath[i].lat, newPath[i].lng);
        }
      }

      setStats({
        eta, distance, speed, accuracy, direction,
        lastUpdate: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
        totalDistance: (totalDist / 1000).toFixed(1)
      });

      if (map) {
        map.panTo(coords);
        map.setZoom(16);
      }
    }
  }, [currentLocation, trip, map, geocode, tracePath]);

  // STATIC LOCATIONS
  useEffect(() => {
    if (trip?.myEntry?.pickupLocation?.coordinates) {
      geocode(trip.myEntry.pickupLocation.coordinates.lat, trip.myEntry.pickupLocation.coordinates.lng, 'pickup');
    }
    if (trip?.myEntry?.dropLocation?.coordinates) {
      geocode(trip.myEntry.dropLocation.coordinates.lat, trip.myEntry.dropLocation.coordinates.lng, 'drop');
    }
    if (trip?.tripType === 'login' && trip?.officeLocation?.coordinates) {
      geocode(trip.officeLocation.coordinates.lat, trip.officeLocation.coordinates.lng, 'office');
    }
  }, [trip, geocode]);

  // CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180; 
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180; 
    const Δλ = (lng2-lng1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
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

  const getToastPosition = () => {
    if (screenSize.width < 640) {
      return {
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        transform: 'none'
      };
    }
    return {
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)'
    };
  };

  const toastPos = getToastPosition();

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-white">
      {/* RESPONSIVE MAP */}
      <div className={`relative ${screenSize.width < 640 ? 'h-[50vh]' : 'h-[55vh]'}`}>
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
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
              { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
            ]
          }}
        >
          {/* Trace Path */}
          {tracePath.length > 1 && (
            <Polyline 
              path={tracePath} 
              options={{ strokeColor: '#10B981', strokeOpacity: 0.8, strokeWeight: 5, geodesic: true }} 
            />
          )}

          {/* CURRENT LOCATION */}
          {currentLocation?.location?.coordinates && (
            <>
              <Marker
                position={currentLocation.location.coordinates}
                icon={{
                  url: 'https://maps.google.com/mapfiles/kml/shapes/truck_red.png',
                  scaledSize: new window.google.maps.Size(44, 44),
                  anchor: new window.google.maps.Point(22, 22)
                }}
                animation={pulseAnimation ? 1 : 2}
              />

              {/* GPS Accuracy Circle - Continuous Pulse */}
              <Circle
                center={currentLocation.location.coordinates}
                radius={stats.accuracy}
                options={{
                  strokeColor: '#10B981',
                  strokeOpacity: pulsePhase * 0.9,
                  strokeWeight: 3,
                  fillColor: '#10B981',
                  fillOpacity: pulsePhase * 0.25,
                  clickable: false
                }}
              />

              {/* CONTINUOUS BEATING PULSE CIRCLE - 2s INFINITE LOOP */}
              <Circle
                center={currentLocation.location.coordinates}
                radius={pulsePhase * 300} // 0-300m smooth expansion
                options={{
                  strokeColor: '#10B981',
                  strokeOpacity: Math.max(0.3, pulsePhase * 0.95),
                  strokeWeight: 2.5,
                  fillColor: '#10B981',
                  fillOpacity: Math.max(0, pulsePhase * 0.2),
                  clickable: false,
                  zIndex: 1000
                }}
              />

              {/* Speed Ring */}
              <Circle
                center={currentLocation.location.coordinates}
                radius={stats.speed * 2.5}
                options={{
                  strokeColor: stats.speed > 40 ? '#EF4444' : '#10B981',
                  strokeOpacity: 0.5,
                  strokeWeight: 2,
                  fillOpacity: 0,
                  clickable: false
                }}
              />

              {/* Info Window */}
              {showCurrentInfo && (
                <InfoWindow
                  position={currentLocation.location.coordinates}
                  onCloseClick={() => setShowCurrentInfo(false)}
                  options={{ 
                    pixelOffset: new window.google.maps.Size(0, -40),
                    zIndex: 999 
                  }}
                >
                  <div className="p-2 bg-white rounded-lg shadow-lg border min-w-[160px]">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="font-bold text-xs text-slate-900">LIVE</span>
                    </div>
                    <div className="text-xs text-slate-700 truncate">{addresses.current}</div>
                    <div className="text-xs text-slate-600 flex gap-1">
                      <span>{stats.speed}</span><span>km/h</span>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Other Markers */}
          {trip?.myEntry?.pickupLocation?.coordinates && (
            <Marker position={trip.myEntry.pickupLocation.coordinates} 
              icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(36, 36) }} />
          )}
          {trip?.tripType === 'login' && trip?.officeLocation?.coordinates && (
            <Marker position={trip.officeLocation.coordinates} 
              icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png', scaledSize: new window.google.maps.Size(36, 36) }} />
          )}
          {trip?.myEntry?.dropLocation?.coordinates && trip?.tripType !== 'login' && (
            <Marker position={trip.myEntry.dropLocation.coordinates} 
              icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new window.google.maps.Size(36, 36) }} />
          )}

          {/* Dashed Route Line */}
          {currentLocation?.location?.coordinates && 
           (trip?.myEntry?.pickupLocation?.coordinates || 
            (trip?.tripType === 'login' ? trip?.officeLocation?.coordinates : trip?.myEntry?.dropLocation?.coordinates)) && (
            <Polyline
              path={[currentLocation.location.coordinates, 
                    trip?.myEntry?.pickupLocation?.coordinates || 
                    (trip?.tripType === 'login' ? trip?.officeLocation?.coordinates : trip?.myEntry?.dropLocation?.coordinates)]}
              options={{
                strokeColor: '#F59E0B', strokeOpacity: 0.7, strokeWeight: 3,
                strokeDasharray: [8, 4], geodesic: true
              }}
            />
          )}
        </GoogleMap>

        {/* Pan Button */}
        <button 
          onClick={panToCurrent}
          className={`absolute top-2 left-2 z-[100] w-11 h-11 rounded-xl flex items-center justify-center border-2 bg-white/95 backdrop-blur-sm shadow-lg transition-all ${
            pulseAnimation 
              ? 'border-emerald-400 bg-emerald-50 animate-pulse' 
              : 'border-slate-200 hover:border-slate-300 hover:shadow-xl'
          }`}
        >
          <Navigation className="w-5 h-5 text-slate-700" />
        </button>

        {/* Toast */}
        {toastMessage && (
          <div 
            className="z-[200] bg-white/98 backdrop-blur-md px-3 py-1.5 rounded-full shadow-2xl border border-emerald-200 text-xs flex items-center gap-1.5 text-emerald-800 font-medium leading-tight animate-pulse"
            style={{
              position: 'absolute',
              ...toastPos,
              maxWidth: screenSize.width < 640 ? 'calc(100% - 2rem)' : '280px'
            }}
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Bottom Panel - Unchanged */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 border-t border-slate-200">
        {/* All bottom panel content same as before */}
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">Driver Location</h3>
          </div>
          <div className={`text-[13px] font-medium text-slate-800 mb-2 max-h-12 overflow-y-auto leading-tight transition-opacity duration-500 ${
            addresses.current.includes('Resolving') ? 'animate-pulse opacity-70' : 'opacity-100'
          }`}>
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
              <p className="font-semibold text-sm text-slate-900 mb-1 truncate">{trip?.assignedDriver?.driverId || 'Driver'}</p>
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
            <Activity className="w-4 h-4 text-emerald-500" />Route Details
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
            <Phone className="w-4 h-4 text-red-500" />Emergency Contacts
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

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 z-[999] w-11 h-11 bg-white/95 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all backdrop-blur-sm shadow-lg hover:shadow-xl pointer-events-auto"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>
    </div>
  );
};

export default LiveTrackingMap;
