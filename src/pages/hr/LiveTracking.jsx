// src/pages/hr/LiveTracking.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Clock,
  Users,
  Car,
  Phone,
  AlertCircle,
  ArrowLeft,
  Navigation,
} from 'lucide-react';
import HRLayout from '../../components/layouts/HRLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { dashboardAPI, locationAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import LiveTrackingMap from '../../components/LiveTrackingMap';

const LiveTracking = () => {
  const [liveTrips, setLiveTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [locationHistory, setLocationHistory] = useState([]);
  const [addresses, setAddresses] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  const { socket, joinTripRoom, leaveTripRoom } = useSocket();

  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [mapModal, setMapModal] = useState(false);

const geocode = useCallback(
  async (lat, lng, key) => {
    // Check if we already have a good address
    if (addresses[key] && addresses[key].length > 20 && !addresses[key].includes('+')) {
      return addresses[key];
    }

    // Check cache first (sessionStorage)
    const cacheKey = `addr_${lat.toFixed(6)}_${lng.toFixed(6)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached && cached.length > 20 && !cached.includes('+')) {
      setAddresses((prev) => ({ ...prev, [key]: cached }));
      return cached;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode(
          {
            location: { lat, lng },
            region: 'IN',
            language: 'en',
            // Optional: prefer more detailed results
            // result_type: 'street_address|locality|route',
          },
          (results, status) => {
            if (status === 'OK') resolve(results);
            else reject(status);
          }
        );
      });

      let bestAddress = null;
      let maxDetailLevel = 0;

      for (const result of response) {
        const addr = result.formatted_address;
        const types = result.types || [];

        // Prioritize detailed addresses
        if (addr && !addr.includes('+')) {
          let detailScore = 0;
          if (types.includes('street_address') || types.includes('route')) detailScore += 3;
          if (types.includes('premise') || types.includes('establishment')) detailScore += 2;
          if (types.includes('locality') || types.includes('sublocality')) detailScore += 1;

          if (detailScore > maxDetailLevel || (detailScore === maxDetailLevel && addr.length > (bestAddress?.length || 0))) {
            maxDetailLevel = detailScore;
            bestAddress = addr;
          }
        }
      }

      if (bestAddress) {
        // Sometimes we can get even better by finding the longest valid address
        const longestAddr = response
          .map(r => r.formatted_address)
          .filter(a => a && !a.includes('+'))
          .sort((a, b) => b.length - a.length)[0];

        const finalAddr = longestAddr || bestAddress;

        setAddresses((prev) => ({ ...prev, [key]: finalAddr }));
        sessionStorage.setItem(cacheKey, finalAddr); // Cache it
        return finalAddr;
      }
    } catch (err) {
      console.warn('Geocode failed:', err);
    }

    // Fallback to coordinates
    const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    setAddresses((prev) => ({ ...prev, [key]: fallback }));
    sessionStorage.setItem(cacheKey, fallback);
    return fallback;
  },
  [addresses]
);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load live trips
  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardAPI.getLiveTrips();
        const trips = res.data.liveTrips || [];
        setLiveTrips(trips);
        setLastUpdate(new Date());

        trips.forEach((trip) => {
          if (trip.latestLocation) {
            const { lat, lng } = trip.latestLocation.location.coordinates;
            geocode(lat, lng, `trip-${trip._id}`);
          }
        });

        if (trips.length > 0 && !selectedTrip) setSelectedTrip(trips[0]);
      } catch {
        toast.error('Failed to load live trips');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket live updates
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      setLastUpdate(new Date());
      if (!selectedTrip || data.tripId !== selectedTrip._id) return;

      setLocationHistory((prev) => [data, ...prev].slice(0, 50));
      const { lat, lng } = data.location.coordinates;
      geocode(lat, lng, `current-${selectedTrip._id}`);
    };

    const handleTripStatusChange = async () => {
      try {
        const res = await dashboardAPI.getLiveTrips();
        setLiveTrips(res.data.liveTrips || []);
        setLastUpdate(new Date());
      } catch (e) {
        console.error('Failed to refresh trips', e);
      }
    };

    socket.on('location-update', handleLocationUpdate);
    socket.on('trip-status-changed', handleTripStatusChange);

    return () => {
      socket.off('location-update', handleLocationUpdate);
      socket.off('trip-status-changed', handleTripStatusChange);
    };
  }, [socket, selectedTrip, geocode]);

  // Trip change → history + address cache
  useEffect(() => {
    if (!selectedTrip) return;

    joinTripRoom(selectedTrip._id);

    const loadHistory = async () => {
      try {
        const res = await locationAPI.getHistory(selectedTrip._id, { limit: 50 });
        const locs = res.data.locations || [];
        setLocationHistory(locs);
        locs.forEach((loc, i) => {
          const { lat, lng } = loc.location.coordinates;
          geocode(lat, lng, `hist-${selectedTrip._id}-${i}`);
        });
      } catch (err) {
        console.error('Failed to load history', err);
      }
    };

    loadHistory();

    if (selectedTrip.latestLocation) {
      const { lat, lng } = selectedTrip.latestLocation.location.coordinates;
      geocode(lat, lng, `current-${selectedTrip._id}`);
    }

    return () => leaveTripRoom(selectedTrip._id);
  }, [selectedTrip, geocode, joinTripRoom, leaveTripRoom]);

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getAddress = (key, coords) =>
    addresses[key] ||
    (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Resolving...');

  const totalActive = liveTrips.length;
  const totalEmployees = liveTrips.reduce(
    (s, t) => s + (t.employees?.length || 0),
    0
  );

  const effectiveView = isMobile ? viewMode : 'detail';

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    if (isMobile) setViewMode('detail');
  };

  const getEmployeeStatusBadge = (emp) => {
    const status = emp.status;
    const cls = {
      not_started: 'bg-gray-100 text-gray-800',
      picked_up: 'bg-blue-100 text-blue-800',
      dropped: 'bg-green-100 text-green-800',
    }[status];
    return (
      <span
        className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${
          cls || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const nextEmployee =
    selectedTrip?.employees?.find((e) => e.status !== 'dropped') ||
    selectedTrip?.employees?.[0];

  // emergency phone helpers
  const getDriverPhone = () =>
    selectedTrip?.assignedDriver?.user?.phone ||
    selectedTrip?.company?.contactDetails?.phone ||
    null;

  const getEmployeePhone = (emp) =>
    emp.employee?.user?.phone || selectedTrip?.company?.contactDetails?.phone || null;

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
      <div className="h-[calc(100vh-64px)] relative bg-slate-50">
        {/* Top bar + KPIs - always visible */}
        <div className=" top-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 pt-3 pb-2">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {isMobile && effectiveView === 'detail' && (
                  <button
                    onClick={() => setViewMode('list')}
                    className="p-2 rounded-full bg-slate-100"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-700" />
                  </button>
                )}
               
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Live Trip Tracking
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Real-time view of cabs, employees & emergency contacts
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline text-[11px] text-slate-500">
                Last update:{' '}
                <span className="font-medium">
                  {lastUpdate ? formatTime(lastUpdate) : '--'}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-2.5">
                <p className="text-[11px] uppercase opacity-90">Active trips</p>
                <p className="text-xl font-semibold">{totalActive}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white px-3 py-2.5">
                <p className="text-[11px] uppercase opacity-90">Employees</p>
                <p className="text-xl font-semibold">{totalEmployees}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-2.5">
                <p className="text-[11px] uppercase opacity-90">Live vehicles</p>
                <p className="text-xl font-semibold">{totalActive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile list view */}
        {effectiveView === 'list' && (
          <div className="absolute top-[0px] inset-x-0 bottom-0 z-10 lg:hidden">
            <div className="h-full bg-white rounded-t-3xl shadow-2xl overflow-y-auto">
              <div className="p-4">
                <h2 className="font-semibold text-sm mb-3">
                  Active trips ({totalActive})
                </h2>
                {liveTrips.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-10">
                    No trips currently running.
                  </div>
                )}
                {liveTrips.map((trip) => {
                  const addr = getAddress(
                    `trip-${trip._id}`,
                    trip.latestLocation?.location?.coordinates
                  );
                  return (
                    <button
                      key={trip._id}
                      onClick={() => handleSelectTrip(trip)}
                      className="w-full mb-3 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-left hover:bg-slate-100 transition"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {trip.tripName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {trip.routeName}
                          </p>
                          <p className="mt-1 text-[11px] text-emerald-700 line-clamp-2">
                            {addr}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {trip.assignedVehicle?.vehicleNumber || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {trip.employees?.length || 0}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                          LIVE
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Desktop list panel */}
        {!isMobile && (
          <div className="absolute top-[104px] bottom-0 left-0 w-80 z-10">
            <div className="h-full bg-white border-r border-slate-200 shadow-sm flex flex-col">
              <div className="px-4 pt-3 pb-2 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-900">
                  Active trips ({totalActive})
                </p>
                <p className="text-[11px] text-slate-500">
                  Select a trip to view live details
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
                {liveTrips.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-10">
                    No trips currently running.
                  </div>
                )}
                {liveTrips.map((trip) => {
                  const addr = getAddress(
                    `trip-${trip._id}`,
                    trip.latestLocation?.location?.coordinates
                  );
                  const isActive = selectedTrip?._id === trip._id;
                  return (
                    <button
                      key={trip._id}
                      onClick={() => handleSelectTrip(trip)}
                      className={`w-full mb-2 rounded-xl px-3 py-2 text-left text-[11px] ${
                        isActive
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-semibold text-slate-900 line-clamp-1">
                        {trip.tripName}
                      </p>
                      <p className="text-slate-500 line-clamp-1">
                        {trip.routeName}
                      </p>
                      <p className="mt-1 text-emerald-700 line-clamp-2">
                        {addr}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-slate-500">
                        <span>
                          <Car className="w-3 h-3 inline mr-1" />
                          {trip.assignedVehicle?.vehicleNumber || 'N/A'}
                        </span>
                        <span>
                          <Users className="w-3 h-3 inline mr-1" />
                          {trip.employees?.length || 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Detail view */}
        <div
          className={`absolute top-[0px] bottom-0 ${
            isMobile ? 'inset-x-0' : 'left-80 right-0'
          } bg-slate-50`}
        >
          {!selectedTrip ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <Navigation className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Select a trip to view details
              </p>
              <p className="text-[11px] text-slate-500">
                Choose an active trip from the list to see live employee and cab
                information.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto h-full px-4 pt-4 pb-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button
                    onClick={() => setViewMode('list')}
                    className="p-2 rounded-full bg-slate-100"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-700" />
                  </button>
                )}
                {/* <button
                  onClick={() => setMapModal(true)}
                  disabled={!selectedTrip.latestLocation}
                  className={`p-2 px-4 rounded-full ${
                    selectedTrip.latestLocation
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Map
                </button> */}
              </div>

              {/* Trip header */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedTrip.tripName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedTrip.routeName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Company:{' '}
                      <span className="font-medium">
                        {selectedTrip.company?.name || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                    LIVE
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] mt-2">
                  <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700">
                    {selectedTrip.tripType === 'login'
                      ? 'Login trip'
                      : 'Logout trip'}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700">
                    Shift: {selectedTrip.schedule?.startTime} –{' '}
                    {selectedTrip.schedule?.endTime}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-violet-50 text-violet-700 flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    {selectedTrip.assignedVehicle?.vehicleNumber || 'N/A'}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedTrip.employees?.length || 0} employees
                  </span>
                </div>
              </div>

              {/* Security / SLA strip */}
              <div className="bg-slate-900 rounded-2xl text-white px-4 py-3 flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-300" />
                  <span className="font-semibold">Security & live tracking enabled</span>
                </div>
                <span className="opacity-80">
                  All emergency calls are logged with timestamp and trip ID for audit.
                </span>
              </div>

              {/* Current location + driver + emergency card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <p className="text-[11px] font-semibold text-slate-900 mb-1">
                    Current cab location
                  </p>
                <p className="text-sm font-medium text-slate-900">
  {addresses[`current-${selectedTrip._id}`] || 'Loading detailed address...'}
</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Speed:{' '}
                    {selectedTrip.latestLocation?.location?.speed || 0} km/h
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Last ping:{' '}
                    {selectedTrip.latestLocation
                      ? formatTime(selectedTrip.latestLocation.timestamp)
                      : '--'}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-900">
                        Driver & vehicle
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedTrip.assignedDriver?.user?.name ||
                          selectedTrip.assignedDriver?.driverId ||
                          'N/A'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Vehicle: {selectedTrip.assignedVehicle?.brand}{' '}
                        {selectedTrip.assignedVehicle?.model} ·{' '}
                        {selectedTrip.assignedVehicle?.vehicleNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!getDriverPhone()}
                      onClick={() => {
                        const phone = getDriverPhone();
                        if (phone) window.location.href = `tel:${phone}`;
                      }}
                      className={`p-2.5 rounded-full ${
                        getDriverPhone()
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-500">
                    <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5" />
                    <span>
                      Emergency driver call connects to the last known number from the driver
                      profile or the company helpline if driver contact is unavailable.
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency contacts card (driver + company HR) */}
              <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <p className="text-[11px] font-semibold text-rose-700 uppercase">
                      Emergency contacts
                    </p>
                  </div>
                  {/* <span className="text-[10px] text-slate-500">
                    Trip ID: {selectedTrip._id}
                  </span> */}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Driver emergency</p>
                      <p className="text-slate-500">
                        {getDriverPhone() || 'No driver phone available'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!getDriverPhone()}
                      onClick={() => {
                        const phone = getDriverPhone();
                        if (phone) window.location.href = `tel:${phone}`;
                      }}
                      className={`p-2 rounded-full ${
                        getDriverPhone()
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Company / HR desk
                      </p>
                      <p className="text-slate-500">
                        {selectedTrip.company?.contactDetails?.phone ||
                          'No company helpline configured'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!selectedTrip.company?.contactDetails?.phone}
                      onClick={() => {
                        const phone = selectedTrip.company?.contactDetails?.phone;
                        if (phone) window.location.href = `tel:${phone}`;
                      }}
                      className={`p-2 rounded-full ${
                        selectedTrip.company?.contactDetails?.phone
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Next stop */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[11px] font-semibold text-slate-900">
                    Next stop
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Total stops:{' '}
                    {(selectedTrip.employees?.length || 0) + 1}
                  </p>
                </div>
                {nextEmployee ? (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {nextEmployee.employee?.user?.name || 'Employee'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ID: {nextEmployee.employee?.employeeId}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Pickup:{' '}
                        {nextEmployee.pickupLocation?.address ||
                          'Pickup address not available'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    All employees have been dropped for this trip.
                  </p>
                )}
              </div>

              {/* Employees list with per-employee emergency call */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[11px] font-semibold text-slate-900">
                    Employees on this trip
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedTrip.employees?.length || 0} total
                  </p>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedTrip.employees?.map((emp) => {
                    const empPhone = getEmployeePhone(emp);
                    return (
                      <div
                        key={emp._id}
                        className="flex items-start justify-between rounded-xl bg-slate-50 px-3 py-2 gap-3"
                      >
                        <div className="flex-1">
                          <p className="text-[11px] font-semibold text-slate-900">
                            {emp.employee?.user?.name || 'Employee'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            ID: {emp.employee?.employeeId}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Pickup:{' '}
                            {emp.pickupLocation?.address ||
                              'Pickup address not available'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Dept: {emp.employee?.department || '—'} · Role:{' '}
                            {emp.employee?.designation || '—'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getEmployeeStatusBadge(emp)}
                          <button
                            type="button"
                            disabled={!empPhone}
                            onClick={() => {
                              if (empPhone) window.location.href = `tel:${empPhone}`;
                            }}
                            className={`p-1.5 rounded-full ${
                              empPhone
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Emergency call to employee"
                          >
                            <Phone className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent locations */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <p className="text-[11px] font-semibold text-slate-900 mb-2">
                  Recent location trail
                </p>
                {locationHistory.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    No location data yet for this trip.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto text-[11px]">
                    {locationHistory.slice(0, 15).map((loc, idx) => {
                      const addrKey = `hist-${selectedTrip._id}-${idx}`;
                      const addr = getAddress(
                        addrKey,
                        loc.location.coordinates
                      );
                      return (
                        <div
                          key={loc._id || idx}
                          className="flex items-start gap-2"
                        >
                          <div className="pt-1">
                            <div className="w-2 h-2 rounded-full bg-sky-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-800">
                              {addr}
                            </p>
                            <p className="text-slate-500">
                              {formatTime(loc.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Floating Map Button */}
              <button
                onClick={() => setMapModal(true)}
                disabled={!selectedTrip.latestLocation}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                  selectedTrip.latestLocation
                    ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Navigation className="w-6 h-6" />
              </button>

              {/* Fullscreen Map Modal */}
              {mapModal && selectedTrip.latestLocation && (
                <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4">
                  <div className="w-full h-[90vh] bg-white rounded-2xl overflow-hidden border border-slate-200 relative">
                    <LiveTrackingMap
                      trip={selectedTrip}
                      currentLocation={selectedTrip.latestLocation}
                      locationHistory={locationHistory}
                      onClose={() => setMapModal(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
};

export default LiveTracking;