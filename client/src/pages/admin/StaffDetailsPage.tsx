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
  Download,
  Shield,
  User,
  AlertTriangle,
  CreditCard,
  Award,
  FileText,
  AlertCircle
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminLayout from "./AdminLayout";
import { getUserById, getAdminStaffEvents, suspendUser, activateUser, getStaffProfile, getEmergencyContact, type EventStaffAssignment, type User as ApiUser, type StaffProfile, type EmergencyContact } from "@/lib/admin-api";
import { getEventStatusBadgeClass } from "@/lib/utils/event-badge-helpers";

interface StaffDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "event_manager" | "ticket_scanner" | "support_staff" | "admin" | "supervisor";
  department: "operations" | "customer_service" | "technical" | "management";
  status: "active" | "inactive" | "pending";
  hireDate: string;
  lastActive: string;
  location: string;
  eventsManaged: number;
  totalHours: number;
  rating: number;
  avatar?: string;
  employeeId: string;
  salary: number;
  hourlyRate: number;
  totalEarnings: number;
  pendingDues: number;
  permissions: {
    canManageEvents: boolean;
    canAccessAnalytics: boolean;
    canManageUsers: boolean;
    canProcessPayments: boolean;
    canViewReports: boolean;
    canModerateContent: boolean;
    canAccessAdminPanel: boolean;
  };
  performance: {
    eventsCompleted: number;
    averageRating: number;
    onTimeRate: number;
    customerSatisfaction: number;
    lastPerformanceReview: string;
    nextReviewDate: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents?: Array<{
    id: string;
    name: string;
    type: "contract" | "id" | "certification" | "other";
    uploadDate: string;
    expiryDate?: string;
  }>;
}

// Legacy interface - not used anymore, using EventStaffAssignment from API instead
// interface StaffEvent {
//   id: string;
//   title: string;
//   date: string;
//   location: string;
//   role: string;
//   hours: number;
//   status: "completed" | "upcoming" | "cancelled";
//   rating?: number;
//   payment: number;
//   organizer: string;
// }

interface EarningsRecord {
  id: string;
  date: string;
  type: "salary" | "hourly" | "bonus" | "overtime";
  amount: number;
  description: string;
  status: "paid" | "pending" | "processing";
}

const StaffDetailsPage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [staffEvents, setStaffEvents] = useState<EventStaffAssignment[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [userData, setUserData] = useState<ApiUser | null>(null);
  const [staffProfileData, setStaffProfileData] = useState<StaffProfile | null>(null);
  const [emergencyContactData, setEmergencyContactData] = useState<EmergencyContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch user data and extended profile on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!staffId) {
        setError("Staff ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch basic user data
        const response = await getUserById(staffId);
        if (response.success && response.data?.user) {
          setUserData(response.data.user);
        } else {
          setError("Staff member not found");
          setLoading(false);
          return;
        }

        // Fetch extended staff profile
        try {
          const profileResponse = await getStaffProfile(staffId);
          if (profileResponse.success && profileResponse.data?.staffProfile) {
            setStaffProfileData(profileResponse.data.staffProfile);
          }
        } catch {
          // Staff profile may not exist yet, that's ok
        }

        // Fetch emergency contact
        try {
          const contactResponse = await getEmergencyContact(staffId);
          if (contactResponse.success && contactResponse.data?.emergencyContact) {
            setEmergencyContactData(contactResponse.data.emergencyContact);
          }
        } catch {
          // Emergency contact may not exist yet, that's ok
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load staff details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [staffId]);

  // Fetch staff events when events tab is active
  useEffect(() => {
    const fetchStaffEvents = async () => {
      if (!staffId || activeTab !== "events") return;

      try {
        setLoadingEvents(true);
        const response = await getAdminStaffEvents(staffId);
        if (response.success && response.data) {
          setStaffEvents(response.data.assignments);
        }
      } catch (error) {
        console.error("Error fetching staff events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchStaffEvents();
  }, [staffId, activeTab]);

  // Map API department to local department type
  const mapDepartment = (dept?: string): "operations" | "customer_service" | "technical" | "management" => {
    const deptMap: Record<string, "operations" | "customer_service" | "technical" | "management"> = {
      'OPERATIONS': 'operations',
      'CUSTOMER_SERVICE': 'customer_service',
      'TECHNICAL': 'technical',
      'MANAGEMENT': 'management',
      'FINANCE': 'operations',
      'MARKETING': 'operations',
    };
    return deptMap[dept || ''] || 'operations';
  };

  // Build staffData from API response + extended profile data
  const staffData: StaffDetails = {
    id: userData?.id || staffId || "",
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    email: userData?.email || "",
    phone: userData?.phoneNumber || undefined,
    role: "event_manager", // Default - could be extended in future
    department: mapDepartment(staffProfileData?.department),
    status: userData?.status === "ACTIVE" ? "active" : userData?.status === "SUSPENDED" ? "inactive" : "pending",
    hireDate: staffProfileData?.hireDate || userData?.createdAt || new Date().toISOString(),
    lastActive: userData?.updatedAt || new Date().toISOString(),
    location: staffProfileData?.location || "Not specified",
    eventsManaged: staffEvents.length,
    totalHours: staffProfileData?.totalHours || 0,
    rating: staffProfileData?.rating || 0,
    avatar: undefined,
    employeeId: staffProfileData?.employeeId || `EMP-${userData?.id?.slice(0, 6).toUpperCase() || "000"}`,
    salary: staffProfileData?.salary || 0,
    hourlyRate: staffProfileData?.hourlyRate || 0,
    totalEarnings: 0, // Computed field - could be added later
    pendingDues: 0, // Computed field - could be added later
    permissions: (staffProfileData?.permissions as StaffDetails['permissions']) || {
      canManageEvents: true,
      canAccessAnalytics: false,
      canManageUsers: false,
      canProcessPayments: false,
      canViewReports: true,
      canModerateContent: false,
      canAccessAdminPanel: false
    },
    performance: {
      eventsCompleted: staffEvents.filter(e => !e.isActive).length,
      averageRating: staffProfileData?.rating || 0,
      onTimeRate: 0,
      customerSatisfaction: 0,
      lastPerformanceReview: "",
      nextReviewDate: ""
    },
    emergencyContact: emergencyContactData ? {
      name: emergencyContactData.name,
      phone: emergencyContactData.phone,
      relationship: emergencyContactData.relationship
    } : undefined,
    documents: []
  };

  // Mock events data (legacy - not used anymore, using API instead)
  // const mockStaffEvents: StaffEvent[] = [
  //   {
  //     id: "EVT-001",
  //     title: "Tech Innovation Summit 2024",
  //     date: "2024-03-15",
  //     location: "San Francisco, CA",
  //     role: "Event Manager",
  //     hours: 12,
  //     status: "upcoming",
  //     payment: 540,
  //     organizer: "Tech Events Inc."
  //   },
  //   {
  //     id: "EVT-002",
  //     title: "AI & Machine Learning Workshop",
  //     date: "2024-02-20",
  //     location: "San Francisco, CA",
  //     role: "Event Manager",
  //     hours: 8,
  //     status: "completed",
  //     rating: 4.9,
  //     payment: 360,
  //     organizer: "Tech Events Inc."
  //   },
  //   {
  //     id: "EVT-003",
  //     title: "Startup Networking Event",
  //     date: "2024-01-25",
  //     location: "San Francisco, CA",
  //     role: "Event Manager",
  //     hours: 6,
  //     status: "completed",
  //     rating: 4.7,
  //     payment: 270,
  //     organizer: "Tech Events Inc."
  //   }
  // ];

  // Mock earnings data
  const earningsRecords: EarningsRecord[] = [
    {
      id: "EARN-001",
      date: "2024-02-01",
      type: "salary",
      amount: 6250,
      description: "Monthly salary - February 2024",
      status: "paid"
    },
    {
      id: "EARN-002",
      date: "2024-02-15",
      type: "hourly",
      amount: 540,
      description: "Event management - Tech Innovation Summit",
      status: "paid"
    },
    {
      id: "EARN-003",
      date: "2024-02-20",
      type: "hourly",
      amount: 360,
      description: "Event management - AI Workshop",
      status: "paid"
    },
    {
      id: "EARN-004",
      date: "2024-02-25",
      type: "bonus",
      amount: 1000,
      description: "Performance bonus - Q1 2024",
      status: "pending"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "ACTIVE",
      inactive: "DEACTIVATED",
      pending: "PENDING",
    };
    const mappedStatus = statusMap[status] || status;
    return getEventStatusBadgeClass(mappedStatus);
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      event_manager: "bg-primary/10 text-primary border-primary",
      ticket_scanner: "bg-success/10 text-success border-success",
      support_staff: "bg-purple-100 text-purple-800 border-purple-200",
      admin: "bg-destructive/10 text-destructive border-destructive",
      supervisor: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return variants[role as keyof typeof variants] || "bg-muted text-gray-800 border-gray-200";
  };


  const getEarningsStatusBadge = (status: string) => {
    const variants = {
      paid: "bg-success/10 text-success border-success",
      pending: "bg-warning/10 text-warning border-warning",
      processing: "bg-primary/10 text-primary border-primary"
    };
    return variants[status as keyof typeof variants] || "bg-muted text-gray-800 border-gray-200";
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
    navigate(`/admin/users/staff/${staffData.id}/edit`);
  };

  const handleSuspend = async () => {
    if (!staffId) return;
    try {
      setActionLoading(true);
      const response = await suspendUser(staffId);
      if (response.success) {
        setUserData(prev => prev ? { ...prev, status: "SUSPENDED" as const } : null);
      }
    } catch (err) {
      console.error("Error suspending user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!staffId) return;
    try {
      setActionLoading(true);
      const response = await activateUser(staffId);
      if (response.success) {
        setUserData(prev => prev ? { ...prev, status: "ACTIVE" as const } : null);
      }
    } catch (err) {
      console.error("Error activating user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader />
          <span className="ml-2 text-muted-foreground">Loading staff details...</span>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <BackButton to="/admin/users/staff" label="Back to Staff" />
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
            <BackButton to="/admin/users/staff" label="Back to Staff" />
            <div>
              <h1 className="text-base font-semibold text-foreground">
                {staffData.firstName} {staffData.lastName}
              </h1>
              <p className="text-muted-foreground">{staffData.role.replace('_', ' ')} • {staffData.department.replace('_', ' ')}</p>
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
            {staffData.status === 'active' && (
              <Button variant="destructive" size="sm" onClick={handleSuspend} disabled={actionLoading}>
                {actionLoading ? <Loader className="inline mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Suspend
              </Button>
            )}
            {staffData.status === 'inactive' && (
              <Button size="sm" onClick={handleActivate} disabled={actionLoading}>
                {actionLoading ? <Loader className="inline mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Activate
              </Button>
            )}
          </div>
        </div>

        {/* Status and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge className={`text-xs ${getStatusBadge(staffData.status)}`}>
                {staffData.status}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Events</span>
              </div>
              <p className="text-lg font-bold text-foreground">{staffData.eventsManaged}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Total Earnings</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(staffData.totalEarnings)}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Pending Dues</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(staffData.pendingDues)}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium">Rating</span>
              </div>
              <p className="text-lg font-bold text-foreground">{staffData.rating}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Staff Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Staff Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {staffData.avatar ? (
                          <img
                            src={staffData.avatar}
                            alt={`${staffData.firstName} ${staffData.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {staffData.firstName} {staffData.lastName}
                        </h3>
                        <p className="text-muted-foreground">Employee ID: {staffData.employeeId}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getStatusBadge(staffData.status)}`}>
                            {staffData.status}
                          </Badge>
                          <Badge className={`text-xs ${getRoleBadge(staffData.role)}`}>
                            {staffData.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm text-foreground">{staffData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-sm text-foreground">{staffData.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <p className="text-sm text-foreground">{staffData.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Department</label>
                        <p className="text-sm text-foreground">{staffData.department.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                        <p className="text-sm text-foreground">{formatDate(staffData.hireDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Active</label>
                        <p className="text-sm text-foreground">{formatDateTime(staffData.lastActive)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Events Completed</label>
                        <p className="text-sm text-foreground">{staffData.performance.eventsCompleted}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Average Rating</label>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning fill-current" />
                          <span className="text-sm text-foreground">{staffData.performance.averageRating}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">On-Time Rate</label>
                        <p className="text-sm text-foreground">{staffData.performance.onTimeRate}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Customer Satisfaction</label>
                        <p className="text-sm text-foreground">{staffData.performance.customerSatisfaction}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Review</label>
                        <p className="text-sm text-foreground">{formatDate(staffData.performance.lastPerformanceReview)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Next Review</label>
                        <p className="text-sm text-foreground">{formatDate(staffData.performance.nextReviewDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                {staffData.emergencyContact && (
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Emergency Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Name</label>
                          <p className="text-sm text-foreground">{staffData.emergencyContact.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-sm text-foreground">{staffData.emergencyContact.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                          <p className="text-sm text-foreground">{staffData.emergencyContact.relationship}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Financial Summary */}
              <div className="space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Annual Salary</span>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(staffData.salary)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hourly Rate</span>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(staffData.hourlyRate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Earnings</span>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(staffData.totalEarnings)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pending Dues</span>
                      <span className="text-sm font-medium text-destructive">{formatCurrency(staffData.pendingDues)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Hours</span>
                      <span className="text-sm font-medium text-foreground">{staffData.totalHours}h</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" size="sm" className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Award className="h-4 w-4 mr-2" />
                      Performance Review
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Staff Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(staffData.permissions).map(([permission, hasAccess]) => (
                    <div key={permission} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${hasAccess ? 'bg-success/50' : 'bg-gray-300'}`}></div>
                        <span className="text-sm font-medium text-foreground">
                          {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                      <Badge className={hasAccess ? "bg-success/10 text-success border-success" : "bg-muted text-gray-800 border-gray-200"}>
                        {hasAccess ? "Allowed" : "Denied"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Earnings History ({earningsRecords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earningsRecords.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{earning.description}</h4>
                          <p className="text-sm text-muted-foreground">{formatDate(earning.date)} • {earning.type}</p>
                          <Badge className={`text-xs ${getEarningsStatusBadge(earning.status)}`}>
                            {earning.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {formatCurrency(earning.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Event Assignments ({staffEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEvents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader />
                  </div>
                ) : staffEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No event assignments found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staffEvents.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {assignment.event?.title || "Event"}
                            </h4>
                            {assignment.event?.startDate && (
                              <p className="text-sm text-muted-foreground">
                                {new Date(assignment.event.startDate).toLocaleDateString()}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="text-xs bg-primary/10 text-primary border-primary">
                                {assignment.role}
                              </Badge>
                              {assignment.isActive ? (
                                <Badge className="text-xs bg-success/10 text-success border-success">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-muted text-gray-800 border-gray-200">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {assignment.notes && (
                              <p className="text-xs text-gray-500 mt-1">{assignment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {assignment.facility && (
                              <div className="text-sm text-muted-foreground">
                                {assignment.facility}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/events/${assignment.eventId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Staff Documents ({staffData.documents?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staffData.documents?.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{doc.name}</h4>
                          <p className="text-sm text-muted-foreground">Uploaded: {formatDate(doc.uploadDate)}</p>
                          {doc.expiryDate && (
                            <p className="text-sm text-muted-foreground">Expires: {formatDate(doc.expiryDate)}</p>
                          )}
                          <Badge className="text-xs bg-primary/10 text-primary border-primary">
                            {doc.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No documents found</p>
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

export default StaffDetailsPage;
