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
  revenueStats,
  revenueBreakdown,
  paymentMethods,
  revenueTrends,
  financialInsights,
} from "@/data/analytics";

const RevenueReports = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState("all");

  // Debug: Log the imported data
  console.log('RevenueReports - revenueStats:', revenueStats);
  console.log('RevenueReports - revenueBreakdown:', revenueBreakdown);
  console.log('RevenueReports - paymentMethods:', paymentMethods);
  console.log('RevenueReports - revenueTrends:', revenueTrends);
  console.log('RevenueReports - financialInsights:', financialInsights);

  // Chart data for revenue analysis
  const monthlyRevenueData = [
    { month: "Jan", revenue: 45000, events: 3, attendees: 1200 },
    { month: "Feb", revenue: 32000, events: 2, attendees: 800 },
    { month: "Mar", revenue: 145200, events: 4, attendees: 1800 },
    { month: "Apr", revenue: 28000, events: 3, attendees: 950 },
    { month: "May", revenue: 18000, events: 2, attendees: 600 },
    { month: "Jun", revenue: 165000, events: 5, attendees: 2200 },
  ];

  const revenueByEventTypeData = [
    { type: "Technology", revenue: 145200, percentage: 45 },
    { type: "Business", revenue: 67500, percentage: 21 },
    { type: "Marketing", revenue: 25600, percentage: 8 },
    { type: "Health", revenue: 15600, percentage: 5 },
    { type: "Other", revenue: 67550, percentage: 21 },
  ];

  const paymentMethodData = [
    { method: "Credit Card", percentage: 68, amount: 86666 },
    { method: "PayPal", percentage: 18, amount: 22941 },
    { method: "Bank Transfer", percentage: 8, amount: 10196 },
    { method: "Cryptocurrency", percentage: 4, amount: 5098 },
    { method: "Other", percentage: 2, amount: 2549 },
  ];

  const revenueVsAttendeesData = [
    { attendees: 78, revenue: 15600, event: "Business Workshop" },
    { attendees: 320, revenue: 25600, event: "Food & Wine Expo" },
    { attendees: 450, revenue: 67500, event: "Marketing Conf" },
    { attendees: 485, revenue: 145200, event: "Tech Summit" },
  ];

  // Use imported data
  const statsData = revenueStats;

  // Use imported data
  const breakdownData = revenueBreakdown;
  const paymentMethodsData = paymentMethods;
  const trendsData = revenueTrends;
  const insightsData = financialInsights;

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
      <div className="py-8">
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
                    formatter={(value) => `$${value.toLocaleString()}`}
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
                    formatter={(value, name) => `${value}%`}
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
                      if (name === "Attendees") return value.toLocaleString();
                      if (name === "Revenue") return `$${value.toLocaleString()}`;
                      return value.toString();
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
                    formatter={(value, name) => `${value}%`}
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
                    formatter={(value) => `$${value.toLocaleString()}`}
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
                    formatter={(value) => `$${value.toLocaleString()}`}
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
      </div>
    </OrganizerLayout>
  );
};

export default RevenueReports;
