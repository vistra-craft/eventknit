import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  CreditCard,
  UserCheck,
  Briefcase,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "./AdminLayout";

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

  // Mock staff data - in real app, this would be fetched from API
  const [staffData, setStaffData] = useState<StaffDetails>({
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
    emergencyContact: {
      name: "John Johnson",
      phone: "+1 (555) 987-6543",
      relationship: "Spouse"
    }
  });

  const [formData, setFormData] = useState({
    firstName: staffData.firstName,
    lastName: staffData.lastName,
    email: staffData.email,
    phone: staffData.phone || "",
    role: staffData.role,
    department: staffData.department,
    location: staffData.location,
    employeeId: staffData.employeeId,
    salary: staffData.salary,
    hourlyRate: staffData.hourlyRate,
    emergencyContactName: staffData.emergencyContact?.name || "",
    emergencyContactPhone: staffData.emergencyContact?.phone || "",
    emergencyContactRelationship: staffData.emergencyContact?.relationship || "",
    status: staffData.status,
    canManageEvents: staffData.permissions.canManageEvents,
    canAccessAnalytics: staffData.permissions.canAccessAnalytics,
    canManageUsers: staffData.permissions.canManageUsers,
    canProcessPayments: staffData.permissions.canProcessPayments,
    canViewReports: staffData.permissions.canViewReports,
    canModerateContent: staffData.permissions.canModerateContent,
    canAccessAdminPanel: staffData.permissions.canAccessAdminPanel
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the staff data
      setStaffData(prev => ({
        ...prev,
        ...formData,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        },
        permissions: {
          canManageEvents: formData.canManageEvents,
          canAccessAnalytics: formData.canAccessAnalytics,
          canManageUsers: formData.canManageUsers,
          canProcessPayments: formData.canProcessPayments,
          canViewReports: formData.canViewReports,
          canModerateContent: formData.canModerateContent,
          canAccessAdminPanel: formData.canAccessAdminPanel
        }
      }));

      console.log("Staff updated:", formData);
      // TODO: Show success message
    } catch (error) {
      console.error("Error updating staff:", error);
      // TODO: Show error message
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Staff Member</h1>
              <p className="text-gray-600">{staffData.firstName} {staffData.lastName} • {staffData.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
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
                        <span className="text-sm font-medium text-gray-900">{label}</span>
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
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StaffEditPage;
