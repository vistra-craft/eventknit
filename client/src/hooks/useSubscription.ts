import { useState, useEffect } from 'react';
import { getSubscription } from '@/lib/organizer-api';
import type { SubscriptionTier } from '@/lib/subscription-api';

export type { SubscriptionTier };

const TIER_ORDER: Record<SubscriptionTier, number> = {
  BASIC: 0,
  STANDARD: 1,
  PREMIUM: 2,
};

/**
 * Maps feature keys to the minimum subscription tier required to access them.
 * The backend enforces this at the API layer; this map drives the UI gates.
 */
export const FEATURE_TIER_MINIMUM: Record<string, SubscriptionTier> = {
  // STANDARD features
  attendee_list: 'STANDARD',   // view attendee contact info
  export: 'STANDARD',          // basic attendee data export
  email_attendees: 'STANDARD', // email communication to attendees
  forms: 'STANDARD',           // participant forms + people management

  // PREMIUM features
  demographics: 'PREMIUM',     // demographic data access
  analytics: 'PREMIUM',        // advanced analytics
  advanced_export: 'PREMIUM',  // advanced data exports + heatmaps
  heatmaps: 'PREMIUM',
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  BASIC: 'Basic',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
};

interface UseSubscriptionResult {
  tier: SubscriptionTier;
  isLoading: boolean;
  /** Returns true if the organizer's tier meets the minimum for this feature. */
  hasFeature: (key: string) => boolean;
  /** Returns the minimum tier required for this feature. */
  requiredTierFor: (key: string) => SubscriptionTier;
}

export function useSubscription(): UseSubscriptionResult {
  const [tier, setTier] = useState<SubscriptionTier>('BASIC');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSubscription()
      .then((res) => {
        if (res.success) setTier(res.data.subscription.tier);
      })
      .catch(() => { /* default to BASIC */ })
      .finally(() => setIsLoading(false));
  }, []);

  const hasFeature = (key: string): boolean => {
    const required = FEATURE_TIER_MINIMUM[key];
    if (!required) return true; // unknown key = ungated
    return TIER_ORDER[tier] >= TIER_ORDER[required];
  };

  const requiredTierFor = (key: string): SubscriptionTier =>
    FEATURE_TIER_MINIMUM[key] ?? 'BASIC';

  return { tier, isLoading, hasFeature, requiredTierFor };
}
