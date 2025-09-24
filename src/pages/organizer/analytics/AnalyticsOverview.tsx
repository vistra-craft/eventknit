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

const AnalyticsOverview = () => {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data - in a real app, this would come from your API
  const overviewStats = [
    {
      title: "Total Events",
      value: "24",
      change: "+12%",
      changeType: "positive",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      description: "Events created this period",
    },
    {
      title: "Total Attendees",
      value: "4,247",
      change: "+18%",
      changeType: "positive",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
      description: "Registered attendees",
    },
    {
      title: "Total Revenue",
      value: "$127,450",
      change: "+24%",
      changeType: "positive",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-200",
      description: "Revenue generated",
    },
    {
      title: "Page Views",
      value: "89,234",
      change: "+8%",
      changeType: "positive",
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      description: "Event page views",
    },
    {
      title: "Conversion Rate",
      value: "14.9%",
      change: "+2.1%",
      changeType: "positive",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-200",
      description: "View to registration",
    },
    {
      title: "Avg. Event Duration",
      value: "6.5h",
      change: "-0.3h",
      changeType: "negative",
      icon: Clock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      borderColor: "border-indigo-200",
      description: "Average event length",
    },
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
          {overviewStats.map((stat, index) => (
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
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
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
              {/* Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Performance chart will be displayed here</p>
                    </div>
                  </div>
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
              {/* Trend Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Registration Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Registration trend chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Chart Placeholder */}
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

export default AnalyticsOverview;
