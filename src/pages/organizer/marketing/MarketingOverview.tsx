import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OrganizerLayout from "../OrganizerLayout";
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
  Handshake
} from "lucide-react";

interface MarketingMetric {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const MarketingOverview = () => {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock marketing metrics
  const metrics: MarketingMetric[] = [
    {
      title: "Total Campaigns",
      value: "12",
      change: 8.2,
      icon: Megaphone,
      color: "text-blue-600"
    },
    {
      title: "Email Subscribers",
      value: "24.5K",
      change: 12.5,
      icon: Mail,
      color: "text-green-600"
    },
    {
      title: "Social Reach",
      value: "156K",
      change: -2.1,
      icon: Share2,
      color: "text-purple-600"
    },
    {
      title: "Conversion Rate",
      value: "3.8%",
      change: 15.3,
      icon: Target,
      color: "text-orange-600"
    },
    {
      title: "Revenue Generated",
      value: "$45.2K",
      change: 22.7,
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      title: "ROI",
      value: "340%",
      change: 18.9,
      icon: TrendingUp,
      color: "text-red-600"
    }
  ];

  const quickActions: QuickAction[] = [
    {
      title: "Create Campaign",
      description: "Launch a new marketing campaign",
      href: "/organizer/marketing/campaigns",
      icon: Megaphone,
      color: "bg-blue-500"
    },
    {
      title: "Email Marketing",
      description: "Send targeted email campaigns",
      href: "/organizer/marketing/email",
      icon: Mail,
      color: "bg-green-500"
    },
    {
      title: "Social Media",
      description: "Manage social media presence",
      href: "/organizer/marketing/social",
      icon: Share2,
      color: "bg-purple-500"
    },
    {
      title: "Promotions",
      description: "Create discount codes & offers",
      href: "/organizer/marketing/promotions",
      icon: Gift,
      color: "bg-orange-500"
    },
    {
      title: "Partnerships",
      description: "Manage brand partnerships",
      href: "/organizer/marketing/partnerships",
      icon: Handshake,
      color: "bg-indigo-500"
    },
    {
      title: "Analytics",
      description: "View detailed marketing reports",
      href: "/organizer/analytics",
      icon: BarChart3,
      color: "bg-teal-500"
    }
  ];

  const recentCampaigns = [
    {
      id: "1",
      name: "Tech Summit Early Bird",
      type: "email",
      status: "active",
      sentDate: "2024-01-15",
      recipients: 2500,
      openRate: 24.5,
      clickRate: 8.2,
      conversions: 45,
      revenue: 13500
    },
    {
      id: "2",
      name: "Social Media Blast",
      type: "social",
      status: "active",
      sentDate: "2024-01-20",
      recipients: 15000,
      openRate: 12.3,
      clickRate: 3.1,
      conversions: 28,
      revenue: 8400
    },
    {
      id: "3",
      name: "Referral Program",
      type: "referral",
      status: "paused",
      sentDate: "2024-01-10",
      recipients: 800,
      openRate: 18.7,
      clickRate: 6.4,
      conversions: 12,
      revenue: 3600
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
      case 'promotion': return <Target className="h-4 w-4" />;
      case 'referral': return <Users className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return "bg-blue-100 text-blue-800";
      case 'social': return "bg-purple-100 text-purple-800";
      case 'promotion': return "bg-green-100 text-green-800";
      case 'referral': return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800";
      case 'paused': return "bg-yellow-100 text-yellow-800";
      case 'completed': return "bg-gray-100 text-gray-800";
      case 'draft': return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing Center</h1>
          <p className="text-muted-foreground mt-1">
            Manage campaigns, promotions, and grow your event audience
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground w-full sm:w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.change > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">vs last period</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="group p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
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

      {/* Recent Campaigns */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Recent Campaigns
            </CardTitle>
            <Link to="/organizer/marketing/campaigns">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-foreground">{campaign.name}</h3>
                      <Badge className={`text-xs ${getTypeColor(campaign.type)}`}>
                        {campaign.type}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Sent on {campaign.sentDate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{campaign.recipients.toLocaleString()}</p>
                    <p className="text-muted-foreground">Recipients</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{campaign.openRate}%</p>
                    <p className="text-muted-foreground">Open Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{campaign.clickRate}%</p>
                    <p className="text-muted-foreground">Click Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">${campaign.revenue.toLocaleString()}</p>
                    <p className="text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Marketing Tips */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            Marketing Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📧 Email Marketing</h4>
                <p className="text-sm text-blue-800">
                  Your email open rates are above industry average! Consider A/B testing subject lines to improve further.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">🎯 Targeting</h4>
                <p className="text-sm text-green-800">
                  Segment your audience by event interests to increase conversion rates by up to 30%.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">📱 Social Media</h4>
                <p className="text-sm text-purple-800">
                  Post event updates 2-3 times per week and engage with comments to boost organic reach.
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2">💰 Promotions</h4>
                <p className="text-sm text-orange-800">
                  Early bird discounts typically increase ticket sales by 25%. Consider launching one for your next event.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </OrganizerLayout>
  );
};

export default MarketingOverview;

