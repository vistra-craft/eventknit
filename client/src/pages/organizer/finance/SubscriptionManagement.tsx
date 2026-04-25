import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Crown,
  Zap,
  Shield,
  Building2,
  ArrowUpRight,
  XCircle,
  Check,
  Clock,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader, ButtonLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSubscription, upgradeSubscription, cancelSubscription, type SubscriptionTier, type OrganizerSubscription } from '@/lib/organizer-api';
import {
  getSubscriptionPlans,
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
  type SubscriptionPlanConfig,
} from '@/lib/subscription-api';
import { extractErrorMessage } from '@/lib/utils/error';
import { useToast } from '@/hooks/useToast';

// ─── Config ───────────────────────────────────────────────────────────────────

const TIER_ORDER: Record<SubscriptionTier, number> = {
  BASIC: 0, STANDARD: 1, PREMIUM: 2, ENTERPRISE: 3,
};

const TIER_CONFIG: Record<SubscriptionTier, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  ringColor: string;
  badgeClass: string;
}> = {
  BASIC: {
    icon: Shield,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    ringColor: 'ring-border',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
  STANDARD: {
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    ringColor: 'ring-blue-400',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
  },
  PREMIUM: {
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    ringColor: 'ring-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
  },
  ENTERPRISE: {
    icon: Building2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    ringColor: 'ring-purple-400',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
  },
};

/**
 * Core platform features always included at each tier — not the gated data
 * features stored in the DB, but the structural capabilities of the plan.
 */
const TIER_BASE_FEATURES: Record<SubscriptionTier, string[]> = {
  BASIC: [
    'Up to 3 active events',
    'M-Pesa + card payments',
    'QR code scanning (mobile app)',
    'Free & paid ticket types',
    'Email ticket delivery',
    'Aggregate event stats',
    'Platform fee: 7.5% per ticket',
  ],
  STANDARD: [
    'Unlimited active events',
    'Platform fee reduced to 5%',
    'Up to 5 team members',
    'Custom event page branding',
    'Everything in Basic',
  ],
  PREMIUM: [
    'Platform fee reduced to 3%',
    'Unlimited team members',
    'Priority 24h support',
    'Everything in Standard',
  ],
  ENTERPRISE: [
    'Negotiated 0% platform fee',
    'Dedicated account manager',
    'Custom SLA guarantee',
    'On-site hardware & field team',
    'Everything in Premium',
  ],
};

/** Human-readable labels for DB-stored feature keys (shown as bonuses per plan) */
const FEATURE_LABELS: Record<string, string> = {
  attendee_list: 'Attendee list with contact info',
  export: 'CSV attendee data export',
  email_attendees: 'Email communication to attendees',
  forms: 'Participant forms & people management',
  custom_branding: 'Remove EventKnit branding',
  promo_codes: 'Promotional / discount codes',
  whatsapp_delivery: 'WhatsApp ticket delivery',
  whatsapp_reminders: 'WhatsApp event reminders (24h + 1h)',
  team_members: 'Team member access (up to 5)',
  tracking_links: 'UTM tracking links per channel',
  on_site_sales: 'On-site walk-in ticket sales',
  multi_day_events: 'Multi-day event setup',
  event_templates: 'Event templates & duplication',
  offline_scanning: 'Offline QR scanning (sync on reconnect)',
  realtime_checkin_dashboard: 'Real-time check-in dashboard',
  post_event_survey: 'Post-event attendee survey',
  demographics: 'Demographic data access',
  analytics: 'Advanced analytics & traffic breakdown',
  advanced_export: 'Advanced exports (Excel, scheduled)',
  heatmaps: 'Geographic attendee heatmaps',
  whatsapp_ai_registration: 'WhatsApp AI registration flow',
  whatsapp_broadcast: 'WhatsApp broadcast to past attendees',
  promoter_network: 'Promoter & affiliate network',
  recurring_events: 'Recurring event setup',
  seating_plans: 'Drag-and-drop seating plan builder',
  embed_widget: 'Embed widget for external sites',
  api_access: 'REST API + webhooks',
  split_payouts: 'Split payouts between recipients',
  priority_support: 'Priority 24h support',
  tax_reports: 'Tax reports & invoice generation',
  event_comparison: 'Cross-event comparison analytics',
  revenue_forecast: 'Revenue payout forecast',
  social_login: 'Google / Apple login for attendees',
  retargeting_pixels: 'Meta Pixel / Google Tag pass-through',
  early_payout: 'Early payout requests',
  unlimited_team: 'Unlimited team members',
  white_label: 'White-label / custom domain',
  custom_integrations: 'Salesforce, HubSpot, custom CRM',
  sso: 'SSO / SAML integration',
  dedicated_support: 'Dedicated account manager + SLA',
  on_site_hardware: 'On-site hardware & field support',
  agency_management: 'Agency sub-account management',
  custom_analytics: 'Custom analytics / data warehouse',
};

/** Features that exist in the gate system but aren't built yet */
const COMING_SOON_FEATURES = new Set([
  'whatsapp_ai_registration',
  'promoter_network',
  'recurring_events',
  'seating_plans',
  'embed_widget',
  'split_payouts',
  'tax_reports',
]);

function formatPrice(plan: SubscriptionPlanConfig): string {
  const price = parseFloat(plan.price);
  if (price === 0) return 'Free';
  if (plan.tier === 'ENTERPRISE') return `KES ${price.toLocaleString()}+/mo`;
  return `KES ${price.toLocaleString()}/mo`;
}

function isPaidPlan(plan: SubscriptionPlanConfig | undefined): boolean {
  if (!plan) return false;
  return parseFloat(plan.price) > 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [subscription, setSubscription] = useState<OrganizerSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>([]);
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [targetTier, setTargetTier] = useState<SubscriptionTier | null>(null);
  const [billingEmail, setBillingEmail] = useState('');
  const [billingEmailError, setBillingEmailError] = useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [subResponse, plansResponse] = await Promise.all([
        getSubscription(),
        getSubscriptionPlans(),
      ]);
      if (subResponse.success) {
        setSubscription(subResponse.data.subscription);
        setBillingEmail(subResponse.data.subscription.billingEmail || '');
      }
      if (plansResponse.success) {
        setPlans(plansResponse.data.plans);
      }
    } catch (error: unknown) {
      toast({
        title: 'Failed to load subscription',
        description: extractErrorMessage(error, 'Unable to load subscription data'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle Paystack callback
  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference || !reference.startsWith('SUB-')) return;

    const verify = async () => {
      setVerifying(true);
      try {
        const result = await verifySubscriptionPayment(reference);
        if (result.success && result.data.status === 'SUCCESS' && result.data.subscription) {
          setSubscription(result.data.subscription);
          toast({ title: 'Payment successful', description: `Upgraded to ${result.data.subscription.tier}` });
        } else {
          toast({ title: 'Payment verification failed', description: 'Contact support if you were charged', variant: 'destructive' });
        }
      } catch (error: unknown) {
        toast({ title: 'Verification error', description: extractErrorMessage(error, 'Unable to verify payment'), variant: 'destructive' });
      } finally {
        setVerifying(false);
        setSearchParams({}, { replace: true });
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = (tier: SubscriptionTier) => {
    if (tier === 'ENTERPRISE') {
      window.location.href = 'mailto:enterprise@eventknit.com?subject=Enterprise Plan Enquiry';
      return;
    }
    setTargetTier(tier);
    setShowUpgradeDialog(true);
    setBillingEmailError('');
  };

  const handleConfirmUpgrade = async () => {
    if (!targetTier) return;
    const targetPlanConfig = plans.find(p => p.tier === targetTier);
    const paid = isPaidPlan(targetPlanConfig);

    if (paid && !billingEmail.trim()) { setBillingEmailError('Billing email is required'); return; }
    if (paid && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) { setBillingEmailError('Enter a valid email address'); return; }

    try {
      setUpgrading(true);
      if (paid) {
        const paymentResponse = await initializeSubscriptionPayment({ tier: targetTier, billingEmail: billingEmail.trim() });
        if (paymentResponse.success && paymentResponse.data.authorizationUrl) {
          setShowUpgradeDialog(false);
          window.location.href = paymentResponse.data.authorizationUrl;
          return;
        }
      } else {
        const response = await upgradeSubscription({ tier: targetTier, billingEmail: undefined });
        if (response.success) {
          setSubscription(response.data.subscription);
          setShowUpgradeDialog(false);
          setTargetTier(null);
          toast({ title: 'Subscription upgraded', description: `Now on ${plans.find(p => p.tier === targetTier)?.name ?? targetTier}` });
        }
      }
    } catch (error: unknown) {
      toast({ title: 'Upgrade failed', description: extractErrorMessage(error, 'Unable to upgrade subscription'), variant: 'destructive' });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    try {
      setCanceling(true);
      const response = await cancelSubscription();
      if (response.success) {
        await loadData();
        setShowCancelDialog(false);
        toast({ title: 'Subscription canceled', description: 'Remains active until expiry' });
      }
    } catch (error: unknown) {
      toast({ title: 'Cancel failed', description: extractErrorMessage(error, 'Unable to cancel'), variant: 'destructive' });
    } finally {
      setCanceling(false);
    }
  };

  const [selectedPlanTier, setSelectedPlanTier] = useState<SubscriptionTier | null>(null);

  const canUpgradeTo = (tier: SubscriptionTier): boolean => {
    if (!subscription) return false;
    return TIER_ORDER[tier] > TIER_ORDER[subscription.tier];
  };

  if (loading || verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader size="lg" />
        {verifying && <p className="text-sm text-muted-foreground">Verifying payment...</p>}
      </div>
    );
  }

  if (!subscription) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load subscription information</AlertDescription>
      </Alert>
    );
  }

  const currentPlan = plans.find(p => p.tier === subscription.tier);
  const currentCfg = TIER_CONFIG[subscription.tier];
  const CurrentIcon = currentCfg.icon;
  const currentIsPaid = isPaidPlan(currentPlan);

  // Sort plans by tier order
  const sortedPlans = [...plans].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

  // Build display entries
  const tierEntries = sortedPlans.map((plan) => {
    const cfg = TIER_CONFIG[plan.tier];
    const baseFeatures = TIER_BASE_FEATURES[plan.tier] ?? [];
    const dbFeatures = plan.features
      .map(key => ({ label: FEATURE_LABELS[key] ?? key, comingSoon: COMING_SOON_FEATURES.has(key) }))
      // De-duplicate with base features and only show additive ones
      .filter(f => !baseFeatures.includes(f.label));

    return { plan, cfg, baseFeatures, dbFeatures };
  });

  const targetPlanConfig = targetTier ? plans.find(p => p.tier === targetTier) : undefined;
  const targetIsPaid = isPaidPlan(targetPlanConfig);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-page-title">Subscription</h1>
        <p className="text-page-subtitle mt-1">Choose the plan that fits your events. All plans include M-Pesa and card payments.</p>
      </div>

      {/* Current Plan Summary */}
      <Card className={`border-2 ${currentCfg.ringColor} border-opacity-50`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${currentCfg.bgColor}`}>
                <CurrentIcon className={`h-5 w-5 ${currentCfg.color}`} />
              </div>
              <div>
                <CardTitle className="text-base">
                  {currentPlan?.name ?? subscription.tier} Plan
                  {subscription.isActive
                    ? <Badge className="ml-2 text-[10px] bg-green-50 text-green-700 border-green-300">Active</Badge>
                    : <Badge className="ml-2 text-[10px]" variant="secondary">Inactive</Badge>}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {currentPlan?.description ?? 'Your current subscription tier'}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{currentPlan ? formatPrice(currentPlan) : '—'}</p>
              {subscription.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Renews {new Date(subscription.expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        {currentIsPaid && subscription.isActive && (
          <CardContent className="pt-0">
            <Separator className="mb-3" />
            <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)} className="text-destructive hover:text-destructive">
              <XCircle className="h-3.5 w-3.5 mr-2" />
              Cancel Subscription
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Plan Cards */}
      <h2 className="text-base font-semibold">Available Plans</h2>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tierEntries.map(({ plan, cfg, baseFeatures, dbFeatures }) => {
          const Icon = cfg.icon;
          const isCurrent = subscription.tier === plan.tier;
          const canUpgrade = canUpgradeTo(plan.tier);
          const price = parseFloat(plan.price);
          const isEnterprise = plan.tier === 'ENTERPRISE';

          return (
            <Card
              key={plan.tier}
              onClick={() => setSelectedPlanTier(plan.tier)}
              className={`relative flex flex-col transition-all cursor-pointer ${isCurrent ? `ring-2 ${cfg.ringColor} shadow-md` : 'hover:shadow-md hover:border-border/80'}`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-4 z-10">
                  <Badge className={`gap-1 pl-1.5 text-xs border ${cfg.badgeClass}`}>
                    <CheckCircle2 className="h-3 w-3" /> Current plan
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${cfg.bgColor}`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <CardTitle className="text-sm font-semibold">{plan.name}</CardTitle>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold">
                    {price === 0 ? 'Free' : `KES ${price.toLocaleString()}`}
                  </span>
                  {price > 0 && (
                    <span className="text-xs text-muted-foreground">{isEnterprise ? '/mo+' : '/mo'}</span>
                  )}
                </div>
                {isEnterprise && (
                  <p className="text-[11px] text-muted-foreground">Custom pricing — contact sales</p>
                )}
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-3">
                {/* Core / structural features */}
                <div className="space-y-1.5">
                  {baseFeatures.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-xs">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Gated feature bonuses (first 5, don't repeat base) */}
                {dbFeatures.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      {dbFeatures.slice(0, 5).map(({ label, comingSoon }) => (
                        <div key={label} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-xs flex-1">{label}</span>
                          {comingSoon && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 rounded border border-amber-300 bg-amber-50 px-1 py-0.5 text-[9px] font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              <Clock className="h-2 w-2" /> Soon
                            </span>
                          )}
                        </div>
                      ))}
                      {dbFeatures.length > 5 && (
                        <p className="text-[11px] text-muted-foreground pl-5">+{dbFeatures.length - 5} more features</p>
                      )}
                    </div>
                  </>
                )}

                {/* CTA — pushed to bottom */}
                <div className="mt-auto pt-2">
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" size="sm" disabled onClick={(e) => e.stopPropagation()}>Current Plan</Button>
                  ) : canUpgrade ? (
                    isEnterprise ? (
                      <Button className="w-full" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleUpgrade('ENTERPRISE'); }}>
                        <Mail className="h-3.5 w-3.5 mr-2" /> Contact Sales
                      </Button>
                    ) : (
                      <Button className="w-full" size="sm" onClick={(e) => { e.stopPropagation(); handleUpgrade(plan.tier); }} disabled={upgrading}>
                        <ArrowUpRight className="h-3.5 w-3.5 mr-2" />
                        Upgrade — {formatPrice(plan)}
                      </Button>
                    )
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Detail Dialog */}
      {(() => {
        const detailPlan = selectedPlanTier ? plans.find(p => p.tier === selectedPlanTier) : null;
        if (!detailPlan || !selectedPlanTier) return null;
        const cfg = TIER_CONFIG[selectedPlanTier];
        const Icon = cfg.icon;
        const baseFeatures = TIER_BASE_FEATURES[selectedPlanTier] ?? [];
        const allDbFeatures = detailPlan.features.map(key => ({
          key,
          label: FEATURE_LABELS[key] ?? key,
          comingSoon: COMING_SOON_FEATURES.has(key),
        }));
        const isCurrent = subscription?.tier === selectedPlanTier;
        const canUpgradeToSelected = canUpgradeTo(selectedPlanTier);
        const isEnterprise = selectedPlanTier === 'ENTERPRISE';

        return (
          <Dialog open={!!selectedPlanTier} onOpenChange={(open) => { if (!open) setSelectedPlanTier(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-2.5 rounded-xl ${cfg.bgColor}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div>
                    <DialogTitle>{detailPlan.name} Plan</DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      {detailPlan.description ?? 'All features included in this plan'}
                    </DialogDescription>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="text-lg font-bold">{formatPrice(detailPlan)}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="overflow-y-auto max-h-[55vh] pr-1 space-y-4">
                {/* Structural features */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Platform capabilities</p>
                  <div className="space-y-1.5">
                    {baseFeatures.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gated features */}
                {allDbFeatures.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Included features</p>
                    <div className="space-y-1.5">
                      {allDbFeatures.map(({ key, label, comingSoon }) => (
                        <div key={key} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm flex-1">{label}</span>
                          {comingSoon && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              <Clock className="h-2.5 w-2.5" /> Soon
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedPlanTier(null)}>Close</Button>
                {!isCurrent && canUpgradeToSelected && (
                  isEnterprise ? (
                    <Button variant="outline" onClick={() => { setSelectedPlanTier(null); handleUpgrade('ENTERPRISE'); }}>
                      <Mail className="h-3.5 w-3.5 mr-2" /> Contact Sales
                    </Button>
                  ) : (
                    <Button onClick={() => { setSelectedPlanTier(null); handleUpgrade(selectedPlanTier); }}>
                      <ArrowUpRight className="h-3.5 w-3.5 mr-2" />
                      Upgrade — {formatPrice(detailPlan)}
                    </Button>
                  )
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {targetPlanConfig?.name ?? targetTier}</DialogTitle>
            <DialogDescription>
              {targetIsPaid
                ? `You'll be redirected to Paystack to complete payment. ${targetPlanConfig?.name} is ${targetPlanConfig ? formatPrice(targetPlanConfig) : ''}.`
                : `You'll be upgraded to ${targetPlanConfig?.name ?? targetTier} immediately.`}
            </DialogDescription>
          </DialogHeader>
          {targetIsPaid && (
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="billingEmail">Billing Email *</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={billingEmail}
                  onChange={(e) => { setBillingEmail(e.target.value); setBillingEmailError(''); }}
                  placeholder="billing@yourorg.com"
                  className={billingEmailError ? 'border-destructive' : ''}
                />
                {billingEmailError && <p className="text-xs text-destructive mt-1">{billingEmailError}</p>}
                <p className="text-xs text-muted-foreground mt-1">Used for invoices and payment notifications</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUpgradeDialog(false); setBillingEmailError(''); }} disabled={upgrading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpgrade} disabled={upgrading}>
              {upgrading ? <><ButtonLoader />Processing...</> : targetIsPaid ? 'Proceed to Payment' : 'Confirm Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {currentPlan?.name ?? subscription.tier} Subscription</DialogTitle>
            <DialogDescription>
              Your subscription stays active until{' '}
              {subscription.expiresAt
                ? new Date(subscription.expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'the end of the billing period'}
              . After that you'll revert to Basic.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={canceling}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={canceling}>
              {canceling ? <><ButtonLoader />Processing...</> : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
