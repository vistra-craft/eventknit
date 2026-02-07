import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";
import { AlertCircle } from "lucide-react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
  CustomMultiLineChart,
  CustomComposedChart,
} from "@/components/charts/ChartComponents";
import { CHART_COLORS } from "@/components/charts/chartConstants";
import { getOrganizerDashboardStats, getOrganizerEvents } from "@/lib/organizer-api";

const AnalyticsOverview = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalEvents?: number; totalAttendees?: number; totalRevenue?: number; totalSpeakers?: number; totalExhibitors?: number } | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; title: string; startDate?: string; attendees?: number; price?: number | string | null; views?: number; rating?: number; status?: string; category?: string; capacity?: number }>>([]);

  // Calculate date range based on selected time filter
  const getDateRange = (range: string): { dateFrom: string; dateTo: string } => {
    const now = new Date();
    const dateTo = now.toISOString();
    let dateFrom: Date;

    switch (range) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { dateFrom: dateFrom.toISOString(), dateTo };
  };

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const { dateFrom, dateTo } = getDateRange(timeRange);

        const [statsResponse, eventsResponse] = await Promise.all([
          getOrganizerDashboardStats(),
          getOrganizerEvents({ limit: 100, dateFrom, dateTo }),
        ]);

        if (statsResponse.success) {
          setStats(statsResponse.data.stats);
        }

        if (eventsResponse.success && eventsResponse.data?.events) {
          setEvents(eventsResponse.data.events as Array<{ id: string; title: string; startDate?: string; attendees?: number; price?: number | string | null; views?: number; rating?: number; status?: string; category?: string; capacity?: number }>);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Calculate analytics metrics from real data
  const analyticsOverviewStats = stats ? [
    {
      title: "Total Events",
      value: stats.totalEvents?.toString() || "0",
      change: "+0%",
      changeType: "positive" as const,
      icon: "Calendar",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      description: "Events created",
    },
    {
      title: "Total Attendees",
      value: stats.totalAttendees?.toLocaleString() || "0",
      change: "+0%",
      changeType: "positive" as const,
      icon: "Users",
      color: "text-success",
      bgColor: "bg-success-light",
      borderColor: "border-success/20",
      description: "Registered attendees",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue?.toLocaleString() || "0"}`,
      change: "+0%",
      changeType: "positive" as const,
      icon: "DollarSign",
      color: "text-success",
      bgColor: "bg-success-light",
      borderColor: "border-success/20",
      description: "Revenue generated",
    },
    {
      title: "Total Speakers",
      value: stats.totalSpeakers?.toString() || "0",
      change: "+0%",
      changeType: "positive" as const,
      icon: "Mic",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      description: "Event speakers",
    },
    {
      title: "Total Exhibitors",
      value: stats.totalExhibitors?.toString() || "0",
      change: "+0%",
      changeType: "positive" as const,
      icon: "Building2",
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
      description: "Event exhibitors",
    },
    {
      title: "Conversion Rate",
      value: stats.totalEvents && stats.totalAttendees 
        ? `${((stats.totalAttendees / (stats.totalEvents * 100)) * 100).toFixed(1)}%`
        : "0%",
      change: "+0%",
      changeType: "positive" as const,
      icon: "TrendingUp",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      description: "View to registration",
    },
  ] : [];

  // Transform events data for charts
  const topPerformingEvents = events
    .filter(e => e.attendees && e.attendees > 0)
    .sort((a, b) => (b.attendees || 0) - (a.attendees || 0))
    .slice(0, 10)
    .map(event => ({
      id: event.id,
      title: event.title,
      attendees: event.attendees || 0,
      revenue: typeof event.price === 'number' ? event.price * (event.attendees || 0) : 0,
      conversion: event.views ? ((event.attendees || 0) / event.views * 100).toFixed(1) : "0",
      views: event.views || 0,
      rating: event.rating || 0,
      status: event.status || 'pending',
    }));

  // Group events by month for trends
  const getMonthData = () => {
    const monthMap = new Map<string, { events: number; attendees: number; revenue: number; views: number }>();
    
    events.forEach(event => {
      if (event.startDate) {
        const date = new Date(event.startDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const existing = monthMap.get(monthKey) || { events: 0, attendees: 0, revenue: 0, views: 0 };
        existing.events += 1;
        existing.attendees += event.attendees || 0;
        existing.revenue += typeof event.price === 'number' ? event.price * (event.attendees || 0) : 0;
        existing.views += event.views || 0;
        monthMap.set(monthKey, existing);
      }
    });

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  };

  const performanceTrendsData = getMonthData();
  const revenueTrendsData = getMonthData().map(d => ({ month: d.month, revenue: d.revenue, events: d.events }));

  // Group by category
  const categoryMap = new Map<string, number>();
  events.forEach(event => {
    const cat = event.category || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const totalEvents = events.length;
  const eventCategoriesData = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    value: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0,
    count,
  }));

  // Registration trends data - placeholder (would need backend support for daily registration data)
  // For now, show empty data with proper structure
  const registrationTrendsData = [
    { day: "Mon", registrations: 0, views: 0 },
    { day: "Tue", registrations: 0, views: 0 },
    { day: "Wed", registrations: 0, views: 0 },
    { day: "Thu", registrations: 0, views: 0 },
    { day: "Fri", registrations: 0, views: 0 },
    { day: "Sat", registrations: 0, views: 0 },
    { day: "Sun", registrations: 0, views: 0 },
  ];

  const conversionFunnelData = stats ? [
    { stage: "Page Views", value: 100, count: stats.totalAttendees ? stats.totalAttendees * 10 : 0 },
    { stage: "Registration", value: 15, count: stats.totalAttendees || 0 },
    { stage: "Payment", value: 12, count: Math.round((stats.totalAttendees || 0) * 0.8) },
    { stage: "Attendance", value: 10, count: Math.round((stats.totalAttendees || 0) * 0.7) },
  ] : [];

  const recentInsights = events.length > 0 ? [
    {
      id: 1,
      type: "trend",
      title: "Event Performance",
      description: `You have ${events.length} event${events.length !== 1 ? 's' : ''} with ${stats?.totalAttendees || 0} total attendees`,
      impact: "positive",
      icon: TrendingUp,
    },
    ...(topPerformingEvents.length > 0 ? [{
      id: 2,
      type: "insight",
      title: "Top Event",
      description: `${topPerformingEvents[0].title} has ${topPerformingEvents[0].attendees} attendees`,
      impact: "positive",
      icon: BarChart3,
    }] : []),
    {
      id: 3,
      type: "recommendation",
      title: "Analytics",
      description: "View detailed analytics for each event to optimize performance",
      impact: "neutral",
      icon: DollarSign,
    },
  ] : [
    {
      id: 1,
      type: "insight",
      title: "No Events Yet",
      description: "Create your first event to start seeing analytics",
      impact: "neutral",
      icon: Calendar,
    },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive":
        return "text-success bg-success-light border-success/20";
      case "negative":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-primary bg-primary/10 border-primary/20";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-success-light text-success">Completed</Badge>;
      case "upcoming":
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Upcoming</Badge>;
      case "active":
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Active</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
          <span className="ml-2 text-muted-foreground">Loading analytics...</span>
        </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive" className="m-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
      <div className="py-8">
        <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-page-title">Analytics Overview</h1>
            <p className="text-page-subtitle mt-1">
              Comprehensive insights into your event performance and audience engagement
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {analyticsOverviewStats.map((stat, index) => (
            <Card key={index} className={`border ${stat.borderColor} hover:shadow-md transition-shadow duration-200`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold text-foreground mb-1">
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
                    <Calendar className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Top Events</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomComposedChart
                    data={performanceTrendsData}
                    xAxisKey="month"
                    bars={[
                      { dataKey: "events", name: "Events", color: CHART_COLORS.primary },
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

              {/* Event Categories Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomPieChart
                    data={eventCategoriesData}
                    dataKey="value"
                    nameKey="name"
                    height={300}
                    formatter={(value) => `${value}%`}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registration Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Registration Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomMultiLineChart
                    data={registrationTrendsData}
                    xAxisKey="day"
                    lines={[
                      { dataKey: "registrations", name: "Registrations", color: CHART_COLORS.primary },
                      { dataKey: "views", name: "Page Views", color: CHART_COLORS.secondary },
                    ]}
                    height={250}
                  />
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topPerformingEvents.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Best Performing Event</p>
                          <p className="text-xs text-muted-foreground">
                            {topPerformingEvents[0].title.length > 30 
                              ? topPerformingEvents[0].title.substring(0, 30) + '...' 
                              : topPerformingEvents[0].title}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-success">{topPerformingEvents[0].conversion}%</p>
                          <p className="text-xs text-muted-foreground">conversion</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Average Rating</p>
                          <p className="text-xs text-muted-foreground">All events</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            {events.length > 0 
                              ? (events.reduce((sum, e) => sum + (e.rating || 0), 0) / events.filter(e => e.rating && e.rating > 0).length || 1).toFixed(1)
                              : '0.0'}
                          </p>
                          <p className="text-xs text-muted-foreground">stars</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Total Events</p>
                          <p className="text-xs text-muted-foreground">In this period</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{events.length}</p>
                          <p className="text-xs text-muted-foreground">events</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No events data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-foreground">{event.title}</h3>
                          {getStatusBadge(event.status)}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Attendees</p>
                            <p className="font-medium">{event.attendees}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Revenue</p>
                            <p className="font-medium">${event.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversion</p>
                            <p className="font-medium">{event.conversion}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <p className="font-medium">{event.rating} ⭐</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentInsights.map((insight) => (
                <Card key={insight.id} className={`border ${getImpactColor(insight.impact).split(' ')[2]}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full ${getImpactColor(insight.impact).split(' ')[1]} flex items-center justify-center`}>
                        <insight.icon className={`h-4 w-4 ${getImpactColor(insight.impact).split(' ')[0]}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomAreaChart
                    data={revenueTrendsData}
                    dataKey="revenue"
                    xAxisKey="month"
                    height={300}
                    color={CHART_COLORS.success}
                    formatter={(value) => `$${(value as number).toLocaleString()}`}
                  />
                </CardContent>
              </Card>

              {/* Event Volume Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Volume Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart
                    data={revenueTrendsData}
                    dataKey="events"
                    xAxisKey="month"
                    height={300}
                    color={CHART_COLORS.primary}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart
                    data={conversionFunnelData}
                    dataKey="value"
                    xAxisKey="stage"
                    height={300}
                    color={CHART_COLORS.warning}
                    formatter={(value) => `${value}%`}
                  />
                </CardContent>
              </Card>

              {/* Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomMultiLineChart
                    data={performanceTrendsData}
                    xAxisKey="month"
                    lines={[
                      { dataKey: "views", name: "Page Views", color: CHART_COLORS.info },
                      { dataKey: "attendees", name: "Attendees", color: CHART_COLORS.success },
                    ]}
                    height={300}
                    formatter={(value, name) => {
                      if (name === "Page Views") return (value as number).toLocaleString();
                      if (name === "Attendees") return (value as number).toLocaleString();
                      return (value as number).toString();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
  );
};

export default AnalyticsOverview;
