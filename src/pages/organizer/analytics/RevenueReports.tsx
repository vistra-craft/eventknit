import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import OrganizerLayout from "../OrganizerLayout";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  Target,
} from "lucide-react";

const RevenueReports = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState("all");

  // Mock data - in a real app, this would come from your API
  const revenueStats = [
    {
      title: "Total Revenue",
      value: "$127,450",
      change: "+24%",
      changeType: "positive",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "All-time revenue",
    },
    {
      title: "Monthly Revenue",
      value: "$45,230",
      change: "+18%",
      changeType: "positive",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "This month",
    },
    {
      title: "Avg. Revenue/Event",
      value: "$5,310",
      change: "+12%",
      changeType: "positive",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Per event",
    },
    {
      title: "Avg. Revenue/Attendee",
      value: "$30",
      change: "+8%",
      changeType: "positive",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Per attendee",
    },
    {
      title: "Refund Rate",
      value: "2.3%",
      change: "-0.5%",
      changeType: "positive",
      icon: Receipt,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Refund percentage",
    },
    {
      title: "Payment Success Rate",
      value: "98.7%",
      change: "+1.2%",
      changeType: "positive",
      icon: CreditCard,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      description: "Successful payments",
    },
  ];

  const revenueBreakdown = [
    {
      event: "Tech Innovation Summit 2024",
      date: "March 15-17, 2024",
      status: "completed",
      revenue: 145200,
      attendees: 485,
      ticketPrice: 299,
      revenuePerAttendee: 299,
      refunds: 3200,
      netRevenue: 142000,
      growth: 24,
    },
    {
      event: "Digital Marketing Conference",
      date: "January 20, 2024",
      status: "completed",
      revenue: 67500,
      attendees: 450,
      ticketPrice: 150,
      revenuePerAttendee: 150,
      refunds: 1200,
      netRevenue: 66300,
      growth: 19,
    },
    {
      event: "Business Leadership Workshop",
      date: "April 2, 2024",
      status: "upcoming",
      revenue: 15600,
      attendees: 78,
      ticketPrice: 200,
      revenuePerAttendee: 200,
      refunds: 0,
      netRevenue: 15600,
      growth: 28,
    },
    {
      event: "Food & Wine Expo",
      date: "February 10, 2024",
      status: "completed",
      revenue: 25600,
      attendees: 320,
      ticketPrice: 80,
      revenuePerAttendee: 80,
      refunds: 800,
      netRevenue: 24800,
      growth: 16,
    },
    {
      event: "Startup Pitch Competition",
      date: "May 15, 2024",
      status: "upcoming",
      revenue: 3750,
      attendees: 25,
      ticketPrice: 150,
      revenuePerAttendee: 150,
      refunds: 0,
      netRevenue: 3750,
      growth: 35,
    },
  ];

  const paymentMethods = [
    { method: "Credit Card", percentage: 68, amount: 86666, count: 2890 },
    { method: "PayPal", percentage: 18, amount: 22941, count: 765 },
    { method: "Bank Transfer", percentage: 8, amount: 10196, count: 340 },
    { method: "Cryptocurrency", percentage: 4, amount: 5098, count: 170 },
    { method: "Other", percentage: 2, amount: 2549, count: 85 },
  ];

  const revenueTrends = [
    { month: "Jan", revenue: 42000, events: 3 },
    { month: "Feb", revenue: 38000, events: 2 },
    { month: "Mar", revenue: 145200, events: 1 },
    { month: "Apr", revenue: 15600, events: 1 },
    { month: "May", revenue: 3750, events: 1 },
    { month: "Jun", revenue: 0, events: 0 },
  ];

  const financialInsights = [
    {
      id: 1,
      title: "Revenue Growth Trend",
      description: "Monthly revenue has grown 24% compared to last quarter",
      insight: "Consider increasing event frequency to capitalize on growth",
      icon: TrendingUp,
      type: "growth",
    },
    {
      id: 2,
      title: "High-Value Events",
      description: "Tech events generate 3x more revenue than other categories",
      insight: "Focus on expanding tech event portfolio",
      icon: Target,
      type: "strategy",
    },
    {
      id: 3,
      title: "Payment Method Optimization",
      description: "Credit card payments have 98.7% success rate",
      insight: "Consider offering credit card incentives",
      icon: CreditCard,
      type: "payment",
    },
    {
      id: 4,
      title: "Refund Management",
      description: "Refund rate decreased to 2.3% - below industry average",
      insight: "Current refund policy is working well",
      icon: Receipt,
      type: "policy",
    },
    {
      id: 5,
      title: "Seasonal Patterns",
      description: "Q1 shows highest revenue potential",
      insight: "Plan major events for Q1 next year",
      icon: Calendar,
      type: "timing",
    },
    {
      id: 6,
      title: "Attendee Value",
      description: "Average revenue per attendee increased 8%",
      insight: "Consider premium pricing tiers",
      icon: Users,
      type: "pricing",
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

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case "growth":
        return "text-green-600 bg-green-100 border-green-200";
      case "strategy":
        return "text-blue-600 bg-blue-100 border-blue-200";
      case "payment":
        return "text-purple-600 bg-purple-100 border-purple-200";
      case "policy":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "timing":
        return "text-red-600 bg-red-100 border-red-200";
      case "pricing":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Revenue Reports</h1>
            <p className="text-muted-foreground mt-1">
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
          {revenueStats.map((stat, index) => (
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
            <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            <TabsTrigger value="insights">Financial Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Revenue trend chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {revenueTrends.map((trend, index) => (
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
                  {revenueBreakdown.map((event) => (
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
              {/* Payment Methods Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Payment methods pie chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentMethods.map((method, index) => (
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
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {financialInsights.map((insight) => (
                <Card key={insight.id} className={`border ${getInsightTypeColor(insight.type).split(' ')[2]}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full ${getInsightTypeColor(insight.type).split(' ')[1]} flex items-center justify-center`}>
                        <insight.icon className={`h-4 w-4 ${getInsightTypeColor(insight.type).split(' ')[0]}`} />
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
        </Tabs>
      </div>
    </OrganizerLayout>
  );
};

export default RevenueReports;
