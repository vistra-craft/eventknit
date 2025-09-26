import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import OrganizerLayout from "../OrganizerLayout";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Star,
  MapPin,
  Mic,
  Building2,
} from "lucide-react";
import {
  CustomLineChart,
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
  CustomMultiLineChart,
  CustomComposedChart,
  CustomScatterChart,
  CHART_COLORS,
} from "@/components/charts/ChartComponents";
import {
  eventPerformanceData,
  performanceMetrics,
} from "@/data/analytics";

const EventPerformance = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState("all");

  // Chart data for performance analysis
  const performanceTrendsData = [
    { month: "Jan", attendance: 85, satisfaction: 4.2, engagement: 78, revenue: 45000 },
    { month: "Feb", attendance: 88, satisfaction: 4.4, engagement: 82, revenue: 32000 },
    { month: "Mar", attendance: 92, satisfaction: 4.6, engagement: 89, revenue: 145200 },
    { month: "Apr", attendance: 87, satisfaction: 4.5, engagement: 85, revenue: 28000 },
    { month: "May", attendance: 90, satisfaction: 4.7, engagement: 91, revenue: 18000 },
    { month: "Jun", attendance: 94, satisfaction: 4.8, engagement: 93, revenue: 165000 },
  ];

  const eventComparisonData = [
    { name: "Tech Summit", attendees: 485, revenue: 145200, conversion: 14.9, rating: 4.8 },
    { name: "Marketing Conf", attendees: 450, revenue: 67500, conversion: 21.4, rating: 4.6 },
    { name: "Business Workshop", attendees: 78, revenue: 15600, conversion: 8.8, rating: 4.7 },
    { name: "Food & Wine Expo", attendees: 320, revenue: 25600, conversion: 16.9, rating: 4.5 },
  ];

  const satisfactionDistributionData = [
    { rating: "5 stars", count: 45, percentage: 45 },
    { rating: "4 stars", count: 35, percentage: 35 },
    { rating: "3 stars", count: 15, percentage: 15 },
    { rating: "2 stars", count: 3, percentage: 3 },
    { rating: "1 star", count: 2, percentage: 2 },
  ];

  const attendanceVsRevenueData = [
    { attendees: 78, revenue: 15600, event: "Business Workshop" },
    { attendees: 320, revenue: 25600, event: "Food & Wine Expo" },
    { attendees: 450, revenue: 67500, event: "Marketing Conf" },
    { attendees: 485, revenue: 145200, event: "Tech Summit" },
  ];

  // Use imported data
  const eventsData = eventPerformanceData;

  // Use imported performance metrics
  const metricsData = performanceMetrics;

  // Debug: Log the data to console
  console.log('EventPerformance - metricsData:', metricsData);
  console.log('EventPerformance - eventsData:', eventsData);

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

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBg = (score: number) => {
    if (score >= 90) return "bg-green-100";
    if (score >= 80) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <OrganizerLayout>
      <div className="py-8">
        <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Event Performance</h1>
            <p className="text-muted-foreground mt-1">
              Detailed performance metrics and analytics for your events
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
          </div>
        </div>

        {/* Performance Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsData.map((metric, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {metric.title}
                    </p>
                    <p className="text-xl font-bold text-foreground mb-1">
                      {metric.value}
                    </p>
                    <div className="flex items-center">
                      {metric.changeType === "positive" ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          metric.changeType === "positive" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                    <Users className={`h-5 w-5 ${metric.color}`} />
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
            <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="comparison">Event Comparison</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomMultiLineChart
                    data={performanceTrendsData}
                    xAxisKey="month"
                    lines={[
                      { dataKey: "attendance", name: "Attendance Rate", color: CHART_COLORS.success },
                      { dataKey: "satisfaction", name: "Satisfaction Score", color: CHART_COLORS.warning },
                      { dataKey: "engagement", name: "Engagement Score", color: CHART_COLORS.primary },
                    ]}
                    height={300}
                    formatter={(value, name) => {
                      if (name === "Attendance Rate") return `${value}%`;
                      if (name === "Satisfaction Score") return value.toFixed(1);
                      if (name === "Engagement Score") return `${value}%`;
                      return value.toString();
                    }}
                  />
                </CardContent>
              </Card>

              {/* Event Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomComposedChart
                    data={eventComparisonData}
                    xAxisKey="name"
                    bars={[
                      { dataKey: "attendees", name: "Attendees", color: CHART_COLORS.primary },
                    ]}
                    lines={[
                      { dataKey: "conversion", name: "Conversion Rate", color: CHART_COLORS.success },
                      { dataKey: "rating", name: "Rating", color: CHART_COLORS.warning },
                    ]}
                    height={300}
                    formatter={(value, name) => {
                      if (name === "Attendees") return value.toLocaleString();
                      if (name === "Conversion Rate") return `${value}%`;
                      if (name === "Rating") return value.toFixed(1);
                      return value.toString();
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Satisfaction Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomPieChart
                    data={satisfactionDistributionData}
                    dataKey="count"
                    nameKey="rating"
                    height={300}
                    formatter={(value, name) => `${value}%`}
                  />
                </CardContent>
              </Card>

              {/* Attendance vs Revenue Scatter */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance vs Revenue Correlation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomScatterChart
                    data={attendanceVsRevenueData}
                    xDataKey="attendees"
                    yDataKey="revenue"
                    height={300}
                    color={CHART_COLORS.primary}
                    formatter={(value, name) => {
                      if (name === "attendees") return value.toLocaleString();
                      if (name === "revenue") return `$${value.toLocaleString()}`;
                      return value.toString();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="space-y-6">
              {eventPerformanceData.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{event.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(event.status)}
                        <div className={`px-3 py-1 rounded-full ${getPerformanceBg(event.performance.engagementScore)}`}>
                          <span className={`text-sm font-medium ${getPerformanceColor(event.performance.engagementScore)}`}>
                            Score: {event.performance.engagementScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Basic Metrics */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Basic Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Attendees</span>
                            <span className="text-sm font-medium">{event.metrics.attendees}/{event.metrics.capacity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Revenue</span>
                            <span className="text-sm font-medium">${event.metrics.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Views</span>
                            <span className="text-sm font-medium">{event.metrics.views.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Conversion</span>
                            <span className="text-sm font-medium">{event.metrics.conversion}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Performance</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Attendance Rate</span>
                            <span className="text-sm font-medium">{event.performance.attendanceRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Revenue/Attendee</span>
                            <span className="text-sm font-medium">${event.performance.revenuePerAttendee}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Satisfaction</span>
                            <span className="text-sm font-medium">{event.performance.satisfactionScore} ⭐</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Engagement</span>
                            <span className="text-sm font-medium">{event.performance.engagementScore}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Event Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{event.metrics.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{event.metrics.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{event.metrics.speakers} speakers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{event.metrics.exhibitors} exhibitors</span>
                          </div>
                        </div>
                      </div>

                      {/* Growth Trends */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Growth Trends</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Registration</span>
                            <span className="text-sm font-medium text-green-600">+{event.trends.registrationGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Revenue</span>
                            <span className="text-sm font-medium text-green-600">+{event.trends.revenueGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Attendance</span>
                            <span className="text-sm font-medium text-green-600">+{event.trends.attendanceGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Satisfaction</span>
                            <span className="text-sm font-medium text-green-600">+{event.trends.satisfactionGrowth}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Comparison Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-foreground">Event</th>
                        <th className="text-center py-3 px-4 font-medium text-foreground">Attendees</th>
                        <th className="text-center py-3 px-4 font-medium text-foreground">Revenue</th>
                        <th className="text-center py-3 px-4 font-medium text-foreground">Conversion</th>
                        <th className="text-center py-3 px-4 font-medium text-foreground">Rating</th>
                        <th className="text-center py-3 px-4 font-medium text-foreground">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventPerformanceData.map((event) => (
                        <tr key={event.id} className="border-b border-border">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-foreground">{event.title}</p>
                              <p className="text-sm text-muted-foreground">{event.date}</p>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-medium">{event.metrics.attendees}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-medium">${event.metrics.revenue.toLocaleString()}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-medium">{event.metrics.conversion}%</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-medium">{event.metrics.rating} ⭐</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-medium ${getPerformanceColor(event.performance.engagementScore)}`}>
                              {event.performance.engagementScore}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
                    data={performanceTrendsData}
                    dataKey="revenue"
                    xAxisKey="month"
                    height={300}
                    color={CHART_COLORS.success}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                </CardContent>
              </Card>

              {/* Engagement Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomLineChart
                    data={performanceTrendsData}
                    dataKey="engagement"
                    xAxisKey="month"
                    height={300}
                    color={CHART_COLORS.primary}
                    formatter={(value) => `${value}%`}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart
                    data={performanceTrendsData}
                    dataKey="attendance"
                    xAxisKey="month"
                    height={300}
                    color={CHART_COLORS.info}
                    formatter={(value) => `${value}%`}
                  />
                </CardContent>
              </Card>

              {/* Satisfaction Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomLineChart
                    data={performanceTrendsData}
                    dataKey="satisfaction"
                    xAxisKey="month"
                    height={300}
                    color={CHART_COLORS.warning}
                    formatter={(value) => value.toFixed(1)}
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

export default EventPerformance;
