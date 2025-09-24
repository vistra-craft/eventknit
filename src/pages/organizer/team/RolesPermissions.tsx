import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  QrCode, 
  Smartphone, 
  User,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  Calendar,
  BarChart3,
  Users
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'mobile' | 'dashboard' | 'events' | 'analytics';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  staffCount: number;
  color: string;
}

const RolesPermissions = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);

  const permissions: Permission[] = [
    // Mobile permissions
    { id: 'mobile_scan', name: 'Scan Tickets', description: 'Scan QR codes to verify tickets', category: 'mobile' },
    { id: 'mobile_checkin', name: 'Check-in Attendees', description: 'Mark attendees as checked in', category: 'mobile' },
    { id: 'mobile_events', name: 'View Assigned Events', description: 'See only events assigned to them', category: 'mobile' },
    
    // Dashboard permissions
    { id: 'dashboard_view', name: 'View Dashboard', description: 'Access main dashboard', category: 'dashboard' },
    { id: 'dashboard_stats', name: 'View Statistics', description: 'See event statistics and metrics', category: 'dashboard' },
    
    // Events permissions
    { id: 'events_view', name: 'View Events', description: 'See all events', category: 'events' },
    { id: 'events_create', name: 'Create Events', description: 'Create new events', category: 'events' },
    { id: 'events_edit', name: 'Edit Events', description: 'Modify existing events', category: 'events' },
    { id: 'events_delete', name: 'Delete Events', description: 'Remove events', category: 'events' },
    { id: 'events_assign', name: 'Assign Staff', description: 'Assign staff to events', category: 'events' },
    
    // Analytics permissions
    { id: 'analytics_view', name: 'View Analytics', description: 'Access analytics dashboard', category: 'analytics' },
    { id: 'analytics_export', name: 'Export Reports', description: 'Download analytics reports', category: 'analytics' },
  ];

  const roles: Role[] = [
    {
      id: 'ticket_scanner',
      name: 'Ticket Scanner',
      description: 'Basic staff for scanning tickets and checking in attendees',
      permissions: ['mobile_scan', 'mobile_checkin', 'mobile_events'],
      staffCount: 2,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'event_manager',
      name: 'Event Manager',
      description: 'Manage events and oversee staff operations',
      permissions: ['mobile_scan', 'mobile_checkin', 'mobile_events', 'dashboard_view', 'events_view', 'events_edit', 'events_assign'],
      staffCount: 1,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'supervisor',
      name: 'Supervisor',
      description: 'Full access to manage events and view analytics',
      permissions: ['mobile_scan', 'mobile_checkin', 'mobile_events', 'dashboard_view', 'dashboard_stats', 'events_view', 'events_create', 'events_edit', 'events_assign', 'analytics_view'],
      staffCount: 1,
      color: 'bg-red-100 text-red-800'
    },
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Complete access to all features and settings',
      permissions: permissions.map(p => p.id),
      staffCount: 1,
      color: 'bg-yellow-100 text-yellow-800'
    }
  ];

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'events': return <Calendar className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mobile': return 'bg-blue-50 text-blue-700';
      case 'dashboard': return 'bg-green-50 text-green-700';
      case 'events': return 'bg-purple-50 text-purple-700';
      case 'analytics': return 'bg-orange-50 text-orange-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Define what your staff can access and do
          </p>
        </div>
        <Button 
          className="bg-accent-neon hover:bg-accent-neon/80 text-primary"
          onClick={() => setShowCreateRole(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRole === role.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{role.name}</h3>
                        <Badge className={`text-xs ${role.color}`}>
                          {role.staffCount} staff
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {role.permissions.length} permissions
                        </span>
                        <div className="flex space-x-1">
                          {role.permissions.slice(0, 3).map(permissionId => {
                            const permission = permissions.find(p => p.id === permissionId);
                            return permission ? (
                              <div key={permissionId} className="w-2 h-2 bg-primary rounded-full" />
                            ) : null;
                          })}
                          {role.permissions.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{role.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedRoleData ? selectedRoleData.name : 'Select a Role'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRoleData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedRoleData.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${selectedRoleData.color}`}>
                      {selectedRoleData.staffCount} staff members
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedRoleData.permissions.length} permissions
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Permissions</h4>
                  <div className="space-y-3">
                    {Object.entries(
                      permissions.reduce((acc, permission) => {
                        if (!acc[permission.category]) {
                          acc[permission.category] = [];
                        }
                        if (selectedRoleData.permissions.includes(permission.id)) {
                          acc[permission.category].push(permission);
                        }
                        return acc;
                      }, {} as Record<string, Permission[]>)
                    ).map(([category, categoryPermissions]) => (
                      <div key={category}>
                        <div className="flex items-center space-x-2 mb-2">
                          {getPermissionIcon(category)}
                          <span className="text-sm font-medium text-foreground capitalize">
                            {category} Access
                          </span>
                          <Badge className={`text-xs ${getCategoryColor(category)}`}>
                            {categoryPermissions.length}
                          </Badge>
                        </div>
                        <div className="ml-6 space-y-1">
                          {categoryPermissions.map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Check className="h-3 w-3 text-green-500" />
                              <span className="text-sm text-foreground">{permission.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Role
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Assign Staff
                    </Button>
                  </div>
                </div>
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
          <div className="space-y-4">
            {Object.entries(
              permissions.reduce((acc, permission) => {
                if (!acc[permission.category]) {
                  acc[permission.category] = [];
                }
                acc[permission.category].push(permission);
                return acc;
              }, {} as Record<string, Permission[]>)
            ).map(([category, categoryPermissions]) => (
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
                        <div className="text-xs text-muted-foreground">
                          {permission.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPermissions;
