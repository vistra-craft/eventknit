import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import OrganizerLayout from "../OrganizerLayout";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  CustomLineChart,
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
  CustomComposedChart,
} from "@/components/charts/ChartComponents";
import { CHART_COLORS } from "@/components/charts/chartConstants";
import { getOrganizerDashboardStats, getOrganizerEvents } from "@/lib/organizer-api";

const RevenueReports = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [stats, setStats] = useState<{ totalRevenue?: number } | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; title: string; startDate?: string; attendees?: number; price?: number | string | null; status?: string; category?: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filters: { limit?: number; status?: string } = { limit: 100 };
        
        // Apply status filter
        if (selectedEvent !== 'all') {
          filters.status = selectedEvent.toUpperCase();
        }
        
        const [statsResponse, eventsResponse] = await Promise.all([
          getOrganizerDashboardStats(),
          getOrganizerEvents(filters),
        ]);
        if (statsResponse.success) setStats(statsResponse.data.stats);
        if (eventsResponse.success && eventsResponse.data?.events) {
          setEvents(eventsResponse.data.events as Array<{ id: string; title: string; startDate?: string; attendees?: number; price?: number | string | null; status?: string; category?: string }>);
        }
      } catch (err) {
        console.error('Failed to load revenue data:', err);
      }
    };
    fetchData();
  }, [timeRange, selectedEvent]);

  // Calculate revenue data from real events
  const revenueStats = stats ? [
    { title: "Total Revenue", value: `$${stats.totalRevenue?.toLocaleString() || "0"}`, change: "+0%", changeType: "positive", description: "Total revenue generated", bgColor: "bg-success-light", color: "text-success" },
    { title: "Platform Fees", value: `$${Math.round((stats.totalRevenue || 0) * 0.1).toLocaleString()}`, change: "+0%", changeType: "neutral", description: "Platform service fees", bgColor: "bg-primary/10", color: "text-primary" },
    { title: "Net Revenue", value: `$${Math.round((stats.totalRevenue || 0) * 0.9).toLocaleString()}`, change: "+0%", changeType: "positive", description: "Revenue after fees", bgColor: "bg-success-light", color: "text-success" },
  ] : [];

  const revenueBreakdown = events.map(e => {
    const revenue = typeof e.price === 'number' ? e.price * (e.attendees || 0) : 0;
    return {
      event: e.title,
      revenue,
      percentage: stats?.totalRevenue ? ((revenue / stats.totalRevenue) * 100).toFixed(1) : "0",
      status: e.status || 'pending',
      netRevenue: Math.round(revenue * 0.9),
      attendees: e.attendees || 0,
      ticketPrice: typeof e.price === 'number' ? e.price : 0,
      refunds: 0,
      revenuePerAttendee: (e.attendees || 0) > 0 ? Math.round(revenue / (e.attendees || 0)) : 0,
      growth: "+0%",
      date: e.startDate ? new Date(e.startDate).toLocaleDateString() : 'TBD',
    };
  });

  const paymentMethods = [
    { method: "Credit Card", percentage: 65, amount: stats?.totalRevenue ? Math.round(stats.totalRevenue * 0.65) : 0, count: stats?.totalRevenue ? Math.round(stats.totalRevenue * 0.65 / 100) : 0 },
    { method: "Mobile Money", percentage: 25, amount: stats?.totalRevenue ? Math.round(stats.totalRevenue * 0.25) : 0, count: stats?.totalRevenue ? Math.round(stats.totalRevenue * 0.25 / 100) : 0 },
    { method: "Bank Transfer", percentage: 10, amount: stats?.totalRevenue ? Math.round(stats.totalRevenue * 0.1) : 0, count: stats?.totalRevenue ? Math.round(stats.totalRevenue * 0.1 / 100) : 0 },
  ];

  // Group events by month for trends
  const revenueTrendsMap = new Map<string, { revenue: number; events: number }>();
  events.forEach(e => {
    if (e.startDate) {
      const date = new Date(e.startDate);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      const existing = revenueTrendsMap.get(monthKey) || { revenue: 0, events: 0 };
      existing.revenue += typeof e.price === 'number' ? e.price * (e.attendees || 0) : 0;
      existing.events += 1;
      revenueTrendsMap.set(monthKey, existing);
    }
  });
  const revenueTrends = Array.from(revenueTrendsMap.entries()).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    events: data.events,
  }));

  const financialInsights = [
    { id: 1, type: "trend", title: "Revenue Growth", description: `Total revenue: $${stats?.totalRevenue?.toLocaleString() || "0"}`, impact: "positive", icon: DollarSign },
    { id: 2, type: "insight", title: "Top Event", description: events.length > 0 ? `${events[0].title}` : "No events yet", impact: "neutral", icon: DollarSign },
  ];

  const insightsData = financialInsights;

  // Calculate monthly revenue data from real events (using revenueTrends which is already calculated)
  const monthlyRevenueData = revenueTrends.map(trend => ({
    month: trend.month,
    revenue: trend.revenue,
    events: trend.events,
    attendees: events.filter(e => {
      if (!e.startDate) return false;
      const date = new Date(e.startDate);
      return date.toLocaleDateString('en-US', { month: 'short' }) === trend.month;
    }).reduce((sum, e) => sum + (e.attendees || 0), 0),
  }));

  // Calculate revenue by event category from real events
  const revenueByCategoryMap = new Map<string, number>();
  events.forEach(event => {
    const category = event.category || 'Other';
    const revenue = typeof event.price === 'number' ? event.price * (event.attendees || 0) : 0;
    revenueByCategoryMap.set(category, (revenueByCategoryMap.get(category) || 0) + revenue);
  });
  const totalCategoryRevenue = Array.from(revenueByCategoryMap.values()).reduce((a, b) => a + b, 0);
  const revenueByEventTypeData = Array.from(revenueByCategoryMap.entries()).map(([type, revenue]) => ({
    type,
    revenue,
    percentage: totalCategoryRevenue > 0 ? Math.round((revenue / totalCategoryRevenue) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  // Payment method data uses real paymentMethods which is calculated from stats
  const paymentMethodData = paymentMethods.map(method => ({
    method: method.method,
    percentage: method.percentage,
    amount: method.amount,
  }));

  // Revenue vs Attendees from real events
  const revenueVsAttendeesData = revenueBreakdown.map(event => ({
    attendees: event.attendees,
    revenue: event.revenue,
    event: event.event,
  }));

  // Use imported data
  const statsData = revenueStats;

  // Use imported data
  const breakdownData = revenueBreakdown;
  const paymentMethodsData = paymentMethods;
  const trendsData = revenueTrends;

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

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case "growth":
        return "text-success bg-success-light border-success/20";
      case "strategy":
        return "text-primary bg-primary/10 border-primary/20";
      case "payment":
        return "text-primary bg-primary/10 border-primary/20";
      case "policy":
        return "text-warning bg-warning/10 border-warning/20";
      case "timing":
        return "text-destructive bg-destructive/10 border-destructive/20";
      case "pricing":
        return "text-warning bg-warning/10 border-warning/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <OrganizerLayout>
      <div className="py-8">
        <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-page-title">Revenue Reports</h1>
            <p className="text-page-subtitle mt-1">
              Comprehensive financial analytics and revenue insights for your events
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
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="all">All Events</option>
              <option value="completed">Completed Events</option>
              <option value="upcoming">Upcoming Events</option>
              <option value="active">Active Events</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Revenue Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statsData.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
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
                        <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          stat.changeType === "positive" ? "text-green-600" : "text-red-600"
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
                    <DollarSign className={`h-5 w-5 ${stat.color}`} />
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
            <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            <TabsTrigger value="insights">Financial Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomAreaChart
                    data={monthlyRevenueData}
                    dataKey="revenue"
                    xAxisKey="month"
                    height={300}
                    color={CHART_COLORS.success}
                    formatter={(value) => `$${(value as number).toLocaleString()}`}
                  />
                </CardContent>
              </Card>

              {/* Revenue by Event Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Event Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomPieChart
                    data={revenueByEventTypeData}
                    dataKey="percentage"
                    nameKey="type"
                    height={300}
                    formatter={(value) => `${value}%`}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Attendees */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Attendees Correlation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomComposedChart
                    data={revenueVsAttendeesData}
                    xAxisKey="event"
                    bars={[
                      { dataKey: "attendees", name: "Attendees", color: CHART_COLORS.primary },
                    ]}
                    lines={[
                      { dataKey: "revenue", name: "Revenue", color: CHART_COLORS.success },
                    ]}
                    height={300}
                    formatter={(value, name) => {
                      if (name === "Attendees") return (value as number).toLocaleString();
                      if (name === "Revenue") return `$${(value as number).toLocaleString()}`;
                      return (value as number).toString();
                    }}
                  />
                </CardContent>
              </Card>

              {/* Monthly Revenue Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trendsData.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground text-sm">{trend.month}</h3>
                        <p className="text-xs text-muted-foreground">{trend.events} events</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          ${trend.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {breakdownData.map((event) => (
                    <div key={event.event} className="border border-border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-foreground">{event.event}</h3>
                          <p className="text-sm text-muted-foreground">{event.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(event.status)}
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              ${event.netRevenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">net revenue</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Gross Revenue</p>
                          <p className="font-medium">${event.revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Attendees</p>
                          <p className="font-medium">{event.attendees}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ticket Price</p>
                          <p className="font-medium">${event.ticketPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Refunds</p>
                          <p className="font-medium text-red-600">-${event.refunds.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue/Attendee</p>
                            <p className="font-medium">${event.revenuePerAttendee}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Growth</p>
                            <p className="font-medium text-green-600">+{event.growth}%</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomPieChart
                    data={paymentMethodData}
                    dataKey="percentage"
                    nameKey="method"
                    height={300}
                    formatter={(value) => `${value}%`}
                  />
                </CardContent>
              </Card>

              {/* Payment Methods Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentMethodsData.map((method, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-foreground">{method.method}</span>
                          <span className="text-sm text-muted-foreground">
                            ${method.amount.toLocaleString()} ({method.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${method.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">{method.count} transactions</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Success Rate Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Success Rate Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomLineChart
                    data={monthlyRevenueData}
                    dataKey="revenue"
                    xAxisKey="month"
                    height={300}
                    color={CHART_COLORS.success}
                    formatter={(value) => `$${(value as number).toLocaleString()}`}
                  />
                </CardContent>
              </Card>

              {/* Revenue by Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart
                    data={paymentMethodData}
                    dataKey="amount"
                    xAxisKey="method"
                    height={300}
                    color={CHART_COLORS.primary}
                    formatter={(value) => `$${(value as number).toLocaleString()}`}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insightsData.map((insight) => (
                <Card key={insight.id} className={`border ${getInsightTypeColor(insight.type).split(' ')[2]}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full ${getInsightTypeColor(insight.type).split(' ')[1]} flex items-center justify-center`}>
                        {insight.icon && <insight.icon className={`h-4 w-4 ${getInsightTypeColor(insight.type).split(' ')[0]}`} />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default RevenueReports;
