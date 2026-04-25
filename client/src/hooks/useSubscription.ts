import { useState, useEffect } from 'react';
import { getSubscription } from '@/lib/organizer-api';
import type { SubscriptionTier } from '@/lib/subscription-api';

export type { SubscriptionTier };

export const TIER_ORDER: Record<SubscriptionTier, number> = {
  BASIC: 0,
  STANDARD: 1,
  PREMIUM: 2,
  ENTERPRISE: 3,
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  BASIC: 'Basic',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise',
};

/**
 * Maps every gated feature key to the minimum tier required.
 * BASIC organizers get none of these — all require at least STANDARD.
 */
export const FEATURE_TIER_MINIMUM: Record<string, SubscriptionTier> = {
  // ── STANDARD ────────────────────────────────────────────────────────────
  attendee_list: 'STANDARD',
  export: 'STANDARD',
  email_attendees: 'STANDARD',
  forms: 'STANDARD',
  custom_branding: 'STANDARD',
  promo_codes: 'STANDARD',
  whatsapp_delivery: 'STANDARD',
  whatsapp_reminders: 'STANDARD',
  team_members: 'STANDARD',
  tracking_links: 'STANDARD',
  on_site_sales: 'STANDARD',
  multi_day_events: 'STANDARD',
  event_templates: 'STANDARD',
  offline_scanning: 'STANDARD',
  realtime_checkin_dashboard: 'STANDARD',
  post_event_survey: 'STANDARD',

  // ── PREMIUM ─────────────────────────────────────────────────────────────
  demographics: 'PREMIUM',
  analytics: 'PREMIUM',
  advanced_export: 'PREMIUM',
  heatmaps: 'PREMIUM',
  whatsapp_ai_registration: 'PREMIUM',
  whatsapp_broadcast: 'PREMIUM',
  promoter_network: 'PREMIUM',
  recurring_events: 'PREMIUM',
  seating_plans: 'PREMIUM',
  embed_widget: 'PREMIUM',
  api_access: 'PREMIUM',
  split_payouts: 'PREMIUM',
  priority_support: 'PREMIUM',
  tax_reports: 'PREMIUM',
  event_comparison: 'PREMIUM',
  revenue_forecast: 'PREMIUM',
  social_login: 'PREMIUM',
  retargeting_pixels: 'PREMIUM',
  early_payout: 'PREMIUM',
  unlimited_team: 'PREMIUM',

  // ── ENTERPRISE ──────────────────────────────────────────────────────────
  white_label: 'ENTERPRISE',
  custom_integrations: 'ENTERPRISE',
  sso: 'ENTERPRISE',
  dedicated_support: 'ENTERPRISE',
  on_site_hardware: 'ENTERPRISE',
  agency_management: 'ENTERPRISE',
  custom_analytics: 'ENTERPRISE',
};

interface UseSubscriptionResult {
  tier: SubscriptionTier;
  isLoading: boolean;
  /** True if the organizer's tier meets the minimum required for this feature. */
  hasFeature: (key: string) => boolean;
  /** The minimum tier required to access this feature. */
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
    if (!required) return true;
    return TIER_ORDER[tier] >= TIER_ORDER[required];
  };

  const requiredTierFor = (key: string): SubscriptionTier =>
    FEATURE_TIER_MINIMUM[key] ?? 'BASIC';

  return { tier, isLoading, hasFeature, requiredTierFor };
}
