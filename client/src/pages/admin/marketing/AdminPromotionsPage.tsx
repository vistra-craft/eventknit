import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AdminLayout from "../AdminLayout";
import { 
  Gift, 
  Target,
  Percent,
  DollarSign,
  Plus,
  Users,
  TrendingUp,
  BarChart3,
  Edit,
  Copy,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  EyeOff,
  Building2,
  Shield
} from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  organizer: string;
  code: string;
  type: 'percentage' | 'fixed' | 'buy_one_get_one' | 'free_shipping';
  value: number;
  status: 'active' | 'inactive' | 'expired' | 'scheduled' | 'pending_approval';
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  minOrderAmount?: number;
  applicableEvents: string[];
  description: string;
  revenue: number;
  conversions: number;
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

interface PromotionTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const AdminPromotionsPage = () => {
  const [activeTab, setActiveTab] = useState("promotions");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");

  // Mock platform-wide promotions data
  const promotions: Promotion[] = [
    {
      id: "1",
      name: "Early Bird Discount",
      organizer: "Tech Events Co.",
      code: "EARLY30",
      type: "percentage",
      value: 30,
      status: "active",
      startDate: "2024-01-01",
      endDate: "2024-03-01",
      usageLimit: 1000,
      usedCount: 245,
      minOrderAmount: 50,
      applicableEvents: ["Tech Summit 2024", "Music Festival 2024"],
      description: "Early bird discount for upcoming events",
      revenue: 125000,
      conversions: 450,
      approvalStatus: "approved"
    },
    {
      id: "2",
      name: "Student Special",
      organizer: "Music Events Ltd",
      code: "STUDENT20",
      type: "percentage",
      value: 20,
      status: "active",
      startDate: "2024-01-15",
      endDate: "2024-12-31",
      usageLimit: 500,
      usedCount: 89,
      minOrderAmount: 25,
      applicableEvents: ["All Events"],
      description: "Special discount for students",
      revenue: 32000,
      conversions: 120,
      approvalStatus: "approved"
    },
    {
      id: "3",
      name: "Group Booking",
      organizer: "Business Academy",
      code: "GROUP10",
      type: "percentage",
      value: 10,
      status: "active",
      startDate: "2024-01-20",
      endDate: "2024-06-30",
      usageLimit: 200,
      usedCount: 34,
      minOrderAmount: 100,
      applicableEvents: ["Corporate Events"],
      description: "Group booking discount",
      revenue: 18000,
      conversions: 80,
      approvalStatus: "approved"
    },
    {
      id: "4",
      name: "Flash Sale",
      organizer: "Wellness Corp",
      code: "FLASH50",
      type: "fixed",
      value: 50,
      status: "expired",
      startDate: "2024-01-10",
      endDate: "2024-01-12",
      usageLimit: 100,
      usedCount: 100,
      minOrderAmount: 100,
      applicableEvents: ["Tech Summit 2024"],
      description: "Limited time flash sale",
      revenue: 50000,
      conversions: 200,
      approvalStatus: "approved"
    },
    {
      id: "5",
      name: "Valentine's Special",
      organizer: "Entertainment Group",
      code: "VALENTINE25",
      type: "percentage",
      value: 25,
      status: "scheduled",
      startDate: "2024-02-10",
      endDate: "2024-02-15",
      usageLimit: 300,
      usedCount: 0,
      minOrderAmount: 40,
      applicableEvents: ["Romance Events"],
      description: "Valentine's Day special promotion",
      revenue: 0,
      conversions: 0,
      approvalStatus: "pending"
    },
    {
      id: "6",
      name: "Holiday Bundle",
      organizer: "Event Masters",
      code: "HOLIDAY40",
      type: "percentage",
      value: 40,
      status: "pending_approval",
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      usageLimit: 500,
      usedCount: 0,
      minOrderAmount: 75,
      applicableEvents: ["Holiday Events"],
      description: "Holiday season bundle promotion",
      revenue: 0,
      conversions: 0,
      approvalStatus: "pending"
    }
  ];

  // Mock promotion templates
  const promotionTemplates: PromotionTemplate[] = [
    {
      id: "1",
      name: "Percentage Discount",
      description: "Create a percentage-based discount",
      type: "percentage",
      icon: Percent,
      color: "bg-blue-500"
    },
    {
      id: "2",
      name: "Fixed Amount",
      description: "Create a fixed dollar amount discount",
      type: "fixed",
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      id: "3",
      name: "Buy One Get One",
      description: "Create a BOGO promotion",
      type: "buy_one_get_one",
      icon: Gift,
      color: "bg-purple-500"
    },
    {
      id: "4",
      name: "Free Shipping",
      description: "Create a free shipping promotion",
      type: "free_shipping",
      icon: Target,
      color: "bg-orange-500"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed': return <DollarSign className="h-4 w-4" />;
      case 'buy_one_get_one': return <Gift className="h-4 w-4" />;
      case 'free_shipping': return <Target className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage': return "bg-blue-100 text-blue-800";
      case 'fixed': return "bg-green-100 text-green-800";
      case 'buy_one_get_one': return "bg-purple-100 text-purple-800";
      case 'free_shipping': return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-100 text-green-800";
      case 'inactive': return "bg-gray-100 text-gray-800";
      case 'expired': return "bg-red-100 text-red-800";
      case 'scheduled': return "bg-blue-100 text-blue-800";
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
      case 'inactive': return <EyeOff className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'pending_approval': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || promotion.type === filterType;
    const matchesStatus = filterStatus === "all" || promotion.status === filterStatus;
    const matchesApproval = filterApproval === "all" || promotion.approvalStatus === filterApproval;
    
    return matchesSearch && matchesType && matchesStatus && matchesApproval;
  });

  const totalRevenue = promotions.reduce((sum, promotion) => sum + promotion.revenue, 0);
  const totalConversions = promotions.reduce((sum, promotion) => sum + promotion.conversions, 0);
  const activePromotions = promotions.filter(p => p.status === 'active').length;
  const totalUsage = promotions.reduce((sum, promotion) => sum + promotion.usedCount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Platform Promotions
            </h1>
            <p className="text-gray-600">
              Monitor and manage platform-wide promotional campaigns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create Promotion
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
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

        {/* Promotions Tab */}
        {activeTab === "promotions" && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Promotions</p>
                      <p className="font-semibold text-gray-900">{activePromotions}</p>
                    </div>
                    <Gift className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                      <p className="font-semibold text-gray-900">{totalUsage.toLocaleString()}</p>
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
                      <p className="font-semibold text-gray-900">${totalRevenue.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                      <p className="font-semibold text-gray-900">{totalConversions}</p>
                    </div>
                    <Target className="h-8 w-8 text-primary" />
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
                    placeholder="Search promotions..."
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
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="buy_one_get_one">BOGO</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
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

            {/* Promotions List */}
            <div className="space-y-4">
              {filteredPromotions.map((promotion) => (
                <Card key={promotion.id} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getTypeIcon(promotion.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{promotion.name}</h3>
                            <Badge className={`text-xs ${getTypeColor(promotion.type)}`}>
                              {promotion.type}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(promotion.status)}`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(promotion.status)}
                                <span>{promotion.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                            <Badge className={`text-xs ${getApprovalColor(promotion.approvalStatus)}`}>
                              {promotion.approvalStatus}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2 font-medium flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {promotion.organizer}
                          </p>
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-foreground">Code:</span>
                              <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{promotion.code}</code>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-foreground">Value:</span>
                              <span className="text-sm font-semibold text-primary">
                                {promotion.type === 'percentage' ? `${promotion.value}%` : `$${promotion.value}`}
                              </span>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-3">{promotion.description}</p>
                          <div className="flex items-center space-x-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <span className="ml-1 font-medium">{promotion.startDate}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">End:</span>
                              <span className="ml-1 font-medium">{promotion.endDate}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Used:</span>
                              <span className="ml-1 font-medium">{promotion.usedCount}</span>
                              {promotion.usageLimit && (
                                <span className="ml-1 text-muted-foreground">/ {promotion.usageLimit}</span>
                              )}
                            </div>
                            {promotion.minOrderAmount && (
                              <div>
                                <span className="text-muted-foreground">Min Order:</span>
                                <span className="ml-1 font-medium">${promotion.minOrderAmount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        {promotion.revenue > 0 && (
                          <div className="text-center">
                            <p className="font-semibold text-foreground">${promotion.revenue.toLocaleString()}</p>
                            <p className="text-muted-foreground">Revenue</p>
                          </div>
                        )}
                        {promotion.conversions > 0 && (
                          <div className="text-center">
                            <p className="font-semibold text-foreground">{promotion.conversions}</p>
                            <p className="text-muted-foreground">Conversions</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {promotion.approvalStatus === "pending" && (
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
                <CardTitle>Promotion Templates</CardTitle>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {promotionTemplates.map((template) => (
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
              <h3 className="text-lg font-medium text-foreground mb-2">Platform Promotion Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Detailed analytics and insights for platform-wide promotional campaigns
              </p>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Reports
              </Button>
            </CardContent>
          </Card>
        )}

        {filteredPromotions.length === 0 && activeTab === "promotions" && (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No promotions found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPromotionsPage;
