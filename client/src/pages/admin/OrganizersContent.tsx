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
  User,
  Mail,
  Building2,
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
import { useToast } from "@/hooks/use-toast";
import { getUsers, suspendUser, deactivateUser, activateUser, type User, type UserStatus } from "@/lib/admin-api";
import { exportUserData } from "@/lib/utils/export";
import CreateOrganizerModal from "./CreateOrganizerModal";

const OrganizersContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewOrganizer, setPreviewOrganizer] = useState<User | null>(null);

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
        });

        if (response.success && response.data) {
          setOrganizers(response.data.users);
        }
      } catch (err: any) {
        console.error("Error fetching organizers:", err);
        setError(err.message || "Failed to load organizers");
        toast({
          title: "Error",
          description: err.message || "Failed to load organizers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizers();
  }, [searchTerm, statusFilter, toast]);

  const getStatusBadge = (status: UserStatus) => {
    const variants = {
      ACTIVE: "bg-green-100 text-green-800 border-green-200",
      SUSPENDED: "bg-red-100 text-red-800 border-red-200",
      DEACTIVATED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewOrganizer = (id: string) => {
    navigate(`/admin/users/organizers/${id}`);
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
        const updatedResponse = await getUsers({ role: "ORGANIZER" });
        if (updatedResponse.success && updatedResponse.data) {
          setOrganizers(updatedResponse.data.users);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to suspend organizer",
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
        const updatedResponse = await getUsers({ role: "ORGANIZER" });
        if (updatedResponse.success && updatedResponse.data) {
          setOrganizers(updatedResponse.data.users);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to deactivate organizer",
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
        const updatedResponse = await getUsers({ role: "ORGANIZER" });
        if (updatedResponse.success && updatedResponse.data) {
          setOrganizers(updatedResponse.data.users);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to activate organizer",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = async () => {
    // Refresh list
    const response = await getUsers({ role: "ORGANIZER" });
    if (response.success && response.data) {
      setOrganizers(response.data.users);
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
        <div className="text-gray-600">Loading organizers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Organizers</h2>
          <p className="text-gray-600">Manage external event organizers</p>
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
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Organizer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">{organizers.length}</div>
            <p className="text-sm text-gray-600">Total Organizers</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {organizers.filter((o) => o.status === "ACTIVE").length}
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {organizers.filter((o) => o.status === "SUSPENDED").length}
            </div>
            <p className="text-sm text-gray-600">Suspended</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600 mb-2">
              {organizers.filter((o) => o.status === "DEACTIVATED").length}
            </div>
            <p className="text-sm text-gray-600">Deactivated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
            <div className="text-center py-8 text-gray-600">No organizers found</div>
          ) : (
            <div className="space-y-3">
              {filteredOrganizers.map((organizer) => (
                <div
                  key={organizer.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar
                      src={undefined} // Profile image URL if available in future
                      name={`${organizer.firstName} ${organizer.lastName}`}
                      alt={`${organizer.firstName} ${organizer.lastName}`}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {organizer.firstName} {organizer.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {organizer.organizationName || "No organization"}
                      </p>
                      <p className="text-sm text-gray-600">{organizer.email}</p>
                      {organizer.businessEmail && (
                        <p className="text-sm text-gray-600">Business: {organizer.businessEmail}</p>
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
                      <div className="text-sm text-gray-600">
                        Joined: {formatDate(organizer.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewOrganizer(organizer)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOrganizer(organizer.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {organizer.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspendOrganizer(organizer.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          title="Suspend Organizer"
                          disabled={actionLoading === organizer.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      )}
                      {(organizer.status === "SUSPENDED" || organizer.status === "DEACTIVATED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateOrganizer(organizer.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          title="Activate Organizer"
                          disabled={actionLoading === organizer.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
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
                          <DropdownMenuItem onClick={() => handleEditOrganizer(organizer.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Organizer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {organizer.status === "ACTIVE" && (
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
                          {(organizer.status === "SUSPENDED" || organizer.status === "DEACTIVATED") && (
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
                                organizationName: organizer.organizationName,
                              });
                              toast({
                                title: "Exported",
                                description: "Organizer data exported successfully",
                              });
                            } catch (error) {
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

      <CreateOrganizerModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />

      {/* Organizer Preview Dialog */}
      <Dialog 
        open={!!previewOrganizer} 
        onOpenChange={(open) => {
          if (!open) {
            setPreviewOrganizer(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Organizer Preview</DialogTitle>
            <DialogDescription>
              View organizer details
            </DialogDescription>
          </DialogHeader>
          {previewOrganizer && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar
                  src={undefined} // Profile image URL if available in future
                  name={`${previewOrganizer.firstName} ${previewOrganizer.lastName}`}
                  alt={`${previewOrganizer.firstName} ${previewOrganizer.lastName}`}
                  size="xl"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {previewOrganizer.firstName} {previewOrganizer.lastName}
                  </h2>
                  <Badge className={`${getStatusBadge(previewOrganizer.status)} mb-2`}>
                    {previewOrganizer.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{previewOrganizer.email}</p>
                  </div>
                </div>
                {previewOrganizer.businessEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Business Email</p>
                      <p className="font-medium">{previewOrganizer.businessEmail}</p>
                    </div>
                  </div>
                )}
                {previewOrganizer.organizationName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Organization</p>
                      <p className="font-medium">{previewOrganizer.organizationName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(previewOrganizer.createdAt)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewOrganizer(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setPreviewOrganizer(null);
                  handleEditOrganizer(previewOrganizer.id);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Organizer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizersContent;

