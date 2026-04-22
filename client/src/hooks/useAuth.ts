/**
 * Authentication Hook
 */

import { useCallback, useEffect } from 'react';
import { useAuthContext } from './useAuthContext';
import * as authApi from '../lib/auth-api';
import { setAccessToken, removeAccessToken, getAccessToken, setLogoutCallback } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { UserRole, UserStatus } from '../types/auth';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { state, dispatch } = useAuthContext();
  const navigate = useNavigate();

  /**
   * Get dashboard route based on user role
   * NEW: Unified dashboard for ATTENDEE and ORGANIZER
   */
  const getDashboardRoute = useCallback((role: UserRole): string => {
    switch (role) {
      // Admin roles - redirect to admin dashboard
      case UserRole.SUPERADMIN:
      case UserRole.ADMIN:
      case UserRole.SUPPORT:
      case UserRole.TELLER:
        return '/admin/dashboard';
      // Organizer roles - organizer dashboard (PENDING_APPROVAL is handled upstream in login())
      case UserRole.ORGANIZER:
      case UserRole.ORGANIZER_ADMIN:
      case UserRole.ORGANIZER_TELLER:
        return '/organizer/dashboard';
      // Attendees and default - unified dashboard
      case UserRole.ATTENDEE:
      default:
        return '/dashboard';
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      try {
        dispatch({ type: 'AUTH_START' });

        const response = await authApi.login({ email, password, rememberMe });

        if (response.success && response.data) {
          setAccessToken(response.data.accessToken);
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });

          // Invalidate profile cache to force fresh fetch of user profile with updated avatar
          queryClient.invalidateQueries({ queryKey: ['profile'] });

          // NEW: Check if user needs personalized onboarding (all new users, not just organizers)
          const role = response.data.user.role;
          const isAdminRole =
            role === 'SUPERADMIN' ||
            role === 'ADMIN' ||
            role === 'SUPPORT' ||
            role === 'TELLER';

          const needsOnboarding = !isAdminRole && (
            !("onboardingCompleted" in response.data.user) ||
            !(response.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
          );

          const isOrganizerRole =
            role === 'ORGANIZER' ||
            role === 'ORGANIZER_ADMIN' ||
            role === 'ORGANIZER_TELLER';

          // Check for returnTo query param (e.g., from transfer accept page)
          const searchParams = new URLSearchParams(window.location.search);
          const returnTo = searchParams.get('returnTo');

          if (returnTo && returnTo.startsWith('/')) {
            navigate(returnTo);
          } else if (response.data.user.status === 'PENDING_APPROVAL') {
            // Pending organizers go to user dashboard (limited access, shows pending banner)
            navigate('/user/dashboard');
          } else if (isOrganizerRole) {
            // Active organizers go straight to organizer dashboard
            // ProtectedRoute handles organizer-specific onboarding if needed
            navigate('/organizer/dashboard');
          } else if (needsOnboarding) {
            // Non-organizer users go through unified onboarding
            navigate('/onboarding/welcome');
          } else {
            // Redirect to appropriate dashboard
            const dashboardRoute = getDashboardRoute(response.data.user.role);
            navigate(dashboardRoute);
          }
        } else {
          throw new Error(response.message || 'Login failed');
        }
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error.message as string)
            : 'An error occurred during login';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        throw error;
      }
    },
    [dispatch, navigate, getDashboardRoute]
  );

  /**
   * Register new user
   */
  const register = useCallback(
    async (data: authApi.RegisterData) => {
      try {
        dispatch({ type: 'AUTH_START' });

        const response = await authApi.register(data);

        if (response.success && response.data) {
          setAccessToken(response.data.accessToken);
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });

          // NEW: All new users go through unified onboarding
          const role = response.data.user.role;
          const isAdminRole =
            role === 'SUPERADMIN' ||
            role === 'ADMIN' ||
            role === 'SUPPORT' ||
            role === 'TELLER';

          const needsOnboarding = !isAdminRole && (
            !("onboardingCompleted" in response.data.user) ||
            !(response.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
          );

          if (response.data.user.status === 'PENDING_APPROVAL') {
            // Pending organizers go to user dashboard (limited access, shows pending banner)
            navigate('/user/dashboard');
          } else if (needsOnboarding) {
            // New unified onboarding for ALL users
            navigate('/onboarding/welcome');
          } else {
            // Redirect to appropriate dashboard
            const dashboardRoute = getDashboardRoute(response.data.user.role);
            navigate(dashboardRoute);
          }
        } else {
          throw new Error(response.message || 'Registration failed');
        }
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error.message as string)
            : 'An error occurred during registration';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        throw error;
      }
    },
    [dispatch, navigate, getDashboardRoute]
  );

  /**
   * Logout user
   * Captures token before clearing, fires server logout with it, then cleans up client state.
   */
  const logout = useCallback(() => {
    // 1. Capture the current access token BEFORE removing it (needed for server call)
    const currentToken = getAccessToken();

    // 2. Clear client-side state immediately for instant UX
    removeAccessToken();
    localStorage.removeItem('activeViewRole');
    // Note: We keep rememberedEmail so "Remember me" persists across sessions

    // 3. Dispatch logout to clear React auth state
    dispatch({ type: 'AUTH_LOGOUT' });

    // 4. Clear React Query cache to prevent stale data leaking to next session
    queryClient.clear();

    // 5. Notify components of token change
    window.dispatchEvent(new Event('tokenChange'));

    // 6. Navigate immediately
    navigate('/', { replace: true });

    // 7. Fire-and-forget server-side token revocation using the captured token
    // Uses raw fetch to bypass apiRequest's 401-refresh logic (we're already logged out)
    if (currentToken) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? '/api/v1' : 'https://eventknit.onrender.com/api/v1');
      fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        credentials: 'include', // Include cookies so server can clear refresh token
      }).catch(() => {
        // Silently fail - client is already logged out
      });
    }
  }, [dispatch, navigate]);

  /**
   * Login without navigation — for use inside modals/embedded flows.
   */
  const loginForModal = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: 'AUTH_START' });
      const response = await authApi.login({ email, password });
      if (response.success && response.data) {
        setAccessToken(response.data.accessToken);
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message || 'Login failed' });
        throw new Error(response.message || 'Login failed');
      }
    },
    [dispatch]
  );

  /**
   * Set auth state from a guest registration/checkout response without navigation.
   * Stores the access token, hydrates auth context with partial user data, then
   * fetches the full profile to fill in role and any missing fields.
   */
  const setAuthFromGuestResponse = useCallback(
    async (
      partialUser: { id: string; email: string; firstName: string; lastName: string },
      accessToken: string
    ) => {
      setAccessToken(accessToken);
      // Dispatch with placeholder role/status — the profile fetch below overwrites with real values
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          ...partialUser,
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Fetch full profile asynchronously so role and all fields are populated
      try {
        const profileResponse = await authApi.getProfile();
        if (profileResponse.success && profileResponse.data) {
          dispatch({ type: 'UPDATE_USER', payload: profileResponse.data.user });
        }
      } catch {
        // Non-fatal — partial user data is sufficient for the modal flow
      }
    },
    [dispatch]
  );

  /**
   * Refresh user profile
   */
  const refreshProfile = useCallback(async () => {
    try {
      // Don't dispatch AUTH_START here — it sets isLoading: true which
      // causes ProtectedRoute to unmount the layout (losing modal state).
      // UPDATE_USER already handles setting the new user data.
      const response = await authApi.getProfile();

      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error: unknown) {
      // If unauthorized, logout
      if (error && typeof error === 'object' && 'message' in error) {
        const msg = error.message as string;
        if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('token')) {
          removeAccessToken();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    }
  }, [dispatch]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, [dispatch]);

  /**
   * Initialize auth state from stored token
   * Runs on mount and when state becomes unauthenticated (to handle navigation)
   */
  useEffect(() => {
    const initAuth = async () => {
      // If already authenticated, don't re-initialize
      if (state.user && state.isAuthenticated) {
        dispatch({ type: 'AUTH_CLEAR_ERROR' }); // Just clear loading state
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (token) {
        // Signal that we're verifying — GuestRoute will hold the page blank until done
        dispatch({ type: 'AUTH_START' });
        try {
          await refreshProfile();
        } catch {
          // Token is invalid, clear it
          removeAccessToken();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        // No token - user is not logged in, clear loading state
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - state persistence is handled by AuthProvider

  /**
   * Set logout callback for API client to call on token refresh failure
   */
  useEffect(() => {
    setLogoutCallback(() => {
      removeAccessToken();
      localStorage.removeItem('activeViewRole');
      dispatch({ type: 'AUTH_LOGOUT' });
      queryClient.clear();
      // Use requestAnimationFrame to ensure state update propagates
      requestAnimationFrame(() => {
        navigate('/auth/signin');
      });
    });
  }, [dispatch, navigate]);

  return {
    ...state,
    login,
    loginForModal,
    logout,
    register,
    setAuthFromGuestResponse,
    refreshProfile,
    clearError,
  };
};

