import React from 'react';
import { Crown, Shield, Zap, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

interface SubscriptionTierBadgeProps {
  tier: SubscriptionTier;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIER_CONFIG: Record<SubscriptionTier, { label: string; icon: React.ElementType; className: string }> = {
  BASIC: {
    label: 'Basic',
    icon: Shield,
    className: 'bg-muted text-muted-foreground border-border',
  },
  STANDARD: {
    label: 'Standard',
    icon: Zap,
    className: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700',
  },
  PREMIUM: {
    label: 'Premium',
    icon: Crown,
    className: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700',
  },
  ENTERPRISE: {
    label: 'Enterprise',
    icon: Building2,
    className: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700',
  },
};

const SIZE_CONFIG = {
  sm: { badge: 'text-xs px-2 py-0.5', icon: 'h-3 w-3' },
  md: { badge: 'text-sm px-3 py-1',   icon: 'h-4 w-4' },
  lg: { badge: 'text-base px-4 py-1.5', icon: 'h-5 w-5' },
};

export const SubscriptionTierBadge: React.FC<SubscriptionTierBadgeProps> = ({
  tier,
  showIcon = true,
  size = 'md',
  className,
}) => {
  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(config.className, sizeConfig.badge, 'font-medium border', className)}
    >
      {showIcon && <Icon className={cn(sizeConfig.icon, 'mr-1.5')} />}
      {config.label}
    </Badge>
  );
};
