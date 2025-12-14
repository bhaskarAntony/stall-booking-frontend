import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { companyAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: { lat: '', lng: '' }
    },
    contactDetails: {
      email: '',
      phone: '',
      website: ''
    }
  });

  useEffect(() => {
    fetchCompanies();
  }, [searchTerm]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await companyAPI.getAll({ search: searchTerm });
      setCompanies(response.data.companies || []);
    } catch (error) {
      toast.error('Error fetching companies');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        coordinates: { lat: '', lng: '' }
      },
      contactDetails: {
        email: '',
        phone: '',
        website: ''
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await companyAPI.update(editingCompany._id, formData);
        toast.success('Company updated successfully');
      } else {
        await companyAPI.create(formData);
        toast.success('Company created successfully');
      }
      setShowModal(false);
      setEditingCompany(null);
      resetForm();
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving company');
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      code: company.code || '',
      address: {
        street: company.address?.street || '',
        city: company.address?.city || '',
        state: company.address?.state || '',
        zipCode: company.address?.zipCode || '',
        coordinates: company.address?.coordinates || { lat: '', lng: '' }
      },
      contactDetails: {
        email: company.contactDetails?.email || '',
        phone: company.contactDetails?.phone || '',
        website: company.contactDetails?.website || ''
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      await companyAPI.delete(companyId);
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting company');
    }
  };

  const handleToggleStatus = async (companyId) => {
    try {
      await companyAPI.toggleStatus(companyId);
      toast.success('Company status updated');
      fetchCompanies();
    } catch (error) {
      toast.error('Error updating company status');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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
                Companies
              </h1>
              <p className="text-xs text-slate-500">
                Manage client organizations and their settings
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingCompany(null);
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 text-white text-sm font-semibold px-4 py-2 active:scale-[0.98] hover:bg-sky-700"
            >
              <Plus className="w-4 h-4" />
              Add company
            </button>
          </div>

          {/* Search & summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>{companies.length} companies</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Active: {companies.filter((c) => c.isActive).length}</span>
              </div>
            </div>
          </div>

          {/* Companies grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {companies.map((company) => (
              <div
                key={company._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {company.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Code: {company.code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(company._id)}
                      className={`p-1 rounded-full ${
                        company.isActive
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {company.isActive ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-600">
                    <p>
                      <span className="font-medium">Address:</span>{' '}
                      {company.address?.city}, {company.address?.state}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{' '}
                      {company.contactDetails?.email || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{' '}
                      {company.contactDetails?.phone || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                        company.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-1.5 rounded-full text-sky-600 hover:bg-sky-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company._id)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {companies.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
                No companies found. Try adjusting your search.
              </div>
            )}
          </div>

          {/* Modal as bottom sheet on mobile */}
          {showModal && (
            <div className="fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => {
                  setShowModal(false);
                  setEditingCompany(null);
                  resetForm();
                }}
              />
              <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:flex sm:items-center sm:justify-center">
                <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                  <div className="pt-3 sm:pt-4">
                    <div className="hidden sm:block px-6">
                      <h3 className="text-base font-semibold text-slate-900">
                        {editingCompany ? 'Edit company' : 'Add new company'}
                      </h3>
                    </div>
                    <div className="sm:hidden flex justify-center">
                      <div className="w-10 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="px-4 sm:px-6 pb-4 pt-2 space-y-4">
                      <div className="sm:hidden">
                        <h3 className="text-base font-semibold text-slate-900 text-center">
                          {editingCompany ? 'Edit company' : 'Add new company'}
                        </h3>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Company name
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Company code
                            </label>
                            <input
                              type="text"
                              name="code"
                              value={formData.code}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Street address
                          </label>
                          <input
                            type="text"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              name="address.city"
                              value={formData.address.city}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              State
                            </label>
                            <input
                              type="text"
                              name="address.state"
                              value={formData.address.state}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              ZIP code
                            </label>
                            <input
                              type="text"
                              name="address.zipCode"
                              value={formData.address.zipCode}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Contact email
                            </label>
                            <input
                              type="email"
                              name="contactDetails.email"
                              value={formData.contactDetails.email}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              name="contactDetails.phone"
                              value={formData.contactDetails.phone}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Website
                          </label>
                          <input
                            type="url"
                            name="contactDetails.website"
                            value={formData.contactDetails.website}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-2 pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowModal(false);
                              setEditingCompany(null);
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
                            {editingCompany ? 'Update' : 'Create'}
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

export default CompanyManagement;
