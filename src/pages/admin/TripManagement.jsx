import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Play,
  Square,
  X,
  Car
} from 'lucide-react';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { tripAPI, driverAPI, vehicleAPI, employeeAPI, companyAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { LoadScript, StandaloneSearchBox } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBS = ['places'];

const TripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tripTypeFilter, setTripTypeFilter] = useState('');

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    tripName: '',
    tripType: 'login',
    routeName: '',
    officeLocation: { address: '', coordinates: { lat: 0, lng: 0 } },
    assignedDriver: '',
    assignedVehicle: '',
    schedule: {
      startTime: '',
      endTime: '',
      days: []
    },
    employees: []
  });

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  const officeSearchBoxRef = useRef(null);
  const employeeSearchBoxRefs = useRef({});

  useEffect(() => {
    fetchTrips();
    if (showCreateModal) {
      fetchSupportingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, tripTypeFilter, pagination.current, showCreateModal]);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        tripType: tripTypeFilter || undefined
      };

      const response = await tripAPI.getAll(params);
      setTrips(response.data.trips || []);

      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Error fetching trips');
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      const [driversRes, vehiclesRes, companiesRes] = await Promise.all([
        driverAPI.getAll({ limit: 100 }),
        vehicleAPI.getAll({ limit: 100 }),
        companyAPI.getAll({ limit: 100 })
      ]);

      setDrivers(driversRes.data.drivers || []);
      setVehicles(vehiclesRes.data.vehicles || []);
      setCompanies(companiesRes.data.companies || []);
    } catch {
      toast.error('Error loading data for trip creation');
    }
  };

  const fetchAvailableEmployees = async (companyId) => {
    if (!companyId) {
      setAvailableEmployees([]);
      return;
    }
    try {
      const res = await employeeAPI.getAvailable(companyId);
      setAvailableEmployees(res.data.employees || []);
    } catch {
      toast.error('Error fetching employees');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, current: newPage }));
  };

  const handleStartTrip = async (tripId) => {
    try {
      await tripAPI.start(tripId);
      toast.success('Trip started successfully');
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error starting trip');
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await tripAPI.complete(tripId);
      toast.success('Trip completed successfully');
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error completing trip');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await tripAPI.delete(tripId);
      toast.success('Trip deleted successfully');
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting trip');
    }
  };

  const handleCreateTrip = async () => {
    if (
      !formData.tripName ||
      !formData.routeName ||
      formData.employees.length === 0 ||
      !formData.assignedDriver ||
      !formData.assignedVehicle ||
      !formData.officeLocation.address ||
      formData.schedule.days.length === 0
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        tripName: formData.tripName,
        tripType: formData.tripType,
        routeName: formData.routeName,
        officeLocation: formData.officeLocation,
        assignedDriver: formData.assignedDriver,
        assignedVehicle: formData.assignedVehicle,
        schedule: formData.schedule,
        employees: formData.employees.map((emp) => ({
          employeeId: emp.employee._id,
          pickupLocation: emp.pickupLocation,
          dropLocation:
            formData.tripType === 'login'
              ? formData.officeLocation
              : emp.dropLocation
        })),
        companyId: selectedCompany
      };

      await tripAPI.create(payload);
      toast.success('Trip created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchTrips();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating trip');
    }
  };

  const resetForm = () => {
    setFormData({
      tripName: '',
      tripType: 'login',
      routeName: '',
      officeLocation: { address: '', coordinates: { lat: 0, lng: 0 } },
      assignedDriver: '',
      assignedVehicle: '',
      schedule: { startTime: '', endTime: '', days: [] },
      employees: []
    });
    setSelectedCompany('');
    setAvailableEmployees([]);
  };

  const addEmployeeToTrip = (employee) => {
    setFormData((prev) => ({
      ...prev,
      employees: [
        ...prev.employees,
        {
          employee,
          pickupLocation: { address: '', coordinates: { lat: 0, lng: 0 } },
          dropLocation: { address: '', coordinates: { lat: 0, lng: 0 } }
        }
      ]
    }));
  };

  const removeEmployeeFromTrip = (index) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.filter((_, i) => i !== index)
    }));
  };

  const updateEmployeeLocation = (index, type, place) => {
    const location = {
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }
    };

    setFormData((prev) => {
      const updated = [...prev.employees];
      updated[index][type] = location;
      return { ...prev, employees: updated };
    });
  };

  const handleOfficePlaceChanged = () => {
    const places = officeSearchBoxRef.current.getPlaces();
    if (places && places.length > 0) {
      const place = places[0];
      setFormData((prev) => ({
        ...prev,
        officeLocation: {
          address: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        }
      }));
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      scheduled: 'bg-slate-50 text-slate-700',
      active: 'bg-emerald-50 text-emerald-700',
      completed: 'bg-sky-50 text-sky-700',
      cancelled: 'bg-rose-50 text-rose-700'
    };
    return (
      <span
        className={`px-2 py-1 text-[11px] font-medium rounded-full ${
          classes[status] || classes.scheduled
        }`}
      >
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const getTripTypeBadge = (type) => (
    <span
      className={`px-2 py-1 text-[11px] font-medium rounded-full ${
        type === 'login'
          ? 'bg-sky-50 text-sky-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {type === 'login' ? 'Login trip' : 'Logout trip'}
    </span>
  );

  if (isLoading && trips.length === 0) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
        <div className="min-h-[calc(100vh-64px)] bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 py-4 pb-20 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Trips
                </h1>
                <p className="text-xs text-slate-500">
                  Manage daily login and logout trips
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 text-white text-sm font-semibold px-4 py-2 active:scale-[0.98] hover:bg-sky-700"
              >
                <Plus className="w-4 h-4" />
                Create trip
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search trips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={tripTypeFilter}
                  onChange={(e) => setTripTypeFilter(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All types</option>
                  <option value="login">Login trip</option>
                  <option value="logout">Logout trip</option>
                </select>
              </div>
            </div>

            {/* Trips table */}
         {/* Trips cards */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
  {trips.length === 0 && !isLoading && (
    <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
      No trips found. Try adjusting your filters.
    </div>
  )}

  {trips.map((trip) => (
    <div
      key={trip._id}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-4 space-y-3">
        {/* Header: trip name + type */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              {trip.tripName}
            </p>
            <p className="text-[11px] text-slate-500">
              {trip.routeName || 'No route name'}
            </p>
          </div>
          {getTripTypeBadge(trip.tripType)}
        </div>

        {/* Company */}
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-medium">Company</span>
          <span className="text-right">
            {trip.company?.name || 'N/A'}{' '}
            {trip.company?.code && (
              <span className="text-slate-400">({trip.company.code})</span>
            )}
          </span>
        </div>

        {/* Driver & vehicle strip */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[11px]">
          <div className="flex flex-col">
            <span className="text-slate-400">Driver</span>
            <span className="font-medium text-slate-900">
              {trip.assignedDriver?.user?.name ||
                trip.assignedDriver?.driverId ||
                'Not assigned'}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex flex-col items-end">
            <span className="text-slate-400">Vehicle</span>
            <span className="font-medium text-slate-900 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-slate-400" />
              {trip.assignedVehicle?.vehicleNumber || 'No vehicle'}
            </span>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <div>
            <p className="font-medium text-slate-900">
              {trip.schedule?.startTime} – {trip.schedule?.endTime}
            </p>
            <p className="text-slate-500">
              {trip.schedule?.days?.join(', ') || 'No days configured'}
            </p>
          </div>
          <div>{getStatusBadge(trip.status)}</div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            {trip.employees?.length || 0} employees
          </p>
          <div className="flex items-center gap-2">
            {trip.status === 'scheduled' && (
              <button
                onClick={() => handleStartTrip(trip._id)}
                className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-50"
                title="Start trip"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {trip.status === 'active' && (
              <button
                onClick={() => handleCompleteTrip(trip._id)}
                className="p-1.5 rounded-full text-sky-600 hover:bg-sky-50"
                title="Complete trip"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
            <button
              className="p-1.5 rounded-full text-sky-600 hover:bg-sky-50"
              title="Edit"
              // onClick={() => openEdit(trip)}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTrip(trip._id)}
              className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

          </div>

          {/* Create trip modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-40 bg-black/40">
              <div className="flex items-center justify-center min-h-screen p-4">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">
                      Create new trip
                    </h2>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="p-1.5 rounded-full hover:bg-slate-100"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  <div className="px-6 py-4 space-y-6 text-sm">
                    {/* Basic info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-slate-700">
                          Trip name *
                        </label>
                        <input
                          type="text"
                          value={formData.tripName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tripName: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Morning Koramangala route"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-slate-700">
                          Trip type *
                        </label>
                        <select
                          value={formData.tripType}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tripType: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="login">
                            Login trip (Home → Office)
                          </option>
                          <option value="logout">
                            Logout trip (Office → Home)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-slate-700">
                          Route name *
                        </label>
                        <input
                          type="text"
                          value={formData.routeName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              routeName: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-[11px] font-medium mb-1 text-slate-700">
                        Company *
                      </label>
                      <select
                        value={selectedCompany}
                        onChange={(e) => {
                          setSelectedCompany(e.target.value);
                          fetchAvailableEmployees(e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">Select company</option>
                        {companies.map((comp) => (
                          <option key={comp._id} value={comp._id}>
                            {comp.name} ({comp.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Office location */}
                    <div>
                      <label className="block text-[11px] font-medium mb-1 text-slate-700">
                        Office location *
                      </label>
                      <StandaloneSearchBox
                        onLoad={(ref) => (officeSearchBoxRef.current = ref)}
                        onPlacesChanged={handleOfficePlaceChanged}
                      >
                        <input
                          type="text"
                          placeholder="Search office address..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </StandaloneSearchBox>
                      {formData.officeLocation.address && (
                        <p className="text-[11px] text-emerald-600 mt-1">
                          Selected: {formData.officeLocation.address}
                        </p>
                      )}
                    </div>

                    {/* Driver & vehicle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-slate-700">
                          Assign driver *
                        </label>
                        <select
                          value={formData.assignedDriver}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              assignedDriver: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="">Select driver</option>
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.user?.name} ({driver.driverId})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-slate-700">
                          Assign vehicle *
                        </label>
                        <select
                          value={formData.assignedVehicle}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              assignedVehicle: e.target.value
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="">Select vehicle</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle._id} value={vehicle._id}>
                              {vehicle.vehicleNumber} - {vehicle.brand}{' '}
                              {vehicle.model}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-slate-700">
                          Start time *
                        </label>
                        <input
                          type="time"
                          value={formData.schedule.startTime}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                startTime: e.target.value
                              }
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-slate-700">
                          End time *
                        </label>
                        <input
                          type="time"
                          value={formData.schedule.endTime}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                endTime: e.target.value
                              }
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-slate-700">
                          Days *
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                            (day) => (
                              <label
                                key={day}
                                className="flex items-center gap-1 text-[11px]"
                              >
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-300"
                                  checked={formData.schedule.days.includes(
                                    day.toLowerCase()
                                  )}
                                  onChange={(e) => {
                                    const days = e.target.checked
                                      ? [
                                          ...formData.schedule.days,
                                          day.toLowerCase()
                                        ]
                                      : formData.schedule.days.filter(
                                          (d) => d !== day.toLowerCase()
                                        );
                                    setFormData((prev) => ({
                                      ...prev,
                                      schedule: { ...prev.schedule, days }
                                    }));
                                  }}
                                />
                                {day}
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Employees */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-slate-800">
                          Employees *
                        </label>
                        <select
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (!selectedId) return;
                            const emp = availableEmployees.find(
                              (employee) =>
                                employee &&
                                employee._id &&
                                employee._id === selectedId
                            );
                            if (
                              emp &&
                              !formData.employees.some(
                                (item) =>
                                  item.employee &&
                                  item.employee._id === emp._id
                              )
                            ) {
                              addEmployeeToTrip(emp);
                            }
                            e.target.value = '';
                          }}
                          className="px-3 py-1 border border-slate-200 rounded-xl text-sm"
                        >
                          <option value="">Add employee</option>
                          {availableEmployees
                            .filter(
                              (emp) =>
                                emp &&
                                emp._id &&
                                !formData.employees.some(
                                  (item) =>
                                    item.employee &&
                                    item.employee._id === emp._id
                                )
                            )
                            .map((emp) => (
                              <option key={emp._id} value={emp._id}>
                                {emp.user?.name || 'Unnamed'} (
                                {emp.employeeId || 'No ID'})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {formData.employees.map((item, index) => (
                          <div
                            key={index}
                            className="border border-slate-200 rounded-xl p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {item.employee.user?.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {item.employee.employeeId}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  removeEmployeeFromTrip(index)
                                }
                                className="p-1 rounded-full hover:bg-rose-50"
                              >
                                <X className="w-4 h-4 text-rose-500" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-medium text-slate-700">
                                  Pickup location
                                </label>
                                <StandaloneSearchBox
                                  onLoad={(ref) =>
                                    (employeeSearchBoxRefs.current[
                                      `pickup-${index}`
                                    ] = ref)
                                  }
                                  onPlacesChanged={() => {
                                    const ref =
                                      employeeSearchBoxRefs.current[
                                        `pickup-${index}`
                                      ];
                                    const places = ref.getPlaces();
                                    if (places?.length > 0) {
                                      updateEmployeeLocation(
                                        index,
                                        'pickupLocation',
                                        places[0]
                                      );
                                    }
                                  }}
                                >
                                  <input
                                    type="text"
                                    placeholder="Search pickup address..."
                                    className="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  />
                                </StandaloneSearchBox>
                                {item.pickupLocation.address && (
                                  <p className="text-[11px] text-emerald-600 mt-1">
                                    {item.pickupLocation.address}
                                  </p>
                                )}
                              </div>

                              {formData.tripType === 'logout' && (
                                <div>
                                  <label className="text-[11px] font-medium text-slate-700">
                                    Drop location
                                  </label>
                                  <StandaloneSearchBox
                                    onLoad={(ref) =>
                                      (employeeSearchBoxRefs.current[
                                        `drop-${index}`
                                      ] = ref)
                                    }
                                    onPlacesChanged={() => {
                                      const ref =
                                        employeeSearchBoxRefs.current[
                                          `drop-${index}`
                                        ];
                                      const places = ref.getPlaces();
                                      if (places?.length > 0) {
                                        updateEmployeeLocation(
                                          index,
                                          'dropLocation',
                                          places[0]
                                        );
                                      }
                                    }}
                                  >
                                    <input
                                      type="text"
                                      placeholder="Search drop address..."
                                      className="w-full px-3 py-2 mt-1 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                  </StandaloneSearchBox>
                                  {item.dropLocation.address && (
                                    <p className="text-[11px] text-emerald-600 mt-1">
                                      {item.dropLocation.address}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {formData.employees.length === 0 && (
                        <p className="text-center text-xs text-slate-500 py-6">
                          No employees added yet
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowCreateModal(false);
                          resetForm();
                        }}
                        className="px-4 py-2 rounded-2xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateTrip}
                        className="px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700"
                      >
                        Create trip
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </AdminLayout>
  );
};

export default TripManagement;
