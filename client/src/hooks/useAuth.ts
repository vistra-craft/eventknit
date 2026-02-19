/**
 * Authentication Hook
 */

import { useCallback, useEffect } from 'react';
import { useAuthContext } from './useAuthContext';
import * as authApi from '../lib/auth-api';
import { setAccessToken, removeAccessToken, setLogoutCallback } from '../lib/api';
import { UserRole } from '../types/auth';
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
      case UserRole.ADMIN_STAFF:
      case UserRole.MARKETER:
      case UserRole.SUPPORT:
      case UserRole.TELLER:
        return '/admin/dashboard';
      // Organizer roles - redirect to organizer dashboard
      case UserRole.ORGANIZER:
      case UserRole.ORGANIZER_STAFF:
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

          // NEW: Check if user needs personalized onboarding (all new users, not just organizers)
          const role = response.data.user.role;
          const isAdminRole =
            role === 'SUPERADMIN' ||
            role === 'ADMIN_STAFF' ||
            role === 'MARKETER' ||
            role === 'SUPPORT' ||
            role === 'TELLER';

          const needsOnboarding = !isAdminRole && (
            !("onboardingCompleted" in response.data.user) ||
            !(response.data.user as { onboardingCompleted?: boolean }).onboardingCompleted
          );

          const isOrganizerRole =
            role === 'ORGANIZER' ||
            role === 'ORGANIZER_STAFF' ||
            role === 'ORGANIZER_TELLER';

          if (response.data.user.status === 'PENDING_APPROVAL') {
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
            role === 'ADMIN_STAFF' ||
            role === 'MARKETER' ||
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
   * Hybrid approach: Immediate client-side logout + optional server-side invalidation
   * Following pos/vf-ticket pattern for immediate UX, with optional security enhancement
   */
  const logout = useCallback(() => {
    // 1. Clear token immediately (prevents any API calls from using it)
    removeAccessToken();

    // 2. Clear role view from localStorage
    localStorage.removeItem('activeViewRole');

    // 3. Note: We keep rememberedEmail in localStorage so "Remember me" persists across sessions
    // User can uncheck "Remember me" on next login to clear it

    // 4. Dispatch logout immediately to clear state (synchronous)
    dispatch({ type: 'AUTH_LOGOUT' });

    // 5. Dispatch custom event to notify components immediately
    window.dispatchEvent(new Event('tokenChange'));

    // 6. Navigate immediately (no setTimeout delay - like pos/vf-ticket)
    navigate('/', { replace: true });

    // 7. Fire-and-forget server-side token invalidation (optional security enhancement)
    // Don't wait for this - it's non-blocking for better UX
    authApi.logout().catch((error) => {
      // Silently fail - client is already logged out
      console.error('Logout API error (non-blocking):', error);
    });
  }, [dispatch, navigate]);

  /**
   * Refresh user profile
   */
  const refreshProfile = useCallback(async () => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authApi.getProfile();

      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to refresh profile';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
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
        // Try to fetch profile to verify token
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
      // Use requestAnimationFrame to ensure state update propagates
      requestAnimationFrame(() => {
        navigate('/auth/signin');
      });
    });
  }, [dispatch, navigate]);

  return {
    ...state,
    login,
    logout,
    register,
    refreshProfile,
    clearError,
  };
};

