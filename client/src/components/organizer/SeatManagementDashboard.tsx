import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useSeatAllocationSummary,
  useSeatAllocations,
  useSeatOperations,
  type SeatAllocation,
  type SeatOperation,
} from '@/hooks/queries/seats';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  TrendingUp,
  Users,
  Grid3X3,
} from 'lucide-react';
import { SeatAllocationOverviewCard } from './SeatAllocationOverviewCard';
import { SeatAllocationByTypeCard } from './SeatAllocationByTypeCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SeatManagementDashboardProps {
  eventId: string;
}

export function SeatManagementDashboard({
  eventId,
}: SeatManagementDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [allocationsPage] = useState(1);

  const { data: summaryResponse } =
    useSeatAllocationSummary(eventId);
  const { data: allocationsResponse, isLoading: allocationsLoading } = useSeatAllocations(
    eventId,
    allocationsPage,
    50,
    'all',
  );
  const { data: operationsResponse, isLoading: operationsLoading } = useSeatOperations(
    eventId,
    20,
  );

  const summary = summaryResponse?.data;
  const allocations = allocationsResponse?.data?.allocations || [];
  const operations = operationsResponse?.data?.operations || [];

  if (!summary?.totalSeats) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Grid3X3 className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Seating Configured</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This event does not have seating configured yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'RELEASED':
        return <LogOut className="h-4 w-4 text-red-500" />;
      case 'ALLOCATION':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SeatAllocationOverviewCard eventId={eventId} />
            <SeatAllocationByTypeCard eventId={eventId} />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Total Seats"
              value={summary?.totalSeats || 0}
              icon={<Grid3X3 className="h-4 w-4" />}
              color="text-blue-500"
            />
            <MetricCard
              label="Confirmed"
              value={summary?.allocatedSeats || 0}
              icon={<CheckCircle className="h-4 w-4" />}
              color="text-green-500"
            />
            <MetricCard
              label="Available"
              value={summary?.availableSeats || 0}
              icon={<TrendingUp className="h-4 w-4" />}
              color="text-amber-500"
            />
            <MetricCard
              label="Pending"
              value={summary?.pendingSeats || 0}
              icon={<Clock className="h-4 w-4" />}
              color="text-purple-500"
            />
          </div>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seat Allocations</CardTitle>
              {allocationsLoading && (
                <p className="text-xs text-muted-foreground">Loading...</p>
              )}
            </CardHeader>
            <CardContent>
              {allocationsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : allocations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No allocations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-xs">Attendee</TableHead>
                          <TableHead className="text-xs">Email</TableHead>
                          <TableHead className="text-xs">Seat</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocations.map((alloc: SeatAllocation) => (
                          <TableRow key={alloc.id} className="hover:bg-secondary/50">
                            <TableCell className="text-sm font-medium">
                              {alloc.attendeeName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {alloc.attendeeEmail}
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {alloc.seatLocation}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  alloc.status === 'CONFIRMED'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {alloc.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(alloc.allocatedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Seat Operations</CardTitle>
              {operationsLoading && (
                <p className="text-xs text-muted-foreground">Loading...</p>
              )}
            </CardHeader>
            <CardContent>
              {operationsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : operations.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No operations recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {operations.map((op: SeatOperation) => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getOperationIcon(op.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{op.attendeeName}</p>
                          <p className="text-xs text-muted-foreground">{op.attendeeEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-mono text-muted-foreground">
                            {op.seatLocation}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(op.operationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={op.type === 'RELEASED' ? 'destructive' : 'default'}
                        >
                          {op.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for metric cards
interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
