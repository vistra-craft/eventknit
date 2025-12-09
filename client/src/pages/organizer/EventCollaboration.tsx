import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrganizerLayout from "./OrganizerLayout";
import {
  Users,
  Plus,
  UserPlus,
  UserMinus,
  Settings,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import {
  inviteCollaborator,
  getEventCollaborators,
  updateCollaboratorPermissions,
  removeCollaborator,
  getEventActivityLog,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";

interface Collaborator {
  id: string;
  collaborator: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  role?: string;
  canEdit: boolean;
  canManageAttendees: boolean;
  canManageTickets: boolean;
  canViewAnalytics: boolean;
  canManageStaff: boolean;
  canPublish: boolean;
  invitedAt: string;
  acceptedAt?: string;
  isActive: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
  changes?: any;
}

const EventCollaboration = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("collaborators");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      loadCollaborators();
      if (activeTab === "activity") {
        loadActivityLog();
      }
    }
  }, [eventId, activeTab]);

  const loadCollaborators = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const response = await getEventCollaborators(eventId);
      if (response.success && response.data) {
        setCollaborators(response.data.collaborators || []);
      }
    } catch (error) {
      console.error("Error loading collaborators:", error);
      toast({
        title: "Error",
        description: "Failed to load collaborators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async () => {
    if (!eventId) return;
    try {
      const response = await getEventActivityLog(eventId);
      if (response.success && response.data) {
        setActivityLog(response.data.activities || []);
      }
    } catch (error) {
      console.error("Error loading activity log:", error);
    }
  };

  const handleInviteCollaborator = async (data: {
    collaboratorId: string;
    role?: string;
    canEdit?: boolean;
    canManageAttendees?: boolean;
    canManageTickets?: boolean;
    canViewAnalytics?: boolean;
    canManageStaff?: boolean;
    canPublish?: boolean;
  }) => {
    if (!eventId) return;
    try {
      const response = await inviteCollaborator(eventId, data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Collaborator invited successfully",
        });
        setIsInviteDialogOpen(false);
        loadCollaborators();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to invite collaborator",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePermissions = async (collaborationId: string, data: {
    role?: string;
    canEdit?: boolean;
    canManageAttendees?: boolean;
    canManageTickets?: boolean;
    canViewAnalytics?: boolean;
    canManageStaff?: boolean;
    canPublish?: boolean;
  }) => {
    try {
      const response = await updateCollaboratorPermissions(collaborationId, data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Permissions updated successfully",
        });
        setIsPermissionsDialogOpen(false);
        setSelectedCollaborator(null);
        loadCollaborators();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCollaborator = async (collaborationId: string) => {
    if (!confirm("Are you sure you want to remove this collaborator?")) return;

    try {
      const response = await removeCollaborator(collaborationId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Collaborator removed successfully",
        });
        loadCollaborators();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove collaborator",
        variant: "destructive",
      });
    }
  };

  if (!eventId) {
    return (
      <OrganizerLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Event ID is required</p>
          </CardContent>
        </Card>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Event Collaboration</h1>
            <p className="text-muted-foreground mt-1">
              Manage collaborators and track event activity
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="collaborators" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Collaborator
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Collaborator</DialogTitle>
                  </DialogHeader>
                  <InviteCollaboratorForm
                    onSubmit={handleInviteCollaborator}
                    onCancel={() => setIsInviteDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading collaborators...</div>
            ) : collaborators.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No collaborators yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {collaborators.map((collaborator) => (
                  <Card key={collaborator.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {collaborator.collaborator.firstName}{" "}
                              {collaborator.collaborator.lastName}
                            </h3>
                            {collaborator.acceptedAt ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {collaborator.collaborator.email}
                          </p>
                          {collaborator.role && (
                            <Badge variant="outline" className="mb-2">
                              {collaborator.role}
                            </Badge>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {collaborator.canEdit && (
                              <Badge variant="secondary" className="text-xs">Edit</Badge>
                            )}
                            {collaborator.canManageAttendees && (
                              <Badge variant="secondary" className="text-xs">Attendees</Badge>
                            )}
                            {collaborator.canManageTickets && (
                              <Badge variant="secondary" className="text-xs">Tickets</Badge>
                            )}
                            {collaborator.canViewAnalytics && (
                              <Badge variant="secondary" className="text-xs">Analytics</Badge>
                            )}
                            {collaborator.canManageStaff && (
                              <Badge variant="secondary" className="text-xs">Staff</Badge>
                            )}
                            {collaborator.canPublish && (
                              <Badge variant="secondary" className="text-xs">Publish</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCollaborator(collaborator);
                              setIsPermissionsDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Permissions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading activity log...</div>
            ) : activityLog.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No activity recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {activityLog.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">
                              {activity.user.firstName} {activity.user.lastName}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {activity.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedCollaborator && (
          <Dialog
            open={isPermissionsDialogOpen}
            onOpenChange={setIsPermissionsDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Permissions</DialogTitle>
              </DialogHeader>
              <PermissionsForm
                collaborator={selectedCollaborator}
                onSubmit={(data) => handleUpdatePermissions(selectedCollaborator.id, data)}
                onCancel={() => {
                  setIsPermissionsDialogOpen(false);
                  setSelectedCollaborator(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </OrganizerLayout>
  );
};

const InviteCollaboratorForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    collaboratorId: "",
    role: "",
    canEdit: false,
    canManageAttendees: false,
    canManageTickets: false,
    canViewAnalytics: true,
    canManageStaff: false,
    canPublish: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="collaboratorId">User ID *</Label>
        <Input
          id="collaboratorId"
          value={formData.collaboratorId}
          onChange={(e) =>
            setFormData({ ...formData, collaboratorId: e.target.value })
          }
          required
          placeholder="Enter user ID"
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="e.g., Co-Organizer"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canEdit"
            checked={formData.canEdit}
            onChange={(e) => setFormData({ ...formData, canEdit: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="canEdit">Can Edit Event</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canManageAttendees"
            checked={formData.canManageAttendees}
            onChange={(e) =>
              setFormData({ ...formData, canManageAttendees: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="canManageAttendees">Can Manage Attendees</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canManageTickets"
            checked={formData.canManageTickets}
            onChange={(e) =>
              setFormData({ ...formData, canManageTickets: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="canManageTickets">Can Manage Tickets</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canViewAnalytics"
            checked={formData.canViewAnalytics}
            onChange={(e) =>
              setFormData({ ...formData, canViewAnalytics: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="canViewAnalytics">Can View Analytics</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canManageStaff"
            checked={formData.canManageStaff}
            onChange={(e) =>
              setFormData({ ...formData, canManageStaff: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="canManageStaff">Can Manage Staff</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canPublish"
            checked={formData.canPublish}
            onChange={(e) => setFormData({ ...formData, canPublish: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="canPublish">Can Publish</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Invite</Button>
      </div>
    </form>
  );
};

const PermissionsForm = ({
  collaborator,
  onSubmit,
  onCancel,
}: {
  collaborator: Collaborator;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    role: collaborator.role || "",
    canEdit: collaborator.canEdit,
    canManageAttendees: collaborator.canManageAttendees,
    canManageTickets: collaborator.canManageTickets,
    canViewAnalytics: collaborator.canViewAnalytics,
    canManageStaff: collaborator.canManageStaff,
    canPublish: collaborator.canPublish,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="e.g., Co-Organizer"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canEdit"
            checked={formData.canEdit}
            onChange={(e) => setFormData({ ...formData, canEdit: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="canEdit">Can Edit Event</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canManageAttendees"
            checked={formData.canManageAttendees}
            onChange={(e) =>
              setFormData({ ...formData, canManageAttendees: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="canManageAttendees">Can Manage Attendees</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canManageTickets"
            checked={formData.canManageTickets}
            onChange={(e) =>
              setFormData({ ...formData, canManageTickets: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="canManageTickets">Can Manage Tickets</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canViewAnalytics"
            checked={formData.canViewAnalytics}
            onChange={(e) =>
              setFormData({ ...formData, canViewAnalytics: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="canViewAnalytics">Can View Analytics</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canManageStaff"
            checked={formData.canManageStaff}
            onChange={(e) =>
              setFormData({ ...formData, canManageStaff: e.target.checked })
            }
            className="rounded"
          />
          <Label htmlFor="canManageStaff">Can Manage Staff</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canPublish"
            checked={formData.canPublish}
            onChange={(e) => setFormData({ ...formData, canPublish: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="canPublish">Can Publish</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Update Permissions</Button>
      </div>
    </form>
  );
};

export default EventCollaboration;
