/**
 * Onboarding Hook
 *
 * Provides functionality for managing user onboarding flow:
 * - Get onboarding status
 * - Save progress
 * - Complete onboarding (with smart role upgrade)
 * - Skip onboarding
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from './useAuthContext';
import * as onboardingApi from '../lib/onboarding-api';
import type { EventPreferences } from '../lib/onboarding-api';

interface OnboardingState {
  isLoading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  savedPreferences: EventPreferences | null;
}

export const useOnboarding = () => {
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingState>({
    isLoading: false,
    error: null,
    onboardingCompleted: false,
    savedPreferences: null,
  });

  /**
   * Get onboarding status and saved preferences
   */
  const getStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await onboardingApi.getOnboardingStatus();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          onboardingCompleted: response.data.onboardingCompleted,
          savedPreferences: response.data.savedPreferences,
        }));

        return response.data;
      } else {
        throw new Error('Failed to get onboarding status');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to get onboarding status';

      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  /**
   * Save onboarding progress without completing
   */
  const saveProgress = useCallback(async (preferences: EventPreferences) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await onboardingApi.saveOnboardingProgress(preferences);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          savedPreferences: preferences,
        }));

        return response;
      } else {
        throw new Error(response.message || 'Failed to save progress');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to save progress';

      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  /**
   * Complete onboarding with final preferences
   * Smart role upgrade: Upgrades to ORGANIZER if intent is 'organize' or 'both'
   */
  const complete = useCallback(async (preferences: EventPreferences) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await onboardingApi.completeOnboarding(preferences);

      if (response.success && response.data) {
        // Update user in auth context
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });

        setState(prev => ({
          ...prev,
          isLoading: false,
          onboardingCompleted: true,
        }));

        // Navigate to dashboard
        navigate('/dashboard');

        return response;
      } else {
        throw new Error(response.message || 'Failed to complete onboarding');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to complete onboarding';

      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [dispatch, navigate]);

  /**
   * Skip onboarding and go directly to dashboard
   */
  const skip = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await onboardingApi.skipOnboarding();

      if (response.success && response.data) {
        // Update user in auth context
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });

        setState(prev => ({
          ...prev,
          isLoading: false,
          onboardingCompleted: true,
        }));

        // Navigate to dashboard
        navigate('/dashboard');

        return response;
      } else {
        throw new Error(response.message || 'Failed to skip onboarding');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to skip onboarding';

      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [dispatch, navigate]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    getStatus,
    saveProgress,
    complete,
    skip,
    clearError,
  };
};
