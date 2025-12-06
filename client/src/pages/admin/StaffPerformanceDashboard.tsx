import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  CheckCircle,
  Target,
  Award,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  getTeamSummary,
  getTeamPerformance,
  type PerformancePeriod,
  type TeamPerformanceSummary,
  type StaffPerformanceMetrics,
} from '@/lib/admin-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from './AdminLayout';

const StaffPerformanceDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PerformancePeriod>('month');
  const [summary, setSummary] = useState<TeamPerformanceSummary | null>(null);
  const [performances, setPerformances] = useState<StaffPerformanceMetrics[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryResponse, teamResponse] = await Promise.all([
        getTeamSummary(period),
        getTeamPerformance(period, 10), // Top 10 performers
      ]);

      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data);
      }

      if (teamResponse.success && teamResponse.data) {
        setPerformances(teamResponse.data.performances);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load performance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getPerformanceBadge = (metrics: StaffPerformanceMetrics) => {
    const score = metrics.totalScans + metrics.eventsCompleted * 10;
    if (score >= 100) return <Badge className="bg-green-500">Top Performer</Badge>;
    if (score >= 50) return <Badge className="bg-blue-500">Good</Badge>;
    if (score >= 20) return <Badge variant="outline">Average</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">New</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={`space-y-4 md:space-y-6 ${isMobile ? 'p-4' : 'p-0'}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Staff Performance Dashboard
            </h1>
            <p className="text-gray-600">
              Track and analyze staff performance metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as PerformancePeriod)}>
              <SelectTrigger className={isMobile ? 'w-full' : 'w-[180px]'}>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!summary ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
              <p className="text-muted-foreground text-center">
                No staff performance data available for the selected period.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-gray-900">{summary.totalStaff}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.activeStaff} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-gray-900">{formatNumber(summary.totalEvents)}</div>
                  <p className="text-xs text-muted-foreground">Events assigned</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-gray-900">{formatNumber(summary.totalScans)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(summary.averageScansPerStaff)} avg per staff
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-gray-900">
                    {formatPercentage(summary.averageAttendanceRate)}
                  </div>
                  <p className="text-xs text-muted-foreground">Average attendance</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            {performances.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className={isMobile ? 'text-lg' : ''}>Top Performers</CardTitle>
                  <CardDescription className={isMobile ? 'text-xs' : ''}>
                    Staff members with highest performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performances.map((performance, index) => (
                      <div
                        key={performance.staffId}
                        className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-3 ${isMobile ? 'p-3' : 'p-4'} border rounded-lg hover:bg-muted/50 transition-colors`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-primary/10`}>
                            {index < 3 ? (
                              <Award className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-primary`} />
                            ) : (
                              <span className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-primary`}>
                                #{index + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`${isMobile ? 'text-base' : ''} font-semibold`}>
                                {performance.staffName}
                              </h3>
                              {getPerformanceBadge(performance)}
                            </div>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                              {performance.staffEmail}
                            </p>
                          </div>
                        </div>
                        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-3 md:gap-4 flex-1`}>
                          <div>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Scans</p>
                            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                              {formatNumber(performance.totalScans)}
                            </p>
                          </div>
                          <div>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Events</p>
                            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                              {performance.eventsAssigned}
                            </p>
                          </div>
                          <div>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Attendance</p>
                            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                              {formatPercentage(performance.attendanceRate)}
                            </p>
                          </div>
                          <div>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Avg/Event</p>
                            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                              {performance.averageScansPerEvent.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size={isMobile ? 'default' : 'sm'}
                          onClick={() => navigate(`/admin/staff-performance/${performance.staffId}`)}
                          className={isMobile ? 'w-full' : ''}
                        >
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Insights */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className={isMobile ? 'text-lg' : ''}>Performance Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Most Active Staff</span>
                    <span className="text-sm font-semibold">
                      {performances[0]?.staffName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Highest Attendance</span>
                    <span className="text-sm font-semibold">
                      {performances.length > 0
                        ? formatPercentage(
                            Math.max(...performances.map((p) => p.attendanceRate))
                          )
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Hours Worked</span>
                    <span className="text-sm font-semibold">
                      {formatNumber(
                        performances.reduce((sum, p) => sum + p.totalHoursWorked, 0)
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={isMobile ? 'text-lg' : ''}>Team Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Staff</span>
                    <span className="text-sm font-semibold">
                      {summary.activeStaff} / {summary.totalStaff}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Scans/Staff</span>
                    <span className="text-sm font-semibold">
                      {formatNumber(summary.averageScansPerStaff)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="text-sm font-semibold">
                      {performances.length > 0
                        ? formatPercentage(
                            (performances.reduce((sum, p) => sum + p.successfulScans, 0) /
                              performances.reduce((sum, p) => sum + p.totalScans, 0)) *
                              100
                          )
                        : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default StaffPerformanceDashboard;


