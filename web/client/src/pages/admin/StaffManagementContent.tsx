import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Shield,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/useToast";
import { getUsers, suspendUser, deactivateUser, activateUser, type User, type UserStatus, type UserRole as AdminApiUserRole } from "@/lib/admin-api";
import { UserRole } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { getEventStatusBadgeClass } from "@/lib/utils/event-badge-helpers";

// Staff roles that exist in the enum but not in the admin-api UserRole type
type StaffRole = AdminApiUserRole | 'MARKETER' | 'SUPPORT' | 'TELLER';
import { exportUserData } from "@/lib/utils/export";

const StaffManagementContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewStaff, setPreviewStaff] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Permission hooks
  const { canModifyUser } = usePermissions();

  // Helper function to check if user can modify a staff member
  const canModifyStaff = (staffRole: AdminApiUserRole): boolean => {
    return canModifyUser(staffRole as UserRole);
  };


  // Fetch staff members (ADMIN_STAFF, SUPERADMIN, etc.)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers({
          role: roleFilter !== "all" ? (roleFilter as AdminApiUserRole) : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined,
          page,
          limit,
        });

        if (response.success && response.data) {
          // Filter to only show staff roles
          const staffRoles: StaffRole[] = ['SUPERADMIN', 'ADMIN_STAFF', 'MARKETER', 'SUPPORT', 'TELLER'] as StaffRole[];
          const staff = response.data.users.filter((user) => staffRoles.includes(user.role as StaffRole));
          setStaffMembers(staff);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages);
            // Note: total is for all users, not just staff. We'll use staff.length for display
            setTotal(response.data.pagination.total);
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching staff:", err);
        const message = err instanceof Error ? err.message : "Failed to load staff members";
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [searchTerm, statusFilter, roleFilter, page, limit, toast]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  const getStatusBadge = (status: UserStatus) => {
    const statusMap: Record<UserStatus, string> = {
      ACTIVE: "ACTIVE",
      SUSPENDED: "SUSPENDED",
      DEACTIVATED: "DEACTIVATED",
    };
    const mappedStatus = statusMap[status] || status;
    return getEventStatusBadgeClass(mappedStatus);
  };

  const getRoleBadge = (role: AdminApiUserRole | StaffRole) => {
    const variants: Record<string, string> = {
      'SUPERADMIN': "bg-destructive/10 text-destructive",
      'ADMIN_STAFF': "bg-primary/10 text-primary",
      'MARKETER': "bg-pink-100 text-pink-800",
      'SUPPORT': "bg-purple-100 text-purple-800",
      'TELLER': "bg-success/10 text-success",
      'ORGANIZER': "bg-warning/10 text-warning",
      'ATTENDEE': "bg-muted text-gray-800",
    };
    return variants[role] || "bg-muted text-gray-800";
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
        const updatedResponse = await getUsers({ page, limit });
        if (updatedResponse.success && updatedResponse.data) {
          const staffRoles: StaffRole[] = ['SUPERADMIN', 'ADMIN_STAFF', 'MARKETER', 'SUPPORT', 'TELLER'] as StaffRole[];
          const staff = updatedResponse.data.users.filter((user) => staffRoles.includes(user.role));
          setStaffMembers(staff);
          if (updatedResponse.data.pagination) {
            setTotalPages(updatedResponse.data.pagination.totalPages);
            setTotal(updatedResponse.data.pagination.total);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to suspend staff member";
      toast({
        title: "Error",
        description: message,
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
        const updatedResponse = await getUsers({ page, limit });
        if (updatedResponse.success && updatedResponse.data) {
          const staffRoles: StaffRole[] = ['SUPERADMIN', 'ADMIN_STAFF', 'MARKETER', 'SUPPORT', 'TELLER'] as StaffRole[];
          const staff = updatedResponse.data.users.filter((user) => staffRoles.includes(user.role));
          setStaffMembers(staff);
          if (updatedResponse.data.pagination) {
            setTotalPages(updatedResponse.data.pagination.totalPages);
            setTotal(updatedResponse.data.pagination.total);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to deactivate staff member";
      toast({
        title: "Error",
        description: message,
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
        const updatedResponse = await getUsers({ page, limit });
        if (updatedResponse.success && updatedResponse.data) {
          const staffRoles: StaffRole[] = ['SUPERADMIN', 'ADMIN_STAFF', 'MARKETER', 'SUPPORT', 'TELLER'] as StaffRole[];
          const staff = updatedResponse.data.users.filter((user) => staffRoles.includes(user.role));
          setStaffMembers(staff);
          if (updatedResponse.data.pagination) {
            setTotalPages(updatedResponse.data.pagination.totalPages);
            setTotal(updatedResponse.data.pagination.total);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to activate staff member";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Search is handled by backend, no need for frontend filtering
  const filteredStaff = staffMembers;

  if (loading && staffMembers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading staff members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Staff Management</h2>
          <p className="text-muted-foreground">Manage company employees and event staff</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {staffMembers.length} of {total || staffMembers.length} staff
          </div>
          <Select value={limit.toString()} onValueChange={(value) => {
            setLimit(parseInt(value, 10));
            setPage(1);
          }}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hover:bg-gray-900 hover:text-white transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="hover:bg-gray-900 hover:text-white transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-base font-semibold text-primary mb-2">{total || staffMembers.length}</div>
            <p className="text-sm text-muted-foreground">Total Staff</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-base font-semibold text-primary mb-2">
              {staffMembers.filter((s) => s.status === "ACTIVE").length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-base font-semibold text-destructive mb-2">
              {staffMembers.filter((s) => s.status === "SUSPENDED").length}
            </div>
            <p className="text-sm text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-base font-semibold text-muted-foreground mb-2">
              {staffMembers.filter((s) => s.status === "DEACTIVATED").length}
            </div>
            <p className="text-sm text-muted-foreground">Deactivated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
            <div className="text-center py-8 text-muted-foreground">No staff members found</div>
          ) : (
            <div className="space-y-3">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar
                      src={undefined} // Profile image URL if available in future
                      name={`${staff.firstName} ${staff.lastName}`}
                      alt={`${staff.firstName} ${staff.lastName}`}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">
                        {staff.firstName} {staff.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{staff.email}</p>
                      {staff.phoneNumber && (
                        <p className="text-sm text-muted-foreground">{staff.phoneNumber}</p>
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
                      <div className="text-sm text-muted-foreground">
                        Joined: {formatDate(staff.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewStaff(staff)}
                        className="hover:bg-gray-900 hover:text-white transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      {canModifyStaff(staff.role) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStaff(staff.id)}
                          className="hover:bg-gray-900 hover:text-white transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title={`You do not have permission to modify ${staff.role} users`}
                          className="hover:bg-gray-900 hover:text-white transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {staff.status === "ACTIVE" && (
                        canModifyStaff(staff.role) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspendStaff(staff.id)}
                            className="text-destructive border-destructive hover:bg-destructive/5"
                            title="Suspend Staff"
                            disabled={actionLoading === staff.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title={`You do not have permission to suspend ${staff.role} users`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )
                      )}
                      {(staff.status === "SUSPENDED" || staff.status === "DEACTIVATED") && (
                        canModifyStaff(staff.role) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateStaff(staff.id)}
                            className="text-success border-success hover:bg-success/5"
                            title="Activate Staff"
                            disabled={actionLoading === staff.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title={`You do not have permission to activate ${staff.role} users`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        )
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewStaff(staff.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {canModifyStaff(staff.role) && (
                            <DropdownMenuItem onClick={() => handleEditStaff(staff.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Staff
                            </DropdownMenuItem>
                          )}
                          {canModifyStaff(staff.role) && <DropdownMenuSeparator />}
                          {staff.status === "ACTIVE" && canModifyStaff(staff.role) && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleSuspendStaff(staff.id)}
                                disabled={actionLoading === staff.id}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeactivateStaff(staff.id)}
                                disabled={actionLoading === staff.id}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            </>
                          )}
                          {(staff.status === "SUSPENDED" || staff.status === "DEACTIVATED") && canModifyStaff(staff.role) && (
                            <DropdownMenuItem 
                              onClick={() => handleActivateStaff(staff.id)}
                              disabled={actionLoading === staff.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            try {
                              exportUserData({
                                id: staff.id,
                                firstName: staff.firstName,
                                lastName: staff.lastName,
                                email: staff.email,
                                role: staff.role,
                                status: staff.status,
                                createdAt: staff.createdAt,
                              });
                              toast({
                                title: "Exported",
                                description: "Staff data exported successfully",
                              });
                            } catch {
                              toast({
                                title: "Error",
                                description: "Failed to export staff data",
                                variant: "destructive",
                              });
                            }
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Staff Preview Dialog */}
      <Dialog 
        open={!!previewStaff} 
        onOpenChange={(open) => {
          if (!open) {
            setPreviewStaff(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff Preview</DialogTitle>
            <DialogDescription>
              View staff member details
            </DialogDescription>
          </DialogHeader>
          {previewStaff && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar
                  src={undefined} // Profile image URL if available in future
                  name={`${previewStaff.firstName} ${previewStaff.lastName}`}
                  alt={`${previewStaff.firstName} ${previewStaff.lastName}`}
                  size="xl"
                />
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-foreground mb-2">
                    {previewStaff.firstName} {previewStaff.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getRoleBadge(previewStaff.role)}`}>
                      {previewStaff.role.replace("_", " ")}
                    </Badge>
                    <Badge className={`${getStatusBadge(previewStaff.status)}`}>
                      {previewStaff.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{previewStaff.email}</p>
                  </div>
                </div>
                {previewStaff.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{previewStaff.phoneNumber}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{previewStaff.role.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(previewStaff.createdAt)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewStaff(null)}>
                  Close
                </Button>
                {previewStaff && canModifyStaff(previewStaff.role) && (
                  <Button onClick={() => {
                    setPreviewStaff(null);
                    handleEditStaff(previewStaff.id);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Staff
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagementContent;

