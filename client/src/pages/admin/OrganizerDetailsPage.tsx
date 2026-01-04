import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Star,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  User,
  Download,
  Loader2,
  AlertCircle
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminLayout from "./AdminLayout";
import {
  getUserById,
  suspendUser,
  activateUser,
  getOrganizerProfile,
  getEmergencyContact,
  type User as ApiUser,
  type OrganizerProfile,
  type EmergencyContact
} from "@/lib/admin-api";

interface OrganizerDetails {
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
  businessLicense?: string;
  taxId?: string;
  bankAccount?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  supportTickets?: Array<{
    id: string;
    subject: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high" | "urgent";
    createdAt: string;
    updatedAt: string;
  }>;
}

interface OrganizerEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  revenue: number;
  status: "active" | "completed" | "cancelled" | "pending";
  category: string;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
}

const OrganizerDetailsPage = () => {
  const { organizerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [userData, setUserData] = useState<ApiUser | null>(null);
  const [organizerProfileData, setOrganizerProfileData] = useState<OrganizerProfile | null>(null);
  const [emergencyContactData, setEmergencyContactData] = useState<EmergencyContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!organizerId) {
        setError("Organizer ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getUserById(organizerId);
        if (response.success && response.data?.user) {
          setUserData(response.data.user);

          // Fetch extended profile data
          try {
            const profileResponse = await getOrganizerProfile(organizerId);
            if (profileResponse.success && profileResponse.data?.organizerProfile) {
              setOrganizerProfileData(profileResponse.data.organizerProfile);
            }
          } catch {
            console.log("No organizer profile found, using defaults");
          }

          try {
            const contactResponse = await getEmergencyContact(organizerId);
            if (contactResponse.success && contactResponse.data?.emergencyContact) {
              setEmergencyContactData(contactResponse.data.emergencyContact);
            }
          } catch {
            console.log("No emergency contact found");
          }
        } else {
          setError("Organizer not found");
        }
      } catch (err) {
        console.error("Error fetching organizer:", err);
        setError("Failed to load organizer details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [organizerId]);

  // Build organizerData from API response + extended profile data
  const organizerData: OrganizerDetails = {
    id: userData?.id || organizerId || "",
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    email: userData?.email || "",
    phone: userData?.phoneNumber || undefined,
    company: userData?.organizationName || "Not specified",
    status: userData?.status === "ACTIVE" ? "verified" : userData?.status === "SUSPENDED" ? "suspended" : "pending",
    verificationDate: userData?.isEmailVerified ? userData.createdAt : undefined,
    totalEvents: organizerProfileData?.totalEvents || 0,
    totalRevenue: organizerProfileData?.totalRevenue ? Number(organizerProfileData.totalRevenue) : 0,
    rating: organizerProfileData?.rating ? Number(organizerProfileData.rating) : 0,
    joinDate: userData?.createdAt || new Date().toISOString(),
    lastActive: userData?.updatedAt || new Date().toISOString(),
    location: organizerProfileData?.location || "Not specified",
    website: organizerProfileData?.website || undefined,
    description: organizerProfileData?.description || undefined,
    avatar: undefined,
    businessLicense: organizerProfileData?.businessLicense || undefined,
    taxId: organizerProfileData?.taxId || undefined,
    bankAccount: organizerProfileData?.bankAccountLast4 ? `****${organizerProfileData.bankAccountLast4}` : undefined,
    emergencyContact: emergencyContactData ? {
      name: emergencyContactData.name,
      phone: emergencyContactData.phone,
      relationship: emergencyContactData.relationship
    } : undefined,
    supportTickets: []
  };

  // Mock events data
  const organizerEvents: OrganizerEvent[] = [
    {
      id: "EVT-001",
      title: "Tech Innovation Summit 2024",
      date: "2024-03-15",
      location: "San Francisco, CA",
      attendees: 1250,
      revenue: 45000,
      status: "active",
      category: "Technology",
      ticketPrice: 299,
      totalTickets: 1500,
      soldTickets: 1250
    },
    {
      id: "EVT-002",
      title: "AI & Machine Learning Workshop",
      date: "2024-02-20",
      location: "San Francisco, CA",
      attendees: 300,
      revenue: 15000,
      status: "completed",
      category: "Technology",
      ticketPrice: 199,
      totalTickets: 350,
      soldTickets: 300
    },
    {
      id: "EVT-003",
      title: "Startup Networking Event",
      date: "2024-01-25",
      location: "San Francisco, CA",
      attendees: 200,
      revenue: 8000,
      status: "completed",
      category: "Business",
      ticketPrice: 99,
      totalTickets: 250,
      soldTickets: 200
    },
    {
      id: "EVT-004",
      title: "Future of Web Development",
      date: "2024-04-10",
      location: "San Francisco, CA",
      attendees: 0,
      revenue: 0,
      status: "pending",
      category: "Technology",
      ticketPrice: 149,
      totalTickets: 400,
      soldTickets: 0
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      suspended: "bg-red-100 text-red-800 border-red-200",
      rejected: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getEventStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTicketStatusBadge = (status: string) => {
    const variants = {
      open: "bg-red-100 text-red-800 border-red-200",
      in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "bg-gray-100 text-gray-800 border-gray-200",
      medium: "bg-blue-100 text-blue-800 border-blue-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[priority as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleEdit = () => {
    navigate(`/admin/users/organizers/${organizerData.id}/edit`);
  };

  const handleVerify = async () => {
    if (!organizerId) return;
    try {
      setActionLoading(true);
      const response = await activateUser(organizerId);
      if (response.success) {
        setUserData(prev => prev ? { ...prev, status: "ACTIVE" as const } : null);
      }
    } catch (err) {
      console.error("Error verifying organizer:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!organizerId) return;
    try {
      setActionLoading(true);
      const response = await suspendUser(organizerId);
      if (response.success) {
        setUserData(prev => prev ? { ...prev, status: "SUSPENDED" as const } : null);
      }
    } catch (err) {
      console.error("Error suspending organizer:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading organizer details...</span>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <BackButton to="/admin/users/organizers" label="Back to Organizers" />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/admin/users/organizers" label="Back to Organizers" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {organizerData.firstName} {organizerData.lastName}
              </h1>
              <p className="text-muted-foreground">{organizerData.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            {organizerData.status === 'pending' && (
              <Button size="sm" onClick={handleVerify} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Verify
              </Button>
            )}
            {organizerData.status === 'verified' && (
              <Button variant="destructive" size="sm" onClick={handleSuspend} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Suspend
              </Button>
            )}
          </div>
        </div>

        {/* Organizer Status and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge className={`text-xs ${getStatusBadge(organizerData.status)}`}>
                {organizerData.status}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Events</span>
              </div>
              <p className="text-lg font-bold text-primary">{organizerData.totalEvents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Revenue</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(organizerData.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Rating</span>
              </div>
              <p className="text-lg font-bold text-primary">{organizerData.rating}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Organizer Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Organizer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {organizerData.avatar ? (
                          <img
                            src={organizerData.avatar}
                            alt={`${organizerData.firstName} ${organizerData.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {organizerData.firstName} {organizerData.lastName}
                        </h3>
                        <p className="text-muted-foreground">{organizerData.company}</p>
                        <Badge className={`text-xs ${getStatusBadge(organizerData.status)}`}>
                          {organizerData.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm text-foreground">{organizerData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-sm text-foreground">{organizerData.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <p className="text-sm text-foreground">{organizerData.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Website</label>
                        <p className="text-sm text-foreground">
                          {organizerData.website ? (
                            <a href={organizerData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {organizerData.website}
                            </a>
                          ) : "Not provided"}
                        </p>
                      </div>
                    </div>

                    {organizerData.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm text-foreground mt-1">{organizerData.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Business Information */}
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Business License</label>
                        <p className="text-sm text-foreground">{organizerData.businessLicense || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                        <p className="text-sm text-foreground">{organizerData.taxId || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Bank Account</label>
                        <p className="text-sm text-foreground">{organizerData.bankAccount || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Join Date</label>
                        <p className="text-sm text-foreground">{formatDate(organizerData.joinDate)}</p>
                      </div>
                    </div>

                    {organizerData.verificationDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Verification Date</label>
                        <p className="text-sm text-foreground">{formatDate(organizerData.verificationDate)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                {organizerData.emergencyContact && (
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle>Emergency Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Name</label>
                          <p className="text-sm text-foreground">{organizerData.emergencyContact.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-sm text-foreground">{organizerData.emergencyContact.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                          <p className="text-sm text-foreground">{organizerData.emergencyContact.relationship}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Statistics and Activity */}
              <div className="space-y-6">
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Events</span>
                      <span className="text-sm font-medium text-foreground">{organizerData.totalEvents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(organizerData.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-foreground">{organizerData.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Active</span>
                      <span className="text-sm font-medium text-foreground">{formatDateTime(organizerData.lastActive)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-foreground">Event "Tech Innovation Summit" published</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-foreground">Payment received: $45,000</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-foreground">Support ticket resolved</p>
                        <p className="text-xs text-muted-foreground">3 days ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <CardTitle>Organizer Events ({organizerEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizerEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.date} • {event.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getEventStatusBadge(event.status)}`}>
                              {event.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{event.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">
                            {event.attendees} attendees
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(event.revenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.soldTickets}/{event.totalTickets} tickets
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <CardTitle>Support Tickets ({organizerData.supportTickets?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizerData.supportTickets?.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{ticket.subject}</h4>
                          <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getTicketStatusBadge(ticket.status)}`}>
                              {ticket.status}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityBadge(ticket.priority)}`}>
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Created: {formatDateTime(ticket.createdAt)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Updated: {formatDateTime(ticket.updatedAt)}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No support tickets found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default OrganizerDetailsPage;




