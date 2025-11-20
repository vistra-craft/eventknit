import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  assignAdminStaffToEvent,
  getEventStaff,
  updateStaffAssignment,
  removeStaffFromEvent,
  bulkAssignStaff,
  type EventStaffAssignment as EventStaffAssignmentType,
  type EventStaffRole,
  type AssignStaffToEventData,
} from "@/lib/admin-api";
import { getUsers, type User } from "@/lib/admin-api";
import { UserRole } from "@/types/auth";

interface EventStaffAssignmentProps {
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

const STAFF_ROLES: UserRole[] = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN_STAFF,
  UserRole.MARKETER,
  UserRole.SUPPORT,
  UserRole.TELLER,
];

export const EventStaffAssignment: React.FC<EventStaffAssignmentProps> = ({
  eventId,
  eventTitle,
}) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<EventStaffAssignmentType[]>([]);
  const [availableStaff, setAvailableStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EventStaffAssignmentType | null>(null);
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

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        role?: string;
        staffType?: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
        isActive?: boolean;
      } = {};

      if (filterRole !== "all") filters.role = filterRole;
      if (filterStaffType !== "all") {
        filters.staffType = filterStaffType as 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
      }
      if (filterActive !== "all") {
        filters.isActive = filterActive === "true";
      }

      const response = await getEventStaff(eventId, filters);
      if (response.success && response.data) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load staff assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, filterRole, filterStaffType, filterActive, toast]);

  const fetchAvailableStaff = useCallback(async () => {
    try {
      const response = await getUsers({
        role: undefined, // Get all staff roles
        status: "ACTIVE",
      });

      if (response.success && response.data) {
        // Filter to only staff roles
        const staff = response.data.users.filter((user) =>
          STAFF_ROLES.includes(user.role as UserRole)
        );
        setAvailableStaff(staff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchAvailableStaff();
  }, [fetchAssignments, fetchAvailableStaff]);

  const handleAssign = async () => {
    if (!selectedStaffId) {
      toast({
        title: "Error",
        description: "Please select a staff member",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigning(true);
      const data: AssignStaffToEventData = {
        staffId: selectedStaffId,
        role: selectedRole,
        notes: notes || undefined,
        shiftStart: shiftStart || undefined,
        shiftEnd: shiftEnd || undefined,
        facility: facility || undefined,
      };

      await assignAdminStaffToEvent(eventId, data);
      toast({
        title: "Success",
        description: "Staff assigned to event successfully",
      });
      resetForm();
      setShowAssignDialog(false);
      fetchAssignments();
    } catch (error) {
      console.error("Error assigning staff:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign staff",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedStaffIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one staff member",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigning(true);
      await bulkAssignStaff(eventId, selectedStaffIds, selectedRole, notes || undefined);
      toast({
        title: "Success",
        description: `${selectedStaffIds.length} staff members assigned successfully`,
      });
      resetForm();
      setShowBulkAssignDialog(false);
      fetchAssignments();
    } catch (error) {
      console.error("Error bulk assigning staff:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign staff",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdate = async (assignment: EventStaffAssignmentType) => {
    try {
      setAssigning(true);
      await updateStaffAssignment(eventId, assignment.staffId, {
        role: selectedRole,
        notes: notes || undefined,
        isActive: assignment.isActive,
        shiftStart: shiftStart || null,
        shiftEnd: shiftEnd || null,
        facility: facility || null,
      });
      toast({
        title: "Success",
        description: "Assignment updated successfully",
      });
      resetForm();
      setEditingAssignment(null);
      fetchAssignments();
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assignment",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (assignment: EventStaffAssignmentType) => {
    if (!confirm(`Are you sure you want to remove ${assignment.staff.firstName} ${assignment.staff.lastName} from this event?`)) {
      return;
    }

    try {
      setAssigning(true);
      await removeStaffFromEvent(eventId, assignment.staffId);
      toast({
        title: "Success",
        description: "Staff removed from event successfully",
      });
      fetchAssignments();
    } catch (error) {
      console.error("Error removing staff:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove staff",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
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
      SCANNER: "bg-blue-100 text-blue-800",
      SUPPORT: "bg-purple-100 text-purple-800",
      MANAGER: "bg-orange-100 text-orange-800",
      COORDINATOR: "bg-green-100 text-green-800",
      SUPERVISOR: "bg-red-100 text-red-800",
      TICKET_SELLER: "bg-yellow-100 text-yellow-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getStaffTypeBadge = (staffType: string) => {
    return staffType === "ADMIN_STAFF" ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Admin Staff
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Organizer Staff
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkAssignDialog(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Bulk Assign
              </Button>
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
            <div className="flex-1">
              <Label>Staff Type</Label>
              <Select value={filterStaffType} onValueChange={setFilterStaffType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ADMIN_STAFF">Admin Staff</SelectItem>
                  <SelectItem value="ORGANIZER_STAFF">Organizer Staff</SelectItem>
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
              <Loader2 className="h-6 w-6 animate-spin" />
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
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingAssignment ? "Updating..." : "Assigning..."}
                </>
              ) : (
                editingAssignment ? "Update" : "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign ${selectedStaffIds.length} Staff`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


