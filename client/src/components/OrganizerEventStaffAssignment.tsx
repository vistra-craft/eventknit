import { useState } from "react";
import {
  UserPlus,
  Users,
  Edit,
  Trash2,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/useToast";
import {
  type EventStaffAssignment as EventStaffAssignmentType,
  type EventStaffRole,
  type AssignOrganizerStaffToEventData,
} from "@/lib/organizer-api";
// TanStack Query hooks
import { useOrganizerEventStaff, useOrganizerStaff } from "@/hooks/queries";
import {
  useAssignOrganizerStaff,
  useUpdateOrganizerStaffAssignment,
  useRemoveOrganizerStaff,
} from "@/hooks/mutations";

interface OrganizerEventStaffAssignmentProps {
  eventId: string;
  eventTitle?: string;
}

const EVENT_STAFF_ROLES: EventStaffRole[] = [
  'SCANNER',
  'SUPPORT',
  'MANAGER',
  'COORDINATOR',
  'SUPERVISOR',
  'TICKET_SELLER',
];

export const OrganizerEventStaffAssignment: React.FC<OrganizerEventStaffAssignmentProps> = ({
  eventId,
  eventTitle,
}) => {
  const { toast } = useToast();

  // Dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EventStaffAssignmentType | null>(null);

  // Filter state
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");

  // Assignment form state
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<EventStaffRole>("SCANNER");
  const [notes, setNotes] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [facility, setFacility] = useState("");

  // TanStack Query hooks
  const { data: eventStaffData, isLoading: loading } = useOrganizerEventStaff(eventId, {
    role: filterRole,
    isActive: filterActive !== "all" ? filterActive === "true" : undefined,
  });

  const { data: availableStaff = [] } = useOrganizerStaff();

  // Mutation hooks
  const assignStaffMutation = useAssignOrganizerStaff();
  const updateStaffMutation = useUpdateOrganizerStaffAssignment();
  const removeStaffMutation = useRemoveOrganizerStaff();

  const assignments = eventStaffData?.assignments || [];
  const assigning =
    assignStaffMutation.isPending ||
    updateStaffMutation.isPending ||
    removeStaffMutation.isPending;

  const handleAssign = () => {
    if (!selectedStaffId) {
      toast({
        title: "Error",
        description: "Please select a staff member",
        variant: "destructive",
      });
      return;
    }

    const data: AssignOrganizerStaffToEventData = {
      staffId: selectedStaffId,
      role: selectedRole,
      notes: notes || undefined,
      shiftStart: shiftStart || undefined,
      shiftEnd: shiftEnd || undefined,
      facility: facility || undefined,
    };

    assignStaffMutation.mutate(
      { eventId, data },
      {
        onSuccess: () => {
          resetForm();
          setShowAssignDialog(false);
        },
      }
    );
  };

  const handleUpdate = (assignment: EventStaffAssignmentType) => {
    updateStaffMutation.mutate(
      {
        eventId,
        staffId: assignment.staffId,
        data: {
          role: selectedRole,
          notes: notes || undefined,
          isActive: assignment.isActive,
          shiftStart: shiftStart || null,
          shiftEnd: shiftEnd || null,
          facility: facility || null,
        },
      },
      {
        onSuccess: () => {
          resetForm();
          setEditingAssignment(null);
        },
      }
    );
  };

  const handleRemove = (assignment: EventStaffAssignmentType) => {
    if (!confirm(`Are you sure you want to remove ${assignment.staff.firstName} ${assignment.staff.lastName} from this event?`)) {
      return;
    }

    removeStaffMutation.mutate({
      eventId,
      staffId: assignment.staffId,
    });
  };

  const resetForm = () => {
    setSelectedStaffId("");
    setSelectedRole("SCANNER");
    setNotes("");
    setShiftStart("");
    setShiftEnd("");
    setFacility("");
  };

  const openEditDialog = (assignment: EventStaffAssignmentType) => {
    setEditingAssignment(assignment);
    setSelectedRole(assignment.role);
    setNotes(assignment.notes || "");
    setShiftStart(assignment.shiftStart ? new Date(assignment.shiftStart).toISOString().slice(0, 16) : "");
    setShiftEnd(assignment.shiftEnd ? new Date(assignment.shiftEnd).toISOString().slice(0, 16) : "");
    setFacility(assignment.facility || "");
    setShowAssignDialog(true);
  };

  const getRoleBadgeColor = (role: EventStaffRole) => {
    const colors: Record<EventStaffRole, string> = {
      SCANNER: "bg-primary/10 text-primary",
      SUPPORT: "bg-purple-100 text-purple-800",
      MANAGER: "bg-orange-100 text-orange-800",
      COORDINATOR: "bg-success/10 text-success",
      SUPERVISOR: "bg-destructive/10 text-destructive",
      TICKET_SELLER: "bg-warning/10 text-warning",
    };
    return colors[role] || "bg-muted text-muted-foreground";
  };

  // Filter out already assigned staff
  const availableStaffForAssignment = availableStaff.filter(
    (staff) => !assignments.some((a) => a.staffId === staff.id && a.isActive)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Staff
              {eventTitle && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {eventTitle}
                </span>
              )}
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setEditingAssignment(null);
                setShowAssignDialog(true);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label>Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {EVENT_STAFF_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignments List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader />
            </div>
          ) : assignments.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No staff assigned to this event yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {assignment.staff.firstName} {assignment.staff.lastName}
                        </h4>
                        <Badge className={getRoleBadgeColor(assignment.role)}>
                          {assignment.role}
                        </Badge>
                        {assignment.isActive ? (
                          <Badge variant="outline" className="bg-success/5 text-success border-success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <span>{assignment.staff.email}</span>
                          {assignment.staff.phoneNumber && (
                            <span>• {assignment.staff.phoneNumber}</span>
                          )}
                        </div>
                        {assignment.notes && (
                          <div className="mt-1">{assignment.notes}</div>
                        )}
                        {(assignment.shiftStart || assignment.shiftEnd) && (
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {assignment.shiftStart && (
                              <span>
                                {new Date(assignment.shiftStart).toLocaleString()}
                              </span>
                            )}
                            {assignment.shiftStart && assignment.shiftEnd && (
                              <span>-</span>
                            )}
                            {assignment.shiftEnd && (
                              <span>
                                {new Date(assignment.shiftEnd).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        {assignment.facility && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{assignment.facility}</span>
                          </div>
                        )}
                        <div className="text-xs mt-2">
                          Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(assignment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(assignment)}
                        disabled={assigning}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? "Edit Staff Assignment" : "Assign Staff to Event"}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? "Update the staff assignment details"
                : "Select a staff member and assign them to this event"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editingAssignment && (
              <div>
                <Label>Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaffForAssignment.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.firstName} {staff.lastName} ({staff.email}) - {staff.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Event Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as EventStaffRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STAFF_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this assignment..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shift Start (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                />
              </div>
              <div>
                <Label>Shift End (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Facility/Station (Optional)</Label>
              <Input
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="e.g., Main Entrance, VIP Area"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignDialog(false);
              resetForm();
              setEditingAssignment(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={editingAssignment ? () => handleUpdate(editingAssignment) : handleAssign}
              disabled={assigning || (!editingAssignment && !selectedStaffId)}
            >
              {assigning ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  {editingAssignment ? "Updating..." : "Assigning..."}
                </>
              ) : (
                editingAssignment ? "Update" : "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


