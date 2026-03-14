import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Download,
  MoreVertical,
  Mail,
  Send,
  Clock,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { getUsers, suspendUser, deactivateUser, activateUser, type User, type UserStatus, type UserRole as AdminApiUserRole } from "@/lib/admin-api";
import { UserRole } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { getEventStatusBadgeClass } from "@/lib/utils/event-badge-helpers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  inviteAdminStaff,
  getAdminStaffInvitations,
  resendAdminStaffInvitation,
  revokeAdminStaffInvitation,
  type StaffInvitation,
} from "@/lib/admin-api";
import { ROLE_LABELS } from "@/constants/roleLabels";
import { Loader } from "@/components/ui/loader";

// Staff roles that exist in the enum but not in the admin-api UserRole type
type StaffRole = AdminApiUserRole | 'SUPPORT' | 'TELLER';
import { exportUserData } from "@/lib/utils/export";
import { extractErrorMessage, showErrorToast } from "@/lib/utils/error";

const StaffManagementContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("staff");

  // Staff list state
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Invitation state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("ADMIN");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Invitations tab state
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<string>("all");
  const [invitationsPage, setInvitationsPage] = useState(1);
  const [invitationsTotalPages, setInvitationsTotalPages] = useState(1);
  const [invitationsTotal, setInvitationsTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Permission hooks
  const { canModifyUser } = usePermissions();

  const canModifyStaff = (staffRole: AdminApiUserRole): boolean => {
    return canModifyUser(staffRole as UserRole);
  };

  // Fetch staff members
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
          const staffRoles: StaffRole[] = ['SUPERADMIN', 'ADMIN', 'SUPPORT', 'TELLER'] as StaffRole[];
          const staff = response.data.users.filter((user) => staffRoles.includes(user.role as StaffRole));
          setStaffMembers(staff);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages);
            setTotal(response.data.pagination.total);
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching staff:", err);
        const message = extractErrorMessage(err, "Failed to load staff members");
        setError(message);
        showErrorToast(toast, err, "Load failed", "Failed to load staff members");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [searchTerm, statusFilter, roleFilter, page, limit, toast]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    try {
      const response = await getAdminStaffInvitations({
        status: invitationStatusFilter !== "all" ? invitationStatusFilter : undefined,
        page: invitationsPage,
        limit: 20,
      });
      if (response.success && response.data) {
        setInvitations(response.data.invitations);
        setInvitationsTotalPages(response.data.pagination.totalPages);
        setInvitationsTotal(response.data.pagination.total);
      }
    } catch (err: unknown) {
      showErrorToast(toast, err, "Load failed", "Failed to load invitations");
    } finally {
      setInvitationsLoading(false);
    }
  }, [invitationStatusFilter, invitationsPage, toast]);

  // Fetch pending count for badge
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await getAdminStaffInvitations({ status: 'PENDING', limit: 1 });
      if (response.success && response.data) {
        setPendingCount(response.data.pagination.total);
      }
    } catch {
      // Silently fail — badge count is non-critical
    }
  }, []);

  // Load invitations when tab switches to invitations
  useEffect(() => {
    if (activeTab === "invitations") {
      fetchInvitations();
    }
  }, [activeTab, fetchInvitations]);

  // Load pending count on mount
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  useEffect(() => {
    setInvitationsPage(1);
  }, [invitationStatusFilter]);

  const getStatusBadge = (status: UserStatus) => {
    const statusMap: Record<UserStatus, string> = {
      ACTIVE: "ACTIVE",
      SUSPENDED: "SUSPENDED",
      DEACTIVATED: "DEACTIVATED",
      PENDING_APPROVAL: "PENDING_APPROVAL",
    };
    const mappedStatus = statusMap[status] || status;
    return getEventStatusBadgeClass(mappedStatus);
  };

  const getRoleBadge = (role: AdminApiUserRole | StaffRole) => {
    const variants: Record<string, string> = {
      'SUPERADMIN': "bg-destructive/10 text-destructive",
      'ADMIN': "bg-primary/10 text-primary",
      'SUPPORT': "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      'TELLER': "bg-success/10 text-success",
      'ORGANIZER': "bg-warning/10 text-warning",
      'ATTENDEE': "bg-muted text-muted-foreground",
    };
    return variants[role] || "bg-muted text-muted-foreground";
  };

  const getInvitationStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case 'ACCEPTED':
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case 'REVOKED':
        return "bg-destructive/10 text-destructive";
      case 'EXPIRED':
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleViewStaff = (id: string) => {
    navigate(`/admin/users/staff/${id}`);
  };

  const handleEditStaff = (id: string) => {
    navigate(`/admin/users/staff/${id}/edit`);
  };

  const refreshStaffList = async () => {
    try {
      const updatedResponse = await getUsers({ page, limit });
      if (updatedResponse.success && updatedResponse.data) {
        const staffRoles: StaffRole[] = ['SUPERADMIN', 'ADMIN', 'SUPPORT', 'TELLER'] as StaffRole[];
        const staff = updatedResponse.data.users.filter((user) => staffRoles.includes(user.role));
        setStaffMembers(staff);
        if (updatedResponse.data.pagination) {
          setTotalPages(updatedResponse.data.pagination.totalPages);
          setTotal(updatedResponse.data.pagination.total);
        }
      }
    } catch {
      // Handled by caller
    }
  };

  const handleSuspendStaff = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await suspendUser(id);
      if (response.success) {
        toast({ title: "Success", description: "Staff member suspended successfully" });
        await refreshStaffList();
      }
    } catch (err: unknown) {
      showErrorToast(toast, err, "Suspend failed", "Failed to suspend staff member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateStaff = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await deactivateUser(id);
      if (response.success) {
        toast({ title: "Success", description: "Staff member deactivated successfully" });
        await refreshStaffList();
      }
    } catch (err: unknown) {
      showErrorToast(toast, err, "Deactivate failed", "Failed to deactivate staff member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateStaff = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await activateUser(id);
      if (response.success) {
        toast({ title: "Success", description: "Staff member activated successfully" });
        await refreshStaffList();
      }
    } catch (err: unknown) {
      showErrorToast(toast, err, "Activate failed", "Failed to activate staff member");
    } finally {
      setActionLoading(null);
    }
  };

  // Invitation handlers
  const handleInviteStaff = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const response = await inviteAdminStaff({
        email: inviteEmail.trim(),
        role: inviteRole,
        message: inviteMessage.trim() || undefined,
      });
      if (response.success) {
        toast({ title: "Invitation Sent", description: `Invitation sent to ${inviteEmail}` });
        setShowInviteDialog(false);
        setInviteEmail("");
        setInviteRole("ADMIN");
        setInviteMessage("");
        // Refresh invitations if on that tab, and update pending count
        if (activeTab === "invitations") fetchInvitations();
        fetchPendingCount();
      }
    } catch (err: unknown) {
      showErrorToast(toast, err, "Invite failed", "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      setActionLoading(id);
      await resendAdminStaffInvitation(id);
      toast({ title: "Resent", description: "Invitation resent successfully" });
      fetchInvitations();
      fetchPendingCount();
    } catch (err: unknown) {
      showErrorToast(toast, err, "Resend failed", "Failed to resend invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      setActionLoading(id);
      await revokeAdminStaffInvitation(id);
      toast({ title: "Revoked", description: "Invitation revoked" });
      fetchInvitations();
      fetchPendingCount();
    } catch (err: unknown) {
      showErrorToast(toast, err, "Revoke failed", "Failed to revoke invitation");
    } finally {
      setActionLoading(null);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Staff Management</h2>
          <p className="text-muted-foreground">Manage platform staff and invitations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Staff
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
            <div className="text-base font-semibold text-amber-600 dark:text-amber-400 mb-2">
              {pendingCount}
            </div>
            <p className="text-sm text-muted-foreground">Pending Invitations</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Staff Members | Invitations */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="staff">Staff Members</TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            Invitations
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] font-semibold">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Staff Members Tab */}
        <TabsContent value="staff" className="space-y-4 mt-4">
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
                    <SelectItem value="ADMIN">Admin</SelectItem>
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
              <div className="flex items-center justify-between">
                <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Showing {staffMembers.length} of {total || staffMembers.length}
                  </span>
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
              </div>
            </CardHeader>
            <CardContent>
              {filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No staff members found</div>
              ) : (
                <div className="space-y-3">
                  {filteredStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar
                          src={undefined}
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
                              {ROLE_LABELS[staff.role as keyof typeof ROLE_LABELS] || staff.role.replace("_", " ")}
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
                            onClick={() => handleViewStaff(staff.id)}
                            className="hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          {canModifyStaff(staff.role) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditStaff(staff.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Staff
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {staff.status === "ACTIVE" && (
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
                                    toast({ title: "Exported", description: "Staff data exported successfully" });
                                  } catch (err) {
                                    showErrorToast(toast, err, "Export failed", "Failed to export staff data");
                                  }
                                }}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export Data
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4 mt-4">
          {/* Invitation Filters */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Select
                  value={invitationStatusFilter}
                  onValueChange={setInvitationStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REVOKED">Revoked</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground ml-auto">
                  {invitationsTotal} invitation{invitationsTotal !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Invitations List */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size="md" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No invitations found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send First Invitation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`text-xs ${getRoleBadge(inv.role as StaffRole)}`}>
                              {ROLE_LABELS[inv.role as keyof typeof ROLE_LABELS] || inv.role}
                            </Badge>
                            <Badge className={`text-xs ${getInvitationStatusBadge(inv.status)}`}>
                              {inv.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Invited by {inv.invitedBy.firstName} {inv.invitedBy.lastName} on {formatDate(inv.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right text-xs text-muted-foreground hidden sm:block">
                          {inv.status === 'PENDING' && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Expires {formatDateTime(inv.expiresAt)}</span>
                            </div>
                          )}
                          {inv.status === 'ACCEPTED' && inv.acceptedAt && (
                            <span>Accepted {formatDate(inv.acceptedAt)}</span>
                          )}
                        </div>
                        {inv.status === 'PENDING' && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(inv.id)}
                              disabled={actionLoading === inv.id}
                              title="Resend invitation"
                            >
                              <RefreshCw className={`h-4 w-4 ${actionLoading === inv.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvitation(inv.id)}
                              disabled={actionLoading === inv.id}
                              title="Revoke invitation"
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {invitationsTotalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={invitationsPage}
                totalPages={invitationsTotalPages}
                onPageChange={(newPage) => {
                  setInvitationsPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Staff Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogDescription>
              Send an invitation email. The invitee will create their own password when they accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="staff@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="SUPPORT">Support Team</SelectItem>
                  <SelectItem value="TELLER">Teller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-message">
                Personal Message <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="invite-message"
                placeholder="Welcome to the team! Looking forward to working with you."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {inviteMessage.length}/500
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteStaff} disabled={inviteLoading || !inviteEmail.trim()}>
              {inviteLoading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagementContent;
