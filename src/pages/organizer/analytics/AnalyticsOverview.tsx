import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import OrganizerLayout from "../OrganizerLayout";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  CustomLineChart,
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
  CustomMultiLineChart,
  CustomComposedChart,
  CHART_COLORS,
} from "@/components/charts/ChartComponents";
import {
  analyticsOverviewStats,
  topPerformingEvents,
  recentInsights,
  recentActivity,
} from "@/data/analytics";

const AnalyticsOverview = () => {
  const [timeRange, setTimeRange] = useState("30d");

  // Chart data
  const performanceTrendsData = [
    { month: "Jan", events: 3, attendees: 1200, revenue: 45000, views: 8500 },
    { month: "Feb", events: 2, attendees: 800, revenue: 32000, views: 6200 },
    { month: "Mar", events: 4, attendees: 1800, revenue: 145200, views: 12500 },
    { month: "Apr", events: 3, attendees: 950, revenue: 28000, views: 7800 },
    { month: "May", events: 2, attendees: 600, revenue: 18000, views: 4500 },
    { month: "Jun", events: 5, attendees: 2200, revenue: 165000, views: 18900 },
  ];

  const registrationTrendsData = [
    { day: "Mon", registrations: 45, views: 1200 },
    { day: "Tue", registrations: 52, views: 1350 },
    { day: "Wed", registrations: 38, views: 980 },
    { day: "Thu", registrations: 61, views: 1650 },
    { day: "Fri", registrations: 48, views: 1200 },
    { day: "Sat", registrations: 35, views: 850 },
    { day: "Sun", registrations: 28, views: 720 },
  ];

  const revenueTrendsData = [
    { month: "Jan", revenue: 45000, events: 3 },
    { month: "Feb", revenue: 32000, events: 2 },
    { month: "Mar", revenue: 145200, events: 4 },
    { month: "Apr", revenue: 28000, events: 3 },
    { month: "May", revenue: 18000, events: 2 },
    { month: "Jun", revenue: 165000, events: 5 },
  ];

  const eventCategoriesData = [
    { name: "Technology", value: 45, count: 12 },
    { name: "Business", value: 25, count: 7 },
    { name: "Marketing", value: 15, count: 4 },
    { name: "Health", value: 10, count: 3 },
    { name: "Other", value: 5, count: 2 },
  ];

  const conversionFunnelData = [
    { stage: "Page Views", value: 100, count: 89234 },
    { stage: "Registration", value: 15, count: 13385 },
    { stage: "Payment", value: 12, count: 10708 },
    { stage: "Attendance", value: 10, count: 8923 },
  ];

  const topPerformingEvents = [
    {
      id: 1,
      title: "Tech Innovation Summit 2024",
      attendees: 485,
      revenue: 145200,
      conversion: 21.4,
      views: 3250,
      rating: 4.8,
      status: "completed",
    },
    {
      id: 2,
      title: "Digital Marketing Conference",
      attendees: 450,
      revenue: 67500,
      conversion: 19.2,
      views: 2100,
      rating: 4.6,
      status: "completed",
    },
    {
      id: 3,
      title: "Business Leadership Workshop",
      attendees: 78,
      revenue: 15600,
      conversion: 8.8,
      views: 890,
      rating: 4.7,
      status: "upcoming",
    },
    {
      id: 4,
      title: "Food & Wine Expo",
      attendees: 320,
      revenue: 25600,
      conversion: 16.9,
      views: 1890,
      rating: 4.5,
      status: "completed",
    },
  ];

  const recentInsights = [
    {
      id: 1,
      type: "trend",
      title: "Peak Registration Times",
      description: "Most registrations occur between 2-4 PM on weekdays",
      impact: "positive",
      icon: TrendingUp,
    },
    {
      id: 2,
      type: "alert",
      title: "Low Conversion Rate",
      description: "Startup Pitch Competition has 5.6% conversion - below average",
      impact: "negative",
      icon: TrendingDown,
    },
    {
      id: 3,
      type: "insight",
      title: "High Engagement Events",
      description: "Tech events show 40% higher engagement than other categories",
      impact: "positive",
      icon: BarChart3,
    },
    {
      id: 4,
      type: "recommendation",
      title: "Pricing Optimization",
      description: "Consider reducing early bird pricing by 15% for better conversion",
      impact: "neutral",
      icon: DollarSign,
    },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive":
        return "text-green-600 bg-green-100 border-green-200";
      case "negative":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-blue-600 bg-blue-100 border-blue-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "upcoming":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case "active":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Active</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <OrganizerLayout>
      <div className="py-8">
        <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Overview</h1>
            <p className="text-muted-foreground mt-1">
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
                      if (name === "Revenue") return `$${value.toLocaleString()}`;
                      if (name === "Attendees") return value.toLocaleString();
                      return value.toString();
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
                    formatter={(value, name) => `${value}%`}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Best Performing Event</p>
                      <p className="text-xs text-muted-foreground">Tech Innovation Summit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">21.4%</p>
                      <p className="text-xs text-muted-foreground">conversion</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Average Rating</p>
                      <p className="text-xs text-muted-foreground">All events</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">4.6</p>
                      <p className="text-xs text-muted-foreground">stars</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Revenue Growth</p>
                      <p className="text-xs text-muted-foreground">vs last period</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">+24%</p>
                      <p className="text-xs text-muted-foreground">increase</p>
                    </div>
                  </div>
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
                    formatter={(value) => `$${value.toLocaleString()}`}
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
                      if (name === "Page Views") return value.toLocaleString();
                      if (name === "Attendees") return value.toLocaleString();
                      return value.toString();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default AnalyticsOverview;
