import { useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Shield,
  Users,
  UserPlus,
  Settings,
  Calendar,
  DollarSign,
  BarChart3,
  MessageCircle,
  Database,
  Megaphone,
  CheckCircle,
  Star,
  Download,
  Send,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "./AdminLayout";
import { getRoles, type RoleInfo } from "@/lib/admin-api";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole as UserRoleEnum } from "@/types/auth";
import { useToast } from "@/hooks/useToast";
import { useEffect } from "react";

// Define all available pages/permissions based on the website structure
export interface PagePermission {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Use RoleInfo from backend API instead of mock UserRole
type UserRole = RoleInfo;

const UserRolesPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);

  // Define all available page permissions
  const pagePermissions: PagePermission[] = [
    // Dashboard
    { id: "dashboard_view", name: "Dashboard View", category: "Dashboard", description: "View admin dashboard", icon: BarChart3 },
    
    // Events Management
    { id: "events_view", name: "View Events", category: "Events", description: "View all events", icon: Calendar },
    { id: "events_create", name: "Create Events", category: "Events", description: "Create new events", icon: Plus },
    { id: "events_edit", name: "Edit Events", category: "Events", description: "Edit existing events", icon: Edit },
    { id: "events_delete", name: "Delete Events", category: "Events", description: "Delete events", icon: Trash2 },
    { id: "events_approve", name: "Approve Events", category: "Events", description: "Approve pending events", icon: CheckCircle },
    { id: "events_feature", name: "Feature Events", category: "Events", description: "Feature/unfeature events", icon: Star },
    
    // User Management
    { id: "users_view", name: "View Users", category: "Users", description: "View all users", icon: Users },
    { id: "users_create", name: "Create Users", category: "Users", description: "Create new users", icon: UserPlus },
    { id: "users_edit", name: "Edit Users", category: "Users", description: "Edit user information", icon: Edit },
    { id: "users_delete", name: "Delete Users", category: "Users", description: "Delete users", icon: Trash2 },
    { id: "users_roles", name: "Manage Roles", category: "Users", description: "Manage user roles and permissions", icon: Shield },
    
    // Analytics
    { id: "analytics_view", name: "View Analytics", category: "Analytics", description: "View platform analytics", icon: BarChart3 },
    { id: "analytics_export", name: "Export Analytics", category: "Analytics", description: "Export analytics data", icon: Download },
    
    // Marketing
    { id: "marketing_view", name: "View Marketing", category: "Marketing", description: "View marketing campaigns", icon: Megaphone },
    { id: "marketing_create", name: "Create Campaigns", category: "Marketing", description: "Create marketing campaigns", icon: Plus },
    { id: "marketing_edit", name: "Edit Campaigns", category: "Marketing", description: "Edit marketing campaigns", icon: Edit },
    
    // Finance
    { id: "finance_view", name: "View Finance", category: "Finance", description: "View financial data", icon: DollarSign },
    { id: "finance_manage", name: "Manage Finance", category: "Finance", description: "Manage financial transactions", icon: Settings },
    { id: "finance_export", name: "Export Finance", category: "Finance", description: "Export financial reports", icon: Download },
    
    // Moderation
    { id: "moderation_view", name: "View Moderation", category: "Moderation", description: "View moderation queue", icon: Shield },
    { id: "moderation_manage", name: "Manage Moderation", category: "Moderation", description: "Manage content moderation", icon: Settings },
    
    // Communications
    { id: "communications_view", name: "View Communications", category: "Communications", description: "View communications", icon: MessageCircle },
    { id: "communications_send", name: "Send Communications", category: "Communications", description: "Send communications", icon: Send },
    
    // System Management
    { id: "system_view", name: "View System", category: "System", description: "View system information", icon: Database },
    { id: "system_manage", name: "Manage System", category: "System", description: "Manage system settings", icon: Settings },
    { id: "system_logs", name: "View Logs", category: "System", description: "View system logs", icon: FileText },
    { id: "system_backups", name: "Manage Backups", category: "System", description: "Manage system backups", icon: Database },
  ];

  // Fetch roles from backend API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await getRoles();
        if (response.success && response.data) {
          setRoles(response.data.roles);
        }
      } catch (err: unknown) {
        console.error("Error fetching roles:", err);
        const message = err instanceof Error ? err.message : "Failed to load roles";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [toast]);

  // Permission hooks
  const { canModifyUser } = usePermissions();

  // Helper to check if current user can modify a role
  const canModifyRole = (role: UserRoleEnum): boolean => {
    return canModifyUser(role);
  };

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Note: Create/Edit/Delete role functionality is not yet implemented in backend
  // These handlers are kept for future implementation (prefixed with _ to indicate unused)
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // @ts-expect-error - Intentionally unused, reserved for future implementation
  const _handleCreateRole = () => {
    toast({
      title: "Not Available",
      description: "Custom role creation is not yet available. This feature will be implemented in the future.",
      variant: "default",
    });
    setShowCreateModal(false);
  };

  const handleEditRole = (role: UserRole) => {
    setEditingRole(role);
    setShowEditModal(true);
    toast({
      title: "Not Available",
      description: "Role editing is not yet available. This feature will be implemented in the future.",
      variant: "default",
    });
  };

  // @ts-expect-error - Intentionally unused, reserved for future implementation
  const _handleUpdateRole = () => {
    toast({
      title: "Not Available",
      description: "Role updates are not yet available. This feature will be implemented in the future.",
      variant: "default",
    });
    setShowEditModal(false);
    setEditingRole(null);
  };

  // @ts-expect-error - Intentionally unused, reserved for future implementation
  const _handleDeleteRole = (_roleId: string) => {
    toast({
      title: "Not Available",
      description: "Role deletion is not yet available. This feature will be implemented in the future.",
      variant: "default",
    });
  };

  // @ts-expect-error - Intentionally unused, reserved for future implementation
  const _handleDuplicateRole = (_role: UserRole) => {
    toast({
      title: "Not Available",
      description: "Role duplication is not yet available. This feature will be implemented in the future.",
      variant: "default",
    });
  };

  // @ts-expect-error - Intentionally unused, reserved for future implementation
  const _getCategoryIcon = (_category: string) => {
    switch (_category) {
      case "Dashboard": return BarChart3;
      case "Events": return Calendar;
      case "Users": return Users;
      case "Analytics": return BarChart3;
      case "Marketing": return Megaphone;
      case "Finance": return DollarSign;
      case "Moderation": return Shield;
      case "Communications": return MessageCircle;
      case "System": return Database;
      default: return Settings;
    }
  };

  // @ts-expect-error - Intentionally unused, reserved for future implementation
  const _groupedPermissions = pagePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, PagePermission[]>);
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">User Roles</h1>
            <p className="text-muted-foreground">
              Manage user roles and their access permissions
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="default">Default Roles</SelectItem>
                  <SelectItem value="custom">Custom Roles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading roles...</div>
          </div>
        )}

        {/* Roles Grid */}
        {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => {
              const canModify = canModifyRole(role.role as UserRoleEnum);
              const getRoleColor = (roleType: UserRoleEnum) => {
                const colors: Record<UserRoleEnum, string> = {
                  [UserRoleEnum.SUPERADMIN]: "bg-destructive/10 text-destructive",
                  [UserRoleEnum.ADMIN_STAFF]: "bg-primary/10 text-primary",
                  [UserRoleEnum.MARKETER]: "bg-purple-500/10 text-purple-600",
                  [UserRoleEnum.SUPPORT]: "bg-secondary/10 text-secondary",
                  [UserRoleEnum.TELLER]: "bg-success/10 text-success",
                  [UserRoleEnum.ORGANIZER]: "bg-warning/10 text-warning",
                  [UserRoleEnum.ORGANIZER_STAFF]: "bg-accent-orange/10 text-accent-orange",
                  [UserRoleEnum.ORGANIZER_TELLER]: "bg-muted text-muted-foreground",
                  [UserRoleEnum.ATTENDEE]: "bg-muted text-muted-foreground",
                };
                return colors[roleType] || "bg-muted text-muted-foreground";
              };

              return (
                <Card key={role.role} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                          <CardTitle className="text-lg">{role.displayName}</CardTitle>
                          <Badge className={getRoleColor(role.role as UserRoleEnum)} variant="secondary">
                            Hierarchy: {role.hierarchy}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{role.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Can Create:</span>
                        <Badge
                          variant={role.canCreate ? "secondary" : "secondary"}
                          className={role.canCreate ? "bg-muted/30 text-foreground" : ""}
                        >
                          {role.canCreate ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Can Modify:</span>
                        <Badge
                          variant={role.canModify ? "secondary" : "secondary"}
                          className={role.canModify ? "bg-muted/30 text-foreground" : ""}
                        >
                          {role.canModify ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Can Delete:</span>
                        <Badge
                          variant={role.canDelete ? "secondary" : "secondary"}
                          className={role.canDelete ? "bg-muted/30 text-foreground" : ""}
                        >
                          {role.canDelete ? "Yes" : "No"}
                        </Badge>
                      </div>
                </div>
                
                    {role.creatableRoles.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Can Create: </span>
                        <span className="font-medium">
                          {role.creatableRoles.length} role(s)
                        </span>
                </div>
                    )}

                    {role.modifiableRoles.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Can Modify: </span>
                        <span className="font-medium">
                          {role.modifiableRoles.length} role(s)
                        </span>
                </div>
                    )}
                
                    {canModify && (
                      <Button
                        variant="outline"
                        className="w-full hover:bg-muted/30 hover:text-foreground transition-colors"
                        onClick={() => handleEditRole(role)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                    {!canModify && (
                      <div className="text-xs text-muted-foreground text-center p-2">
                        You don't have permission to modify this role
                      </div>
                    )}
              </CardContent>
            </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRoles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No roles found matching your search.
        </div>
        )}

        {/* Create Role Modal - Feature not yet available */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Custom role creation is not yet available. This feature will be implemented in the future.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Role Modal - Feature not yet available */}
        {showEditModal && editingRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit Role: {editingRole.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Role editing is not yet available. This feature will be implemented in the future.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserRolesPage;
