import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Edit,
  User,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "./AdminLayout";

interface Organizer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  status: "verified" | "pending" | "suspended" | "rejected";
  verificationDate?: string;
  totalEvents: number;
  totalRevenue: number;
  rating: number;
  joinDate: string;
  lastActive: string;
  location: string;
  website?: string;
  description?: string;
  avatar?: string;
}

const OrganizersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Mock organizers data
  const organizers: Organizer[] = [
    {
      id: "1",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@techevents.com",
      phone: "+1 (555) 123-4567",
      company: "Tech Events Inc.",
      status: "verified",
      verificationDate: "2023-01-15",
      totalEvents: 45,
      totalRevenue: 125000,
      rating: 4.8,
      joinDate: "2022-11-20",
      lastActive: "2024-02-15T10:30:00Z",
      location: "San Francisco, CA",
      website: "https://techevents.com",
      description: "Leading technology event organizer with 10+ years of experience",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "2",
      firstName: "Michael",
      lastName: "Chen",
      email: "michael@businessacademy.com",
      phone: "+1 (555) 234-5678",
      company: "Business Academy",
      status: "verified",
      verificationDate: "2023-03-20",
      totalEvents: 28,
      totalRevenue: 85000,
      rating: 4.6,
      joinDate: "2023-02-10",
      lastActive: "2024-02-15T09:15:00Z",
      location: "Los Angeles, CA",
      website: "https://businessacademy.com",
      description: "Business leadership and professional development events",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "3",
      firstName: "Emma",
      lastName: "Wilson",
      email: "emma@musicevents.com",
      phone: "+1 (555) 345-6789",
      company: "Music Events Ltd",
      status: "pending",
      totalEvents: 0,
      totalRevenue: 0,
      rating: 0,
      joinDate: "2024-01-15",
      lastActive: "2024-02-10T11:45:00Z",
      location: "New York, NY",
      website: "https://musicevents.com",
      description: "Music festival and concert organizer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "4",
      firstName: "David",
      lastName: "Brown",
      email: "david@wellnesscorp.com",
      phone: "+1 (555) 456-7890",
      company: "Wellness Corp",
      status: "verified",
      verificationDate: "2023-06-10",
      totalEvents: 32,
      totalRevenue: 95000,
      rating: 4.9,
      joinDate: "2023-04-05",
      lastActive: "2024-02-15T08:20:00Z",
      location: "Chicago, IL",
      website: "https://wellnesscorp.com",
      description: "Health and wellness event specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "5",
      firstName: "Lisa",
      lastName: "Anderson",
      email: "lisa@startupevents.com",
      phone: "+1 (555) 567-8901",
      company: "Startup Events Co.",
      status: "suspended",
      verificationDate: "2023-09-12",
      totalEvents: 15,
      totalRevenue: 35000,
      rating: 3.2,
      joinDate: "2023-08-01",
      lastActive: "2024-01-20T14:30:00Z",
      location: "Seattle, WA",
      website: "https://startupevents.com",
      description: "Startup and entrepreneurship events",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const filteredOrganizers = organizers.filter(organizer => {
    const matchesSearch = 
      organizer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || organizer.status === statusFilter;
    const matchesRating = ratingFilter === "all" || 
      (ratingFilter === "high" && organizer.rating >= 4.5) ||
      (ratingFilter === "medium" && organizer.rating >= 3.5 && organizer.rating < 4.5) ||
      (ratingFilter === "low" && organizer.rating < 3.5);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      suspended: "bg-red-100 text-red-800 border-red-200",
      rejected: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewOrganizer = (id: string) => {
    navigate(`/admin/users/organizers/${id}`);
  };

  const handleEditOrganizer = (id: string) => {
    navigate(`/admin/users/organizers/${id}/edit`);
  };

  const handleSuspendOrganizer = (id: string) => {
    console.log("Suspend organizer:", id);
    // TODO: Suspend organizer
  };

  const handleUnsuspendOrganizer = (id: string) => {
    console.log("Unsuspend organizer:", id);
    // TODO: Unsuspend organizer
  };

  const handleVerifyOrganizer = (id: string) => {
    console.log("Verify organizer:", id);
    // TODO: Verify organizer
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizers</h1>
            <p className="text-gray-600">Manage external event organizers</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Organizer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">{organizers.length}</div>
              <p className="text-sm text-gray-600">Total Organizers</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {organizers.filter(o => o.status === 'verified').length}
              </div>
              <p className="text-sm text-gray-600">Verified</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {organizers.filter(o => o.status === 'pending').length}
              </div>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {formatCurrency(organizers.reduce((sum, o) => sum + o.totalRevenue, 0))}
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search organizers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="high">High (4.5+)</SelectItem>
                  <SelectItem value="medium">Medium (3.5-4.4)</SelectItem>
                  <SelectItem value="low">Low (&lt;3.5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Organizers List */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Organizers ({filteredOrganizers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredOrganizers.map((organizer) => (
                <div key={organizer.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {organizer.avatar ? (
                        <img
                          src={organizer.avatar}
                          alt={`${organizer.firstName} ${organizer.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {organizer.firstName} {organizer.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">{organizer.company}</p>
                      <p className="text-sm text-gray-600">{organizer.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getStatusBadge(organizer.status)}`}>
                          {organizer.status}
                        </Badge>
                        {organizer.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">{organizer.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {organizer.totalEvents} events
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(organizer.totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Joined: {formatDate(organizer.joinDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewOrganizer(organizer.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditOrganizer(organizer.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {organizer.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVerifyOrganizer(organizer.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          title="Verify Organizer"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {organizer.status === 'verified' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSuspendOrganizer(organizer.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          title="Suspend Organizer"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {organizer.status === 'suspended' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnsuspendOrganizer(organizer.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          title="Unsuspend Organizer"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default OrganizersPage;


