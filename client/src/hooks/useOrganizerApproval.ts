/**
 * Organizer Approval Hook
 *
 * Dual strategy for detecting approval:
 * 1. Socket.IO — real-time notification when admin approves
 * 2. Polling fallback — checks profile every 30s in case socket connection fails
 *
 * Only active when user is an organizer with PENDING_APPROVAL status.
 * On approval: refreshes auth state and exposes a modal flag.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { refreshAccessToken, getAccessToken } from '../lib/api';
import { UserRole, UserStatus } from '../types/auth';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const useOrganizerApproval = () => {
  const { user, refreshProfile } = useAuth();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const approvedRef = useRef(false);
  const wasPendingRef = useRef(false);

  const isPendingOrganizer =
    user?.role === UserRole.ORGANIZER && user?.status === UserStatus.PENDING_APPROVAL;

  // Track that we were pending (so we can detect the transition)
  useEffect(() => {
    if (isPendingOrganizer) {
      wasPendingRef.current = true;
    }
  }, [isPendingOrganizer]);

  // Detect status transition: PENDING_APPROVAL → ACTIVE
  // This fires when polling's refreshProfile() updates the auth state
  useEffect(() => {
    if (
      wasPendingRef.current &&
      !approvedRef.current &&
      user?.role === UserRole.ORGANIZER &&
      user?.status === UserStatus.ACTIVE
    ) {
      approvedRef.current = true;
      setShowApprovalModal(true);
    }
  }, [user?.status, user?.role]);

  // Socket.IO real-time listener
  useEffect(() => {
    if (!isPendingOrganizer) return;

    let socket: Socket | null = null;
    let cancelled = false;
    let refreshAttempted = false;

    const connect = async () => {
      // Refresh access token before connecting to ensure it's not expired.
      // Socket.IO doesn't go through the API client's 401-refresh interceptor,
      // so an expired token would cause a 403 rejection from the WS middleware.
      try {
        await refreshAccessToken();
      } catch {
        // Refresh failed — if there's no access token left, the session is dead.
        // Don't attempt Socket.IO connection; the polling fallback will trigger
        // a proper 401 → refresh → logout flow via apiRequest.
        if (!getAccessToken()) return;
      }

      if (cancelled) return;

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      socket = io({
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        refreshAttempted = false; // Reset on successful connection
        socket!.emit('join:notifications');
      });

      socket.on('organizer:approved', () => {
        if (approvedRef.current) return;
        approvedRef.current = true;
        // Refresh auth state to get ACTIVE status, then show modal
        refreshProfile().then(() => {
          setShowApprovalModal(true);
        });
      });

      // Handle auth failures — refresh token once, then let reconnection retry
      socket.on('connect_error', async () => {
        if (!refreshAttempted) {
          refreshAttempted = true;
          try {
            await refreshAccessToken();
            const newToken = localStorage.getItem('accessToken');
            if (newToken && socket) {
              // Update auth for next reconnection attempt
              socket.auth = { token: newToken };
            }
          } catch {
            // Token refresh failed — polling fallback will handle approval detection
          }
        }
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [isPendingOrganizer, refreshProfile]);

  // Polling fallback — checks profile periodically
  useEffect(() => {
    if (!isPendingOrganizer) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(async () => {
      if (approvedRef.current) return;

      try {
        // refreshProfile updates auth state; the status transition
        // effect above will detect PENDING_APPROVAL → ACTIVE
        await refreshProfile();
      } catch {
        // Silently ignore — will retry on next interval
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isPendingOrganizer, refreshProfile]);

  const handleApprovalAcknowledged = useCallback(() => {
    setShowApprovalModal(false);
  }, []);

  return {
    showApprovalModal,
    handleApprovalAcknowledged,
    isPendingOrganizer,
  };
};
