import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/useToast";
import { getUsers, suspendUser, deactivateUser, activateUser, type User, type UserStatus } from "@/lib/admin-api";
import { exportUserData } from "@/lib/utils/export";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types/auth";
import { getEventStatusBadgeClass } from "@/lib/utils/event-badge-helpers";

const OrganizersContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Permission checks
  const { canModifyUser, canCreateRole } = usePermissions();
  const canModifyOrganizer = canModifyUser(UserRole.ORGANIZER);
  const canCreateOrganizer = canCreateRole(UserRole.ORGANIZER);

  // Fetch organizers
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers({
          role: "ORGANIZER",
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined,
          page,
          limit,
        });

        if (response.success && response.data) {
          setOrganizers(response.data.users);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages);
            setTotal(response.data.pagination.total);
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching organizers:", err);
        const message = err instanceof Error ? err.message : "Failed to load organizers";
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

    fetchOrganizers();
  }, [searchTerm, statusFilter, page, limit, toast]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: UserStatus) => {
    const statusMap: Record<UserStatus, string> = {
      ACTIVE: "ACTIVE",
      SUSPENDED: "SUSPENDED",
      DEACTIVATED: "DEACTIVATED",
    };
    const mappedStatus = statusMap[status] || status;
    return getEventStatusBadgeClass(mappedStatus);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewOrganizer = (id: string) => {
    navigate(`/admin/users/organizers/${id}/preview`);
  };

  const handleEditOrganizer = (id: string) => {
    navigate(`/admin/users/organizers/${id}/edit`);
  };

  const handleSuspendOrganizer = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await suspendUser(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Organizer suspended successfully",
        });
        // Refresh list
        const updatedResponse = await getUsers({ role: "ORGANIZER", page, limit });
        if (updatedResponse.success && updatedResponse.data) {
          setOrganizers(updatedResponse.data.users);
          if (updatedResponse.data.pagination) {
            setTotalPages(updatedResponse.data.pagination.totalPages);
            setTotal(updatedResponse.data.pagination.total);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to suspend organizer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateOrganizer = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await deactivateUser(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Organizer deactivated successfully",
        });
        // Refresh list
        const updatedResponse = await getUsers({ role: "ORGANIZER", page, limit });
        if (updatedResponse.success && updatedResponse.data) {
          setOrganizers(updatedResponse.data.users);
          if (updatedResponse.data.pagination) {
            setTotalPages(updatedResponse.data.pagination.totalPages);
            setTotal(updatedResponse.data.pagination.total);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to deactivate organizer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateOrganizer = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await activateUser(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Organizer activated successfully",
        });
        // Refresh list
        const updatedResponse = await getUsers({ role: "ORGANIZER", page, limit });
        if (updatedResponse.success && updatedResponse.data) {
          setOrganizers(updatedResponse.data.users);
          if (updatedResponse.data.pagination) {
            setTotalPages(updatedResponse.data.pagination.totalPages);
            setTotal(updatedResponse.data.pagination.total);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to activate organizer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };


  const filteredOrganizers = organizers.filter((organizer) => {
    const matchesSearch =
      !searchTerm ||
      organizer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (organizer.organizationName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading && organizers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading organizers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Organizers</h2>
          <p className="text-muted-foreground">Manage external event organizers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {organizers.length} of {total} organizers
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
          <Button variant="outline" size="sm" className="hover:bg-primary  transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="hover:bg-primary  transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canCreateOrganizer ? (
            <Button size="sm" onClick={() => navigate("/admin/users/organizers/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Organizer
            </Button>
          ) : (
            <Button 
              size="sm" 
              disabled
              title="You do not have permission to create organizer accounts"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Organizer
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-base font-semibold text-primary mb-2">{total || organizers.length}</div>
            <p className="text-sm text-muted-foreground">Total Organizers</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-base font-semibold text-primary mb-2">
              {organizers.filter((o) => o.status === "ACTIVE").length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-destructive mb-2">
              {organizers.filter((o) => o.status === "SUSPENDED").length}
            </div>
            <p className="text-sm text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-base font-semibold text-muted-foreground mb-2">
              {organizers.filter((o) => o.status === "DEACTIVATED").length}
            </div>
            <p className="text-sm text-muted-foreground">Deactivated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search organizers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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

      {/* Organizers List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Organizers ({filteredOrganizers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrganizers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No organizers found</div>
          ) : (
            <div className="space-y-3">
              {filteredOrganizers.map((organizer) => (
                <div
                  key={organizer.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar
                      src={undefined} // Profile image URL if available in future
                      name={`${organizer.firstName} ${organizer.lastName}`}
                      alt={`${organizer.firstName} ${organizer.lastName}`}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">
                        {organizer.firstName} {organizer.lastName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {organizer.organizationName || "No organization"}
                      </p>
                      <p className="text-sm text-muted-foreground">{organizer.email}</p>
                      {organizer.businessEmail && (
                        <p className="text-sm text-muted-foreground">Business: {organizer.businessEmail}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getStatusBadge(organizer.status)}`}>
                          {organizer.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Joined: {formatDate(organizer.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/users/organizers/${organizer.id}/preview`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      {canModifyOrganizer ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOrganizer(organizer.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="You do not have permission to modify organizer accounts"
                          className="hover:bg-primary  transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {organizer.status === "ACTIVE" && (
                        canModifyOrganizer ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspendOrganizer(organizer.id)}
                            className="text-destructive border-destructive/20 hover:bg-destructive/5"
                            title="Suspend Organizer"
                            disabled={actionLoading === organizer.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title="You do not have permission to suspend organizer accounts"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )
                      )}
                      {(organizer.status === "SUSPENDED" || organizer.status === "DEACTIVATED") && (
                        canModifyOrganizer ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateOrganizer(organizer.id)}
                            className="text-success border-success/20 hover:bg-success/5"
                            title="Activate Organizer"
                            disabled={actionLoading === organizer.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title="You do not have permission to activate organizer accounts"
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
                          <DropdownMenuItem onClick={() => handleViewOrganizer(organizer.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {canModifyOrganizer && (
                            <DropdownMenuItem onClick={() => handleEditOrganizer(organizer.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Organizer
                            </DropdownMenuItem>
                          )}
                          {canModifyOrganizer && <DropdownMenuSeparator />}
                          {organizer.status === "ACTIVE" && canModifyOrganizer && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleSuspendOrganizer(organizer.id)}
                                disabled={actionLoading === organizer.id}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeactivateOrganizer(organizer.id)}
                                disabled={actionLoading === organizer.id}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            </>
                          )}
                          {(organizer.status === "SUSPENDED" || organizer.status === "DEACTIVATED") && canModifyOrganizer && (
                            <DropdownMenuItem 
                              onClick={() => handleActivateOrganizer(organizer.id)}
                              disabled={actionLoading === organizer.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            try {
                              exportUserData({
                                id: organizer.id,
                                firstName: organizer.firstName,
                                lastName: organizer.lastName,
                                email: organizer.email,
                                role: organizer.role,
                                status: organizer.status,
                                createdAt: organizer.createdAt,
                                organizationName: organizer.organizationName || undefined,
                              });
                              toast({
                                title: "Exported",
                                description: "Organizer data exported successfully",
                              });
                            } catch {
                              toast({
                                title: "Error",
                                description: "Failed to export organizer data",
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

    </div>
  );
};

export default OrganizersContent;

