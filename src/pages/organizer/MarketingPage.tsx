import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Megaphone, 
  Mail, 
  Share2, 
  Target,
  TrendingUp,
  Users,
  Eye,
  Click,
  Plus,
  Calendar,
  DollarSign,
  BarChart3
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'promotion' | 'referral';
  status: 'active' | 'paused' | 'completed' | 'draft';
  sentDate: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  conversions: number;
  revenue: number;
}

const MarketingPage = () => {
  const [activeTab, setActiveTab] = useState("campaigns");

  // Mock campaign data
  const campaigns: Campaign[] = [
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
      name: "Social Media Promotion",
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

  const totalRecipients = campaigns.reduce((sum, campaign) => sum + campaign.recipients, 0);
  const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const avgOpenRate = campaigns.reduce((sum, campaign) => sum + campaign.openRate, 0) / campaigns.length;
  const avgClickRate = campaigns.reduce((sum, campaign) => sum + campaign.clickRate, 0) / campaigns.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing Center</h1>
          <p className="text-muted-foreground">
            Manage campaigns, promotions, and marketing tools
          </p>
        </div>
        <Button className="bg-accent-neon hover:bg-accent-neon/80 text-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
                <p className="text-2xl font-bold text-foreground">{totalRecipients.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Generated</p>
                <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Open Rate</p>
                <p className="text-2xl font-bold text-foreground">{avgOpenRate.toFixed(1)}%</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Click Rate</p>
                <p className="text-2xl font-bold text-foreground">{avgClickRate.toFixed(1)}%</p>
              </div>
              <Click className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "campaigns" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab("promotions")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "promotions" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Promotions
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "analytics" 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <Card>
          <CardHeader>
            <CardTitle>Marketing Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
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
      )}

      {/* Promotions Tab */}
      {activeTab === "promotions" && (
        <Card>
          <CardHeader>
            <CardTitle>Promotional Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <Target className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-medium text-foreground mb-2">Discount Codes</h3>
                <p className="text-sm text-muted-foreground">Create and manage promotional codes</p>
              </div>
              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <Share2 className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-medium text-foreground mb-2">Social Sharing</h3>
                <p className="text-sm text-muted-foreground">Share events on social media</p>
              </div>
              <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                <Users className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-medium text-foreground mb-2">Referral Program</h3>
                <p className="text-sm text-muted-foreground">Set up referral rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <Card>
          <CardHeader>
            <CardTitle>Marketing Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Marketing Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Detailed analytics and insights for your marketing campaigns
              </p>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketingPage;

