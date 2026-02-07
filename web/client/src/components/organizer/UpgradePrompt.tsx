import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, X, Crown, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    color: 'blue',
    buttonText: 'Upgrade to Standard (Free)',
  },
  PREMIUM: {
    icon: Crown,
    color: 'purple',
    buttonText: 'Upgrade to Premium',
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

  // Check localStorage for dismissal state
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
      <Alert
        className={cn(
          `border-${config.color}-200 bg-${config.color}-50 dark:border-${config.color}-800 dark:bg-${config.color}-950`,
          className
        )}
      >
        <Icon className={`h-4 w-4 text-${config.color}-600 dark:text-${config.color}-400`} />
        <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
          <span className={`text-${config.color}-900 dark:text-${config.color}-100 flex-1`}>
            <Sparkles className="h-4 w-4 inline mr-1" />
            {message}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpgrade}
              className={cn(
                `border-${config.color}-300 text-${config.color}-700 hover:bg-${config.color}-100`,
                `dark:border-${config.color}-700 dark:text-${config.color}-300 dark:hover:bg-${config.color}-900`
              )}
            >
              {config.buttonText}
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className={`text-${config.color}-700 hover:bg-${config.color}-100 dark:text-${config.color}-300 dark:hover:bg-${config.color}-900`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-2 border-dashed', className)}>
        <CardContent className="p-6 text-center">
          <Icon className={`h-12 w-12 mx-auto mb-4 text-${config.color}-600`} />
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
      <Icon className={`h-4 w-4 text-${config.color}-600`} />
      <span className="text-muted-foreground">{message}</span>
      <Button variant="link" size="sm" onClick={handleUpgrade} className="h-auto p-0">
        {config.buttonText}
        <ArrowUpRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
};
