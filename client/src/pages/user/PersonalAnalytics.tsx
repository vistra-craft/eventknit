import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Calendar, DollarSign, Users, BarChart3, Star } from "lucide-react";
import {
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart,
} from "@/components/charts/ChartComponents";
import { CHART_COLORS } from "@/components/charts/chartConstants";
import { getPersonalAnalytics, getActivityHistory } from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/use-toast";

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface PersonalAnalyticsProps {
  eventData?: EventData;
  user: User;
}

const PersonalAnalytics: React.FC<PersonalAnalyticsProps> = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activityHistory, setActivityHistory] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [analyticsResponse, activityResponse] = await Promise.all([
          getPersonalAnalytics(),
          getActivityHistory({ page: 1, limit: 10 }),
        ]);

        if (analyticsResponse.success && analyticsResponse.data) {
          setAnalytics(analyticsResponse.data);
        }

        if (activityResponse.success && activityResponse.data) {
          setActivityHistory(activityResponse.data.activities || []);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: "Failed to load analytics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No analytics data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const categoryData = analytics.registrationsByCategory?.map((item: any) => ({
    name: item.category || "Uncategorized",
    value: item.count || 0,
  })) || [];

  const monthlyData = analytics.registrationsByMonth?.map((item: any) => ({
    month: item.month,
    count: item.count || 0,
  })) || [];

  const stats = [
    {
      title: "Total Events",
      value: analytics.totalEvents || 0,
      change: "+0%",
      changeType: "positive" as const,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Completed Events",
      value: analytics.completedEvents || 0,
      change: "+0%",
      changeType: "positive" as const,
      icon: Star,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Upcoming Events",
      value: analytics.upcomingEvents || 0,
      change: "+0%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Spent",
      value: `$${Number(analytics.totalSpent || 0).toLocaleString()}`,
      change: "+0%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Personal Analytics</h1>
        <p className="text-muted-foreground">
          Track your event attendance, spending, and preferences
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 bg-card-surface shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Favorite Categories */}
            <Card className="border-0 bg-card-surface shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Favorite Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.favoriteCategories && analytics.favoriteCategories.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.favoriteCategories.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          <span className="font-medium text-foreground">
                            {item.category || "Uncategorized"}
                          </span>
                        </div>
                        <Badge variant="secondary">{item.count} events</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No category data available</p>
                )}
              </CardContent>
            </Card>

            {/* Monthly Registration Trend */}
            <Card className="border-0 bg-card-surface shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Registration Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <div className="h-64">
                    <CustomAreaChart
                      data={monthlyData}
                      dataKey="count"
                      xAxisKey="month"
                      height={250}
                      color={CHART_COLORS.primary}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No trend data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card className="border-0 bg-card-surface shadow-sm">
            <CardHeader>
              <CardTitle>Events by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="h-96">
                  <CustomPieChart
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    height={350}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">No category data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="border-0 bg-card-surface shadow-sm">
            <CardHeader>
              <CardTitle>Registration Trends (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <div className="h-96">
                  <CustomBarChart
                    data={monthlyData}
                    dataKey="count"
                    xAxisKey="month"
                    height={350}
                    color={CHART_COLORS.secondary}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">No trend data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-0 bg-card-surface shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityHistory.length > 0 ? (
                <div className="space-y-4">
                  {activityHistory.map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No activity history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonalAnalytics;
