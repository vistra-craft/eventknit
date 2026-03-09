/**
 * WebSocket Hook
 * Provides Socket.IO connection management for real-time features
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  eventId?: string;
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinEvent: (eventId: string) => void;
  leaveEvent: () => void;
}

export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { eventId, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No auth token found, skipping WebSocket connection');
      return;
    }

    // Create socket connection
    const socketURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);

      // Auto-join event room if eventId provided
      if (eventId) {
        socket.emit('join:event', { eventId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('WebSocket error:', error.message);
    });

    socket.on('joined:event', () => {
      // event room joined
    });

    // Cleanup on unmount
    return () => {
      if (eventId) {
        socket.emit('leave:event', { eventId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, eventId]);

  const joinEvent = (newEventId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join:event', { eventId: newEventId });
    }
  };

  const leaveEvent = () => {
    if (socketRef.current && socketRef.current.connected && eventId) {
      socketRef.current.emit('leave:event', { eventId });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinEvent,
    leaveEvent,
  };
};
