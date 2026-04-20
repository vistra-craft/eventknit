import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, X, Crown, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

interface UpgradePromptProps {
  message: string;
  targetTier: 'STANDARD' | 'PREMIUM';
  variant?: 'banner' | 'card' | 'inline';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const TIER_CONFIG = {
  STANDARD: {
    icon: Zap,
    buttonText: 'Upgrade to Standard (Free)',
    // Banner: left accent border + card-surface bg (dark in dark mode, off-white in light)
    bannerClass: 'border border-border border-l-4 border-l-primary bg-card-surface',
    iconClass: 'text-primary',
    buttonClass: 'border-primary text-primary hover:bg-primary hover:text-primary-foreground',
    dismissClass: 'text-muted-foreground hover:text-foreground',
  },
  PREMIUM: {
    icon: Crown,
    buttonText: 'Upgrade to Premium',
    bannerClass: 'border border-border border-l-4 border-l-violet-500 bg-card-surface',
    iconClass: 'text-violet-500',
    buttonClass: 'border-violet-500 text-violet-500 hover:bg-violet-500 hover:text-white',
    dismissClass: 'text-muted-foreground hover:text-foreground',
  },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  message,
  targetTier,
  variant = 'banner',
  dismissible = false,
  onDismiss,
  className,
}) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const config = TIER_CONFIG[targetTier];
  const Icon = config.icon;

  const storageKey = `upgrade-prompt-dismissed-${targetTier.toLowerCase()}`;

  useEffect(() => {
    if (dismissible) {
      const dismissed = localStorage.getItem(storageKey);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [dismissible, storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (dismissible) {
      localStorage.setItem(storageKey, 'true');
    }
    onDismiss?.();
  };

  const handleUpgrade = () => {
    navigate('/organizer/subscription');
  };

  if (isDismissed) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div
        role="alert"
        className={cn(
          'relative w-full rounded-lg px-4 py-3 text-sm flex items-start gap-3',
          config.bannerClass,
          className,
        )}
      >
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.iconClass)} />
        <div className="flex flex-1 items-center justify-between flex-wrap gap-2">
          <span className="flex-1 text-foreground">
            <Sparkles className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
            {message}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpgrade}
              className={config.buttonClass}
            >
              {config.buttonText}
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className={config.dismissClass}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-2 border-dashed', className)}>
        <CardContent className="p-6 text-center">
          <Icon className={cn('h-12 w-12 mx-auto mb-4', config.iconClass)} />
          <p className="text-muted-foreground mb-4">{message}</p>
          <Button onClick={handleUpgrade} className="mx-auto">
            {config.buttonText}
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // inline variant
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Icon className={cn('h-4 w-4', config.iconClass)} />
      <span className="text-muted-foreground">{message}</span>
      <Button variant="link" size="sm" onClick={handleUpgrade} className="h-auto p-0 text-primary">
        {config.buttonText}
        <ArrowUpRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
};
