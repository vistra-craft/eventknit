import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AdminLayout from "../AdminLayout";
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
  Building2,
  Shield,
  AlertTriangle
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  organizer: string;
  type: 'email' | 'social' | 'promotion' | 'referral' | 'paid';
  status: 'active' | 'paused' | 'completed' | 'draft' | 'scheduled' | 'pending_approval';
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
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

const AdminCampaignsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");

  // Mock platform-wide campaign data
  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "Tech Summit Early Bird",
      organizer: "Tech Events Co.",
      type: "email",
      status: "active",
      createdDate: "2024-01-10",
      sentDate: "2024-01-15",
      recipients: 25000,
      openRate: 24.5,
      clickRate: 8.2,
      conversions: 450,
      revenue: 135000,
      description: "Early bird promotion for Tech Summit 2024",
      approvalStatus: "approved"
    },
    {
      id: "2",
      name: "Social Media Blast",
      organizer: "Music Events Ltd",
      type: "social",
      status: "active",
      createdDate: "2024-01-15",
      sentDate: "2024-01-20",
      recipients: 150000,
      openRate: 12.3,
      clickRate: 3.1,
      conversions: 280,
      revenue: 84000,
      description: "Social media promotion across all platforms",
      approvalStatus: "approved"
    },
    {
      id: "3",
      name: "Referral Program",
      organizer: "Business Academy",
      type: "referral",
      status: "pending_approval",
      createdDate: "2024-01-05",
      sentDate: "2024-01-10",
      recipients: 8000,
      openRate: 18.7,
      clickRate: 6.4,
      conversions: 120,
      revenue: 36000,
      description: "Customer referral program with rewards",
      approvalStatus: "pending"
    },
    {
      id: "4",
      name: "Google Ads Campaign",
      organizer: "Wellness Corp",
      type: "paid",
      status: "active",
      createdDate: "2024-01-18",
      sentDate: "2024-01-22",
      recipients: 50000,
      openRate: 8.9,
      clickRate: 2.4,
      conversions: 180,
      revenue: 54000,
      budget: 10000,
      spent: 7500,
      description: "Google Ads campaign for health events",
      approvalStatus: "approved"
    },
    {
      id: "5",
      name: "Holiday Special",
      organizer: "Entertainment Group",
      type: "promotion",
      status: "draft",
      createdDate: "2024-01-25",
      recipients: 0,
      openRate: 0,
      clickRate: 0,
      conversions: 0,
      revenue: 0,
      description: "Holiday season promotion campaign",
      approvalStatus: "pending"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return Mail;
      case "social":
        return Share2;
      case "promotion":
        return Target;
      case "referral":
        return Users;
      case "paid":
        return DollarSign;
      default:
        return Megaphone;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-purple-100 text-purple-800";
      case "pending_approval":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || campaign.type === filterType;
    const matchesStatus = filterStatus === "all" || campaign.status === filterStatus;
    const matchesApproval = filterApproval === "all" || campaign.approvalStatus === filterApproval;
    
    return matchesSearch && matchesType && matchesStatus && matchesApproval;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center">
              <Megaphone className="h-8 w-8 mr-3 text-primary" />
              Platform Campaigns
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and monitor all platform marketing campaigns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="social">Social Media</option>
              <option value="promotion">Promotion</option>
              <option value="referral">Referral</option>
              <option value="paid">Paid Ads</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="pending_approval">Pending Approval</option>
            </select>
            <select
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="all">All Approval</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const TypeIcon = getTypeIcon(campaign.type);
            return (
              <Card key={campaign.id} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TypeIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {campaign.organizer}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getApprovalColor(campaign.approvalStatus)}>
                        {campaign.approvalStatus}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Recipients</p>
                      <p className="font-semibold">{campaign.recipients.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Open Rate</p>
                      <p className="font-semibold">{campaign.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Click Rate</p>
                      <p className="font-semibold">{campaign.clickRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-semibold">${campaign.revenue.toLocaleString()}</p>
                    </div>
                  </div>

                  {campaign.budget && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Budget</span>
                        <span>${campaign.spent?.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${((campaign.spent || 0) / campaign.budget) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {campaign.approvalStatus === "pending" && (
                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                          <Shield className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCampaignsPage;

