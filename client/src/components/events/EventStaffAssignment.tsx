import { useState } from "react";
import {
  UserPlus,
  Users,
  X,
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/useToast";
import {
  type EventStaffAssignment as EventStaffAssignmentType,
  type EventStaffRole,
  type AssignStaffToEventData,
} from "@/lib/admin-api";
// TanStack Query hooks - Admin
import { useEventStaff, useAvailableStaff } from "@/hooks/queries";
import {
  useAssignStaff,
  useBulkAssignStaff,
  useUpdateStaffAssignment,
  useRemoveStaff,
} from "@/hooks/mutations";
// TanStack Query hooks - Organizer
import { useOrganizerEventStaff, useOrganizerStaff } from "@/hooks/queries";
import {
  useAssignOrganizerStaff,
  useUpdateOrganizerStaffAssignment,
  useRemoveOrganizerStaff,
} from "@/hooks/mutations";

interface EventStaffAssignmentProps {
  eventId: string;
  eventTitle?: string;
  variant?: 'admin' | 'organizer';
}

const EVENT_STAFF_ROLES: EventStaffRole[] = [
  'SCANNER',
  'SUPPORT',
  'MANAGER',
  'COORDINATOR',
  'SUPERVISOR',
  'TICKET_SELLER',
];


export const EventStaffAssignment: React.FC<EventStaffAssignmentProps> = ({
  eventId,
  eventTitle,
  variant = 'admin',
}) => {
  const { toast } = useToast();

  // Dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EventStaffAssignmentType | null>(null);
  const [removingAssignment, setRemovingAssignment] = useState<EventStaffAssignmentType | null>(null);

  // Filter state
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStaffType, setFilterStaffType] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");

  // Assignment form state
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<EventStaffRole>("SCANNER");
  const [notes, setNotes] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [facility, setFacility] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // TanStack Query hooks - conditionally use admin or organizer hooks based on variant
  // TanStack Query hooks - call both admin and organizer hooks unconditionally (conditional logic is inside hooks or handled by enabled flag if needed, but here we just need to satisfy order of hooks)
  const adminEventStaff = useEventStaff(eventId, {
    role: filterRole,
    staffType: filterStaffType !== "all" ? (filterStaffType as 'ADMIN' | 'ORGANIZER_ADMIN') : undefined,
    isActive: filterActive !== "all" ? filterActive === "true" : undefined,
  });
  
  const organizerEventStaff = useOrganizerEventStaff(eventId, {
    role: filterRole,
    isActive: filterActive !== "all" ? filterActive === "true" : undefined,
  });

  const adminAvailableStaff = useAvailableStaff();
  const organizerStaff = useOrganizerStaff();

  // Mutation hooks
  const adminAssignStaff = useAssignStaff();
  const organizerAssignStaff = useAssignOrganizerStaff();
  const adminBulkAssign = useBulkAssignStaff();
  const adminUpdateStaff = useUpdateStaffAssignment();
  const organizerUpdateStaff = useUpdateOrganizerStaffAssignment();
  const adminRemoveStaff = useRemoveStaff();
  const organizerRemoveStaff = useRemoveOrganizerStaff();

  const isAdmin = variant === 'admin';
  const eventStaffData = isAdmin ? adminEventStaff.data : organizerEventStaff.data;
  const loading = isAdmin ? adminEventStaff.isLoading : organizerEventStaff.isLoading;
  const availableStaff = (isAdmin ? adminAvailableStaff.data : organizerStaff.data) || [];

  const assignStaffMutation = isAdmin ? adminAssignStaff : organizerAssignStaff;
  const bulkAssignMutation = isAdmin ? adminBulkAssign : null;
  const updateStaffMutation = isAdmin ? adminUpdateStaff : organizerUpdateStaff;
  const removeStaffMutation = isAdmin ? adminRemoveStaff : organizerRemoveStaff;

  const assignments = eventStaffData?.assignments || [];
  const assigning =
    assignStaffMutation.isPending ||
    (bulkAssignMutation?.isPending ?? false) ||
    updateStaffMutation.isPending ||
    removeStaffMutation.isPending;

  const handleAssign = () => {
    if (!selectedStaffId) {
      toast({
        title: "Staff member required",
        description: "Please select a staff member",
        variant: "destructive",
      });
      return;
    }

    const data: AssignStaffToEventData = {
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

  const handleBulkAssign = () => {
    if (selectedStaffIds.length === 0) {
      toast({
        title: "Staff members required",
        description: "Please select at least one staff member",
        variant: "destructive",
      });
      return;
    }

    if (bulkAssignMutation) {
      bulkAssignMutation.mutate(
        {
          eventId,
          staffIds: selectedStaffIds,
          role: selectedRole,
          notes: notes || undefined,
        },
        {
          onSuccess: () => {
            resetForm();
            setShowBulkAssignDialog(false);
          },
        }
      );
    }
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
    setRemovingAssignment(assignment);
  };

  const confirmRemoveStaff = () => {
    if (!removingAssignment) return;
    removeStaffMutation.mutate({
      eventId,
      staffId: removingAssignment.staffId,
    });
    setRemovingAssignment(null);
  };

  const resetForm = () => {
    setSelectedStaffId("");
    setSelectedRole("SCANNER");
    setNotes("");
    setShiftStart("");
    setShiftEnd("");
    setFacility("");
    setSelectedStaffIds([]);
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

  const getStaffTypeBadge = (staffType: string) => {
    return staffType === "ADMIN" ? (
      <Badge variant="outline" className="bg-primary/5 text-primary border-primary">
        Admin
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-success/5 text-success border-success">
        Organizer Admin
      </Badge>
    );
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
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkAssignDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Bulk Assign
                </Button>
              )}
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
            {isAdmin && (
              <div className="flex-1">
                <Label>Staff Type</Label>
                <Select value={filterStaffType} onValueChange={setFilterStaffType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="ORGANIZER_ADMIN">Organizer Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
                        {getStaffTypeBadge(assignment.staffType)}
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

      {/* Bulk Assign Dialog - Admin only */}
      {isAdmin && (
        <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Assign Staff</DialogTitle>
            <DialogDescription>
              Select multiple staff members to assign to this event with the same role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Staff Members</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !selectedStaffIds.includes(value)) {
                    setSelectedStaffIds([...selectedStaffIds, value]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff members" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaffForAssignment.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.firstName} {staff.lastName} ({staff.email}) - {staff.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStaffIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedStaffIds.map((staffId) => {
                    const staff = availableStaff.find((s) => s.id === staffId);
                    return staff ? (
                      <Badge key={staffId} variant="secondary" className="flex items-center gap-1">
                        {staff.firstName} {staff.lastName}
                        <button
                          onClick={() => setSelectedStaffIds(selectedStaffIds.filter((id) => id !== staffId))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkAssignDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={assigning || selectedStaffIds.length === 0}
            >
              {assigning ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                `Assign ${selectedStaffIds.length} Staff`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Remove Staff Confirmation */}
      <AlertDialog open={!!removingAssignment} onOpenChange={(open) => !open && setRemovingAssignment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removingAssignment?.staff.firstName} {removingAssignment?.staff.lastName} from this event?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveStaff}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


