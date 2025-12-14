import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import AdminLayout from '../../components/layouts/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { userAPI, companyAPI } from '../../services/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '',
    company: '',
    address: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAll({
        search: searchTerm,
        role: roleFilter
      });
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Error fetching users');
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: '',
      company: '',
      address: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        delete updateData.password;
        await userAPI.update(editingUser._id, updateData);
        toast.success('User updated successfully');
      } else {
        await userAPI.create(formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || '',
      company: user.company?._id || '',
      address: user.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userAPI.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting user');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await userAPI.toggleStatus(userId);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Error updating user status');
    }
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      rsr_admin: 'bg-purple-50 text-purple-700',
      office_hr: 'bg-sky-50 text-sky-700',
      driver: 'bg-amber-50 text-amber-700',
      employee: 'bg-emerald-50 text-emerald-700'
    };

    const roleLabels = {
      rsr_admin: 'RSR Admin',
      office_hr: 'Office HR',
      driver: 'Driver',
      employee: 'Employee'
    };

    return (
      <span
        className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
          roleClasses[role] || 'bg-slate-50 text-slate-700'
        }`}
      >
        {roleLabels[role] || role}
      </span>
    );
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
              <h1 className="text-xl font-semibold text-slate-900">Users</h1>
              <p className="text-xs text-slate-500">
                Manage all admins, HRs, drivers and employees
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingUser(null);
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 text-white text-sm font-semibold px-4 py-2 active:scale-[0.98] hover:bg-sky-700"
            >
              <Plus className="w-4 h-4" />
              Add user
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">All roles</option>
                <option value="rsr_admin">RSR Admin</option>
                <option value="office_hr">Office HR</option>
                <option value="driver">Driver</option>
                <option value="employee">Employee</option>
              </select>
              <div className="hidden md:flex items-center justify-end text-[11px] text-slate-500 gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{users.length} users</span>
              </div>
            </div>
          </div>

          {/* Users cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {user.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(user._id)}
                      className={`p-1 rounded-full ${
                        user.isActive ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    {getRoleBadge(user.role)}
                    <span className="text-slate-500">
                      {user.company?.name || 'No company'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p>
                      <span className="font-medium">Phone:</span>{' '}
                      {user.phone || 'N/A'}
                    </p>
                    <p className="line-clamp-1">
                      <span className="font-medium">Address:</span>{' '}
                      {user.address || 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-[11px] font-medium ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 rounded-full text-sky-600 hover:bg-sky-50"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
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

            {users.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
                No users found. Try adjusting your filters.
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
                  setEditingUser(null);
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
                          {editingUser ? 'Edit user' : 'Add new user'}
                        </h3>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Full name
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name: e.target.value
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  email: e.target.value
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        {!editingUser && (
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Password
                            </label>
                            <input
                              type="password"
                              value={formData.password}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  password: e.target.value
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phone: e.target.value
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              Role
                            </label>
                            <select
                              value={formData.role}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  role: e.target.value
                                })
                              }
                              required
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            >
                              <option value="">Select role</option>
                              <option value="rsr_admin">RSR Admin</option>
                              <option value="office_hr">Office HR</option>
                              <option value="driver">Driver</option>
                              <option value="employee">Employee</option>
                            </select>
                          </div>
                        </div>

                        {formData.role !== 'rsr_admin' && (
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
                        )}

                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            Address
                          </label>
                          <textarea
                            rows={3}
                            value={formData.address}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-2 pb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowModal(false);
                              setEditingUser(null);
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
                            {editingUser ? 'Update' : 'Create'}
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

export default UserManagement;
