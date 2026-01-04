import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminLayout from "./AdminLayout";
import { getUserById, updateUser, getStaffProfile, updateStaffProfile, getEmergencyContact, updateEmergencyContact, type User as ApiUser, type StaffProfile, type EmergencyContact, type StaffDepartment } from "@/lib/admin-api";

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
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const StaffEditPage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userData, setUserData] = useState<ApiUser | null>(null);
  const [staffProfileData, setStaffProfileData] = useState<StaffProfile | null>(null);
  const [emergencyContactData, setEmergencyContactData] = useState<EmergencyContact | null>(null);

  // Map API department to local department type
  const mapDepartment = (dept?: string): "operations" | "customer_service" | "technical" | "management" => {
    const deptMap: Record<string, "operations" | "customer_service" | "technical" | "management"> = {
      'OPERATIONS': 'operations',
      'CUSTOMER_SERVICE': 'customer_service',
      'TECHNICAL': 'technical',
      'MANAGEMENT': 'management',
    };
    return deptMap[dept || ''] || 'operations';
  };

  // Staff data built from API response + extended profile data
  const staffData: StaffDetails = {
    id: userData?.id || staffId || "",
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    email: userData?.email || "",
    phone: userData?.phoneNumber || undefined,
    role: "event_manager",
    department: mapDepartment(staffProfileData?.department),
    status: userData?.status === "ACTIVE" ? "active" : userData?.status === "SUSPENDED" ? "inactive" : "pending",
    hireDate: staffProfileData?.hireDate || userData?.createdAt || new Date().toISOString(),
    lastActive: userData?.updatedAt || new Date().toISOString(),
    location: staffProfileData?.location || "N/A",
    eventsManaged: 0,
    totalHours: staffProfileData?.totalHours || 0,
    rating: staffProfileData?.rating || 0,
    avatar: undefined,
    employeeId: staffProfileData?.employeeId || `EMP-${userData?.id?.slice(0, 6) || "000000"}`,
    salary: staffProfileData?.salary || 0,
    hourlyRate: staffProfileData?.hourlyRate || 0,
    totalEarnings: 0,
    pendingDues: 0,
    permissions: (staffProfileData?.permissions as StaffDetails['permissions']) || {
      canManageEvents: false,
      canAccessAnalytics: false,
      canManageUsers: false,
      canProcessPayments: false,
      canViewReports: false,
      canModerateContent: false,
      canAccessAdminPanel: false
    },
    emergencyContact: emergencyContactData ? {
      name: emergencyContactData.name,
      phone: emergencyContactData.phone,
      relationship: emergencyContactData.relationship
    } : undefined
  };

  // Fetch user data and extended profiles on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!staffId) {
        setError("Staff ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

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
          // Staff profile may not exist yet
        }

        // Fetch emergency contact
        try {
          const contactResponse = await getEmergencyContact(staffId);
          if (contactResponse.success && contactResponse.data?.emergencyContact) {
            setEmergencyContactData(contactResponse.data.emergencyContact);
          }
        } catch {
          // Emergency contact may not exist yet
        }
      } catch (err) {
        console.error("Error fetching staff data:", err);
        setError("Failed to load staff details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [staffId]);

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: "event_manager" | "ticket_scanner" | "support_staff" | "admin" | "supervisor";
    department: "operations" | "customer_service" | "technical" | "management";
    location: string;
    employeeId: string;
    salary: number;
    hourlyRate: number;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    status: "active" | "inactive" | "pending";
    canManageEvents: boolean;
    canAccessAnalytics: boolean;
    canManageUsers: boolean;
    canProcessPayments: boolean;
    canViewReports: boolean;
    canModerateContent: boolean;
    canAccessAdminPanel: boolean;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "event_manager",
    department: "operations",
    location: "",
    employeeId: "",
    salary: 0,
    hourlyRate: 0,
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    status: "pending",
    canManageEvents: false,
    canAccessAnalytics: false,
    canManageUsers: false,
    canProcessPayments: false,
    canViewReports: false,
    canModerateContent: false,
    canAccessAdminPanel: false
  });

  // Update formData when userData loads
  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phoneNumber || "",
        status: userData.status === "ACTIVE" ? "active" : userData.status === "SUSPENDED" ? "inactive" : "pending",
      }));
    }
  }, [userData]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Map local department to API department
  const mapDepartmentToApi = (dept: string): StaffDepartment => {
    const deptMap: Record<string, StaffDepartment> = {
      'operations': 'OPERATIONS',
      'customer_service': 'CUSTOMER_SERVICE',
      'technical': 'TECHNICAL',
      'management': 'MANAGEMENT',
    };
    return deptMap[dept] || 'OPERATIONS';
  };

  const handleSave = async () => {
    if (!staffId) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Map form status back to API status
      const apiStatus = formData.status === "active" ? "ACTIVE" : formData.status === "inactive" ? "SUSPENDED" : "DEACTIVATED";

      // Update basic user data
      const response = await updateUser(staffId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phone || undefined,
        status: apiStatus as "ACTIVE" | "SUSPENDED" | "DEACTIVATED",
      });

      if (!response.success) {
        throw new Error("Failed to update basic info");
      }

      // Update local userData to reflect changes
      if (response.data?.user) {
        setUserData(response.data.user);
      }

      // Update staff profile (extended data)
      try {
        const staffProfileResponse = await updateStaffProfile(staffId, {
          employeeId: formData.employeeId || undefined,
          department: mapDepartmentToApi(formData.department),
          location: formData.location || undefined,
          salary: formData.salary || undefined,
          hourlyRate: formData.hourlyRate || undefined,
          permissions: {
            canManageEvents: formData.canManageEvents,
            canAccessAnalytics: formData.canAccessAnalytics,
            canManageUsers: formData.canManageUsers,
            canProcessPayments: formData.canProcessPayments,
            canViewReports: formData.canViewReports,
            canModerateContent: formData.canModerateContent,
            canAccessAdminPanel: formData.canAccessAdminPanel,
          },
        });

        if (staffProfileResponse.success && staffProfileResponse.data?.staffProfile) {
          setStaffProfileData(staffProfileResponse.data.staffProfile);
        }
      } catch (profileErr) {
        console.warn("Error updating staff profile:", profileErr);
        // Continue - basic update succeeded
      }

      // Update emergency contact if provided
      if (formData.emergencyContactName && formData.emergencyContactPhone) {
        try {
          const contactResponse = await updateEmergencyContact(staffId, {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship || 'Other',
          });

          if (contactResponse.success && contactResponse.data?.emergencyContact) {
            setEmergencyContactData(contactResponse.data.emergencyContact);
          }
        } catch (contactErr) {
          console.warn("Error updating emergency contact:", contactErr);
          // Continue - basic update succeeded
        }
      }

      setSuccess("Staff member updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating staff:", err);
      setError(err instanceof Error ? err.message : "Failed to update staff member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/admin/users/staff/${staffId}`);
  };

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

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading staff details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state (only if no userData at all)
  if (error && !userData) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Staff
          </Button>
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
        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff
            </Button>
            <div>
              <h1 className="text-base font-semibold text-foreground">Edit Staff Member</h1>
              <p className="text-gray-600">{staffData.firstName} {staffData.lastName} • {staffData.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || loading}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Current Status */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Current Status:</span>
                <Badge className={`text-xs ${getStatusBadge(staffData.status)}`}>
                  {staffData.status}
                </Badge>
                <Badge className={`text-xs ${getRoleBadge(staffData.role)}`}>
                  {staffData.role.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="contact">Emergency Contact</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Enter location"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => handleInputChange("employeeId", e.target.value)}
                      placeholder="Enter employee ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event_manager">Event Manager</SelectItem>
                        <SelectItem value="ticket_scanner">Ticket Scanner</SelectItem>
                        <SelectItem value="support_staff">Support Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => handleInputChange("department", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="customer_service">Customer Service</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salary">Annual Salary</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => handleInputChange("salary", e.target.value)}
                      placeholder="Enter annual salary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                      placeholder="Enter hourly rate"
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Employment Changes</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Changes to role, department, or status may affect the staff member's permissions and access levels.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Hire Date</Label>
                    <p className="text-sm text-gray-600 mt-1">{new Date(staffData.hireDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Last Active</Label>
                    <p className="text-sm text-gray-600 mt-1">{new Date(staffData.lastActive).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Events Managed</Label>
                    <p className="text-sm text-gray-600 mt-1">{staffData.eventsManaged}</p>
                  </div>
                  <div>
                    <Label>Total Hours</Label>
                    <p className="text-sm text-gray-600 mt-1">{staffData.totalHours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Staff Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries({
                    canManageEvents: "Manage Events",
                    canAccessAnalytics: "Access Analytics",
                    canManageUsers: "Manage Users",
                    canProcessPayments: "Process Payments",
                    canViewReports: "View Reports",
                    canModerateContent: "Moderate Content",
                    canAccessAdminPanel: "Access Admin Panel"
                  }).map(([permission, label]) => (
                    <div key={permission} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <Select
                        value={formData[permission as keyof typeof formData] ? "true" : "false"}
                        onValueChange={(value) => handleInputChange(permission, value === "true")}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Allowed</SelectItem>
                          <SelectItem value="false">Denied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Permission Changes</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Permission changes will take effect immediately. Ensure the staff member is notified of any access changes.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Select
                      value={formData.emergencyContactRelationship}
                      onValueChange={(value) => handleInputChange("emergencyContactRelationship", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="colleague">Colleague</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || loading}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StaffEditPage;
