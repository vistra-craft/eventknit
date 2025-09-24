import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import OrganizerLayout from "../OrganizerLayout";
import { 
  Megaphone, 
  Mail, 
  Share2, 
  Target,
  Users,
  Eye,
  Plus,
  DollarSign,
  BarChart3,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Calendar,
  Edit,
  Copy,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'promotion' | 'referral' | 'paid';
  status: 'active' | 'paused' | 'completed' | 'draft' | 'scheduled';
  createdDate: string;
  sentDate?: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  conversions: number;
  revenue: number;
  budget?: number;
  spent?: number;
  description: string;
}

const CampaignsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock campaign data
  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "Tech Summit Early Bird",
      type: "email",
      status: "active",
      createdDate: "2024-01-10",
      sentDate: "2024-01-15",
      recipients: 2500,
      openRate: 24.5,
      clickRate: 8.2,
      conversions: 45,
      revenue: 13500,
      description: "Early bird promotion for Tech Summit 2024"
    },
    {
      id: "2",
      name: "Social Media Blast",
      type: "social",
      status: "active",
      createdDate: "2024-01-15",
      sentDate: "2024-01-20",
      recipients: 15000,
      openRate: 12.3,
      clickRate: 3.1,
      conversions: 28,
      revenue: 8400,
      description: "Social media promotion across all platforms"
    },
    {
      id: "3",
      name: "Referral Program",
      type: "referral",
      status: "paused",
      createdDate: "2024-01-05",
      sentDate: "2024-01-10",
      recipients: 800,
      openRate: 18.7,
      clickRate: 6.4,
      conversions: 12,
      revenue: 3600,
      description: "Customer referral program with rewards"
    },
    {
      id: "4",
      name: "Google Ads Campaign",
      type: "paid",
      status: "active",
      createdDate: "2024-01-18",
      sentDate: "2024-01-22",
      recipients: 5000,
      openRate: 15.2,
      clickRate: 4.8,
      conversions: 35,
      revenue: 10500,
      budget: 2000,
      spent: 1850,
      description: "Google Ads campaign for event promotion"
    },
    {
      id: "5",
      name: "Holiday Special",
      type: "promotion",
      status: "draft",
      createdDate: "2024-01-25",
      recipients: 0,
      openRate: 0,
      clickRate: 0,
      conversions: 0,
      revenue: 0,
      description: "Holiday season promotional campaign"
    },
    {
      id: "6",
      name: "VIP Event Invite",
      type: "email",
      status: "scheduled",
      createdDate: "2024-01-28",
      sentDate: "2024-02-01",
      recipients: 500,
      openRate: 0,
      clickRate: 0,
      conversions: 0,
      revenue: 0,
      description: "Exclusive VIP event invitation"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
      case 'promotion': return <Target className="h-4 w-4" />;
      case 'referral': return <Users className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return "bg-blue-100 text-blue-800";
      case 'social': return "bg-purple-100 text-purple-800";
      case 'promotion': return "bg-green-100 text-green-800";
      case 'referral': return "bg-orange-100 text-orange-800";
      case 'paid': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800";
      case 'paused': return "bg-yellow-100 text-yellow-800";
      case 'completed': return "bg-gray-100 text-gray-800";
      case 'draft': return "bg-blue-100 text-blue-800";
      case 'scheduled': return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <BarChart3 className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      default: return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || campaign.type === filterType;
    const matchesStatus = filterStatus === "all" || campaign.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalRecipients = campaigns.reduce((sum, campaign) => sum + campaign.recipients, 0);
  const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const avgOpenRate = campaigns.filter(c => c.openRate > 0).reduce((sum, campaign) => sum + campaign.openRate, 0) / campaigns.filter(c => c.openRate > 0).length;

  return (
    <OrganizerLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and track your marketing campaigns
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold text-foreground">{campaigns.length}</p>
              </div>
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Types</option>
                <option value="email">Email</option>
                <option value="social">Social</option>
                <option value="promotion">Promotion</option>
                <option value="referral">Referral</option>
                <option value="paid">Paid Ads</option>
              </select>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                      <Badge className={`text-xs ${getTypeColor(campaign.type)}`}>
                        {campaign.type}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(campaign.status)}
                          <span>{campaign.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{campaign.description}</p>
                    <div className="flex items-center space-x-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-1 font-medium">{campaign.createdDate}</span>
                      </div>
                      {campaign.sentDate && (
                        <div>
                          <span className="text-muted-foreground">Sent:</span>
                          <span className="ml-1 font-medium">{campaign.sentDate}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Recipients:</span>
                        <span className="ml-1 font-medium">{campaign.recipients.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  {campaign.openRate > 0 && (
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{campaign.openRate}%</p>
                      <p className="text-muted-foreground">Open Rate</p>
                    </div>
                  )}
                  {campaign.clickRate > 0 && (
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{campaign.clickRate}%</p>
                      <p className="text-muted-foreground">Click Rate</p>
                    </div>
                  )}
                  {campaign.revenue > 0 && (
                    <div className="text-center">
                      <p className="font-semibold text-foreground">${campaign.revenue.toLocaleString()}</p>
                      <p className="text-muted-foreground">Revenue</p>
                    </div>
                  )}
                  {campaign.budget && (
                    <div className="text-center">
                      <p className="font-semibold text-foreground">${campaign.spent}/{campaign.budget}</p>
                      <p className="text-muted-foreground">Budget</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No campaigns found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== "all" || filterStatus !== "all" 
                ? "Try adjusting your search or filters"
                : "Create your first marketing campaign to get started"
              }
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </OrganizerLayout>
  );
};

export default CampaignsPage;

