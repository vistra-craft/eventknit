/**
 * Organizer Approval Hook
 *
 * Dual strategy for detecting approval:
 * 1. Socket.IO — real-time notification when admin approves
 * 2. Polling fallback — checks profile every 30s in case socket connection fails
 *
 * Only active when user is an organizer with PENDING_APPROVAL status.
 * On approval: refreshes auth state and exposes a modal flag.
 *
 * The "show modal" flag is persisted to sessionStorage so it survives
 * component remounts caused by route redirects (e.g. onboarding guard).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { refreshAccessToken, getAccessToken } from '../lib/api';
import { UserRole, UserStatus } from '../types/auth';

const STORAGE_KEY = 'organizer_approval_pending';

/**
 * Check if an access token's payload is expired (with a small buffer).
 * Falls back to true (needs refresh) if the token can't be decoded.
 */
const isTokenExpired = (token: string, bufferSeconds = 60): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now() + bufferSeconds * 1000;
  } catch {
    return true;
  }
};

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const useOrganizerApproval = () => {
  const { user, refreshProfile } = useAuth();

  // Initialise from sessionStorage so the modal survives remounts
  const [showApprovalModal, setShowApprovalModal] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === '1',
  );

  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const approvedRef = useRef(showApprovalModal); // sync with initial state

  const isPendingOrganizer =
    user?.role === UserRole.ORGANIZER && user?.status === UserStatus.PENDING_APPROVAL;

  // Track that we were pending (so we can detect the transition)
  const wasPendingRef = useRef(isPendingOrganizer);
  useEffect(() => {
    if (isPendingOrganizer) {
      wasPendingRef.current = true;
    }
  }, [isPendingOrganizer]);

  // Helper: show the modal and persist the flag
  const triggerModal = useCallback(() => {
    if (approvedRef.current) return;
    approvedRef.current = true;
    sessionStorage.setItem(STORAGE_KEY, '1');
    setShowApprovalModal(true);
  }, []);

  // Detect status transition: PENDING_APPROVAL → ACTIVE
  // This fires when polling's refreshProfile() updates the auth state
  useEffect(() => {
    if (
      wasPendingRef.current &&
      !approvedRef.current &&
      user?.role === UserRole.ORGANIZER &&
      user?.status === UserStatus.ACTIVE
    ) {
      triggerModal();
    }
  }, [user?.status, user?.role, triggerModal]);

  // Socket.IO real-time listener
  useEffect(() => {
    if (!isPendingOrganizer) return;

    let socket: Socket | null = null;
    let cancelled = false;
    let refreshAttempted = false;

    const connect = async () => {
      // Only refresh the access token if it's actually expired.
      // Eagerly calling refreshAccessToken() races with apiRequest's
      // isRefreshing guard, causing replay detection (backend rotates
      // refresh tokens and revokes all tokens on duplicate use).
      const currentToken = getAccessToken();
      if (!currentToken) return;

      if (isTokenExpired(currentToken)) {
        try {
          await refreshAccessToken();
        } catch {
          if (!getAccessToken()) return;
        }
      }

      if (cancelled) return;

      const token = getAccessToken();
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
        // Refresh auth state to get ACTIVE status, then show modal
        refreshProfile().then(() => {
          triggerModal();
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
  }, [isPendingOrganizer, refreshProfile, triggerModal]);

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
    sessionStorage.removeItem(STORAGE_KEY);
    setShowApprovalModal(false);
  }, []);

  return {
    showApprovalModal,
    handleApprovalAcknowledged,
    isPendingOrganizer,
  };
};
