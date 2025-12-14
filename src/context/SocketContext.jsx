import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('https://stall-bookings-backend.onrender.com', {
        auth: {
          token: localStorage.getItem('accessToken'),
          userId: user._id,
          role: user.role
        }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const joinTripRoom = (tripId) => {
    if (socket) {
      socket.emit('join-trip', tripId);
    }
  };

  const leaveTripRoom = (tripId) => {
    if (socket) {
      socket.emit('leave-trip', tripId);
    }
  };

  const sendLocationUpdate = (tripId, location) => {
    if (socket) {
      socket.emit('driver-location-update', {
        tripId,
        location,
        driverId: user?._id,
        timestamp: new Date()
      });
    }
  };

  const updateTripStatus = (tripId, status, employeeId = null) => {
    if (socket) {
      socket.emit('trip-status-update', {
        tripId,
        status,
        employeeId,
        timestamp: new Date()
      });
    }
  };

  const updateDriverStatus = (status, location = null) => {
    if (socket) {
      socket.emit('driver-status-update', {
        driverId: user?._id,
        status,
        location,
        timestamp: new Date()
      });
    }
  };

  const value = {
    socket,
    isConnected,
    joinTripRoom,
    leaveTripRoom,
    sendLocationUpdate,
    updateTripStatus,
    updateDriverStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};