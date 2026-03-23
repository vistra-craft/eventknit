import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import {
  CustomAreaChart,
  CustomPieChart,
  CustomMultiLineChart,
  CustomComposedChart,
  CustomRadialBarChart,
} from "@/components/charts/ChartComponents";
import { CHART_COLORS } from "@/components/charts/chartConstants";
import { getOrganizerDashboardStats } from "@/lib/organizer-api";

const AttendeeInsights = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [stats, setStats] = useState<{ totalAttendees?: number; totalEvents?: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Note: selectedEvent filter is not applied here as demographics data
        // would need to come from backend API for specific events
        // For now, we show aggregate data
        const statsResponse = await getOrganizerDashboardStats();
        if (statsResponse.success) setStats(statsResponse.data.stats);
      } catch (err) {
        console.error('Failed to load attendee insights:', err);
      }
    };
    fetchData();
  }, [timeRange, selectedEvent]);

  const attendeeStats = stats ? [
    { title: "Total Attendees", value: stats.totalAttendees?.toLocaleString() || "0", change: "+0%", changeType: "positive" as const, trend: "up", description: "Total registered attendees", bgColor: "bg-success-light", color: "text-success" },
    { title: "Avg per Event", value: stats.totalEvents ? Math.round((stats.totalAttendees || 0) / stats.totalEvents).toString() : "0", change: "+0%", changeType: "positive" as const, trend: "up", description: "Average attendees per event", bgColor: "bg-primary/10", color: "text-primary" },
    { title: "Growth Rate", value: "+0%", change: "+0%", changeType: "positive" as const, trend: "up", description: "Attendee growth rate", bgColor: "bg-primary/10", color: "text-primary" },
  ] : [];


  const behaviorInsights = [
    { id: 1, type: "insight", title: "Peak Registration", insight: "Peak Registration", description: "Most registrations occur in the week before events", impact: "positive" },
    { id: 2, type: "trend", title: "Engagement", insight: "Engagement", description: `Average ${stats?.totalAttendees ? Math.round(stats.totalAttendees / (stats.totalEvents || 1)) : 0} attendees per event`, impact: "positive" },
  ];

  // Chart data for attendee analysis - placeholders (would need backend API support)
  // Engagement trends would need backend support for monthly engagement metrics
  const engagementTrendsData: Array<{ month: string; engagement: number; satisfaction: number; retention: number }> = [];
  
  // Registration timing would need backend API support for hourly registration data
  const registrationTimingData: Array<{ hour: string; registrations: number; views: number }> = [];
  
  // Device usage would need backend API support for device analytics
  const deviceUsageData: Array<{ device: string; percentage: number; count: number }> = [];
  
  const statsData = attendeeStats;
  const insightsData = behaviorInsights;

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case "timing":
        return "text-primary bg-primary/10 border-primary/20";
      case "device":
        return "text-success bg-success-light border-success/20";
      case "pricing":
        return "text-warning bg-warning/10 border-warning/20";
      case "marketing":
        return "text-primary bg-primary/10 border-primary/20";
      case "networking":
        return "text-destructive bg-destructive/10 border-destructive/20";
      case "content":
        return "text-warning bg-warning/10 border-warning/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
      <div className="py-8">
        <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-page-title">Attendee Insights</h1>
            <p className="text-page-subtitle mt-1">
              Understand your audience demographics, behavior, and preferences
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
              Export Data
            </Button>
          </div>
        </div>

        {/* Attendee Stats Grid */}
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
                    <Users className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="demographics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="demographics" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-2">Demographic data not yet available</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Age, location, and industry breakdowns require attendees to complete demographic fields during registration.
                  This data will appear here once collected.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registration Timing */}
              <Card>
                <CardHeader>
                  <CardTitle>Registration Timing Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  {registrationTimingData.length > 0 ? (
                    <CustomComposedChart
                      data={registrationTimingData}
                      xAxisKey="hour"
                      bars={[
                        { dataKey: "registrations", name: "Registrations", color: CHART_COLORS.primary },
                      ]}
                      lines={[
                        { dataKey: "views", name: "Page Views", color: CHART_COLORS.secondary },
                      ]}
                      height={300}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[220px] sm:h-[300px] text-muted-foreground">
                      <p>Registration timing data requires backend API support</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Device Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Usage Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {deviceUsageData.length > 0 ? (
                    <CustomPieChart
                      data={deviceUsageData}
                      dataKey="percentage"
                      nameKey="device"
                      height={300}
                      formatter={(value) => `${value}%`}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[220px] sm:h-[300px] text-muted-foreground">
                      <p>Device usage data requires backend API support</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insightsData.map((insight) => (
                <Card key={insight.id} className={`border ${getInsightTypeColor(insight.type).split(' ')[2]}`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full ${getInsightTypeColor(insight.type).split(' ')[1]} flex items-center justify-center`}>
                        <Clock className={`h-4 w-4 ${getInsightTypeColor(insight.type).split(' ')[0]}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-foreground">Recommendation:</p>
                          <p className="text-sm text-muted-foreground">{insight.insight}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-2">Attendee segments not yet available</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Segment data — including first-time vs. returning attendees, satisfaction scores, and retention rates —
                  requires backend support for attendee tracking across events.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {engagementTrendsData.length > 0 ? (
                    <CustomMultiLineChart
                      data={engagementTrendsData}
                      xAxisKey="month"
                      lines={[
                        { dataKey: "engagement", name: "Engagement Score", color: CHART_COLORS.primary },
                        { dataKey: "satisfaction", name: "Satisfaction Score", color: CHART_COLORS.warning },
                        { dataKey: "retention", name: "Retention Rate", color: CHART_COLORS.success },
                      ]}
                      height={300}
                      formatter={(value, name) => {
                        if (name === "Engagement Score") return `${value}%`;
                        if (name === "Satisfaction Score") return (value as number).toFixed(1);
                        if (name === "Retention Rate") return `${value}%`;
                        return (value as number).toString();
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[220px] sm:h-[300px] text-muted-foreground">
                      <p>Engagement trends data requires backend API support</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Engagement metrics require backend API support for detailed analytics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomRadialBarChart
                    data={[
                      { name: "High Engagement", value: 45 },
                      { name: "Medium Engagement", value: 35 },
                      { name: "Low Engagement", value: 20 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    height={300}
                    formatter={(value) => `${value}%`}
                  />
                </CardContent>
              </Card>

              {/* Engagement by Time of Day */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement by Time of Day</CardTitle>
                </CardHeader>
                <CardContent>
                  {registrationTimingData.length > 0 ? (
                    <CustomAreaChart
                      data={registrationTimingData}
                      dataKey="registrations"
                      xAxisKey="hour"
                      height={300}
                      color={CHART_COLORS.info}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[220px] sm:h-[300px] text-muted-foreground">
                      <p>Time of day data requires backend API support</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
  );
};

export default AttendeeInsights;
