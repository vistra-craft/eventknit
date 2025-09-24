import React, { useState } from "react";
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
  Star,
  MapPin,
  Mic,
  Building2,
} from "lucide-react";

const EventPerformance = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState("all");

  // Mock data - in a real app, this would come from your API
  const eventPerformanceData = [
    {
      id: 1,
      title: "Tech Innovation Summit 2024",
      date: "March 15-17, 2024",
      status: "completed",
      metrics: {
        attendees: 485,
        capacity: 500,
        revenue: 145200,
        views: 3250,
        conversion: 14.9,
        rating: 4.8,
        speakers: 24,
        exhibitors: 18,
        sponsors: 12,
        duration: "3 days",
        location: "San Francisco, CA",
      },
      performance: {
        attendanceRate: 97,
        revenuePerAttendee: 299,
        conversionRate: 14.9,
        satisfactionScore: 4.8,
        engagementScore: 92,
      },
      trends: {
        registrationGrowth: 18,
        revenueGrowth: 24,
        attendanceGrowth: 12,
        satisfactionGrowth: 5,
      },
    },
    {
      id: 2,
      title: "Digital Marketing Conference",
      date: "January 20, 2024",
      status: "completed",
      metrics: {
        attendees: 450,
        capacity: 500,
        revenue: 67500,
        views: 2100,
        conversion: 21.4,
        rating: 4.6,
        speakers: 32,
        exhibitors: 28,
        sponsors: 15,
        duration: "1 day",
        location: "Chicago, IL",
      },
      performance: {
        attendanceRate: 90,
        revenuePerAttendee: 150,
        conversionRate: 21.4,
        satisfactionScore: 4.6,
        engagementScore: 88,
      },
      trends: {
        registrationGrowth: 15,
        revenueGrowth: 19,
        attendanceGrowth: 8,
        satisfactionGrowth: 3,
      },
    },
    {
      id: 3,
      title: "Business Leadership Workshop",
      date: "April 2, 2024",
      status: "upcoming",
      metrics: {
        attendees: 78,
        capacity: 100,
        revenue: 15600,
        views: 890,
        conversion: 8.8,
        rating: 4.7,
        speakers: 8,
        exhibitors: 5,
        sponsors: 3,
        duration: "5 hours",
        location: "New York, NY",
      },
      performance: {
        attendanceRate: 78,
        revenuePerAttendee: 200,
        conversionRate: 8.8,
        satisfactionScore: 4.7,
        engagementScore: 85,
      },
      trends: {
        registrationGrowth: 22,
        revenueGrowth: 28,
        attendanceGrowth: 15,
        satisfactionGrowth: 7,
      },
    },
    {
      id: 4,
      title: "Food & Wine Expo",
      date: "February 10, 2024",
      status: "completed",
      metrics: {
        attendees: 320,
        capacity: 350,
        revenue: 25600,
        views: 1890,
        conversion: 16.9,
        rating: 4.5,
        speakers: 15,
        exhibitors: 45,
        sponsors: 8,
        duration: "9 hours",
        location: "Los Angeles, CA",
      },
      performance: {
        attendanceRate: 91,
        revenuePerAttendee: 80,
        conversionRate: 16.9,
        satisfactionScore: 4.5,
        engagementScore: 89,
      },
      trends: {
        registrationGrowth: 12,
        revenueGrowth: 16,
        attendanceGrowth: 6,
        satisfactionGrowth: 2,
      },
    },
  ];

  const performanceMetrics = [
    {
      title: "Average Attendance Rate",
      value: "89%",
      change: "+5%",
      changeType: "positive",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Average Conversion Rate",
      value: "15.5%",
      change: "+2.1%",
      changeType: "positive",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Average Revenue per Event",
      value: "$63,475",
      change: "+18%",
      changeType: "positive",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Average Satisfaction Score",
      value: "4.6",
      change: "+0.3",
      changeType: "positive",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

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
          {performanceMetrics.map((metric, index) => (
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
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
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
              {/* Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Performance overview chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventPerformanceData
                    .sort((a, b) => b.performance.engagementScore - a.performance.engagementScore)
                    .slice(0, 3)
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground text-sm">{event.title}</h3>
                          <p className="text-xs text-muted-foreground">{event.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${getPerformanceColor(event.performance.engagementScore)}`}>
                            {event.performance.engagementScore}
                          </p>
                          <p className="text-xs text-muted-foreground">score</p>
                        </div>
                      </div>
                    ))}
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
              {/* Trend Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Performance trend chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Trend Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Revenue trend chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OrganizerLayout>
  );
};

export default EventPerformance;
