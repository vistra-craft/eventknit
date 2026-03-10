import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw,
  Building2,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  CustomLineChart,
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
  CustomMultiLineChart,
  CustomComposedChart,
} from "@/components/charts/ChartComponents";
import { CHART_COLORS } from "@/components/charts/chartConstants";
import {
  getAdminDashboardStats,
  getAdminDashboardGrowth,
  getAdminRecentEvents,
  type AdminDashboardStatsResponse,
  type AdminDashboardGrowthResponse,
  type AdminRecentEventsResponse,
  type AdminDashboardGrowthPeriod,
} from "@/lib/admin-api";

interface PlatformStat {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

interface GrowthDataPoint {
  month: string;
  events: number;
  organizers: number;
  attendees: number;
  revenue: number;
}

interface RecentEvent {
  id: string;
  title: string;
  organizer: string;
  date: string;
  attendees: number;
  status: string;
  revenue: string;
  category: string;
}

const TAB_ROUTES: Record<string, string> = {
  overview: '/admin/analytics',
  events: '/admin/analytics/events',
  organizers: '/admin/analytics/users',
  revenue: '/admin/analytics/revenue',
  system: '/admin/analytics/system',
};

const AdminAnalyticsOverview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API data state
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);

  // Determine current tab based on route
  const getCurrentTab = () => {
    if (location.pathname.includes('/events')) return 'events';
    if (location.pathname.includes('/users')) return 'organizers';
    if (location.pathname.includes('/revenue')) return 'revenue';
    if (location.pathname.includes('/system')) return 'system';
    return 'overview';
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (tab: string) => {
    navigate(TAB_ROUTES[tab] ?? '/admin/analytics');
  };

  // Transform API stats to UI format
  const transformStats = useCallback(
    (data: AdminDashboardStatsResponse["data"]): PlatformStat[] => {
      const { stats } = data;
      if (!stats) return [];
      return [
        {
          title: "Total Events",
          value: stats.totalEvents?.value ?? "—",
          change: stats.totalEvents?.change ?? "0%",
          changeType: stats.totalEvents?.changeType ?? "positive",
          icon: Calendar,
          color: "text-primary",
          bgColor: "bg-primary/10",
          borderColor: "border-primary",
          description: "All events on platform",
        },
        {
          title: "Active Organizers",
          value: stats.organizers?.value ?? "—",
          change: stats.organizers?.change ?? "0%",
          changeType: stats.organizers?.changeType ?? "positive",
          icon: Building2,
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success",
          description: "Registered organizers",
        },
        {
          title: "Active Staff",
          value: stats.activeStaff?.value ?? "—",
          change: stats.activeStaff?.change ?? "0%",
          changeType: stats.activeStaff?.changeType ?? "positive",
          icon: Users,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
          description: "Platform staff members",
        },
        {
          title: "Platform Revenue",
          value: stats.platformRevenue?.value ?? "—",
          change: stats.platformRevenue?.change ?? "0%",
          changeType: stats.platformRevenue?.changeType ?? "positive",
          icon: DollarSign,
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-emerald-200",
          description: "Total platform revenue",
        },
        {
          title: "System Health",
          value: "99.9%",
          change: "+0.1%",
          changeType: "positive",
          icon: Activity,
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning",
          description: "Platform uptime",
        },
      ];
    },
    []
  );

  // Transform growth data to chart format
  const transformGrowthData = useCallback(
    (data: AdminDashboardGrowthResponse["data"]): GrowthDataPoint[] => {
      const { organizers, events, revenue, attendees } = data;
      if (!Array.isArray(events)) return [];
      // Combine data series by index (they all have the same labels)
      return events.filter(Boolean).map((eventPoint, index) => ({
        month: eventPoint.label,
        events: eventPoint.value,
        organizers: organizers?.[index]?.value ?? 0,
        attendees: attendees?.[index]?.value ?? 0,
        revenue: revenue?.[index]?.value ?? 0,
      }));
    },
    []
  );

  // Transform recent events to UI format
  const transformRecentEvents = useCallback(
    (data: AdminRecentEventsResponse["data"]): RecentEvent[] => {
      return data.events.map((event) => ({
        id: event.id,
        title: event.title,
        organizer: event.organizer,
        date: event.date,
        attendees: event.attendees,
        status: event.status,
        revenue: event.revenue,
        category: event.category,
      }));
    },
    []
  );

  // Fetch all analytics data
  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Map time range to growth period
      const periodMap: Record<string, AdminDashboardGrowthPeriod> = {
        "7d": "monthly",
        "30d": "monthly",
        "90d": "quarterly",
        "1y": "yearly",
      };

      const [statsRes, growthRes, eventsRes] = await Promise.all([
        getAdminDashboardStats(timeRange),
        getAdminDashboardGrowth(periodMap[timeRange] || "monthly"),
        getAdminRecentEvents(10),
      ]);

      if (statsRes.success && statsRes.data) {
        setPlatformStats(transformStats(statsRes.data));
      }

      if (growthRes.success && growthRes.data) {
        setGrowthData(transformGrowthData(growthRes.data));
      }

      if (eventsRes.success && eventsRes.data) {
        setRecentEvents(transformRecentEvents(eventsRes.data));
      }
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, transformStats, transformGrowthData, transformRecentEvents]);

  // Fetch data on mount and when timeRange changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchData(true);
  };

  // Static chart data (these could be fetched from additional endpoints if available)
  const eventCategoriesData = [
    { category: "Technology", count: 456, percentage: 37 },
    { category: "Business", count: 234, percentage: 19 },
    { category: "Marketing", count: 189, percentage: 15 },
    { category: "Health", count: 156, percentage: 13 },
    { category: "Education", count: 123, percentage: 10 },
    { category: "Other", count: 89, percentage: 7 },
  ];

  const organizerTierData = [
    { tier: "Premium", count: 234, revenue: 1450000 },
    { tier: "Standard", count: 567, revenue: 890000 },
    { tier: "Basic", count: 288, revenue: 507450 },
  ];

  const systemMetricsData = [
    { metric: "API Response Time", value: 120, unit: "ms", status: "good" },
    { metric: "Database Performance", value: 95, unit: "%", status: "excellent" },
    { metric: "Server Load", value: 68, unit: "%", status: "good" },
    { metric: "Error Rate", value: 0.2, unit: "%", status: "excellent" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Approved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
      <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-base font-semibold text-foreground">
                Platform Analytics
              </h1>
              <p className="text-muted-foreground">
                Comprehensive insights into platform performance and user engagement
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "7d" | "30d" | "90d" | "1y")}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-primary hover:text-white transition-colors"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
            <Loader />
              <span className="ml-2 text-muted-foreground">Loading analytics...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Platform Stats Grid */}
          {!isLoading && !error && platformStats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {platformStats.map((stat, index) => (
              <Card key={index} className={`border ${stat.borderColor} hover:shadow-md transition-shadow duration-200`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="font-semibold text-foreground mb-1">
                        {stat.value}
                      </p>
                      <div className="flex items-center">
                        {stat.changeType === "positive" ? (
                          <ArrowUpRight className="h-3 w-3 text-success mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-destructive mr-1" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            stat.changeType === "positive" ? "text-success" : "text-destructive"
                          }`}
                        >
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {/* Main Content Tabs */}
          {!isLoading && !error && (
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="organizers">Organizers</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Growth */}
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Growth Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomComposedChart
                      data={growthData}
                      xAxisKey="month"
                      bars={[
                        { dataKey: "events", name: "Events", color: CHART_COLORS.primary },
                        { dataKey: "organizers", name: "Organizers", color: CHART_COLORS.secondary },
                      ]}
                      lines={[
                        { dataKey: "attendees", name: "Attendees", color: CHART_COLORS.success },
                        { dataKey: "revenue", name: "Revenue", color: CHART_COLORS.warning },
                      ]}
                      height={300}
                      formatter={(value, name) => {
                        if (name === "Revenue") return `$${(value as number).toLocaleString()}`;
                        if (name === "Attendees") return (value as number).toLocaleString();
                        return (value as number).toString();
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Event Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle>Event Categories Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomPieChart
                      data={eventCategoriesData}
                      dataKey="percentage"
                      nameKey="category"
                      height={300}
                      formatter={(value) => `${value}%`}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Organizer Tiers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Organizer Tier Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomBarChart
                      data={organizerTierData}
                      dataKey="count"
                      xAxisKey="tier"
                      height={300}
                      color={CHART_COLORS.info}
                    />
                  </CardContent>
                </Card>

                {/* System Health */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Health Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {systemMetricsData.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{metric.metric}</p>
                          <p className="text-xs text-muted-foreground">{metric.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            metric.status === "excellent" ? "text-success" : 
                            metric.status === "good" ? "text-primary" : "text-destructive"
                          }`}>
                            {metric.value}{metric.unit}
                          </p>
                          <p className={`text-xs ${
                            metric.status === "excellent" ? "text-success" : 
                            metric.status === "good" ? "text-primary" : "text-destructive"
                          }`}>
                            {metric.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Platform Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-base font-medium text-foreground">{event.title}</h3>
                            {getStatusBadge(event.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {event.organizer}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {event.date}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {event.attendees.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{event.revenue}</p>
                          <p className="text-sm text-muted-foreground">{event.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organizers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Organizer Revenue */}
                <Card>
                  <CardHeader>
                    <CardTitle>Organizer Revenue by Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomBarChart
                      data={organizerTierData}
                      dataKey="revenue"
                      xAxisKey="tier"
                      height={300}
                      color={CHART_COLORS.success}
                      formatter={(value) => `$${(value as number).toLocaleString()}`}
                    />
                  </CardContent>
                </Card>

                {/* Organizer Growth */}
                <Card>
                  <CardHeader>
                    <CardTitle>Organizer Growth Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomLineChart
                      data={growthData}
                      dataKey="organizers"
                      xAxisKey="month"
                      height={300}
                      color={CHART_COLORS.primary}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomLineChart
                      data={growthData}
                      dataKey="revenue"
                      xAxisKey="month"
                      height={300}
                      color={CHART_COLORS.success}
                      formatter={(value) => `$${(value as number).toLocaleString()}`}
                    />
                  </CardContent>
                </Card>

                {/* Revenue by Organizer Tier */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Organizer Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomBarChart
                      data={organizerTierData}
                      dataKey="revenue"
                      xAxisKey="tier"
                      height={300}
                      color={CHART_COLORS.success}
                      formatter={(value) => `$${(value as number).toLocaleString()}`}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Revenue</span>
                        <span className="font-semibold">$2,847,450</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Average</span>
                        <span className="font-semibold">$474,575</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Growth Rate</span>
                        <span className="font-semibold text-success">+32%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Revenue Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Revenue Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Event Fees</span>
                        <span className="text-sm font-medium">$1,234,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Premium Subscriptions</span>
                        <span className="text-sm font-medium">$890,200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Transaction Fees</span>
                        <span className="text-sm font-medium">$722,750</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Forecast */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Next Month</span>
                        <span className="text-sm font-medium">$520,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Next Quarter</span>
                        <span className="text-sm font-medium">$1,560,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Next Year</span>
                        <span className="text-sm font-medium">$6,240,000</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomAreaChart
                      data={growthData}
                      dataKey="events"
                      xAxisKey="month"
                      height={300}
                      color={CHART_COLORS.info}
                    />
                  </CardContent>
                </Card>

                {/* Platform Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Usage Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomMultiLineChart
                      data={growthData}
                      xAxisKey="month"
                      lines={[
                        { dataKey: "events", name: "Events", color: CHART_COLORS.primary },
                        { dataKey: "attendees", name: "Attendees", color: CHART_COLORS.success },
                      ]}
                      height={300}
                      formatter={(value, name) => {
                        if (name === "Events") return (value as number).toString();
                        if (name === "Attendees") return (value as number).toLocaleString();
                        return (value as number).toString();
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          )}
        </div>
  );
};

export default AdminAnalyticsOverview;
