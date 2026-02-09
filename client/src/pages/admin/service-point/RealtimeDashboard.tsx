/**
 * Real-Time Dashboard
 * Live monitoring dashboard with scan feed, heatmaps, staff metrics, and capacity alerts
 */

import React, { useState, useEffect, useRef, useMemo, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { List, type ListImperativeAPI } from 'react-window';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  Users,
  TrendingUp,
  UserCheck,
  MapPin,
  AlertTriangle,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { useSocket } from '@/hooks/use-socket';
import {
  getRealtimeMetrics,
  getRecentScans,
  getStaffMetrics,
  getCapacityOverview,
  getFacilityHeatmap,
  type RecentScan,
} from '@/lib/dashboard-api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

// Custom row props for the virtualized scan list
interface ScanRowCustomProps {
  scans: RecentScan[];
}

// Full props received by the row component (injected + custom)
interface ScanRowProps {
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
  index: number;
  style: CSSProperties;
  scans: RecentScan[];
}

const ScanRow = ({ index, style, scans }: ScanRowProps) => {
  const scan = scans[index];
  if (!scan) return null;

  return (
    <div style={style} className="px-1 py-1">
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors h-[88px]">
        {/* Attendee Photo */}
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
          {scan.attendee.photo ? (
            <img
              src={scan.attendee.photo}
              alt={scan.attendee.fullName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            scan.attendee.fullName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Scan Details */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{scan.attendee.fullName}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{scan.checkpointName}</span>
            {scan.facilityName && <span>• {scan.facilityName}</span>}
            {scan.zoneName && <span>• {scan.zoneName}</span>}
          </div>
        </div>

        {/* Ticket Type & Time */}
        <div className="text-right flex-shrink-0">
          {scan.attendee.ticketType && (
            <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
              {scan.attendee.ticketType}
            </span>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(scan.scannedAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};

const RealtimeDashboard: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<ListImperativeAPI>(null);

  // Fetch real-time metrics
  const { data: metricsData } = useQuery({
    queryKey: ['dashboardMetrics', eventId],
    queryFn: () => getRealtimeMetrics(eventId!),
    enabled: !!eventId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch recent scans
  const { data: scansData } = useQuery({
    queryKey: ['recentScans', eventId],
    queryFn: () => getRecentScans(eventId!, 100),
    enabled: !!eventId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch staff metrics
  const { data: staffData } = useQuery({
    queryKey: ['staffMetrics', eventId],
    queryFn: () => getStaffMetrics(eventId!),
    enabled: !!eventId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch capacity overview
  const { data: capacityData } = useQuery({
    queryKey: ['capacityOverview', eventId],
    queryFn: () => getCapacityOverview(eventId!),
    enabled: !!eventId,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch facility heatmap (last 24 hours)
  const { data: heatmapData } = useQuery({
    queryKey: ['facilityHeatmap', eventId],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      return getFacilityHeatmap(eventId!, startDate, endDate);
    },
    enabled: !!eventId,
    refetchInterval: 60000, // Refresh every minute
  });

  const metrics = metricsData?.data?.metrics;
  const scans = useMemo(() => scansData?.data?.scans || [], [scansData?.data?.scans]);
  const staffMetrics = staffData?.data?.metrics || [];
  const zones = capacityData?.data?.zones || [];
  const heatmap = heatmapData?.data?.heatmap || [];

  // WebSocket connection for real-time updates
  const { socket, isConnected } = useSocket({ eventId: eventId || undefined });

  // Listen for real-time events
  useEffect(() => {
    if (!socket || !eventId) return;

    // Handle new scan notifications
    socket.on('scan:new', (notification: {
      scanId: string;
      registrationId: string;
      attendeeName: string;
      ticketType?: string;
      facilityName?: string;
      zoneName?: string;
      scannedAt: Date;
      scannedByName: string;
    }) => {
      console.log('New scan received:', notification);

      // Invalidate queries to fetch updated data
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', eventId] });
      queryClient.invalidateQueries({ queryKey: ['recentScans', eventId] });
    });

    // Handle capacity alerts
    socket.on('capacity:alert', (alert: {
      zoneId: string;
      zoneName: string;
      currentOccupancy: number;
      maxCapacity: number;
      percentage: number;
      threshold: number;
    }) => {
      console.log('Capacity alert:', alert);

      // Show toast notification
      toast({
        title: `⚠️ ${alert.zoneName} Capacity Alert`,
        description: `Zone is at ${alert.percentage}% capacity (${alert.currentOccupancy}/${alert.maxCapacity})`,
        variant: alert.percentage >= 95 ? 'destructive' : 'default',
        duration: 10000,
      });

      // Refresh capacity data
      queryClient.invalidateQueries({ queryKey: ['capacityOverview', eventId] });
    });

    // Handle staff metrics updates
    socket.on('staff:metrics', (metrics: Array<{
      staffId: string;
      staffName: string;
      totalScans: number;
      scansPerHour: number;
      avgScanTime: number;
    }>) => {
      console.log('Staff metrics update:', metrics);

      // Update staff metrics cache directly
      queryClient.setQueryData(['staffMetrics', eventId], (old: Record<string, unknown> | undefined) => ({
        ...old,
        data: { metrics, count: metrics.length },
      }));
    });

    return () => {
      socket.off('scan:new');
      socket.off('capacity:alert');
      socket.off('staff:metrics');
    };
  }, [socket, eventId, queryClient, toast]);

  // Auto-scroll to top when new scans arrive (showing newest first)
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollToRow({ index: 0, align: 'start' });
    }
  }, [scans, autoScroll]);

  // Get capacity color
  const getCapacityColor = (percentFull: number): string => {
    if (percentFull >= 95) return 'bg-red-500';
    if (percentFull >= 80) return 'bg-yellow-500';
    if (percentFull >= 70) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Get capacity text color
  const getCapacityTextColor = (percentFull: number): string => {
    if (percentFull >= 95) return 'text-red-600';
    if (percentFull >= 80) return 'text-yellow-600';
    if (percentFull >= 70) return 'text-blue-600';
    return 'text-green-600';
  };

  if (!eventId) {
    return (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No event selected</p>
        </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Dashboard</h1>
          <p className="text-muted-foreground mt-1">Live event monitoring and analytics</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Activity className={`w-4 h-4 ${isConnected ? 'animate-pulse text-green-500' : 'text-gray-400'}`} />
          <span className={isConnected ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Checked In</p>
                <p className="text-3xl font-bold mt-2">{metrics?.totalCheckedIn || 0}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Occupancy</p>
                <p className="text-3xl font-bold mt-2">{metrics?.currentOccupancy || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scans/Minute</p>
                <p className="text-3xl font-bold mt-2">{metrics?.recentScansPerMinute || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                <p className="text-3xl font-bold mt-2">{metrics?.activeStaff || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Live Scan Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Live Scan Feed
            </CardTitle>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {scans.length === 0 ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <p>No recent scans</p>
            </div>
          ) : (
            <List<ScanRowCustomProps>
              listRef={listRef}
              style={{ height: 400, width: '100%' }}
              rowCount={scans.length}
              rowHeight={96}
              rowProps={{ scans }}
              rowComponent={ScanRow}
            />
          )}
        </CardContent>
      </Card>

      {/* Facility Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Facility Activity (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {heatmap.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No facility activity data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={heatmap.flatMap((facility) =>
                  facility.hourlyScans.map((hourData) => ({
                    facility: facility.facility,
                    hour: new Date(hourData.hour).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      hour12: true,
                    }),
                    scans: hourData.scanCount,
                  }))
                )}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{payload[0].payload.facility}</p>
                          <p className="text-sm text-muted-foreground">
                            {payload[0].payload.hour}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {payload[0].value} scans
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="scans" name="Scans">
                  {heatmap.flatMap((facility, facilityIndex) =>
                    facility.hourlyScans.map((_, hourIndex) => {
                      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                      return (
                        <Cell
                          key={`cell-${facilityIndex}-${hourIndex}`}
                          fill={colors[facilityIndex % colors.length]}
                        />
                      );
                    })
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row: Capacity Meters + Staff Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacity Meters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Zone Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {zones.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No zones configured</p>
            ) : (
              zones.map((zone) => (
                <div key={zone.zoneId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{zone.zoneName}</p>
                      <p className="text-sm text-muted-foreground">
                        {zone.currentOccupancy} / {zone.maxCapacity || '∞'}
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${getCapacityTextColor(zone.percentFull)}`}>
                      {zone.percentFull}%
                    </span>
                  </div>
                  <Progress
                    value={zone.percentFull}
                    className="h-2"
                    indicatorClassName={getCapacityColor(zone.percentFull)}
                  />
                  {zone.isFull && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>At capacity</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Staff Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Staff Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffMetrics.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No staff activity</p>
            ) : (
              <div className="space-y-3">
                {staffMetrics.slice(0, 10).map((staff, index) => (
                  <div
                    key={staff.staffId}
                    className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{staff.staffName}</p>
                      <p className="text-sm text-muted-foreground">
                        {staff.scansPerHour} scans/hr
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{staff.totalScans}</p>
                      <p className="text-xs text-muted-foreground">scans</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealtimeDashboard;
