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
   */
  const getDashboardRoute = useCallback((role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.STAFF:
        return '/admin/dashboard';
      case UserRole.ORGANIZER:
        return '/organizer/dashboard';
      case UserRole.ATTENDEE:
      default:
        return '/user/dashboard';
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch({ type: 'AUTH_START' });

        const response = await authApi.login({ email, password });

        if (response.success && response.data) {
          setAccessToken(response.data.accessToken);
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });

          // Redirect to appropriate dashboard
          const dashboardRoute = getDashboardRoute(response.data.user.role);
          navigate(dashboardRoute);
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

          // Redirect to appropriate dashboard
          const dashboardRoute = getDashboardRoute(response.data.user.role);
          navigate(dashboardRoute);
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
   */
  const logout = useCallback(async () => {
    try {
      // Call logout API
      await authApi.logout();
    } catch (error) {
      // Even if API call fails, clear local state
      console.error('Logout error:', error);
    } finally {
      removeAccessToken();
      dispatch({ type: 'AUTH_LOGOUT' });
      navigate('/');
    }
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
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && !state.user) {
        // Try to fetch profile to verify token
        try {
          await refreshProfile();
        } catch {
          // Token is invalid, clear it
          removeAccessToken();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * Set logout callback for API client to call on token refresh failure
   */
  useEffect(() => {
    setLogoutCallback(() => {
      removeAccessToken();
      dispatch({ type: 'AUTH_LOGOUT' });
      navigate('/auth/signin');
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

