import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Edit,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Download,
  Upload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "./AdminLayout";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleId: string; // Reference to role ID instead of hardcoded role
  roleName: string; // Display name for the role
  department: "operations" | "customer_service" | "technical" | "management";
  status: "active" | "inactive" | "pending";
  hireDate: string;
  lastActive: string;
  location: string;
  eventsManaged: number;
  totalHours: number;
  rating: number;
  avatar?: string;
}

const StaffManagementPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Mock role data (in a real app, this would come from the role management system)
  const availableRoles = [
    { id: "super_admin", name: "Super Administrator", color: "bg-red-100 text-red-800" },
    { id: "event_manager", name: "Event Manager", color: "bg-blue-100 text-blue-800" },
    { id: "content_moderator", name: "Content Moderator", color: "bg-yellow-100 text-yellow-800" },
    { id: "finance_manager", name: "Finance Manager", color: "bg-green-100 text-green-800" },
    { id: "support_staff", name: "Support Staff", color: "bg-purple-100 text-purple-800" },
    { id: "marketing_specialist", name: "Marketing Specialist", color: "bg-pink-100 text-pink-800" }
  ];

  // Mock staff data
  const staffMembers: StaffMember[] = [
    {
      id: "1",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@eventknit.com",
      phone: "+1 (555) 123-4567",
      roleId: "event_manager",
      roleName: "Event Manager",
      department: "operations",
      status: "active",
      hireDate: "2023-01-15",
      lastActive: "2024-02-15T10:30:00Z",
      location: "San Francisco, CA",
      eventsManaged: 45,
      totalHours: 320,
      rating: 4.8,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "2",
      firstName: "Michael",
      lastName: "Chen",
      email: "michael.chen@eventknit.com",
      phone: "+1 (555) 234-5678",
      roleId: "support_staff",
      roleName: "Support Staff",
      department: "operations",
      status: "active",
      hireDate: "2023-03-20",
      lastActive: "2024-02-15T09:15:00Z",
      location: "Los Angeles, CA",
      eventsManaged: 28,
      totalHours: 180,
      rating: 4.6,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "3",
      firstName: "Emma",
      lastName: "Wilson",
      email: "emma.wilson@eventknit.com",
      phone: "+1 (555) 345-6789",
      roleId: "support_staff",
      roleName: "Support Staff",
      department: "customer_service",
      status: "active",
      hireDate: "2023-06-10",
      lastActive: "2024-02-15T11:45:00Z",
      location: "New York, NY",
      eventsManaged: 32,
      totalHours: 240,
      rating: 4.9,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "4",
      firstName: "David",
      lastName: "Brown",
      email: "david.brown@eventknit.com",
      phone: "+1 (555) 456-7890",
      roleId: "finance_manager",
      roleName: "Finance Manager",
      department: "management",
      status: "active",
      hireDate: "2022-11-05",
      lastActive: "2024-02-15T08:20:00Z",
      location: "Chicago, IL",
      eventsManaged: 67,
      totalHours: 480,
      rating: 4.7,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: "5",
      firstName: "Lisa",
      lastName: "Anderson",
      email: "lisa.anderson@eventknit.com",
      phone: "+1 (555) 567-8901",
      roleId: "super_admin",
      roleName: "Super Administrator",
      department: "technical",
      status: "inactive",
      hireDate: "2023-09-12",
      lastActive: "2024-01-20T14:30:00Z",
      location: "Seattle, WA",
      eventsManaged: 15,
      totalHours: 120,
      rating: 4.5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = 
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || staff.roleId === roleFilter;
    const matchesStatus = statusFilter === "all" || staff.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || staff.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const getRoleBadge = (roleId: string) => {
    const role = availableRoles.find(r => r.id === roleId);
    return role ? role.color : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getDepartmentBadge = (department: string) => {
    const variants = {
      operations: "bg-blue-100 text-blue-800 border-blue-200",
      customer_service: "bg-green-100 text-green-800 border-green-200",
      technical: "bg-purple-100 text-purple-800 border-purple-200",
      management: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return variants[department as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleViewStaff = (id: string) => {
    navigate(`/admin/users/staff/${id}`);
  };

  const handleEditStaff = (id: string) => {
    navigate(`/admin/users/staff/${id}/edit`);
  };

  const handleSuspendStaff = (id: string) => {
    console.log("Suspend staff member:", id);
    // TODO: Suspend staff member
  };

  const handleUnsuspendStaff = (id: string) => {
    console.log("Unsuspend staff member:", id);
    // TODO: Unsuspend staff member
  };

  const handleAddStaff = () => {
    console.log("Add new staff member");
    // TODO: Navigate to add staff page
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">Manage company employees and event staff</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/admin/users/roles')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Manage Roles
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={handleAddStaff}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">{staffMembers.length}</div>
              <p className="text-sm text-gray-600">Total Staff</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {staffMembers.filter(s => s.status === 'active').length}
              </div>
              <p className="text-sm text-gray-600">Active</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {staffMembers.filter(s => s.status === 'pending').length}
              </div>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {staffMembers.reduce((sum, s) => sum + s.eventsManaged, 0)}
              </div>
              <p className="text-sm text-gray-600">Events Managed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search staff members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="customer_service">Customer Service</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStaff.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {staff.avatar ? (
                        <img
                          src={staff.avatar}
                          alt={`${staff.firstName} ${staff.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {staff.firstName} {staff.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">{staff.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getRoleBadge(staff.roleId)}`}>
                          {staff.roleName}
                        </Badge>
                        <Badge className={`text-xs ${getStatusBadge(staff.status)}`}>
                          {staff.status}
                        </Badge>
                        <Badge className={`text-xs ${getDepartmentBadge(staff.department)}`}>
                          {staff.department.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {staff.eventsManaged} events
                      </div>
                      <div className="text-sm text-gray-600">
                        {staff.totalHours}h total
                      </div>
                      <div className="text-sm text-gray-600">
                        ⭐ {staff.rating}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewStaff(staff.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditStaff(staff.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {staff.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSuspendStaff(staff.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          title="Suspend Staff"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {staff.status === 'inactive' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnsuspendStaff(staff.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          title="Activate Staff"
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

export default StaffManagementPage;


