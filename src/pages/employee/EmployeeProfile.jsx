// src/pages/employee/EmployeeProfile.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar,
  Clock,
  Edit,
  Save,
  X
} from 'lucide-react';
import EmployeeLayout from '../../components/layouts/EmployeeLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EmployeeProfile = () => {
  const { user, isLoading: authLoading, checkAuthStatus } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileState, setProfileState] = useState(null); // local editable copy

  // Initialize local state from user when loaded
  useEffect(() => {
    if (!user) return;
    const p = user.profile || {};
    setProfileState({
      employeeId: p.employeeId || '',
      department: p.department || '',
      designation: p.designation || '',
      shiftTiming: p.shiftTiming || { start: '', end: '' },
      homeAddress: p.homeAddress || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        coordinates: p.homeAddress?.coordinates || null
      },
      workLocation: p.workLocation || user.company || null,
      emergencyContact: user.emergencyContact || { name: '', phone: '' }
    });
  }, [user]);

  const handleFieldChange = (section, key, value) => {
    setProfileState(prev => ({
      ...prev,
      [section]: {
        ...(prev?.[section] || {}),
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!user?._id || !profileState) return;
    try {
      const payload = {
        // update on user document: address/emergencyContact
        address: `${profileState.homeAddress.street}, ${profileState.homeAddress.city}`,
        emergencyContact: profileState.emergencyContact,
        // update nested profile document
        profile: {
          employeeId: profileState.employeeId,
          department: profileState.department,
          designation: profileState.designation,
          shiftTiming: profileState.shiftTiming,
          homeAddress: profileState.homeAddress,
          workLocation: profileState.workLocation
        }
      };

      await userAPI.update(user._id, payload);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      // refresh auth user so entire app sees updated data
      await checkAuthStatus();
    } catch (err) {
      console.error(err);
      toast.error('Error updating profile');
    }
  };

  const handleCancel = () => {
    if (!user) return;
    const p = user.profile || {};
    setProfileState({
      employeeId: p.employeeId || '',
      department: p.department || '',
      designation: p.designation || '',
      shiftTiming: p.shiftTiming || { start: '', end: '' },
      homeAddress: p.homeAddress || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        coordinates: p.homeAddress?.coordinates || null
      },
      workLocation: p.workLocation || user.company || null,
      emergencyContact: user.emergencyContact || { name: '', phone: '' }
    });
    setIsEditing(false);
  };

  if (authLoading || !profileState) {
    return (
      <EmployeeLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </EmployeeLayout>
    );
  }

  const { employeeId, department, designation, shiftTiming, homeAddress, workLocation, emergencyContact } =
    profileState;

  return (
    <EmployeeLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="max-w-md mx-auto px-4 py-4 pb-24 space-y-4">
          {/* Mobile-style header */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
                <span className="text-2xl font-semibold">
                  {user?.name?.charAt(0) || 'E'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-indigo-100">Employee profile</p>
                <h1 className="text-xl font-semibold leading-snug">
                  {user?.name}
                </h1>
                <p className="text-[11px] text-indigo-100 mt-1">
                  ID: {employeeId}
                </p>
                <p className="text-[11px] text-indigo-100">
                  {designation} • {department}
                </p>
              </div>
              <button
                onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
                className="rounded-full bg-white/15 px-3 py-2 flex items-center gap-1 text-xs font-medium hover:bg-white/25 active:scale-[0.97] transition"
              >
                {isEditing ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Personal information */}
          <div className="bg-white rounded-3xl shadow-sm border px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Personal information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Full name</p>
                  <p className="font-medium text-gray-900">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{user?.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : '--'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Work information */}
          <div className="bg-white rounded-3xl shadow-sm border px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Work information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Company</p>
                  <p className="font-medium text-gray-900">
                    {user.company?.name}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {user.company?.code}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Designation</p>
                  <p className="font-medium text-gray-900">{designation}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Shift</p>
                  <p className="font-medium text-gray-900">
                    {shiftTiming.start} – {shiftTiming.end}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Work location</p>
                  <p className="font-medium text-gray-900">
                    {workLocation?.name}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {workLocation?.address?.street},{' '}
                    {workLocation?.address?.city}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Home address */}
          <div className="bg-white rounded-3xl shadow-sm border px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Home address
            </h3>
            {isEditing ? (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Street
                  </label>
                  <input
                    type="text"
                    value={homeAddress.street}
                    onChange={(e) =>
                      setProfileState(prev => ({
                        ...prev,
                        homeAddress: { ...prev.homeAddress, street: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={homeAddress.city}
                      onChange={(e) =>
                        setProfileState(prev => ({
                          ...prev,
                          homeAddress: { ...prev.homeAddress, city: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={homeAddress.state}
                      onChange={(e) =>
                        setProfileState(prev => ({
                          ...prev,
                          homeAddress: { ...prev.homeAddress, state: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      ZIP
                    </label>
                    <input
                      type="text"
                      value={homeAddress.zipCode}
                      onChange={(e) =>
                        setProfileState(prev => ({
                          ...prev,
                          homeAddress: { ...prev.homeAddress, zipCode: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{homeAddress.street}</p>
                  <p className="text-[11px] text-gray-500">
                    {homeAddress.city}, {homeAddress.state} {homeAddress.zipCode}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Company address: {user.company?.address?.street},{' '}
                    {user.company?.address?.city}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Emergency contact */}
          <div className="bg-white rounded-3xl shadow-sm border px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Emergency contact
            </h3>
            {isEditing ? (
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={emergencyContact.name}
                    onChange={(e) =>
                      setProfileState(prev => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          name: e.target.value
                        }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) =>
                      setProfileState(prev => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          phone: e.target.value
                        }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">
                      {emergencyContact.name || '--'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">
                      {emergencyContact.phone || '--'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky bottom actions */}
          {isEditing && (
            <div className="fixed inset-x-0 bottom-0 bg-white border-t shadow-lg px-4 py-3">
              <div className="max-w-md mx-auto flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-2xl bg-purple-600 text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
                >
                  <Save className="w-4 h-4" />
                  Save changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-2xl bg-slate-100 text-slate-800 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition"
                >
                  <X className="w-4 h-4" />
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeProfile;
