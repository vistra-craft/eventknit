import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
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
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "./AdminLayout";
import { getAdminStaffEvents, type EventStaffAssignment } from "@/lib/admin-api";
import { Loader2 } from "lucide-react";

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

  // Mock staff data
  const staffData: StaffDetails = {
    id: staffId || "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@eventknit.com",
    phone: "+1 (555) 123-4567",
    role: "event_manager",
    department: "operations",
    status: "active",
    hireDate: "2023-01-15",
    lastActive: "2024-02-15T10:30:00Z",
    location: "San Francisco, CA",
    eventsManaged: 45,
    totalHours: 320,
    rating: 4.8,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    employeeId: "EMP-001",
    salary: 75000,
    hourlyRate: 45,
    totalEarnings: 125000,
    pendingDues: 2500,
    permissions: {
      canManageEvents: true,
      canAccessAnalytics: true,
      canManageUsers: false,
      canProcessPayments: true,
      canViewReports: true,
      canModerateContent: true,
      canAccessAdminPanel: false
    },
    performance: {
      eventsCompleted: 45,
      averageRating: 4.8,
      onTimeRate: 98,
      customerSatisfaction: 96,
      lastPerformanceReview: "2024-01-15",
      nextReviewDate: "2024-07-15"
    },
    emergencyContact: {
      name: "John Johnson",
      phone: "+1 (555) 987-6543",
      relationship: "Spouse"
    },
    documents: [
      {
        id: "DOC-001",
        name: "Employment Contract",
        type: "contract",
        uploadDate: "2023-01-15",
        expiryDate: "2025-01-15"
      },
      {
        id: "DOC-002",
        name: "Event Management Certification",
        type: "certification",
        uploadDate: "2023-02-01",
        expiryDate: "2025-02-01"
      }
    ]
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
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      event_manager: "bg-blue-100 text-blue-800 border-blue-200",
      ticket_scanner: "bg-green-100 text-green-800 border-green-200",
      support_staff: "bg-purple-100 text-purple-800 border-purple-200",
      admin: "bg-red-100 text-red-800 border-red-200",
      supervisor: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return variants[role as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };


  const getEarningsStatusBadge = (status: string) => {
    const variants = {
      paid: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200"
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleBack = () => {
    navigate("/admin/users/staff");
  };

  const handleEdit = () => {
    navigate(`/admin/users/staff/${staffData.id}/edit`);
  };

  const handleSuspend = () => {
    console.log("Suspend staff member:", staffData.id);
    // TODO: Suspend staff member
  };

  const handleUnsuspend = () => {
    console.log("Unsuspend staff member:", staffData.id);
    // TODO: Unsuspend staff member
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff
            </Button>
            <div>
              <h1 className="text-base font-semibold text-foreground">
                {staffData.firstName} {staffData.lastName}
              </h1>
              <p className="text-gray-600">{staffData.role.replace('_', ' ')} • {staffData.department.replace('_', ' ')}</p>
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
              <Button variant="destructive" size="sm" onClick={handleSuspend}>
                <XCircle className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            )}
            {staffData.status === 'inactive' && (
              <Button size="sm" onClick={handleUnsuspend}>
                <CheckCircle className="h-4 w-4 mr-2" />
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
                <Shield className="h-5 w-5 text-blue-600" />
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
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Events</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{staffData.eventsManaged}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Total Earnings</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(staffData.totalEarnings)}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Pending Dues</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(staffData.pendingDues)}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Rating</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{staffData.rating}</p>
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
                        <p className="text-gray-600">Employee ID: {staffData.employeeId}</p>
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
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm text-gray-900">{staffData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-sm text-gray-900">{staffData.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-sm text-gray-900">{staffData.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Department</label>
                        <p className="text-sm text-gray-900">{staffData.department.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Hire Date</label>
                        <p className="text-sm text-gray-900">{formatDate(staffData.hireDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Active</label>
                        <p className="text-sm text-gray-900">{formatDateTime(staffData.lastActive)}</p>
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
                        <label className="text-sm font-medium text-gray-600">Events Completed</label>
                        <p className="text-sm text-gray-900">{staffData.performance.eventsCompleted}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Average Rating</label>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-900">{staffData.performance.averageRating}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">On-Time Rate</label>
                        <p className="text-sm text-gray-900">{staffData.performance.onTimeRate}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Customer Satisfaction</label>
                        <p className="text-sm text-gray-900">{staffData.performance.customerSatisfaction}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Review</label>
                        <p className="text-sm text-gray-900">{formatDate(staffData.performance.lastPerformanceReview)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Next Review</label>
                        <p className="text-sm text-gray-900">{formatDate(staffData.performance.nextReviewDate)}</p>
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
                          <label className="text-sm font-medium text-gray-600">Name</label>
                          <p className="text-sm text-gray-900">{staffData.emergencyContact.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Phone</label>
                          <p className="text-sm text-gray-900">{staffData.emergencyContact.phone}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Relationship</label>
                          <p className="text-sm text-gray-900">{staffData.emergencyContact.relationship}</p>
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
                      <span className="text-sm text-gray-600">Annual Salary</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(staffData.salary)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hourly Rate</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(staffData.hourlyRate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Earnings</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(staffData.totalEarnings)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending Dues</span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(staffData.pendingDues)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Hours</span>
                      <span className="text-sm font-medium text-gray-900">{staffData.totalHours}h</span>
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
                        <div className={`w-2 h-2 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm font-medium text-gray-900">
                          {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                      <Badge className={hasAccess ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
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
                          <h4 className="font-medium text-gray-900">{earning.description}</h4>
                          <p className="text-sm text-gray-600">{formatDate(earning.date)} • {earning.type}</p>
                          <Badge className={`text-xs ${getEarningsStatusBadge(earning.status)}`}>
                            {earning.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
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
                    <Loader2 className="h-6 w-6 animate-spin" />
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
                            <h4 className="font-medium text-gray-900">
                              {assignment.event?.title || "Event"}
                            </h4>
                            {assignment.event?.startDate && (
                              <p className="text-sm text-gray-600">
                                {new Date(assignment.event.startDate).toLocaleDateString()}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                {assignment.role}
                              </Badge>
                              {assignment.isActive ? (
                                <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-gray-100 text-gray-800 border-gray-200">
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
                              <div className="text-sm text-gray-600">
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
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          <p className="text-sm text-gray-600">Uploaded: {formatDate(doc.uploadDate)}</p>
                          {doc.expiryDate && (
                            <p className="text-sm text-gray-600">Expires: {formatDate(doc.expiryDate)}</p>
                          )}
                          <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
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
