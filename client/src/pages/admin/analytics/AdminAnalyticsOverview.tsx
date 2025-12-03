import { useState } from "react";
import { useLocation } from "react-router-dom";
import AdminLayout from "../AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  DollarSign,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw,
  Shield,
  Building2,
  Activity,
} from "lucide-react";
import {
  CustomLineChart,
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
  CustomMultiLineChart,
  CustomComposedChart,
} from "@/components/charts/ChartComponents";
import { CHART_COLORS } from "@/components/charts/chartConstants";

const AdminAnalyticsOverview = () => {
  const location = useLocation();
  const [timeRange, setTimeRange] = useState("30d");

  // Determine current tab based on route
  const getCurrentTab = () => {
    if (location.pathname.includes('/events')) return 'events';
    if (location.pathname.includes('/users')) return 'organizers';
    if (location.pathname.includes('/revenue')) return 'revenue';
    if (location.pathname.includes('/system')) return 'system';
    return 'overview';
  };

  const currentTab = getCurrentTab();

  // Admin-specific analytics data
  const platformStats = [
    {
      title: "Total Events",
      value: "1,247",
      change: "+18%",
      changeType: "positive",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      description: "All events on platform",
    },
    {
      title: "Active Organizers",
      value: "1,089",
      change: "+15%",
      changeType: "positive",
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
      description: "Registered organizers",
    },
    {
      title: "Total Attendees",
      value: "45,230",
      change: "+24%",
      changeType: "positive",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      description: "Platform-wide attendees",
    },
    {
      title: "Platform Revenue",
      value: "$2,847,450",
      change: "+32%",
      changeType: "positive",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-200",
      description: "Total platform revenue",
    },
    {
      title: "System Health",
      value: "99.9%",
      change: "+0.1%",
      changeType: "positive",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-200",
      description: "Platform uptime",
    },
    {
      title: "Page Views",
      value: "892,340",
      change: "+12%",
      changeType: "positive",
      icon: Eye,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      borderColor: "border-indigo-200",
      description: "Platform page views",
    },
  ];

  // Chart data
  const platformGrowthData = [
    { month: "Jan", events: 45, organizers: 89, attendees: 3200, revenue: 125000 },
    { month: "Feb", events: 52, organizers: 95, attendees: 3800, revenue: 145000 },
    { month: "Mar", events: 68, organizers: 112, attendees: 5200, revenue: 195000 },
    { month: "Apr", events: 75, organizers: 125, attendees: 6100, revenue: 225000 },
    { month: "May", events: 82, organizers: 138, attendees: 7200, revenue: 275000 },
    { month: "Jun", events: 95, organizers: 156, attendees: 8900, revenue: 340000 },
  ];

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

  const recentEvents = [
    {
      id: 1,
      title: "Tech Conference 2024",
      organizer: "Tech Events Co.",
      date: "2024-03-15",
      attendees: 1250,
      status: "active",
      revenue: "$45,000",
      category: "Technology",
    },
    {
      id: 2,
      title: "Business Leadership Workshop",
      organizer: "Business Academy",
      date: "2024-03-20",
      attendees: 450,
      status: "pending",
      revenue: "$12,500",
      category: "Business",
    },
    {
      id: 3,
      title: "Music Festival 2024",
      organizer: "Music Events Ltd",
      date: "2024-04-01",
      attendees: 5000,
      status: "active",
      revenue: "$125,000",
      category: "Entertainment",
    },
    {
      id: 4,
      title: "Health & Wellness Expo",
      organizer: "Wellness Corp",
      date: "2024-03-25",
      attendees: 800,
      status: "approved",
      revenue: "$28,000",
      category: "Health",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Approved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Platform Analytics
              </h1>
              <p className="text-gray-600">
                Comprehensive insights into platform performance and user engagement
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

          {/* Platform Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {platformStats.map((stat, index) => (
              <Card key={index} className={`border ${stat.borderColor} hover:shadow-md transition-shadow duration-200`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="font-semibold text-gray-900 mb-1">
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
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={currentTab} className="space-y-6">
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
                      data={platformGrowthData}
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
                            metric.status === "excellent" ? "text-green-600" : 
                            metric.status === "good" ? "text-blue-600" : "text-red-600"
                          }`}>
                            {metric.value}{metric.unit}
                          </p>
                          <p className={`text-xs ${
                            metric.status === "excellent" ? "text-green-600" : 
                            metric.status === "good" ? "text-blue-600" : "text-red-600"
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
                            <h3 className="font-medium text-foreground">{event.title}</h3>
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
                      data={platformGrowthData}
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
                      data={platformGrowthData}
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
                        <span className="font-semibold text-green-600">+32%</span>
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
                      data={platformGrowthData}
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
                      data={platformGrowthData}
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
        </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsOverview;
