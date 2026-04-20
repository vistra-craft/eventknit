/**
 * Subscription & Consent API Functions
 */

import { apiGet, apiPost } from './api';

// ========== Subscription Management ==========

/**
 * Subscription Tier
 */
export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

/**
 * Organizer Subscription
 */
export interface OrganizerSubscription {
  id: string;
  organizerId: string;
  tier: SubscriptionTier;
  startedAt: string;
  expiresAt?: string | null;
  isActive: boolean;
  canceledAt?: string | null;
  billingEmail?: string | null;
  nextBillingDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get organizer subscription
 */
export const getSubscription = async (): Promise<{ success: boolean; data: { subscription: OrganizerSubscription } }> => {
  return apiGet('/organizer-dashboard/subscription');
};

/**
 * Upgrade subscription tier data
 */
export interface UpgradeSubscriptionData {
  tier: SubscriptionTier;
  billingEmail?: string; // Required for PREMIUM tier
}

/**
 * Upgrade subscription tier
 */
export const upgradeSubscription = async (data: UpgradeSubscriptionData): Promise<{ success: boolean; data: { subscription: OrganizerSubscription } }> => {
  return apiPost('/organizer-dashboard/subscription/upgrade', data);
};

/**
 * Cancel Premium subscription
 */
export const cancelSubscription = async (): Promise<{ success: boolean; message: string; data: { subscription: OrganizerSubscription } }> => {
  return apiPost('/organizer-dashboard/subscription/cancel', {});
};

// ========== Subscription Plans (public) ==========

/**
 * Subscription plan configuration from admin
 */
export interface SubscriptionPlanConfig {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string | null;
  price: string; // Decimal as string
  currency: string;
  features: string[];
  isActive: boolean;
}

/**
 * Get subscription plans (for organizer pricing/upgrade page)
 */
export const getSubscriptionPlans = async (): Promise<{ success: boolean; data: { plans: SubscriptionPlanConfig[] } }> => {
  return apiGet('/organizer-dashboard/subscription-plans');
};

// ========== Subscription Payment ==========

/**
 * Initialize subscription payment data
 */
export interface InitializeSubscriptionPaymentData {
  tier: SubscriptionTier;
  billingEmail: string;
}

/**
 * Initialize subscription payment (returns Paystack authorization URL)
 */
export const initializeSubscriptionPayment = async (
  data: InitializeSubscriptionPaymentData,
): Promise<{
  success: boolean;
  data: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
    paymentId: string;
  };
}> => {
  return apiPost('/organizer-dashboard/subscription/pay', data);
};

/**
 * Verify subscription payment after Paystack callback
 */
export const verifySubscriptionPayment = async (
  reference: string,
): Promise<{
  success: boolean;
  data: {
    status: 'SUCCESS' | 'FAILED';
    subscription: OrganizerSubscription | null;
  };
}> => {
  return apiGet(`/organizer-dashboard/subscription/verify?reference=${reference}`);
};

// ========== Consent Management ==========

/**
 * Consent Statistics
 */
export interface ConsentStatistics {
  totalRegistrations: number;
  totalConsents: number;
  operational: {
    count: number;
    percentage: number;
  };
  marketing: {
    count: number;
    percentage: number;
  };
  demographics: {
    count: number;
    percentage: number;
  };
  analytics: {
    count: number;
    percentage: number;
  };
}

/**
 * Get consent statistics for an event
 */
export const getEventConsentStats = async (eventId: string): Promise<{ success: boolean; data: ConsentStatistics }> => {
  return apiGet(`/organizer-dashboard/events/${eventId}/consent-stats`);
};

