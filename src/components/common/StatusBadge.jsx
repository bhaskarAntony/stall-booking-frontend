import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusClasses = () => {
    const baseClasses = 'inline-flex px-2 py-1 text-xs font-medium rounded-full';
    
    switch (type) {
      case 'trip':
        const tripClasses = {
          scheduled: 'bg-gray-100 text-gray-800',
          active: 'bg-green-100 text-green-800',
          completed: 'bg-blue-100 text-blue-800',
          cancelled: 'bg-red-100 text-red-800'
        };
        return `${baseClasses} ${tripClasses[status] || tripClasses.scheduled}`;
        
      case 'user':
        const userClasses = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800'
        };
        return `${baseClasses} ${userClasses[status] || userClasses.inactive}`;
        
      case 'vehicle':
        const vehicleClasses = {
          available: 'bg-green-100 text-green-800',
          on_trip: 'bg-blue-100 text-blue-800',
          maintenance: 'bg-yellow-100 text-yellow-800',
          inactive: 'bg-gray-100 text-gray-800'
        };
        return `${baseClasses} ${vehicleClasses[status] || vehicleClasses.inactive}`;
        
      case 'driver':
        const driverClasses = {
          available: 'bg-green-100 text-green-800',
          on_trip: 'bg-blue-100 text-blue-800',
          offline: 'bg-gray-100 text-gray-800'
        };
        return `${baseClasses} ${driverClasses[status] || driverClasses.offline}`;
        
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span className={getStatusClasses()}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;