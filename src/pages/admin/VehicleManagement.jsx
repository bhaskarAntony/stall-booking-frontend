import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Car,
  ToggleLeft,
  ToggleRight,
  Fuel,
  Users
} from 'lucide-react';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { vehicleAPI, companyAPI, driverAPI } from '../../services/api';
import toast from 'react-hot-toast';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: '',
    fuelType: '',
    company: '',
    assignedDriver: ''
  });

  useEffect(() => {
    fetchVehicles();
    fetchCompanies();
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getAll({
        search: searchTerm,
        status: statusFilter
      });
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      toast.error('Error fetching vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error fetching companies');
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await driverAPI.getAvailable();
      setDrivers(response.data.drivers || []);
    } catch (error) {
      console.error('Error fetching drivers');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleNumber: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      capacity: '',
      fuelType: '',
      company: '',
      assignedDriver: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await vehicleAPI.update(editingVehicle._id, formData);
        toast.success('Vehicle updated successfully');
      } else {
        await vehicleAPI.create(formData);
        toast.success('Vehicle created successfully');
      }
      setShowModal(false);
      setEditingVehicle(null);
      resetForm();
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleNumber: vehicle.vehicleNumber || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      capacity: vehicle.capacity || '',
      fuelType: vehicle.fuelType || '',
      company: vehicle.company?._id || '',
      assignedDriver: vehicle.assignedDriver?._id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehicleAPI.delete(vehicleId);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting vehicle');
    }
  };

  const handleToggleStatus = async (vehicleId) => {
    try {
      await vehicleAPI.toggleStatus(vehicleId);
      toast.success('Vehicle status updated');
      fetchVehicles();
    } catch (error) {
      toast.error('Error updating vehicle status');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      available: 'bg-emerald-50 text-emerald-700',
      on_trip: 'bg-sky-50 text-sky-700',
      maintenance: 'bg-amber-50 text-amber-700',
      inactive: 'bg-slate-50 text-slate-700'
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${
          statusClasses[status] || 'bg-slate-50 text-slate-700'
        }`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getFuelIcon = () => <Fuel className="w-4 h-4" />;

  if (isLoading) {
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
                Vehicles
              </h1>
              <p className="text-xs text-slate-500">
                Manage all company cabs and assignments
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingVehicle(null);
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 text-white text-sm font-semibold px-4 py-2 active:scale-[0.98] hover:bg-sky-700"
            >
              <Plus className="w-4 h-4" />
              Add vehicle
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
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
                <option value="available">Available</option>
                <option value="on_trip">On Trip</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="hidden md:flex items-center justify-end text-[11px] text-slate-500 gap-2">
                <Car className="w-4 h-4 text-slate-400" />
                <span>{vehicles.length} vehicles</span>
              </div>
            </div>
          </div>

          {/* Vehicles grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <Car className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {vehicle.vehicleNumber}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {vehicle.brand} {vehicle.model}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(vehicle._id)}
                      className={`p-1 rounded-full ${
                        vehicle.isActive ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {vehicle.isActive ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Year</span>
                      <span className="font-medium">{vehicle.year}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Capacity</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {vehicle.capacity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fuel</span>
                      <span className="flex items-center gap-1 font-medium capitalize">
                        {getFuelIcon()}
                        {vehicle.fuelType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Driver</span>
                      <span className="font-medium">
                        {vehicle.assignedDriver?.driverId || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Company</span>
                      <span className="font-medium">
                        {vehicle.company?.code || '--'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {getStatusBadge(vehicle.status)}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="p-1.5 rounded-full text-sky-600 hover:bg-sky-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle._id)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {vehicles.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
                No vehicles found. Try adjusting your filters.
              </div>
            )}
          </div>

          {/* Modal bottom sheet / dialog */}
          {showModal && (
            <div className="fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => {
                  setShowModal(false);
                  setEditingVehicle(null);
                  resetForm();
                }}
              />
              <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:flex sm:items-center sm:justify-center">
                <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                  <div className="pt-3 sm:pt-4">
                    <div className="sm:hidden flex justify-center">
                      <div className="w-10 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="px-4 sm:px-6 pb-4 pt-2 space-y-4 text-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">
                          {editingVehicle ? 'Edit vehicle' : 'Add new vehicle'}
                        </h3>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Vehicle number
                            </label>
                            <input
                              type="text"
                              value={formData.vehicleNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  vehicleNumber: e.target.value.toUpperCase()
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              placeholder="KA05AB1234"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Brand
                            </label>
                            <input
                              type="text"
                              value={formData.brand}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  brand: e.target.value
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              placeholder="Maruti"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Model
                            </label>
                            <input
                              type="text"
                              value={formData.model}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  model: e.target.value
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              placeholder="Ertiga"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Year
                            </label>
                            <input
                              type="number"
                              value={formData.year}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  year: parseInt(e.target.value) || ''
                                })
                              }
                              required
                              min="1980"
                              max={new Date().getFullYear() + 1}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Capacity
                            </label>
                            <input
                              type="number"
                              value={formData.capacity}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  capacity: parseInt(e.target.value) || ''
                                })
                              }
                              required
                              min="1"
                              max="50"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              placeholder="7"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Fuel type
                            </label>
                            <select
                              value={formData.fuelType}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  fuelType: e.target.value
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                              <option value="">Select fuel type</option>
                              <option value="petrol">Petrol</option>
                              <option value="diesel">Diesel</option>
                              <option value="cng">CNG</option>
                              <option value="electric">Electric</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Company
                          </label>
                          <select
                            value={formData.company}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                company: e.target.value
                              })
                            }
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="">Select company</option>
                            {companies.map((company) => (
                              <option key={company._id} value={company._id}>
                                {company.name} ({company.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Assigned driver (optional)
                          </label>
                          <select
                            value={formData.assignedDriver}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                assignedDriver: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="">Select driver</option>
                            {drivers.map((driver) => (
                              <option key={driver._id} value={driver._id}>
                                {driver.driverId} - {driver.user?.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowModal(false);
                              setEditingVehicle(null);
                              resetForm();
                            }}
                            className="px-4 py-2 rounded-2xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700"
                          >
                            {editingVehicle ? 'Update' : 'Create'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default VehicleManagement;
