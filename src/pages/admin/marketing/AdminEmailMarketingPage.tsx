import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AdminLayout from "../AdminLayout";
import { 
  Mail, 
  Users,
  Eye,
  MousePointer,
  Plus,
  Send,
  Edit,
  Copy,
  MoreHorizontal,
  Target,
  BarChart3,
  TrendingUp,
  Search,
  Pause,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building2,
  Shield
} from "lucide-react";

interface EmailCampaign {
  id: string;
  name: string;
  organizer: string;
  subject: string;
  type: 'newsletter' | 'promotional' | 'transactional' | 'welcome' | 'reminder';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'pending_approval';
  createdDate: string;
  scheduledDate?: string;
  sentDate?: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  conversions: number;
  revenue: number;
  description: string;
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  preview: string;
  lastUsed: string;
  usageCount: number;
  organizer: string;
}

const AdminEmailMarketingPage = () => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");

  // Mock platform-wide email campaigns
  const emailCampaigns: EmailCampaign[] = [
    {
      id: "1",
      name: "Tech Summit Early Bird",
      organizer: "Tech Events Co.",
      subject: "🚀 Early Bird Tickets Now Live - Save 30%!",
      type: "promotional",
      status: "sent",
      createdDate: "2024-01-10",
      sentDate: "2024-01-15",
      recipients: 25000,
      openRate: 24.5,
      clickRate: 8.2,
      unsubscribeRate: 0.3,
      conversions: 450,
      revenue: 135000,
      description: "Early bird promotion for Tech Summit 2024",
      approvalStatus: "approved"
    },
    {
      id: "2",
      name: "Welcome Series - New Subscribers",
      organizer: "Music Events Ltd",
      subject: "Welcome to EventKnit! Here's what to expect...",
      type: "welcome",
      status: "sent",
      createdDate: "2024-01-05",
      sentDate: "2024-01-08",
      recipients: 12000,
      openRate: 32.1,
      clickRate: 12.4,
      unsubscribeRate: 0.1,
      conversions: 280,
      revenue: 0,
      description: "Welcome email series for new subscribers",
      approvalStatus: "approved"
    },
    {
      id: "3",
      name: "Event Reminder - Music Festival",
      organizer: "Business Academy",
      subject: "Don't forget! Music Festival starts tomorrow 🎵",
      type: "reminder",
      status: "scheduled",
      createdDate: "2024-01-20",
      scheduledDate: "2024-02-15",
      recipients: 8000,
      openRate: 0,
      clickRate: 0,
      unsubscribeRate: 0,
      conversions: 0,
      revenue: 0,
      description: "Reminder email for upcoming Music Festival",
      approvalStatus: "pending"
    },
    {
      id: "4",
      name: "Monthly Newsletter",
      organizer: "Wellness Corp",
      subject: "January Highlights: Your Monthly Event Roundup",
      type: "newsletter",
      status: "draft",
      createdDate: "2024-01-25",
      recipients: 0,
      openRate: 0,
      clickRate: 0,
      unsubscribeRate: 0,
      conversions: 0,
      revenue: 0,
      description: "Monthly newsletter with event highlights",
      approvalStatus: "pending"
    },
    {
      id: "5",
      name: "Ticket Confirmation",
      organizer: "Entertainment Group",
      subject: "Your tickets for Tech Summit 2024 are ready!",
      type: "transactional",
      status: "sending",
      createdDate: "2024-01-28",
      sentDate: "2024-01-28",
      recipients: 1500,
      openRate: 0,
      clickRate: 0,
      unsubscribeRate: 0,
      conversions: 0,
      revenue: 0,
      description: "Automated ticket confirmation emails",
      approvalStatus: "approved"
    }
  ];

  // Mock platform-wide email templates
  const emailTemplates: EmailTemplate[] = [
    {
      id: "1",
      name: "Event Announcement",
      category: "Promotional",
      preview: "🎉 Exciting news! We're thrilled to announce...",
      lastUsed: "2024-01-15",
      usageCount: 45,
      organizer: "Tech Events Co."
    },
    {
      id: "2",
      name: "Welcome Series",
      category: "Onboarding",
      preview: "Welcome to EventKnit! We're so glad you're here...",
      lastUsed: "2024-01-08",
      usageCount: 32,
      organizer: "Music Events Ltd"
    },
    {
      id: "3",
      name: "Event Reminder",
      category: "Reminder",
      preview: "Don't forget! Your event is coming up soon...",
      lastUsed: "2024-01-20",
      usageCount: 67,
      organizer: "Business Academy"
    },
    {
      id: "4",
      name: "Newsletter Template",
      category: "Newsletter",
      preview: "Here's what's happening this month at EventKnit...",
      lastUsed: "2024-01-01",
      usageCount: 12,
      organizer: "Wellness Corp"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'newsletter': return <Mail className="h-4 w-4" />;
      case 'promotional': return <Target className="h-4 w-4" />;
      case 'transactional': return <Send className="h-4 w-4" />;
      case 'welcome': return <Users className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'newsletter': return "bg-blue-100 text-blue-800";
      case 'promotional': return "bg-green-100 text-green-800";
      case 'transactional': return "bg-purple-100 text-purple-800";
      case 'welcome': return "bg-orange-100 text-orange-800";
      case 'reminder': return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return "bg-green-100 text-green-800";
      case 'scheduled': return "bg-blue-100 text-blue-800";
      case 'sending': return "bg-yellow-100 text-yellow-800";
      case 'draft': return "bg-gray-100 text-gray-800";
      case 'paused': return "bg-red-100 text-red-800";
      case 'pending_approval': return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalColor = (status: string) => {
    switch (status) {
      case 'approved': return "bg-green-100 text-green-800";
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'rejected': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'sending': return <Send className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'pending_approval': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredCampaigns = emailCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || campaign.type === filterType;
    const matchesStatus = filterStatus === "all" || campaign.status === filterStatus;
    const matchesApproval = filterApproval === "all" || campaign.approvalStatus === filterApproval;
    
    return matchesSearch && matchesType && matchesStatus && matchesApproval;
  });

  const totalRecipients = emailCampaigns.reduce((sum, campaign) => sum + campaign.recipients, 0);
  const totalRevenue = emailCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const avgOpenRate = emailCampaigns.filter(c => c.openRate > 0).reduce((sum, campaign) => sum + campaign.openRate, 0) / emailCampaigns.filter(c => c.openRate > 0).length;
  const avgClickRate = emailCampaigns.filter(c => c.clickRate > 0).reduce((sum, campaign) => sum + campaign.clickRate, 0) / emailCampaigns.filter(c => c.clickRate > 0).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center">
              <Mail className="h-8 w-8 mr-3 text-primary" />
              Platform Email Marketing
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor and manage platform-wide email campaigns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
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
            onClick={() => setActiveTab("templates")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "templates" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab("subscribers")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "subscribers" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Subscribers
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
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-border">
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

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue Generated</p>
                      <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
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

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Click Rate</p>
                      <p className="text-2xl font-bold text-foreground">{avgClickRate.toFixed(1)}%</p>
                    </div>
                    <MousePointer className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
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
                  <option value="newsletter">Newsletter</option>
                  <option value="promotional">Promotional</option>
                  <option value="transactional">Transactional</option>
                  <option value="welcome">Welcome</option>
                  <option value="reminder">Reminder</option>
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
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

            {/* Campaigns List */}
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="border-border hover:shadow-lg transition-shadow">
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
                                <span>{campaign.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                            <Badge className={`text-xs ${getApprovalColor(campaign.approvalStatus)}`}>
                              {campaign.approvalStatus}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2 font-medium flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {campaign.organizer}
                          </p>
                          <p className="text-muted-foreground mb-2 font-medium">{campaign.subject}</p>
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
                            {campaign.scheduledDate && (
                              <div>
                                <span className="text-muted-foreground">Scheduled:</span>
                                <span className="ml-1 font-medium">{campaign.scheduledDate}</span>
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
                      </div>

                      <div className="flex items-center space-x-2">
                        {campaign.approvalStatus === "pending" && (
                          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                            <Shield className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
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
          </>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Platform Email Templates</CardTitle>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-foreground">{template.name}</h3>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.preview}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Used {template.usageCount} times</span>
                      <span>Last used: {template.lastUsed}</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Building2 className="h-3 w-3 mr-1" />
                      {template.organizer}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscribers Tab */}
        {activeTab === "subscribers" && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Platform Subscriber Management</h3>
              <p className="text-muted-foreground mb-4">
                Manage platform-wide email subscribers, segments, and lists
              </p>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Subscribers
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Platform Email Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Detailed analytics and insights for platform-wide email campaigns
              </p>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Reports
              </Button>
            </CardContent>
          </Card>
        )}

        {filteredCampaigns.length === 0 && activeTab === "campaigns" && (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEmailMarketingPage;
