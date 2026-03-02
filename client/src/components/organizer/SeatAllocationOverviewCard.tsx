import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeatAllocationSummary } from '@/hooks/queries/seats';
import { AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeatAllocationOverviewCardProps {
  eventId: string;
  className?: string;
}

export function SeatAllocationOverviewCard({
  eventId,
  className,
}: SeatAllocationOverviewCardProps) {
  const { data: summaryResponse, isLoading, error } = useSeatAllocationSummary(eventId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Seat Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summaryResponse?.data?.totalSeats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Seat Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No seating configured for this event
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = summaryResponse.data;
  const allocationPercentage = summary.totalSeats > 0
    ? Math.round((summary.allocatedSeats / summary.totalSeats) * 100)
    : 0;

  const metrics = [
    {
      label: 'Total Seats',
      value: summary.totalSeats,
      icon: Plus,
      color: 'text-blue-500',
    },
    {
      label: 'Allocated',
      value: summary.allocatedSeats,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'Available',
      value: summary.availableSeats,
      icon: Plus,
      color: 'text-amber-500',
    },
    {
      label: 'Pending',
      value: summary.pendingSeats,
      icon: Clock,
      color: 'text-purple-500',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Seat Allocation Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Allocation Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Allocation Progress</span>
              <span className="font-semibold">{allocationPercentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${allocationPercentage}%` }}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="space-y-1 p-2 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', metric.color)} />
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                  </div>
                  <div className="text-lg font-bold">{metric.value}</div>
                </div>
              );
            })}
          </div>

          {/* Status Summary */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p>
              <span className="font-semibold">{summary.allocatedSeats}</span> confirmed allocations
            </p>
            <p>
              <span className="font-semibold">{summary.availableSeats}</span> seats available
            </p>
            {summary.pendingSeats > 0 && (
              <p>
                <span className="font-semibold">{summary.pendingSeats}</span> pending confirmations
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
