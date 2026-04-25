import { Lock, ArrowUpRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionTierBadge } from './SubscriptionTierBadge';

interface FeatureGateProps {
  /** Feature key from FEATURE_TIER_MINIMUM map */
  feature: string;
  children: React.ReactNode;
  /** One-line description of what the feature does — shown in the lock state */
  description?: string;
}

/**
 * Renders children if the organizer's subscription tier meets the minimum
 * required for `feature`. Otherwise renders an upgrade prompt.
 */
export function FeatureGate({ feature, children, description }: FeatureGateProps) {
  const { hasFeature, requiredTierFor, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasFeature(feature)) return <>{children}</>;

  const required = requiredTierFor(feature);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border-2 border-dashed border-border bg-muted/20">
      <div className="rounded-full bg-muted p-4">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-center space-y-2 max-w-sm px-4">
        <p className="font-semibold text-base">Feature not included in your plan</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Requires{' '}
          <SubscriptionTierBadge tier={required} size="sm" className="inline-flex" />
          {' '}or higher.
        </p>
      </div>
      <Button size="sm" onClick={() => navigate('/organizer/subscription')}>
        <ArrowUpRight className="mr-2 h-3.5 w-3.5" />
        Upgrade Plan
      </Button>
    </div>
  );
}
