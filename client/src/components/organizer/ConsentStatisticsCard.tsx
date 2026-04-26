import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, TrendingUp } from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getEventConsentStats, type ConsentStatistics } from '@/lib/organizer-api';
import { extractErrorMessage } from '@/lib/utils/error';

export type SubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

interface ConsentStatisticsCardProps {
  eventId: string;
  subscriptionTier?: SubscriptionTier;
  onExport?: () => void;
  className?: string;
}

export const ConsentStatisticsCard: React.FC<ConsentStatisticsCardProps> = ({
  eventId,
  subscriptionTier = 'BASIC',
  onExport,
  className,
}) => {
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
        setError(extractErrorMessage(err, 'Failed to load consent statistics'));
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchStats();
    }
  }, [eventId]);

  const canExport = subscriptionTier !== 'BASIC';

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

        <div className="p-4 rounded-lg border border-border/40 bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium">Marketing Communications</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Attendees who opted in to receive promotional emails and updates
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">
                {stats.marketing.percentage.toFixed(0)}%
              </span>
              <span className="text-sm text-muted-foreground">
                {stats.marketing.count} / {stats.totalRegistrations}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${stats.marketing.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
