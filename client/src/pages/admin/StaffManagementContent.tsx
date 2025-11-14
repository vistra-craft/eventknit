import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Edit,
  User,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getUsers, suspendUser, deactivateUser, activateUser, type User, type UserStatus, type UserRole } from "@/lib/admin-api";

const StaffManagementContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch staff members (ADMIN_STAFF, SUPERADMIN, etc.)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers({
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined,
        });

        if (response.success && response.data) {
          // Filter to only show staff roles
          const staffRoles: UserRole[] = ["SUPERADMIN", "ADMIN_STAFF", "MARKETER", "SUPPORT", "TELLER"];
          const staff = response.data.users.filter((user) => staffRoles.includes(user.role));
          setStaffMembers(staff);
        }
      } catch (err: any) {
        console.error("Error fetching staff:", err);
        setError(err.message || "Failed to load staff members");
        toast({
          title: "Error",
          description: err.message || "Failed to load staff members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [searchTerm, statusFilter, roleFilter, toast]);

  const getStatusBadge = (status: UserStatus) => {
    const variants = {
      ACTIVE: "bg-green-100 text-green-800 border-green-200",
      SUSPENDED: "bg-red-100 text-red-800 border-red-200",
      DEACTIVATED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, string> = {
      SUPERADMIN: "bg-red-100 text-red-800",
      ADMIN_STAFF: "bg-blue-100 text-blue-800",
      MARKETER: "bg-pink-100 text-pink-800",
      SUPPORT: "bg-purple-100 text-purple-800",
      TELLER: "bg-green-100 text-green-800",
      ORGANIZER: "bg-yellow-100 text-yellow-800",
      ATTENDEE: "bg-gray-100 text-gray-800",
    };
    return variants[role] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewStaff = (id: string) => {
    navigate(`/admin/users/staff/${id}`);
  };

  const handleEditStaff = (id: string) => {
    navigate(`/admin/users/staff/${id}/edit`);
  };

  const handleSuspendStaff = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await suspendUser(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member suspended successfully",
        });
        // Refresh list
        const updatedResponse = await getUsers({});
        if (updatedResponse.success && updatedResponse.data) {
          const staffRoles: UserRole[] = ["SUPERADMIN", "ADMIN_STAFF", "MARKETER", "SUPPORT", "TELLER"];
          const staff = updatedResponse.data.users.filter((user) => staffRoles.includes(user.role));
          setStaffMembers(staff);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to suspend staff member",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateStaff = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await deactivateUser(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member deactivated successfully",
        });
        // Refresh list
        const updatedResponse = await getUsers({});
        if (updatedResponse.success && updatedResponse.data) {
          const staffRoles: UserRole[] = ["SUPERADMIN", "ADMIN_STAFF", "MARKETER", "SUPPORT", "TELLER"];
          const staff = updatedResponse.data.users.filter((user) => staffRoles.includes(user.role));
          setStaffMembers(staff);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to deactivate staff member",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateStaff = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await activateUser(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member activated successfully",
        });
        // Refresh list
        const updatedResponse = await getUsers({});
        if (updatedResponse.success && updatedResponse.data) {
          const staffRoles: UserRole[] = ["SUPERADMIN", "ADMIN_STAFF", "MARKETER", "SUPPORT", "TELLER"];
          const staff = updatedResponse.data.users.filter((user) => staffRoles.includes(user.role));
          setStaffMembers(staff);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to activate staff member",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch =
      !searchTerm ||
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading && staffMembers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading staff members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage company employees and event staff</p>
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
              {staffMembers.filter((s) => s.status === "ACTIVE").length}
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {staffMembers.filter((s) => s.status === "SUSPENDED").length}
            </div>
            <p className="text-sm text-gray-600">Suspended</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600 mb-2">
              {staffMembers.filter((s) => s.status === "DEACTIVATED").length}
            </div>
            <p className="text-sm text-gray-600">Deactivated</p>
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
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as UserRole | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN_STAFF">Admin Staff</SelectItem>
                <SelectItem value="MARKETER">Marketer</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
                <SelectItem value="TELLER">Teller</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as UserStatus | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
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
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No staff members found</div>
          ) : (
            <div className="space-y-3">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {staff.firstName} {staff.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">{staff.email}</p>
                      {staff.phoneNumber && (
                        <p className="text-sm text-gray-600">{staff.phoneNumber}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getRoleBadge(staff.role)}`}>
                          {staff.role.replace("_", " ")}
                        </Badge>
                        <Badge className={`text-xs ${getStatusBadge(staff.status)}`}>
                          {staff.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Joined: {formatDate(staff.createdAt)}
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
                      {staff.status === "ACTIVE" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspendStaff(staff.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            title="Suspend Staff"
                            disabled={actionLoading === staff.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateStaff(staff.id)}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            title="Deactivate Staff"
                            disabled={actionLoading === staff.id}
                          >
                            Deactivate
                          </Button>
                        </>
                      )}
                      {(staff.status === "SUSPENDED" || staff.status === "DEACTIVATED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateStaff(staff.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          title="Activate Staff"
                          disabled={actionLoading === staff.id}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagementContent;

