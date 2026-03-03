import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Crown,
  Zap,
  Shield,
  ArrowUpRight,
  XCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader, ButtonLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSubscription, upgradeSubscription, cancelSubscription, type SubscriptionTier, type OrganizerSubscription } from '@/lib/organizer-api';
import { getSubscriptionPlans, type SubscriptionPlanConfig } from '@/lib/subscription-api';
import { extractErrorMessage } from '@/lib/utils/error';
import { useToast } from '@/hooks/useToast';

const TIER_ICONS: Record<SubscriptionTier, React.ElementType> = {
  BASIC: Shield,
  STANDARD: Zap,
  PREMIUM: Crown,
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  BASIC: 'bg-muted text-muted-foreground border-border',
  STANDARD: 'bg-primary/10 text-primary border-primary/30',
  PREMIUM: 'bg-primary/10 text-primary border-primary/30',
};

/** Base features always included in each tier — not admin-configurable */
const TIER_BASE_FEATURES: Record<SubscriptionTier, string[]> = {
  BASIC: [
    'Event creation and management',
    'Basic event analytics',
    'Aggregated attendee counts',
    'QR code ticket scanning',
  ],
  STANDARD: [
    'Everything in Basic',
    'Email communication to consented attendees',
    'Registration analytics',
  ],
  PREMIUM: [
    'Everything in Standard',
    'Geographic heatmaps',
    'Multi-event comparisons',
    'Priority support',
  ],
};

/** Human-readable labels for admin-configured feature keys */
const FEATURE_LABELS: Record<string, string> = {
  attendee_list: 'Attendee list with contact info',
  export: 'Basic attendee data export',
  demographics: 'Demographic data access',
  analytics: 'Advanced analytics',
  advanced_export: 'Advanced data exports',
};

function formatPrice(plan: SubscriptionPlanConfig): string {
  const price = parseFloat(plan.price);
  if (price === 0) return 'Free';
  return `${plan.currency} ${price}/month`;
}

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpgrade = (tier: SubscriptionTier) => {
    setTargetTier(tier);
    setShowUpgradeDialog(true);
    setBillingEmailError('');
  };

  const handleConfirmUpgrade = async () => {
    if (!targetTier) return;

    // Validate billing email for Premium
    if (targetTier === 'PREMIUM' && !billingEmail.trim()) {
      setBillingEmailError('Billing email is required for Premium subscription');
      return;
    }

    if (targetTier === 'PREMIUM' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
      setBillingEmailError('Please enter a valid email address');
      return;
    }

    try {
      setUpgrading(true);
      const response = await upgradeSubscription({
        tier: targetTier,
        billingEmail: targetTier === 'PREMIUM' ? billingEmail : undefined,
      });

      if (response.success) {
        setSubscription(response.data.subscription);
        setShowUpgradeDialog(false);
        setTargetTier(null);
        setBillingEmail('');
        const planName = plans.find(p => p.tier === targetTier)?.name ?? targetTier;
        toast({
          title: 'Subscription upgraded successfully',
          description: `You are now on the ${planName} tier`,
          variant: 'default',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Upgrade failed',
        description: extractErrorMessage(error, 'Unable to upgrade subscription'),
        variant: 'destructive',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription || subscription.tier !== 'PREMIUM') return;

    try {
      setCanceling(true);
      const response = await cancelSubscription();

      if (response.success) {
        await loadData();
        setShowCancelDialog(false);
        toast({
          title: 'Subscription canceled',
          description: 'Your Premium subscription will remain active until it expires',
          variant: 'default',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Cancel failed',
        description: extractErrorMessage(error, 'Unable to cancel subscription'),
        variant: 'destructive',
      });
    } finally {
      setCanceling(false);
    }
  };

  const canUpgradeTo = (tier: SubscriptionTier): boolean => {
    if (!subscription) return false;
    const tierOrder = { BASIC: 0, STANDARD: 1, PREMIUM: 2 };
    return tierOrder[tier] > tierOrder[subscription.tier];
  };

  const isCurrentTier = (tier: SubscriptionTier): boolean => {
    return subscription?.tier === tier;
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
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

  const currentTierIcon = TIER_ICONS[subscription.tier];
  const currentPlan = plans.find(p => p.tier === subscription.tier);
  const currentDescription = currentPlan?.description ?? '';

  // Build display data per plan: base features (always available) + admin-configured feature keys
  const tierEntries = (plans.length > 0 ? plans : []).map((plan) => ({
    tier: plan.tier,
    name: plan.name,
    description: plan.description ?? '',
    price: formatPrice(plan),
    displayFeatures: [
      ...(TIER_BASE_FEATURES[plan.tier] ?? []),
      ...plan.features.map(key => FEATURE_LABELS[key] ?? key),
    ],
    icon: TIER_ICONS[plan.tier],
    color: TIER_COLORS[plan.tier],
  }));

  const targetPlan = targetTier ? plans.find(p => p.tier === targetTier) : null;
  const targetPrice = targetPlan ? formatPrice(targetPlan) : '';

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-page-title">Subscription Management</h1>
          <p className="text-page-subtitle mt-2">
            Manage your subscription tier and access to attendee data
          </p>
        </div>

        {/* Current Subscription Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {React.createElement(currentTierIcon, { className: 'h-6 w-6' })}
                <div>
                  <CardTitle className="text-card-title">Current Plan: {currentPlan?.name ?? subscription.tier}</CardTitle>
                  <CardDescription>{currentDescription}</CardDescription>
                </div>
              </div>
              <Badge className={subscription.isActive
                ? 'bg-success-light text-success border-success hover:bg-success-light/80 hover:border-success/80'
                : 'bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted/80'
              }>
                {subscription.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label className="text-sm text-muted-foreground">Started</Label>
                <p className="font-medium">
                  {new Date(subscription.startedAt).toLocaleDateString()}
                </p>
              </div>
              {subscription.expiresAt && (
                <div>
                  <Label className="text-sm text-muted-foreground">Expires</Label>
                  <p className="font-medium">
                    {new Date(subscription.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {subscription.billingEmail && (
                <div>
                  <Label className="text-sm text-muted-foreground">Billing Email</Label>
                  <p className="font-medium">{subscription.billingEmail}</p>
                </div>
              )}
            </div>

            {subscription.tier === 'PREMIUM' && subscription.isActive && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tier Comparison */}
        <div>
          <h2 className="text-section-header mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tierEntries.map((entry) => {
              const TierIcon = entry.icon;
              const isCurrent = isCurrentTier(entry.tier);
              const canUpgrade = canUpgradeTo(entry.tier);
              const isPremium = entry.tier === 'PREMIUM';

              return (
                <Card
                  key={entry.tier}
                  className={`relative ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                >
                  {isCurrent && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <TierIcon className={`h-8 w-8 ${entry.color.split(' ')[1]}`} />
                      <CardTitle className="text-card-title">{entry.name}</CardTitle>
                    </div>
                    <CardDescription>{entry.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-2xl font-bold">{entry.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {entry.displayFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {canUpgrade && (
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade(entry.tier)}
                        disabled={upgrading}
                      >
                        {isPremium ? (
                          <>
                            <Crown className="h-4 w-4 mr-2" />
                            Upgrade to Premium
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            Upgrade to {entry.name}
                          </>
                        )}
                      </Button>
                    )}
                    {isCurrent && (
                      <Button className="w-full" variant="outline" disabled>
                        Current Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Upgrade to {targetPlan?.name ?? targetTier}
              </DialogTitle>
              <DialogDescription>
                {targetTier === 'PREMIUM'
                  ? `Please provide your billing email to complete the upgrade. Premium subscriptions are ${targetPrice}.`
                  : 'You\'ll be upgraded to the Standard tier for free. This includes access to attendee contact information with their consent.'}
              </DialogDescription>
            </DialogHeader>
            {targetTier === 'PREMIUM' && (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="billingEmail">Billing Email *</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={billingEmail}
                    onChange={(e) => {
                      setBillingEmail(e.target.value);
                      setBillingEmailError('');
                    }}
                    placeholder="billing@example.com"
                    className={billingEmailError ? 'border-destructive' : ''}
                  />
                  {billingEmailError && (
                    <p className="text-sm text-destructive mt-1">{billingEmailError}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll use this email for subscription invoices and payment notifications
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpgradeDialog(false);
                  setBillingEmailError('');
                }}
                disabled={upgrading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpgrade}
                disabled={upgrading}
              >
                {upgrading ? (
                  <>
                    <ButtonLoader />
                    Processing...
                  </>
                ) : (
                  'Confirm Upgrade'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Premium Subscription</DialogTitle>
              <DialogDescription>
                Your Premium subscription will remain active until {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'the end of your billing period'}.
                You'll be downgraded to the Standard tier (free) after expiration.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={canceling}
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={canceling}
              >
                {canceling ? (
                  <>
                    <ButtonLoader />
                    Processing...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default SubscriptionManagement;
