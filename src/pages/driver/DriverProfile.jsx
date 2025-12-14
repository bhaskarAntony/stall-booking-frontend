// src/pages/driver/DriverProfile.jsx
import React from 'react';
import { 
  User, 
  Car, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Award,
  Clock,
  Route
} from 'lucide-react';
import DriverLayout from '../../components/layouts/DriverLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const DriverProfile = () => {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </DriverLayout>
    );
  }

  const profile = user.profile || {};
  const rating = profile.rating || { average: 0, count: 0 };
  const vehicle = profile.currentVehicle || null;
  const company = user.company || {};
  const status = profile.status || 'offline';

  const statusLabel =
    status === 'available' ? 'Available' :
    status === 'on_trip'   ? 'On Trip'  :
    'Offline';

  const statusColor =
    status === 'available'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'on_trip'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-700';

  return (
    <DriverLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-20">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-2xl font-semibold">
                  {user.name?.charAt(0) || 'D'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-orange-100">Driver profile</p>
                <h1 className="text-xl font-semibold leading-snug">
                  {user.name}
                </h1>
                <p className="text-[11px] text-orange-100 mt-1">
                  ID: {profile.driverId}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  <Star className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="font-medium">
                    {rating.average.toFixed(1)}
                  </span>
                  <span className="text-orange-100">
                    ({rating.count} reviews)
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Personal info */}
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
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{user.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Home address</p>
                  <p className="font-medium text-gray-900">
                    {user.address || 'Not provided'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Company: {company.name}, {company.address?.city}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* License & experience */}
          <div className="bg-white rounded-3xl shadow-sm border px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              License & experience
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-gray-500">License number</p>
                <p className="font-medium text-gray-900">
                  {profile.licenseNumber}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">License expiry</p>
                <p className="font-medium text-gray-900">
                  {profile.licenseExpiry
                    ? new Date(profile.licenseExpiry).toLocaleDateString()
                    : '--'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Experience</p>
                <p className="font-medium text-gray-900">
                  {profile.experience} years
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Joined</p>
                <p className="font-medium text-gray-900">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Current vehicle */}
          <div className="bg-white rounded-3xl shadow-sm border px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Assigned vehicle
            </h3>
            {vehicle ? (
              <div className="flex items-center gap-4 text-sm">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Car className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {vehicle.vehicleNumber}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {vehicle.brand} {vehicle.model} • {vehicle.year}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Capacity: {vehicle.capacity} passengers
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No vehicle assigned</p>
            )}
          </div>

          {/* Performance (placeholders until you add stats on user.profile) */}
          <div className="bg-white rounded-3xl shadow-sm border px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Performance statistics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-3 rounded-2xl bg-blue-50">
                <Route className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-semibold text-blue-700">0</p>
                <p className="text-[11px] text-gray-600">Total trips</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-emerald-50">
                <MapPin className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-semibold text-emerald-700">0</p>
                <p className="text-[11px] text-gray-600">Total km</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-purple-50">
                <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xl font-semibold text-purple-700">0</p>
                <p className="text-[11px] text-gray-600">This month</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-orange-50">
                <Clock className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <p className="text-xl font-semibold text-orange-700">0</p>
                <p className="text-[11px] text-gray-600">Monthly km</p>
              </div>
            </div>
          </div>

          {/* Achievements (static for now) */}
          <div className="bg-white rounded-3xl shadow-sm border px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Achievements
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-yellow-50">
                <Award className="w-7 h-7 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">New driver</p>
                  <p className="text-[11px] text-gray-600">
                    Complete more trips to unlock badges
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50">
                <Star className="w-7 h-7 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900">Rating builder</p>
                  <p className="text-[11px] text-gray-600">
                    Maintain a high rating to earn rewards
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
};

export default DriverProfile;
