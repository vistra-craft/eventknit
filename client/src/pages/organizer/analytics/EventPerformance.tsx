import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EventThumbnail } from "@/components/ui/event-thumbnail";
import OrganizerLayout from "../OrganizerLayout";
import {
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
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
  CustomScatterChart
} from "@/components/charts/ChartComponents";
import { CHART_COLORS } from "@/components/charts/chartConstants";
import { getOrganizerEvents } from "@/lib/organizer-api";

const EventPerformance = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [events, setEvents] = useState<Array<{ id: string; title: string; startDate?: string; attendees?: number; price?: number | string | null; views?: number; rating?: number; status?: string; capacity?: number; duration?: string; location?: string; venue?: string; speakers?: Array<unknown>; exhibitors?: Array<unknown>; image?: string; category?: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filters: { limit?: number; status?: string } = { limit: 100 };
        
        // Apply status filter
        if (selectedEvent !== 'all') {
          filters.status = selectedEvent.toUpperCase();
        }
        
        const response = await getOrganizerEvents(filters);
        if (response.success && response.data?.events) {
          setEvents(response.data.events as Array<{ id: string; title: string; startDate?: string; attendees?: number; price?: number | string | null; views?: number; rating?: number; status?: string; capacity?: number; duration?: string; location?: string; venue?: string; speakers?: Array<unknown>; exhibitors?: Array<unknown>; image?: string; category?: string }>);
        }
      } catch (err) {
        console.error('Failed to load event performance data:', err);
      }
    };
    fetchData();
  }, [timeRange, selectedEvent]);

  const eventPerformanceData = events.map(e => {
    const revenue = typeof e.price === 'number' ? e.price * (e.attendees || 0) : 0;
    const conversion = e.views ? ((e.attendees || 0) / e.views * 100) : 0;
    const attendanceRate = e.attendees && e.capacity ? Math.round((e.attendees / e.capacity) * 100) : 0;
    const revenuePerAttendee = (e.attendees || 0) > 0 ? Math.round(revenue / (e.attendees || 0)) : 0;
    return {
      id: e.id,
      event: e.title,
      title: e.title,
      date: e.startDate ? new Date(e.startDate).toLocaleDateString() : 'TBD',
      attendees: e.attendees || 0,
      revenue,
      conversion: conversion.toFixed(1),
      rating: e.rating || 0,
      status: e.status || 'pending',
      performance: {
        attendance: attendanceRate,
        satisfaction: e.rating || 0,
        engagement: conversion,
        revenue,
        attendanceRate,
        revenuePerAttendee,
        satisfactionScore: e.rating || 0,
        engagementScore: Math.round(conversion),
      },
      metrics: {
        attendance: attendanceRate,
        satisfaction: e.rating || 0,
        engagement: conversion,
        revenue,
        duration: e.duration || 'N/A',
        location: e.location || e.venue || 'N/A',
        attendees: e.attendees || 0,
        image: e.image,
        category: e.category,
        capacity: e.capacity || 0,
        views: e.views || 0,
        conversion: parseFloat(conversion.toFixed(1)),
        speakers: e.speakers?.length || 0,
        exhibitors: e.exhibitors?.length || 0,
        rating: e.rating || 0,
      },
      trends: {
        attendance: attendanceRate,
        satisfaction: e.rating || 0,
        engagement: conversion,
        revenue,
        registrationGrowth: "+0%",
        revenueGrowth: "+0%",
        attendanceGrowth: "+0%",
        satisfactionGrowth: "+0%",
      },
    };
  });

  const performanceMetrics = [
    { 
      metric: "Total Events", 
      value: events.length.toString(), 
      change: "+0%", 
      trend: "up",
      title: "Total Events",
      changeType: "positive" as const,
      bgColor: "bg-primary/10",
      color: "text-primary",
    },
    { 
      metric: "Avg Attendees", 
      value: events.length > 0 ? Math.round(events.reduce((sum, e) => sum + (e.attendees || 0), 0) / events.length).toString() : "0", 
      change: "+0%", 
      trend: "up",
      title: "Avg Attendees",
      changeType: "positive" as const,
      bgColor: "bg-success-light",
      color: "text-success",
    },
    { 
      metric: "Total Revenue", 
      value: `$${events.reduce((sum, e) => sum + (typeof e.price === 'number' ? e.price * (e.attendees || 0) : 0), 0).toLocaleString()}`, 
      change: "+0%", 
      trend: "up",
      title: "Total Revenue",
      changeType: "positive" as const,
      bgColor: "bg-success-light",
      color: "text-success",
    },
  ];

  // Calculate performance trends from real events (grouped by month)
  const getPerformanceTrendsData = () => {
    const monthMap = new Map<string, { attendance: number[]; satisfaction: number[]; engagement: number[]; revenue: number[] }>();
    
    events.forEach(event => {
      if (event.startDate) {
        const date = new Date(event.startDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const existing = monthMap.get(monthKey) || { attendance: [], satisfaction: [], engagement: [], revenue: [] };
        
        const attendanceRate = event.attendees && event.capacity ? (event.attendees / event.capacity) * 100 : 0;
        const conversion = event.views ? ((event.attendees || 0) / event.views * 100) : 0;
        const revenue = typeof event.price === 'number' ? event.price * (event.attendees || 0) : 0;
        
        existing.attendance.push(attendanceRate);
        existing.satisfaction.push(event.rating || 0);
        existing.engagement.push(conversion);
        existing.revenue.push(revenue);
        monthMap.set(monthKey, existing);
      }
    });
    
    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      attendance: data.attendance.length > 0 ? Math.round(data.attendance.reduce((a, b) => a + b, 0) / data.attendance.length) : 0,
      satisfaction: data.satisfaction.length > 0 ? parseFloat((data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length).toFixed(1)) : 0,
      engagement: data.engagement.length > 0 ? Math.round(data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length) : 0,
      revenue: data.revenue.reduce((a, b) => a + b, 0),
    }));
  };

  const performanceTrendsData = getPerformanceTrendsData();

  // Event comparison data from real events (top 10 by attendees)
  const eventComparisonData = eventPerformanceData
    .sort((a, b) => b.attendees - a.attendees)
    .slice(0, 10)
    .map(event => ({
      name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
      attendees: event.attendees,
      revenue: event.revenue,
      conversion: parseFloat(event.conversion),
      rating: event.rating,
    }));

  // Calculate satisfaction distribution from real ratings
  const satisfactionDistributionData = (() => {
    const ratings = eventPerformanceData.map(e => e.rating).filter(r => r > 0);
    if (ratings.length === 0) return [];
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      const rounded = Math.round(rating);
      if (rounded >= 5) distribution[5]++;
      else if (rounded >= 4) distribution[4]++;
      else if (rounded >= 3) distribution[3]++;
      else if (rounded >= 2) distribution[2]++;
      else distribution[1]++;
    });
    
    const total = ratings.length;
    return [
      { rating: "5 stars", count: distribution[5], percentage: Math.round((distribution[5] / total) * 100) },
      { rating: "4 stars", count: distribution[4], percentage: Math.round((distribution[4] / total) * 100) },
      { rating: "3 stars", count: distribution[3], percentage: Math.round((distribution[3] / total) * 100) },
      { rating: "2 stars", count: distribution[2], percentage: Math.round((distribution[2] / total) * 100) },
      { rating: "1 star", count: distribution[1], percentage: Math.round((distribution[1] / total) * 100) },
    ].filter(item => item.count > 0);
  })();

  // Attendance vs Revenue scatter data from real events
  const attendanceVsRevenueData = eventPerformanceData.map(event => ({
    attendees: event.attendees,
    revenue: event.revenue,
    event: event.title,
  }));

  const metricsData = performanceMetrics;

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

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-warning";
    return "text-destructive";
  };

  const getPerformanceBg = (score: number) => {
    if (score >= 90) return "bg-success-light";
    if (score >= 80) return "bg-warning/10";
    return "bg-destructive/10";
  };

  return (
    <OrganizerLayout>
      <div className="py-8">
        <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-page-title">Event Performance</h1>
            <p className="text-page-subtitle mt-1">
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
                        <ArrowUpRight className="h-3 w-3 text-success mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-destructive mr-1" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          metric.changeType === "positive" ? "text-success" : "text-destructive"
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
                      if (name === "Satisfaction Score") return (value as number).toFixed(1);
                      if (name === "Engagement Score") return `${value}%`;
                      return (value as number).toString();
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
                      if (name === "Attendees") return (value as number).toLocaleString();
                      if (name === "Conversion Rate") return `${value}%`;
                      if (name === "Rating") return (value as number).toFixed(1);
                      return (value as number).toString();
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
                    formatter={(value) => `${value}%`}
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
                      if (name === "attendees") return (value as number).toLocaleString();
                      if (name === "revenue") return `$${(value as number).toLocaleString()}`;
                      return (value as number).toString();
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
                    <div className="flex items-center gap-4">
                      <EventThumbnail
                        src={event.metrics.image}
                        alt={event.title}
                        category={event.metrics.category || ''}
                        size="md"
                      />
                      <div className="flex-1 flex items-center justify-between">
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
                            <span className="text-sm font-medium text-success">+{event.trends.registrationGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Revenue</span>
                            <span className="text-sm font-medium text-success">+{event.trends.revenueGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Attendance</span>
                            <span className="text-sm font-medium text-success">+{event.trends.attendanceGrowth}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Satisfaction</span>
                            <span className="text-sm font-medium text-success">+{event.trends.satisfactionGrowth}%</span>
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
                    formatter={(value) => `$${(value as number).toLocaleString()}`}
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
                    formatter={(value) => (value as number).toFixed(1)}
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

