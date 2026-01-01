import React from 'react';
import { Crown, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

interface SubscriptionTierBadgeProps {
  tier: SubscriptionTier;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIER_CONFIG = {
  BASIC: {
    label: 'Basic',
    icon: Shield,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  STANDARD: {
    label: 'Standard',
    icon: Zap,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  PREMIUM: {
    label: 'Premium',
    icon: Crown,
    className: 'bg-purple-100 text-purple-700 border-purple-300',
  },
};

const SIZE_CONFIG = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'text-sm px-3 py-1',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'text-base px-4 py-1.5',
    icon: 'h-5 w-5',
  },
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
      className={cn(
        config.className,
        sizeConfig.badge,
        'font-medium border',
        className
      )}
    >
      {showIcon && <Icon className={cn(sizeConfig.icon, 'mr-1.5')} />}
      {config.label}
    </Badge>
  );
};
