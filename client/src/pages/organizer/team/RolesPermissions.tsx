import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Shield, 
  Settings,
  Check,
  Calendar,
  BarChart3,
  Users,
  Plus,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { ButtonLoader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { 
  getOrganizerStaff, 
  type OrganizerStaff,
  getPermissionsByCategory,
  getRoleTemplates,
  createRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate,
  duplicateRoleTemplate,
  type Permission,
  type TeamRoleTemplate,
  type CreateRoleTemplateData,
  type UpdateRoleTemplateData,
} from "@/lib/organizer-api";

// System roles (read-only)
interface SystemRoleInfo {
  id: 'ORGANIZER_ADMIN' | 'ORGANIZER_TELLER';
  name: string;
  description: string;
  color: string;
}

const RolesPermissions = () => {
  const { toast } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedRoleType, setSelectedRoleType] = useState<'system' | 'custom' | null>(null);
  const [staff, setStaff] = useState<OrganizerStaff[]>([]);
  const [customRoles, setCustomRoles] = useState<TeamRoleTemplate[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<TeamRoleTemplate | null>(null);
  const [deletingRole, setDeletingRole] = useState<TeamRoleTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateRoleTemplateData>({
    name: '',
    description: '',
    permissionKeys: [],
  });

  // System-defined roles (read-only, fixed in backend)
  const systemRoles: SystemRoleInfo[] = [
    {
      id: 'ORGANIZER_ADMIN',
      name: 'Staff Member',
      description: 'Basic staff members with scanning and check-in permissions',
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'ORGANIZER_TELLER',
      name: 'Teller',
      description: 'Staff members who can handle ticket sales and scanning',
      color: 'bg-primary/10 text-primary'
    }
  ];

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    try {
      setPermissionsLoading(true);
      const response = await getPermissionsByCategory();
      if (response.success && response.data) {
        setPermissions(response.data.permissions);
      }
    } catch (error) {
      showErrorToast(toast, error, 'Load failed', 'Failed to load permissions');
    } finally {
      setPermissionsLoading(false);
    }
  }, [toast]);

  // Fetch custom roles
  const fetchCustomRoles = useCallback(async () => {
    try {
      const response = await getRoleTemplates();
      if (response.success && response.data) {
        setCustomRoles(response.data.templates);
      }
    } catch (error) {
      showErrorToast(toast, error, 'Load failed', 'Failed to load custom roles');
    }
  }, [toast]);

  // Fetch staff
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrganizerStaff();
      if (response.success && response.data) {
        setStaff(response.data.staff);
      }
    } catch (error) {
      showErrorToast(toast, error, 'Load failed', 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPermissions();
    fetchCustomRoles();
    fetchStaff();
  }, [fetchPermissions, fetchCustomRoles, fetchStaff]);

  // Get staff count for system role
  const getSystemRoleStaffCount = (roleId: 'ORGANIZER_ADMIN' | 'ORGANIZER_TELLER') => {
    return staff.filter(s => s.role === roleId && s.status === 'ACTIVE').length;
  };

  // Get staff count for custom role
  const getCustomRoleStaffCount = (roleId: string) => {
    return staff.filter(s => s.customRoleId === roleId && s.status === 'ACTIVE').length;
  };

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case 'events': return <Calendar className="h-4 w-4" />;
      case 'attendees': return <Users className="h-4 w-4" />;
      case 'tickets': return <BarChart3 className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'events': return 'bg-primary/10 text-primary';
      case 'attendees': return 'bg-primary/10 text-primary';
      case 'tickets': return 'bg-success-light text-success';
      case 'analytics': return 'bg-warning/10 text-warning';
      case 'financial': return 'bg-warning/10 text-warning';
      case 'team': return 'bg-primary/10 text-primary';
      case 'communication': return 'bg-primary/10 text-primary';
      case 'settings': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Get selected role data
  const selectedRoleData = selectedRoleType === 'system' 
    ? systemRoles.find(r => r.id === selectedRoleId as 'ORGANIZER_ADMIN' | 'ORGANIZER_TELLER')
    : customRoles.find(r => r.id === selectedRoleId);

  // Get permissions for selected role
  const selectedRolePermissions = selectedRoleType === 'custom' && selectedRoleData
    ? (selectedRoleData as TeamRoleTemplate).permissions?.map(rp => rp.permission) || []
    : [];

  // Handler functions
  const handleCreateRole = async () => {
    if (!formData.name.trim()) {
      showErrorToast(toast, new Error("Role name is required"), "Validation error");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createRoleTemplate(formData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Role created successfully",
        });
        setShowCreateDialog(false);
        setFormData({ name: '', description: '', permissionKeys: [] });
        fetchCustomRoles();
      }
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Create role failed', 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async () => {
    if (!editingRole || !formData.name.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const updateData: UpdateRoleTemplateData = {
        name: formData.name,
        description: formData.description,
        permissionKeys: formData.permissionKeys,
      };
      const response = await updateRoleTemplate(editingRole.id, updateData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
        setShowEditDialog(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissionKeys: [] });
        fetchCustomRoles();
        if (selectedRoleId === editingRole.id) {
          setSelectedRoleId(null);
          setSelectedRoleType(null);
        }
      }
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Update role failed', 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      setSubmitting(true);
      const response = await deleteRoleTemplate(deletingRole.id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Role deleted successfully",
        });
        setShowDeleteDialog(false);
        setDeletingRole(null);
        fetchCustomRoles();
        if (selectedRoleId === deletingRole.id) {
          setSelectedRoleId(null);
          setSelectedRoleType(null);
        }
      }
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Delete role failed', 'Failed to delete role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicateRole = async (role: TeamRoleTemplate) => {
    try {
      setSubmitting(true);
      const response = await duplicateRoleTemplate(role.id, { name: `${role.name} (Copy)` });
      if (response.success) {
        toast({
          title: "Success",
          description: "Role duplicated successfully",
        });
        fetchCustomRoles();
      }
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Duplicate role failed', 'Failed to duplicate role');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (role: TeamRoleTemplate) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionKeys: role.permissions?.map(rp => rp.permission.key) || [],
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (role: TeamRoleTemplate) => {
    setDeletingRole(role);
    setShowDeleteDialog(true);
  };

  const togglePermission = (permissionKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissionKeys: prev.permissionKeys?.includes(permissionKey)
        ? prev.permissionKeys.filter(k => k !== permissionKey)
        : [...(prev.permissionKeys || []), permissionKey],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-page-title mb-2">Roles & Permissions</h1>
          <p className="text-page-subtitle">
            Manage custom roles and permissions for your team members. System roles cannot be modified.
          </p>
        </div>
        <Button 
          onClick={() => {
            setFormData({ name: '', description: '', permissionKeys: [] });
            setShowCreateDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || permissionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size="md" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* System Roles */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">System Roles</h3>
                  <div className="space-y-2">
                    {systemRoles.map((role) => {
                      const staffCount = getSystemRoleStaffCount(role.id);
                      const isSelected = selectedRoleType === 'system' && selectedRoleId === role.id;
                      return (
                        <div
                          key={role.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            setSelectedRoleId(role.id);
                            setSelectedRoleType('system');
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-foreground">{role.name}</h3>
                                <Badge className={`text-xs ${role.color}`}>
                                  {staffCount} {staffCount === 1 ? 'staff' : 'staff'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">System</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Roles */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Custom Roles</h3>
                  {customRoles.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No custom roles yet</p>
                      <p className="text-xs mt-1">Create a custom role to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customRoles.filter(r => r.isActive).map((role) => {
                        const staffCount = getCustomRoleStaffCount(role.id);
                        const permissionCount = role.permissions?.length || 0;
                        const isSelected = selectedRoleType === 'custom' && selectedRoleId === role.id;
                        return (
                          <div
                            key={role.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors group ${
                              isSelected
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:bg-muted/50'
                            }`}
                            onClick={() => {
                              setSelectedRoleId(role.id);
                              setSelectedRoleType('custom');
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium text-foreground">{role.name}</h3>
                                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                                    {staffCount} {staffCount === 1 ? 'staff' : 'staff'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {permissionCount} {permissionCount === 1 ? 'permission' : 'permissions'}
                                  </Badge>
                                </div>
                                {role.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {role.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateRole(role);
                                  }}
                                  className="h-7 w-7 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(role);
                                  }}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog(role);
                                  }}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedRoleData 
                ? (selectedRoleType === 'system' 
                    ? (selectedRoleData as SystemRoleInfo).name 
                    : (selectedRoleData as TeamRoleTemplate).name)
                : 'Select a Role'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRoleData ? (
              <div className="space-y-4">
                {selectedRoleType === 'system' ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {(selectedRoleData as SystemRoleInfo).description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${(selectedRoleData as SystemRoleInfo).color}`}>
                          {getSystemRoleStaffCount((selectedRoleData as SystemRoleInfo).id)} staff members
                        </Badge>
                        <Badge variant="outline" className="text-xs">System Role</Badge>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        System roles are predefined and cannot be customized. To change a staff member's system role, edit their profile in Staff Management.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {(selectedRoleData as TeamRoleTemplate).description || 'No description provided'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                          {getCustomRoleStaffCount((selectedRoleData as TeamRoleTemplate).id)} staff members
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {selectedRolePermissions.length} {selectedRolePermissions.length === 1 ? 'permission' : 'permissions'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Permissions</h4>
                      {selectedRolePermissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No permissions assigned</p>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(
                            selectedRolePermissions.reduce((acc, permission) => {
                              if (!acc[permission.category]) {
                                acc[permission.category] = [];
                              }
                              acc[permission.category].push(permission);
                              return acc;
                            }, {} as Record<string, Permission[]>)
                          ).map(([category, categoryPermissions]) => (
                            <div key={category}>
                              <div className="flex items-center space-x-2 mb-2">
                                {getPermissionIcon(category)}
                                <span className="text-sm font-medium text-foreground capitalize">
                                  {category}
                                </span>
                                <Badge className={`text-xs ${getCategoryColor(category)}`}>
                                  {categoryPermissions.length}
                                </Badge>
                              </div>
                              <div className="ml-6 space-y-1">
                                {categoryPermissions.map(permission => (
                                  <div key={permission.id} className="flex items-center space-x-2">
                                    <Check className="h-3 w-3 text-success" />
                                    <span className="text-sm text-foreground">{permission.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a role to view its permissions and details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Available Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="md" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(permissions).map(([category, categoryPermissions]) => (
                <div key={category}>
                  <div className="flex items-center space-x-2 mb-3">
                    {getPermissionIcon(category)}
                    <h4 className="font-medium text-foreground capitalize">{category} Permissions</h4>
                    <Badge className={`text-xs ${getCategoryColor(category)}`}>
                      {categoryPermissions.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                    {categoryPermissions.map(permission => (
                      <div key={permission.id} className="flex items-start space-x-2 p-2 rounded border">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm text-foreground">
                            {permission.name}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground">
                              {permission.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Create a new role with custom permissions for your team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Event Manager"
              />
            </div>
            <div>
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this role can do..."
                rows={3}
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-4 max-h-[400px] overflow-y-auto border rounded-lg p-4">
                {Object.entries(permissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getPermissionIcon(category)}
                      <h4 className="font-medium text-sm capitalize">{category}</h4>
                      <Badge className={`text-xs ${getCategoryColor(category)}`}>
                        {categoryPermissions.filter(p => formData.permissionKeys?.includes(p.key)).length} / {categoryPermissions.length}
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-2">
                      {categoryPermissions.map(permission => (
                        <div key={permission.id} className="flex items-start space-x-2">
                          <Checkbox
                            checked={formData.permissionKeys?.includes(permission.key) || false}
                            onCheckedChange={() => togglePermission(permission.key)}
                            id={`perm-${permission.id}`}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`perm-${permission.id}`}
                              className="font-normal cursor-pointer"
                            >
                              {permission.name}
                            </Label>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={submitting || !formData.name.trim()}>
              {submitting && <ButtonLoader />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Custom Role</DialogTitle>
            <DialogDescription>
              Update role name, description, and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name">Role Name *</Label>
              <Input
                id="edit-role-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Event Manager"
              />
            </div>
            <div>
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea
                id="edit-role-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this role can do..."
                rows={3}
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-4 max-h-[400px] overflow-y-auto border rounded-lg p-4">
                {Object.entries(permissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getPermissionIcon(category)}
                      <h4 className="font-medium text-sm capitalize">{category}</h4>
                      <Badge className={`text-xs ${getCategoryColor(category)}`}>
                        {categoryPermissions.filter(p => formData.permissionKeys?.includes(p.key)).length} / {categoryPermissions.length}
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-2">
                      {categoryPermissions.map(permission => (
                        <div key={permission.id} className="flex items-start space-x-2">
                          <Checkbox
                            checked={formData.permissionKeys?.includes(permission.key) || false}
                            onCheckedChange={() => togglePermission(permission.key)}
                            id={`edit-perm-${permission.id}`}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`edit-perm-${permission.id}`}
                              className="font-normal cursor-pointer"
                            >
                              {permission.name}
                            </Label>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditingRole(null);
              setFormData({ name: '', description: '', permissionKeys: [] });
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={submitting || !formData.name.trim()}>
              {submitting && <ButtonLoader />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingRole?.name}"? This action cannot be undone.
              {deletingRole && getCustomRoleStaffCount(deletingRole.id) > 0 && (
                <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                    <div className="text-sm text-foreground">
                      <strong>Warning:</strong> {getCustomRoleStaffCount(deletingRole.id)} staff member(s) are assigned to this role. 
                      They will lose their custom role assignment.
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setDeletingRole(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRole} 
              disabled={submitting}
            >
              {submitting && <ButtonLoader />}
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPermissions;

 