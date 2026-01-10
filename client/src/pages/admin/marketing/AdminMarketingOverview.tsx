import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "../AdminLayout";
import {
  Megaphone,
  Mail,
  Share2,
  Target,
  TrendingUp,
  Users,
  Plus,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Gift,
  Handshake,
  Building2,
  Heart,
  MessageCircle,
  Eye,
  MousePointerClick
} from "lucide-react";
import {
  getSocialMetrics,
  getSocialPosts,
  type SocialMetrics,
  type SocialPost,
} from "@/lib/social-media-api";

interface MarketingMetric {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const AdminMarketingOverview = () => {
  const [timeRange, setTimeRange] = useState("30d");

  // API-driven state for social media metrics
  const [socialMetrics, setSocialMetrics] = useState<SocialMetrics | null>(null);
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Load social media metrics from API
  const loadSocialMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const response = await getSocialMetrics();
      if (response.success && response.data) {
        setSocialMetrics(response.data);
      }
    } catch (error) {
      console.error("Failed to load social metrics:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Load recent posts from API
  const loadRecentPosts = async () => {
    try {
      const response = await getSocialPosts({ status: "PUBLISHED" });
      if (response.success && response.data) {
        setRecentPosts(response.data.posts?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error("Failed to load recent posts:", error);
    }
  };

  useEffect(() => {
    loadSocialMetrics();
    loadRecentPosts();
  }, []);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Build metrics from API data or use defaults
  const metrics: MarketingMetric[] = [
    {
      title: "Total Posts",
      value: socialMetrics ? formatNumber(socialMetrics.totalPosts) : "0",
      change: 18.2,
      icon: Megaphone,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Total Likes",
      value: socialMetrics ? formatNumber(socialMetrics.totalLikes) : "0",
      change: 25.5,
      icon: Heart,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Total Reach",
      value: socialMetrics ? formatNumber(socialMetrics.totalReach) : "0",
      change: 32.1,
      icon: Eye,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Impressions",
      value: socialMetrics ? formatNumber(socialMetrics.totalImpressions) : "0",
      change: 8.3,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Comments",
      value: socialMetrics ? formatNumber(socialMetrics.totalComments) : "0",
      change: 42.7,
      icon: MessageCircle,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Engagement Rate",
      value: socialMetrics ? `${socialMetrics.engagementRate}%` : "0%",
      change: 15.2,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    }
  ];

  // Social engagement metrics cards for sharing
  const engagementMetrics = [
    {
      title: "Total Shares",
      value: socialMetrics ? formatNumber(socialMetrics.totalShares) : "0",
      icon: Share2,
      color: "text-success",
      bgColor: "bg-success/5"
    },
    {
      title: "Total Clicks",
      value: socialMetrics ? formatNumber(socialMetrics.totalClicks) : "0",
      icon: MousePointerClick,
      color: "text-primary",
      bgColor: "bg-primary/5"
    },
    {
      title: "Top Platform",
      value: socialMetrics?.topPlatform || "N/A",
      icon: Share2,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const quickActions: QuickAction[] = [
    {
      title: "Platform Campaigns",
      description: "Manage all platform marketing campaigns",
      href: "/admin/marketing/campaigns",
      icon: Megaphone,
      color: "bg-primary/50"
    },
    {
      title: "Email Marketing",
      description: "Platform-wide email marketing management",
      href: "/admin/marketing/email",
      icon: Mail,
      color: "bg-success/50"
    },
    {
      title: "Social Media",
      description: "Platform social media oversight",
      href: "/admin/marketing/social",
      icon: Share2,
      color: "bg-purple-500"
    },
    {
      title: "Promotions",
      description: "Platform-wide promotion management",
      href: "/admin/marketing/promotions",
      icon: Gift,
      color: "bg-orange-500"
    },
    {
      title: "Partnerships",
      description: "Strategic platform partnerships",
      href: "/admin/marketing/partnerships",
      icon: Handshake,
      color: "bg-indigo-500"
    },
    {
      title: "Marketing Analytics",
      description: "Platform marketing performance",
      href: "/admin/analytics",
      icon: BarChart3,
      color: "bg-teal-500"
    }
  ];

  const topCampaigns = [
    {
      id: "1",
      name: "Tech Conference 2024",
      organizer: "Tech Events Co.",
      type: "email",
      status: "active",
      sentDate: "2024-01-15",
      recipients: 25000,
      openRate: 28.5,
      clickRate: 12.2,
      conversions: 450,
      revenue: 135000
    },
    {
      id: "2",
      name: "Music Festival Launch",
      organizer: "Music Events Ltd",
      type: "social",
      status: "active",
      sentDate: "2024-01-20",
      recipients: 150000,
      openRate: 15.3,
      clickRate: 6.1,
      conversions: 280,
      revenue: 84000
    },
    {
      id: "3",
      name: "Business Workshop Series",
      organizer: "Business Academy",
      type: "promotion",
      status: "completed",
      sentDate: "2024-01-10",
      recipients: 8000,
      openRate: 22.7,
      clickRate: 8.4,
      conversions: 120,
      revenue: 36000
    }
  ];

  const topOrganizers = [
    {
      id: "1",
      name: "Tech Events Co.",
      campaigns: 45,
      subscribers: 125000,
      revenue: 450000,
      conversionRate: 5.2,
      growth: 18.5
    },
    {
      id: "2",
      name: "Music Events Ltd",
      campaigns: 32,
      subscribers: 89000,
      revenue: 320000,
      conversionRate: 4.8,
      growth: 22.1
    },
    {
      id: "3",
      name: "Business Academy",
      campaigns: 28,
      subscribers: 67000,
      revenue: 280000,
      conversionRate: 4.2,
      growth: 15.3
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return Mail;
      case "social":
        return Share2;
      case "promotion":
        return Gift;
      case "referral":
        return Users;
      default:
        return Megaphone;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success";
      case "completed":
        return "bg-primary/10 text-primary";
      case "paused":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Platform Marketing
            </h1>
            <p className="text-muted-foreground">
              Manage platform-wide marketing campaigns and analytics
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
            <Link
              to="/admin/marketing/campaigns"
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manage Campaigns
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        {loadingMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-12 w-12 bg-muted rounded-lg mb-4"></div>
                    <div className="h-6 bg-muted rounded w-16 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card
              key={index}
              className="border-border bg-card hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <metric.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {metric.change > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        metric.change > 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground mb-1">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Social Media Engagement Summary - Shareable Cards */}
        <Card className="border-border bg-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-base font-semibold text-foreground">
              <Share2 className="h-5 w-5 mr-2 text-primary" />
              Social Media Engagement Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground">Key metrics to share with clients</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {engagementMetrics.map((metric, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl ${metric.bgColor} border border-border`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg bg-white/80`}>
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{metric.title}</span>
                  </div>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Platform Breakdown */}
            {socialMetrics?.platformBreakdown && Object.keys(socialMetrics.platformBreakdown).length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-4">Platform Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(socialMetrics.platformBreakdown).map(([platform, stats]) => (
                    <div key={platform} className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground uppercase mb-1">{platform}</p>
                      <p className="text-lg font-bold text-foreground">{stats.posts}</p>
                      <p className="text-xs text-muted-foreground">posts</p>
                      <p className="text-sm font-medium text-primary mt-1">
                        {formatNumber(stats.engagement)} engagements
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts Performance */}
            {recentPosts.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-4">Recent Posts Performance</h4>
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{post.content.substring(0, 60)}...</p>
                        <p className="text-xs text-muted-foreground">{post.platform} • {post.postedAt ? new Date(post.postedAt).toLocaleDateString() : 'Scheduled'}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-destructive" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3 text-primary" />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3 text-success" />
                          {post.shares}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - 2 columns of 3 cards each */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-base font-semibold text-foreground">
              <Zap className="h-5 w-5 mr-2 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className="block p-5 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Organizers */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-base font-semibold text-foreground">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              Top Performing Organizers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topOrganizers.map((organizer) => (
                <div
                  key={organizer.id}
                  className="p-6 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{organizer.name}</h3>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">
                        +{organizer.growth}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Campaigns</span>
                      <span className="font-medium">{organizer.campaigns}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subscribers</span>
                      <span className="font-medium">{organizer.subscribers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">${organizer.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversion</span>
                      <span className="font-medium">{organizer.conversionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Campaigns */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-base font-semibold text-foreground">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Top Performing Campaigns
              </CardTitle>
              <Link
                to="/admin/marketing/campaigns"
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCampaigns.map((campaign) => {
                const TypeIcon = getTypeIcon(campaign.type);
                return (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <TypeIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {campaign.organizer}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Recipients</p>
                          <p className="font-semibold text-base">{campaign.recipients.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Open Rate</p>
                          <p className="font-semibold text-base">{campaign.openRate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Revenue</p>
                          <p className="font-semibold text-base">${campaign.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketingOverview;

