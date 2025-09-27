import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AdminLayout from "../AdminLayout";
import { 
  Handshake, 
  Building2,
  Users,
  DollarSign,
  Plus,
  TrendingUp,
  BarChart3,
  Edit,
  Copy,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Settings,
  Star,
  Globe,
  Mail,
  MapPin,
  ExternalLink,
  Shield
} from "lucide-react";

interface Partnership {
  id: string;
  name: string;
  organizer: string;
  type: 'sponsor' | 'venue' | 'media' | 'vendor' | 'influencer';
  status: 'active' | 'pending' | 'expired' | 'negotiating' | 'pending_approval';
  contactPerson: string;
  email: string;
  phone?: string;
  website?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  value: number;
  description: string;
  benefits: string[];
  events: string[];
  rating?: number;
  notes?: string;
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

interface PartnershipTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const AdminPartnershipsPage = () => {
  const [activeTab, setActiveTab] = useState("partnerships");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");

  // Mock platform-wide partnerships data
  const partnerships: Partnership[] = [
    {
      id: "1",
      name: "Microsoft Corporation",
      organizer: "Tech Events Co.",
      type: "sponsor",
      status: "active",
      contactPerson: "Sarah Johnson",
      email: "sarah.johnson@microsoft.com",
      phone: "+1 (555) 123-4567",
      website: "microsoft.com",
      location: "Redmond, WA",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      value: 500000,
      description: "Primary sponsor for Tech Summit 2024",
      benefits: ["Logo placement", "Speaking slot", "Booth space", "Social media mentions"],
      events: ["Tech Summit 2024"],
      rating: 5,
      notes: "Excellent partnership, very responsive team",
      approvalStatus: "approved"
    },
    {
      id: "2",
      name: "Madison Square Garden",
      organizer: "Music Events Ltd",
      type: "venue",
      status: "active",
      contactPerson: "Mike Rodriguez",
      email: "mike.rodriguez@msg.com",
      phone: "+1 (555) 987-6543",
      website: "msg.com",
      location: "New York, NY",
      startDate: "2023-06-01",
      endDate: "2025-05-31",
      value: 1200000,
      description: "Exclusive venue partnership for major events",
      benefits: ["Preferred rates", "Priority booking", "Marketing support", "Catering discounts"],
      events: ["Music Festival 2024", "Sports Expo 2024"],
      rating: 4,
      notes: "Great venue, professional staff",
      approvalStatus: "approved"
    },
    {
      id: "3",
      name: "TechCrunch Media",
      organizer: "Business Academy",
      type: "media",
      status: "active",
      contactPerson: "Alex Chen",
      email: "alex.chen@techcrunch.com",
      phone: "+1 (555) 456-7890",
      website: "techcrunch.com",
      location: "San Francisco, CA",
      startDate: "2024-01-15",
      endDate: "2024-12-15",
      value: 250000,
      description: "Media partnership for event coverage",
      benefits: ["Event coverage", "Article features", "Social media promotion", "Press releases"],
      events: ["Tech Summit 2024", "Startup Pitch Event"],
      rating: 5,
      notes: "Amazing reach and engagement",
      approvalStatus: "approved"
    },
    {
      id: "4",
      name: "Catering Plus",
      organizer: "Wellness Corp",
      type: "vendor",
      status: "pending",
      contactPerson: "Lisa Thompson",
      email: "lisa@cateringplus.com",
      phone: "+1 (555) 234-5678",
      website: "cateringplus.com",
      location: "Los Angeles, CA",
      startDate: "2024-02-01",
      endDate: "2024-11-30",
      value: 150000,
      description: "Exclusive catering partner",
      benefits: ["Preferred rates", "Custom menus", "Event planning", "Staff support"],
      events: ["All Events"],
      rating: 4,
      notes: "Waiting for contract approval",
      approvalStatus: "pending"
    },
    {
      id: "5",
      name: "Tech Influencer Network",
      organizer: "Entertainment Group",
      type: "influencer",
      status: "negotiating",
      contactPerson: "David Park",
      email: "david@techinfluencers.com",
      website: "techinfluencers.com",
      location: "Austin, TX",
      startDate: "2024-03-01",
      endDate: "2024-08-31",
      value: 300000,
      description: "Influencer marketing partnership",
      benefits: ["Social media posts", "Event attendance", "Content creation", "Brand mentions"],
      events: ["Tech Summit 2024"],
      rating: 3,
      notes: "Negotiating terms and deliverables",
      approvalStatus: "pending"
    },
    {
      id: "6",
      name: "Event Security Solutions",
      organizer: "Event Masters",
      type: "vendor",
      status: "pending_approval",
      contactPerson: "Robert Wilson",
      email: "robert@eventsecurity.com",
      phone: "+1 (555) 345-6789",
      website: "eventsecurity.com",
      location: "Chicago, IL",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      value: 200000,
      description: "Security services partnership",
      benefits: ["Security personnel", "Equipment rental", "Emergency planning", "Risk assessment"],
      events: ["All Events"],
      rating: 4,
      notes: "New partnership proposal",
      approvalStatus: "pending"
    }
  ];

  // Mock partnership templates
  const partnershipTemplates: PartnershipTemplate[] = [
    {
      id: "1",
      name: "Sponsorship Package",
      description: "Create a comprehensive sponsorship package",
      type: "sponsor",
      icon: Star,
      color: "bg-yellow-500"
    },
    {
      id: "2",
      name: "Venue Partnership",
      description: "Set up a venue partnership agreement",
      type: "venue",
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      id: "3",
      name: "Media Partnership",
      description: "Create a media partnership proposal",
      type: "media",
      icon: Globe,
      color: "bg-green-500"
    },
    {
      id: "4",
      name: "Vendor Agreement",
      description: "Set up a vendor partnership",
      type: "vendor",
      icon: Handshake,
      color: "bg-purple-500"
    },
    {
      id: "5",
      name: "Influencer Contract",
      description: "Create an influencer partnership",
      type: "influencer",
      icon: Users,
      color: "bg-pink-500"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sponsor': return <Star className="h-4 w-4" />;
      case 'venue': return <Building2 className="h-4 w-4" />;
      case 'media': return <Globe className="h-4 w-4" />;
      case 'vendor': return <Handshake className="h-4 w-4" />;
      case 'influencer': return <Users className="h-4 w-4" />;
      default: return <Handshake className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sponsor': return "bg-yellow-100 text-yellow-800";
      case 'venue': return "bg-blue-100 text-blue-800";
      case 'media': return "bg-green-100 text-green-800";
      case 'vendor': return "bg-purple-100 text-purple-800";
      case 'influencer': return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800";
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'expired': return "bg-red-100 text-red-800";
      case 'negotiating': return "bg-blue-100 text-blue-800";
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
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'negotiating': return <Settings className="h-4 w-4" />;
      case 'pending_approval': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredPartnerships = partnerships.filter(partnership => {
    const matchesSearch = partnership.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partnership.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partnership.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partnership.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || partnership.type === filterType;
    const matchesStatus = filterStatus === "all" || partnership.status === filterStatus;
    const matchesApproval = filterApproval === "all" || partnership.approvalStatus === filterApproval;
    
    return matchesSearch && matchesType && matchesStatus && matchesApproval;
  });

  const totalValue = partnerships.reduce((sum, partnership) => sum + partnership.value, 0);
  const activePartnerships = partnerships.filter(p => p.status === 'active').length;
  const pendingPartnerships = partnerships.filter(p => p.status === 'pending' || p.status === 'pending_approval').length;
  const avgRating = partnerships.filter(p => p.rating).reduce((sum, partnership) => sum + (partnership.rating || 0), 0) / partnerships.filter(p => p.rating).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center">
              <Handshake className="h-8 w-8 mr-3 text-primary" />
              Platform Partnerships
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor and manage platform-wide strategic partnerships
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Partnership
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab("partnerships")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "partnerships" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Partnerships
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

        {/* Partnerships Tab */}
        {activeTab === "partnerships" && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Partnerships</p>
                      <p className="text-2xl font-bold text-foreground">{activePartnerships}</p>
                    </div>
                    <Handshake className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-foreground">{pendingPartnerships}</p>
                    </div>
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                      <p className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                    </div>
                    <Star className="h-8 w-8 text-primary" />
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
                    placeholder="Search partnerships..."
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
                  <option value="sponsor">Sponsor</option>
                  <option value="venue">Venue</option>
                  <option value="media">Media</option>
                  <option value="vendor">Vendor</option>
                  <option value="influencer">Influencer</option>
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="negotiating">Negotiating</option>
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

            {/* Partnerships List */}
            <div className="space-y-4">
              {filteredPartnerships.map((partnership) => (
                <Card key={partnership.id} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getTypeIcon(partnership.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{partnership.name}</h3>
                            <Badge className={`text-xs ${getTypeColor(partnership.type)}`}>
                              {partnership.type}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(partnership.status)}`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(partnership.status)}
                                <span>{partnership.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                            <Badge className={`text-xs ${getApprovalColor(partnership.approvalStatus)}`}>
                              {partnership.approvalStatus}
                            </Badge>
                            {partnership.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">{partnership.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2 font-medium flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {partnership.organizer}
                          </p>
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{partnership.contactPerson}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{partnership.email}</span>
                            </div>
                            {partnership.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{partnership.location}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-3">{partnership.description}</p>
                          <div className="flex items-center space-x-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <span className="ml-1 font-medium">{partnership.startDate}</span>
                            </div>
                            {partnership.endDate && (
                              <div>
                                <span className="text-muted-foreground">End:</span>
                                <span className="ml-1 font-medium">{partnership.endDate}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Value:</span>
                              <span className="ml-1 font-medium">${partnership.value.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Events:</span>
                              <span className="ml-1 font-medium">{partnership.events.length}</span>
                            </div>
                          </div>
                          {partnership.benefits.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm font-medium text-muted-foreground">Benefits:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {partnership.benefits.slice(0, 3).map((benefit, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {benefit}
                                  </Badge>
                                ))}
                                {partnership.benefits.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{partnership.benefits.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {partnership.website && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`https://${partnership.website}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {partnership.approvalStatus === "pending" && (
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
                <CardTitle>Partnership Templates</CardTitle>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partnershipTemplates.map((template) => (
                  <div key={template.id} className="p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                    <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center mb-3`}>
                      <template.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Platform Partnership Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Detailed analytics and insights for platform-wide partnership performance
              </p>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Reports
              </Button>
            </CardContent>
          </Card>
        )}

        {filteredPartnerships.length === 0 && activeTab === "partnerships" && (
          <div className="text-center py-12">
            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No partnerships found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPartnershipsPage;
