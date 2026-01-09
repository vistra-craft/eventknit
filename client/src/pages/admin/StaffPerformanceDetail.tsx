import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  Target,
  AlertCircle,
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import BackButton from "@/components/BackButton";
import { useIsMobile } from '@/hooks/useMobile';
import {
  getStaffPerformance,
  getPerformanceTrends,
  type PerformancePeriod,
  type StaffPerformanceMetrics,
  type PerformanceTrend,
} from '@/lib/admin-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import AdminLayout from './AdminLayout';

const StaffPerformanceDetail = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PerformancePeriod>('month');
  const [performance, setPerformance] = useState<StaffPerformanceMetrics | null>(null);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);

  const fetchData = useCallback(async () => {
    if (!staffId) return;

    try {
      setLoading(true);
      const [performanceResponse, trendsResponse] = await Promise.all([
        getStaffPerformance(staffId, period),
        getPerformanceTrends(staffId, period),
      ]);

      if (performanceResponse.success && performanceResponse.data) {
        setPerformance(performanceResponse.data);
      }

      if (trendsResponse.success && trendsResponse.data) {
        setTrends(trendsResponse.data);
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
  }, [staffId, period, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!performance) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Staff Member Not Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              The requested staff member could not be found.
            </p>
            <Button onClick={() => navigate('/admin/staff-performance')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={`space-y-4 md:space-y-6 ${isMobile ? 'p-4' : 'p-0'}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/admin/staff-performance" label="Back" />
            <div>
              <h1 className="text-base font-semibold text-foreground">
                {performance.staffName}
              </h1>
              <p className="text-gray-600">
                {performance.staffEmail} • {performance.role}
              </p>
            </div>
          </div>
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

        {/* Key Metrics */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-foreground">{formatNumber(performance.totalScans)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(performance.successfulScans)} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-foreground">{performance.eventsAssigned}</div>
              <p className="text-xs text-muted-foreground">
                {performance.eventsCompleted} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-foreground">
                {formatPercentage(performance.attendanceRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                {performance.completedShifts} / {performance.totalShifts} shifts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-foreground">
                {formatNumber(performance.totalHoursWorked)}
              </div>
              <p className="text-xs text-muted-foreground">
                {performance.averageHoursPerEvent.toFixed(1)} avg/event
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Scan Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Scans</span>
                <span className="text-sm font-semibold">{formatNumber(performance.totalScans)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Successful</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatNumber(performance.successfulScans)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed</span>
                <span className="text-sm font-semibold text-red-600">
                  {formatNumber(performance.failedScans)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Re-entries</span>
                <span className="text-sm font-semibold">{formatNumber(performance.reEntryScans)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Scans/Event</span>
                <span className="text-sm font-semibold">
                  {performance.averageScansPerEvent.toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Event Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned</span>
                <span className="text-sm font-semibold">{performance.eventsAssigned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-sm font-semibold text-green-600">
                  {performance.eventsCompleted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm font-semibold text-blue-600">
                  {performance.eventsActive}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Shifts</span>
                <span className="text-sm font-semibold">{performance.totalShifts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed Shifts</span>
                <span className="text-sm font-semibold">
                  {performance.completedShifts}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        {trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Performance Trends</CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>
                Daily scan and event activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trends.slice(-7).map((trend, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{formatDate(trend.date)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Scans</p>
                        <p className="text-sm font-semibold">{trend.scans}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Events</p>
                        <p className="text-sm font-semibold">{trend.events}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? 'text-lg' : ''}>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Scan</span>
              <span className="text-sm font-semibold">
                {formatDate(performance.lastScanAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Event</span>
              <span className="text-sm font-semibold">
                {formatDate(performance.lastEventAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StaffPerformanceDetail;


