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
import OrganizerLayout from './OrganizerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader, ButtonLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSubscription, upgradeSubscription, cancelSubscription, type SubscriptionTier, type OrganizerSubscription } from '@/lib/organizer-api';
import { useToast } from '@/hooks/useToast';

const TIER_INFO = {
  BASIC: {
    name: 'Basic',
    icon: Shield,
    color: 'bg-muted text-muted-foreground border-border',
    description: 'Free tier with aggregated data only',
    features: [
      'Event creation and management',
      'Basic event analytics',
      'Aggregated attendee counts',
      'QR code ticket scanning',
    ],
    price: 'Free',
  },
  STANDARD: {
    name: 'Standard',
    icon: Zap,
    color: 'bg-primary/10 text-primary border-primary/30',
    description: 'Free tier with basic attendee data (requires consent)',
    features: [
      'Everything in Basic',
      'Attendee list with contact info',
      'Basic attendee data export',
      'Email communication to consented attendees',
      'Registration analytics',
    ],
    price: 'Free',
  },
  PREMIUM: {
    name: 'Premium',
    icon: Crown,
    color: 'bg-primary/10 text-primary border-primary/30',
    description: 'Paid tier with advanced analytics and demographics',
    features: [
      'Everything in Standard',
      'Demographic data access',
      'Engagement analytics',
      'Advanced data exports',
      'Geographic heatmaps',
      'Multi-event comparisons',
      'Priority support',
    ],
    price: '$10/month',
  },
};

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<OrganizerSubscription | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [targetTier, setTargetTier] = useState<SubscriptionTier | null>(null);
  const [billingEmail, setBillingEmail] = useState('');
  const [billingEmailError, setBillingEmailError] = useState('');

  const loadSubscription = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSubscription();
      if (response.success) {
        setSubscription(response.data.subscription);
        setBillingEmail(response.data.subscription.billingEmail || '');
      }
    } catch (error: unknown) {
      toast({
        title: 'Failed to load subscription',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

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
        toast({
          title: 'Subscription upgraded successfully',
          description: `You are now on the ${TIER_INFO[targetTier].name} tier`,
          variant: 'default',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Upgrade failed',
        description: error instanceof Error ? error.message : 'An error occurred while upgrading',
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
        await loadSubscription(); // Reload to get updated subscription
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
        description: error instanceof Error ? error.message : 'An error occurred while canceling',
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
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </OrganizerLayout>
    );
  }

  if (!subscription) {
    return (
      <OrganizerLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load subscription information</AlertDescription>
        </Alert>
      </OrganizerLayout>
    );
  }

  const currentTierInfo = TIER_INFO[subscription.tier];

  return (
    <OrganizerLayout>
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
                {React.createElement(currentTierInfo.icon, { className: 'h-6 w-6' })}
                <div>
                  <CardTitle className="text-card-title">Current Plan: {currentTierInfo.name}</CardTitle>
                  <CardDescription>{currentTierInfo.description}</CardDescription>
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
            {Object.entries(TIER_INFO).map(([tier, info]) => {
              const TierIcon = info.icon;
              const isCurrent = isCurrentTier(tier as SubscriptionTier);
              const canUpgrade = canUpgradeTo(tier as SubscriptionTier);
              const isPremium = tier === 'PREMIUM';

              return (
                <Card
                  key={tier}
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
                      <TierIcon className={`h-8 w-8 ${info.color.split(' ')[1]}`} />
                      <CardTitle className="text-card-title">{info.name}</CardTitle>
                    </div>
                    <CardDescription>{info.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-2xl font-bold">{info.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {info.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {canUpgrade && (
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade(tier as SubscriptionTier)}
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
                            Upgrade to {info.name}
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
                Upgrade to {targetTier && TIER_INFO[targetTier].name}
              </DialogTitle>
              <DialogDescription>
                {targetTier === 'PREMIUM' 
                  ? 'Please provide your billing email to complete the upgrade. Premium subscriptions are $10/month.'
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
    </OrganizerLayout>
  );
};

export default SubscriptionManagement;

