import React, { useState } from "react";
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
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Gift,
  Handshake,
  Building2
} from "lucide-react";

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

  // Mock platform-wide marketing metrics
  const metrics: MarketingMetric[] = [
    {
      title: "Platform Campaigns",
      value: "1,247",
      change: 18.2,
      icon: Megaphone,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Total Subscribers",
      value: "2.4M",
      change: 25.5,
      icon: Mail,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Social Reach",
      value: "15.6M",
      change: 32.1,
      icon: Share2,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Platform Conversion",
      value: "4.8%",
      change: 8.3,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Marketing Revenue",
      value: "$2.8M",
      change: 42.7,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    },
    {
      title: "Platform ROI",
      value: "580%",
      change: 15.2,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border"
    }
  ];

  const quickActions: QuickAction[] = [
    {
      title: "Platform Campaigns",
      description: "Manage all platform marketing campaigns",
      href: "/admin/marketing/campaigns",
      icon: Megaphone,
      color: "bg-blue-500"
    },
    {
      title: "Email Marketing",
      description: "Platform-wide email marketing management",
      href: "/admin/marketing/email",
      icon: Mail,
      color: "bg-green-500"
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
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Platform Marketing
            </h1>
            <p className="text-gray-600">
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
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        metric.change > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 mb-1">{metric.value}</p>
                  <p className="text-sm text-gray-600">{metric.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions - 2 columns of 3 cards each */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-base font-semibold text-gray-900">
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
                      <p className="text-sm text-gray-600">
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
            <CardTitle className="flex items-center text-base font-semibold text-gray-900">
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
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
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
              <CardTitle className="flex items-center text-base font-semibold text-gray-900">
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

