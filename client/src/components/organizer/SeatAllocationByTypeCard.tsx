import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSeatAllocationByType } from '@/hooks/queries/seats';
import { AlertCircle, Users } from 'lucide-react';

interface SeatAllocationByTypeCardProps {
  eventId: string;
  className?: string;
}

export function SeatAllocationByTypeCard({
  eventId,
  className,
}: SeatAllocationByTypeCardProps) {
  const { data: response, isLoading, error } = useSeatAllocationByType(eventId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Allocations by Ticket Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Allocations by Ticket Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Failed to load allocation data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const byType = response?.data?.byType || {};
  const ticketTypes = Object.entries(byType);

  if (ticketTypes.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Allocations by Ticket Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No ticket types available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Allocations by Ticket Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ticketTypes.map(([ticketType, stats]) => {
            const allocationRate = stats.total > 0
              ? Math.round((stats.allocated / stats.total) * 100)
              : 0;

            return (
              <div key={ticketType} className="space-y-2 p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{ticketType}</h4>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {allocationRate}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${allocationRate}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Allocated</p>
                    <p className="font-bold text-green-600">{stats.allocated}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="font-bold text-amber-600">{stats.available}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pending</p>
                    <p className="font-bold text-purple-600">{stats.pending}</p>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-2 text-xs">
                  <p className="text-muted-foreground">
                    Total: <span className="font-semibold">{stats.total}</span> seats
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
