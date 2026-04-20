import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Lock, AlertCircle, Mail, BarChart3, Users, TrendingUp } from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getEventConsentStats, type ConsentStatistics } from '@/lib/organizer-api';
import { cn } from '@/lib/utils';

export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

interface ConsentStatisticsCardProps {
  eventId: string;
  subscriptionTier?: SubscriptionTier;
  onExport?: () => void;
  className?: string;
}

interface ConsentTypeConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  premiumOnly: boolean;
}

const CONSENT_TYPES: Record<string, ConsentTypeConfig> = {
  operational: {
    label: 'Operational Consent',
    description: 'Required for ticket delivery and event updates',
    icon: Mail,
    color: 'green',
    premiumOnly: false,
  },
  marketing: {
    label: 'Marketing Communications',
    description: 'Allows sending promotional emails and updates',
    icon: TrendingUp,
    color: 'blue',
    premiumOnly: false,
  },
  demographics: {
    label: 'Demographic Data',
    description: 'Access to age, location, and job information',
    icon: Users,
    color: 'purple',
    premiumOnly: true,
  },
  analytics: {
    label: 'Engagement Analytics',
    description: 'Track email opens, clicks, and session views',
    icon: BarChart3,
    color: 'orange',
    premiumOnly: true,
  },
};

export const ConsentStatisticsCard: React.FC<ConsentStatisticsCardProps> = ({
  eventId,
  subscriptionTier = 'BASIC',
  onExport,
  className,
}) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ConsentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEventConsentStats(eventId);
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          throw new Error('Failed to fetch consent statistics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load consent statistics');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchStats();
    }
  }, [eventId]);

  const isPremium = subscriptionTier === 'PREMIUM';
  const canExport = subscriptionTier !== 'BASIC';

  const renderConsentStat = (
    type: keyof ConsentStatistics,
    config: ConsentTypeConfig
  ) => {
    if (type === 'totalRegistrations' || type === 'totalConsents') return null;

    const stat = stats?.[type];
    if (!stat || typeof stat !== 'object' || !('count' in stat)) return null;

    const isLocked = config.premiumOnly && !isPremium;
    const Icon = config.icon;

    return (
      <div
        key={type}
        className={cn(
          'relative p-4 rounded-lg border bg-card',
          isLocked && 'opacity-60'
        )}
      >
        {isLocked && (
          <div className="absolute top-2 right-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-lg',
                type === 'operational' && 'bg-success/10',
                type === 'marketing' && 'bg-primary/10',
                type === 'demographics' && 'bg-accent/10',
                type === 'analytics' && 'bg-warning/10'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  type === 'operational' && 'text-success',
                  type === 'marketing' && 'text-primary',
                  type === 'demographics' && 'text-accent-foreground',
                  type === 'analytics' && 'text-warning'
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{config.label}</p>
              {isLocked && (
                <Badge variant="outline" className="text-xs mt-1 bg-accent/10 text-accent-foreground border-accent/20">
                  Premium Only
                </Badge>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">
              {isLocked ? '••' : `${stat.percentage.toFixed(0)}%`}
            </span>
            <span className="text-sm text-muted-foreground">
              {isLocked ? '•••' : `${stat.count} / ${stats?.totalRegistrations || 0}`}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                `h-full rounded-full bg-${config.color}-600 transition-all`,
                isLocked && 'bg-muted'
              )}
              style={{ width: isLocked ? '50%' : `${stat.percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader size="lg" className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading consent statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Consent Statistics</CardTitle>
            <CardDescription>
              Attendee data sharing preferences for this event
            </CardDescription>
          </div>
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={!onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Consented
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Registrations</p>
              <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">With Consent Records</p>
              <p className="text-2xl font-bold">{stats.totalConsents}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(CONSENT_TYPES).map(([type, config]) =>
            renderConsentStat(type as keyof ConsentStatistics, config)
          )}
        </div>

        {!isPremium && (
          <Alert className="mt-6 border-border bg-muted">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-muted-foreground">
              Upgrade to <strong>Premium</strong> to access demographic and engagement analytics data.
              <Button
                variant="link"
                size="sm"
                className="ml-2 h-auto p-0 text-muted-foreground"
                onClick={() => navigate('/organizer/subscription')}
              >
                View Plans
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
