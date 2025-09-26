import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Shield,
  Users,
  Settings,
  Calendar,
  DollarSign,
  BarChart3,
  MessageCircle,
  Database,
  Megaphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Save,
  X,
  Star,
  UserPlus,
  Download,
  Send,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "./AdminLayout";

// Define all available pages/permissions based on the website structure
export interface PagePermission {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<any>;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

const UserRolesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);

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

  // Mock data for existing roles
  const [roles, setRoles] = useState<UserRole[]>([
    {
      id: "super_admin",
      name: "Super Administrator",
      description: "Full access to all platform features and settings",
      color: "bg-red-100 text-red-800",
      permissions: pagePermissions.map(p => p.id),
      userCount: 2,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15",
      isDefault: true
    },
    {
      id: "event_manager",
      name: "Event Manager",
      description: "Manage events and oversee event operations",
      color: "bg-blue-100 text-blue-800",
      permissions: [
        "dashboard_view", "events_view", "events_create", "events_edit", 
        "events_approve", "events_feature", "users_view", "analytics_view"
      ],
      userCount: 5,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-10"
    },
    {
      id: "content_moderator",
      name: "Content Moderator",
      description: "Moderate content and manage user reports",
      color: "bg-yellow-100 text-yellow-800",
      permissions: [
        "dashboard_view", "events_view", "moderation_view", "moderation_manage",
        "users_view", "communications_view"
      ],
      userCount: 3,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-08"
    },
    {
      id: "finance_manager",
      name: "Finance Manager",
      description: "Manage financial operations and transactions",
      color: "bg-green-100 text-green-800",
      permissions: [
        "dashboard_view", "finance_view", "finance_manage", "finance_export",
        "analytics_view", "analytics_export"
      ],
      userCount: 2,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-12"
    },
    {
      id: "support_staff",
      name: "Support Staff",
      description: "Provide customer support and basic user management",
      color: "bg-purple-100 text-purple-800",
      permissions: [
        "dashboard_view", "users_view", "users_edit", "communications_view",
        "communications_send"
      ],
      userCount: 8,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-05"
    },
    {
      id: "marketing_specialist",
      name: "Marketing Specialist",
      description: "Manage marketing campaigns and promotions",
      color: "bg-pink-100 text-pink-800",
      permissions: [
        "dashboard_view", "marketing_view", "marketing_create", "marketing_edit",
        "analytics_view", "events_view"
      ],
      userCount: 4,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-07"
    }
  ]);

  const [newRole, setNewRole] = useState<UserRole>({
    id: "",
    name: "",
    description: "",
    color: "bg-gray-100 text-gray-800",
    permissions: [],
    userCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  });

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCreateRole = () => {
    if (!newRole.name.trim()) return;
    
    const role: UserRole = {
      ...newRole,
      id: newRole.name.toLowerCase().replace(/\s+/g, '_'),
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    setRoles([...roles, role]);
    setNewRole({
      id: "",
      name: "",
      description: "",
      color: "bg-gray-100 text-gray-800",
      permissions: [],
      userCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setShowCreateModal(false);
  };

  const handleEditRole = (role: UserRole) => {
    setEditingRole({ ...role });
    setShowEditModal(true);
  };

  const handleUpdateRole = () => {
    if (!editingRole) return;
    
    setRoles(roles.map(role => 
      role.id === editingRole.id 
        ? { ...editingRole, updatedAt: new Date().toISOString().split('T')[0] }
        : role
    ));
    setShowEditModal(false);
    setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
    if (roles.find(r => r.id === roleId)?.isDefault) {
      alert("Cannot delete default roles");
      return;
    }
    setRoles(roles.filter(role => role.id !== roleId));
  };

  const handleDuplicateRole = (role: UserRole) => {
    const duplicatedRole: UserRole = {
      ...role,
      id: `${role.id}_copy`,
      name: `${role.name} (Copy)`,
      userCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isDefault: false
    };
    setRoles([...roles, duplicatedRole]);
  };

  const togglePermission = (role: UserRole, permissionId: string) => {
    const updatedPermissions = role.permissions.includes(permissionId)
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];
    
    if (editingRole) {
      setEditingRole({ ...editingRole, permissions: updatedPermissions });
    } else {
      setNewRole({ ...newRole, permissions: updatedPermissions });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
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

  const groupedPermissions = pagePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, PagePermission[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Roles</h1>
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

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <Badge className={role.color} variant="secondary">
                        {role.isDefault ? "Default" : "Custom"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateRole(role)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!role.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Users:</span>
                  <span className="font-medium">{role.userCount}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Permissions:</span>
                  <span className="font-medium">{role.permissions.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">{role.updatedAt}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleEditRole(role)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Role Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <CardHeader>
                <CardTitle>Create New Role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      placeholder="Enter role name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role-description">Description</Label>
                    <Textarea
                      id="role-description"
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      placeholder="Enter role description"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Permissions</Label>
                    <div className="space-y-4 mt-2">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => {
                        const CategoryIcon = getCategoryIcon(category);
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <CategoryIcon className="h-4 w-4" />
                              <h4 className="font-medium">{category}</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-2 ml-6">
                              {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={permission.id}
                                    checked={newRole.permissions.includes(permission.id)}
                                    onCheckedChange={() => togglePermission(newRole, permission.id)}
                                  />
                                  <Label htmlFor={permission.id} className="text-sm">
                                    {permission.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole}>
                    Create Role
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditModal && editingRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <CardHeader>
                <CardTitle>Edit Role: {editingRole.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-role-name">Role Name</Label>
                    <Input
                      id="edit-role-name"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                      placeholder="Enter role name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-role-description">Description</Label>
                    <Textarea
                      id="edit-role-description"
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                      placeholder="Enter role description"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Permissions</Label>
                    <div className="space-y-4 mt-2">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => {
                        const CategoryIcon = getCategoryIcon(category);
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <CategoryIcon className="h-4 w-4" />
                              <h4 className="font-medium">{category}</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-2 ml-6">
                              {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`edit-${permission.id}`}
                                    checked={editingRole.permissions.includes(permission.id)}
                                    onCheckedChange={() => togglePermission(editingRole, permission.id)}
                                  />
                                  <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                                    {permission.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateRole}>
                    Save Changes
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
