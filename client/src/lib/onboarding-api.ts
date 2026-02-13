/**
 * Onboarding API Functions
 */

import { apiGet, apiPost, type ApiResponse } from './api';
import type { User } from './auth-api';

/**
 * Event preferences structure for onboarding
 */
export interface EventPreferences {
  intent?: 'attend' | 'organize' | 'both';
  eventInterests?: string[];
  organizerEventTypes?: string[];
  location?: {
    city?: string;
    country?: string;
  };
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

/**
 * Onboarding status response
 */
export interface OnboardingStatusResponse {
  success: boolean;
  data: {
    onboardingCompleted: boolean;
    onboardingCompletedAt: string | null;
    savedPreferences: EventPreferences | null;
  };
}

/**
 * Onboarding complete/update response
 */
export interface OnboardingResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Get onboarding status and saved preferences
 */
export const getOnboardingStatus = async (): Promise<OnboardingStatusResponse> => {
  return apiGet<OnboardingStatusResponse>('/onboarding/status');
};

/**
 * Save onboarding progress without completing
 * Allows users to save their preferences and continue later
 */
export const saveOnboardingProgress = async (
  preferences: EventPreferences
): Promise<OnboardingResponse> => {
  return apiPost<OnboardingResponse>('/onboarding/progress', { preferences });
};

/**
 * Complete onboarding with final preferences
 * Marks onboarding as complete and upgrades role based on intent
 */
export const completeOnboarding = async (
  preferences: EventPreferences
): Promise<OnboardingResponse> => {
  return apiPost<OnboardingResponse>('/onboarding/complete', { preferences });
};

/**
 * Skip onboarding
 * Marks onboarding as complete without setting preferences
 */
export const skipOnboarding = async (): Promise<OnboardingResponse> => {
  return apiPost<OnboardingResponse>('/onboarding/skip');
};
