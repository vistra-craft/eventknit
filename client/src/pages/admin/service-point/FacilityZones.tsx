import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Plus,
  Users,
  MapPin,
  AlertCircle,
  Trash2,
  Edit,
  UserPlus,
  BarChart3,
  Activity,
  Building2,
  X,
  Search,
  Link,
  Unlink,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import {
  getEventZones,
  createFacilityZone,
  updateFacilityZone,
  deleteFacilityZone,
  bulkAssignAttendeesToZone,
  assignFacilityToZone,
  removeFacilityFromZone,
  getZoneAttendees,
  revokeZoneAccess,
  checkZoneCapacity,
  type FacilityZone,
  type AttendeeZoneAccess,
  type ZoneCapacityInfo,
} from "@/lib/facility-zone-api";
import { getEventById } from "@/lib/event-api";
import { getFacilities, type EventFacility } from "@/lib/facility-api";
import { getEventAttendees, type EventAttendee } from "@/lib/workstation-api";

interface EventSummary {
  id: string;
  name: string;
  venueMaxCapacity: number | null;
  venueCurrentOccupancy: number;
}

const FacilityZones: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();

  // Core state
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [zones, setZones] = useState<FacilityZone[]>([]);
  const [facilities, setFacilities] = useState<EventFacility[]>([]);
  const [selectedZone, setSelectedZone] = useState<FacilityZone | null>(null);
  const [zoneAttendees, setZoneAttendees] = useState<AttendeeZoneAccess[]>([]);
  const [zoneCapacity, setZoneCapacity] = useState<ZoneCapacityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);

  // Bulk assign state
  const [allAttendees, setAllAttendees] = useState<EventAttendee[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>([]);
  const [assignMode, setAssignMode] = useState<"manual" | "ticket_type">("manual");
  const [selectedTicketType, setSelectedTicketType] = useState<string>("all");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  // Zone form fields
  const [zoneName, setZoneName] = useState("");
  const [zoneCode, setZoneCode] = useState("");
  const [maxCapacity, setMaxCapacity] = useState<number | null>(null);
  const [accessStart, setAccessStart] = useState<string>("");
  const [accessEnd, setAccessEnd] = useState<string>("");

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadEventData = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await getEventById(eventId);
      if (response.success && response.data?.event) {
        const ev = response.data.event;
        setEvent({
          id: ev.id,
          name: ev.title,
          venueMaxCapacity: typeof ev.capacity === "number" ? ev.capacity : null,
          venueCurrentOccupancy: 0,
        });
      }
    } catch (err) {
      console.error("Error loading event:", err);
    }
  }, [eventId]);

  const loadZones = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const response = await getEventZones(eventId, { includeCount: true });
      if (response.success && response.data?.zones) {
        setZones(response.data.zones);
        if (response.data.zones.length > 0) {
          setSelectedZone((prev) => prev ?? response.data!.zones[0]);
        }
      }
    } catch (err) {
      console.error("Error loading zones:", err);
      toast({ title: "Error", description: "Failed to load facility zones", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toast]);

  const loadFacilities = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await getFacilities(eventId);
      if (response.success && response.data) {
        setFacilities(response.data);
      }
    } catch (err) {
      console.error("Error loading facilities:", err);
    }
  }, [eventId]);

  const loadZoneDetails = useCallback(async () => {
    if (!selectedZone) return;
    try {
      const [attendeesRes, capacityRes] = await Promise.all([
        getZoneAttendees(selectedZone.id, { isActive: true }),
        checkZoneCapacity(selectedZone.id),
      ]);
      if (attendeesRes.success && attendeesRes.data?.attendees) {
        setZoneAttendees(attendeesRes.data.attendees);
      }
      if (capacityRes.success && capacityRes.data?.capacity) {
        setZoneCapacity(capacityRes.data.capacity);
      }
    } catch (err) {
      console.error("Error loading zone details:", err);
    }
  }, [selectedZone]);

  useEffect(() => {
    if (eventId) {
      loadEventData();
      loadZones();
      loadFacilities();
    }
  }, [eventId, loadEventData, loadZones, loadFacilities]);

  useEffect(() => {
    if (selectedZone) {
      loadZoneDetails();
    }
  }, [selectedZone, loadZoneDetails]);

  // ── Zone CRUD ─────────────────────────────────────────────────────────────

  const handleCreateZone = async () => {
    if (!eventId || !zoneName || !zoneCode) {
      toast({ title: "Validation Error", description: "Zone name and code are required", variant: "destructive" });
      return;
    }
    try {
      const response = await createFacilityZone({
        eventId,
        name: zoneName,
        code: zoneCode,
        maxCapacity: maxCapacity ?? undefined,
        accessStart: accessStart || undefined,
        accessEnd: accessEnd || undefined,
      });
      if (response.success) {
        toast({ title: "Success", description: "Facility zone created" });
        setCreateDialogOpen(false);
        resetZoneForm();
        loadZones();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create facility zone",
        variant: "destructive",
      });
    }
  };

  const handleUpdateZone = async () => {
    if (!selectedZone) return;
    try {
      const response = await updateFacilityZone(selectedZone.id, {
        name: zoneName,
        code: zoneCode,
        maxCapacity,
        accessStart: accessStart || null,
        accessEnd: accessEnd || null,
      });
      if (response.success) {
        toast({ title: "Success", description: "Facility zone updated" });
        setEditDialogOpen(false);
        resetZoneForm();
        loadZones();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update facility zone",
        variant: "destructive",
      });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Are you sure you want to delete this zone? This action cannot be undone.")) return;
    try {
      const response = await deleteFacilityZone(zoneId);
      if (response.success) {
        toast({ title: "Success", description: "Facility zone deleted" });
        if (selectedZone?.id === zoneId) setSelectedZone(null);
        loadZones();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete facility zone",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (zone: FacilityZone) => {
    setSelectedZone(zone);
    setZoneName(zone.name);
    setZoneCode(zone.code);
    setMaxCapacity(zone.maxCapacity);
    setAccessStart(zone.accessStart ?? "");
    setAccessEnd(zone.accessEnd ?? "");
    setEditDialogOpen(true);
  };

  const resetZoneForm = () => {
    setZoneName("");
    setZoneCode("");
    setMaxCapacity(null);
    setAccessStart("");
    setAccessEnd("");
  };

  // ── Bulk Assign ───────────────────────────────────────────────────────────

  const openBulkAssignDialog = async () => {
    setBulkAssignDialogOpen(true);
    setSelectedRegistrationIds([]);
    setAttendeeSearch("");
    setAssignMode("manual");
    setSelectedTicketType("all");

    // Load all event attendees for selection
    if (eventId && allAttendees.length === 0) {
      try {
        setIsLoadingAttendees(true);
        const res = await getEventAttendees(eventId, 1, 500);
        if (res.success && res.data?.attendees) {
          setAllAttendees(res.data.attendees);
        }
      } catch (err) {
        console.error("Failed to load attendees for bulk assign:", err);
        toast({ title: "Error", description: "Failed to load attendees", variant: "destructive" });
      } finally {
        setIsLoadingAttendees(false);
      }
    }
  };

  // Unique ticket types for the auto-assign by ticket type dropdown
  const ticketTypes = useMemo(() => {
    const types = new Set(allAttendees.map((a) => a.ticketType).filter(Boolean) as string[]);
    return Array.from(types).sort();
  }, [allAttendees]);

  // Filtered attendees in bulk-assign dialog
  const filteredBulkAttendees = useMemo(() => {
    return allAttendees.filter((a) => {
      if (attendeeSearch) {
        const term = attendeeSearch.toLowerCase();
        if (
          !a.attendeeName.toLowerCase().includes(term) &&
          !a.email.toLowerCase().includes(term)
        )
          return false;
      }
      return true;
    });
  }, [allAttendees, attendeeSearch]);

  // When ticket-type mode is selected, auto-select matching registrations
  const effectiveRegistrationIds = useMemo(() => {
    if (assignMode === "ticket_type") {
      if (selectedTicketType === "all") return allAttendees.map((a) => a.registrationId);
      return allAttendees
        .filter((a) => a.ticketType === selectedTicketType)
        .map((a) => a.registrationId);
    }
    return selectedRegistrationIds;
  }, [assignMode, selectedTicketType, allAttendees, selectedRegistrationIds]);

  const handleBulkAssign = async () => {
    if (!selectedZone || effectiveRegistrationIds.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one attendee", variant: "destructive" });
      return;
    }
    try {
      setIsAssigning(true);
      const response = await bulkAssignAttendeesToZone(selectedZone.id, effectiveRegistrationIds);
      if (response.success) {
        toast({
          title: "Success",
          description: `Granted access to ${response.data?.successCount ?? effectiveRegistrationIds.length} attendees`,
        });
        setBulkAssignDialogOpen(false);
        setSelectedRegistrationIds([]);
        loadZoneDetails();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to assign attendees",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleAttendeeSelection = (registrationId: string) => {
    setSelectedRegistrationIds((prev) =>
      prev.includes(registrationId)
        ? prev.filter((id) => id !== registrationId)
        : [...prev, registrationId]
    );
  };

  // ── Facility assignment ───────────────────────────────────────────────────

  const handleAssignFacility = async (facilityId: string) => {
    if (!selectedZone) return;
    try {
      const response = await assignFacilityToZone(selectedZone.id, facilityId);
      if (response.success) {
        toast({ title: "Success", description: "Facility linked to zone" });
        loadZones();
        loadZoneDetails();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to assign facility",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFacility = async (facilityId: string) => {
    if (!selectedZone) return;
    try {
      const response = await removeFacilityFromZone(selectedZone.id, facilityId);
      if (response.success) {
        toast({ title: "Success", description: "Facility removed from zone" });
        loadZones();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove facility",
        variant: "destructive",
      });
    }
  };

  const handleRevokeAccess = async (registrationId: string) => {
    if (!selectedZone) return;
    try {
      const response = await revokeZoneAccess(selectedZone.id, registrationId);
      if (response.success) {
        toast({ title: "Success", description: "Access revoked" });
        loadZoneDetails();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to revoke access",
        variant: "destructive",
      });
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getCapacityProgressColor = (percentage: number) => {
    if (percentage >= 95) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    if (percentage >= 60) return "bg-primary";
    return "bg-success";
  };

  const getCapacityTextColor = (percentage: number) => {
    if (percentage >= 95) return "text-destructive";
    if (percentage >= 80) return "text-warning";
    if (percentage >= 60) return "text-primary";
    return "text-success";
  };

  const getCapacityPercentage = (current: number, max: number | null) => {
    if (!max) return 0;
    return Math.min(100, Math.round((current / max) * 100));
  };

  // Facilities already linked to the selected zone
  const linkedFacilityIds = useMemo(() => {
    return new Set(
      (selectedZone?.facilities ?? []).map((m) => m.facilityId)
    );
  }, [selectedZone]);

  // ── Render guards ─────────────────────────────────────────────────────────

  if (!eventId) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No Event Selected</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Please select an event to manage facility zones
          </p>
        </div>
      </div>
    );
  }

  const ZoneForm = ({ isEdit }: { isEdit: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor={isEdit ? "editZoneName" : "zoneName"}>Zone Name</Label>
        <Input
          id={isEdit ? "editZoneName" : "zoneName"}
          placeholder="VIP Lounge"
          value={zoneName}
          onChange={(e) => setZoneName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={isEdit ? "editZoneCode" : "zoneCode"}>Zone Code</Label>
        <Input
          id={isEdit ? "editZoneCode" : "zoneCode"}
          placeholder="VIP"
          value={zoneCode}
          onChange={(e) => setZoneCode(e.target.value.toUpperCase())}
          maxLength={10}
        />
      </div>
      <div>
        <Label htmlFor={isEdit ? "editMaxCapacity" : "maxCapacity"}>Maximum Capacity (optional)</Label>
        <Input
          id={isEdit ? "editMaxCapacity" : "maxCapacity"}
          type="number"
          placeholder="Leave empty for unlimited"
          value={maxCapacity ?? ""}
          onChange={(e) => setMaxCapacity(e.target.value ? Number(e.target.value) : null)}
        />
      </div>
      <div>
        <Label htmlFor={isEdit ? "editAccessStart" : "accessStart"}>Access Start (optional)</Label>
        <Input
          id={isEdit ? "editAccessStart" : "accessStart"}
          type="datetime-local"
          value={accessStart}
          onChange={(e) => setAccessStart(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={isEdit ? "editAccessEnd" : "accessEnd"}>Access End (optional)</Label>
        <Input
          id={isEdit ? "editAccessEnd" : "accessEnd"}
          type="datetime-local"
          value={accessEnd}
          onChange={(e) => setAccessEnd(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <BackButton />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-7 w-7 text-primary" />
              Facility Access Control
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage access zones, attendee permissions, and capacity limits
              {event ? ` · ${event.name}` : ""}
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetZoneForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Zone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Facility Zone</DialogTitle>
                <DialogDescription>Define a new access control zone for this event</DialogDescription>
              </DialogHeader>
              <ZoneForm isEdit={false} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateZone}>Create Zone</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Zone Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Facility Zone</DialogTitle>
            <DialogDescription>Update zone settings and configuration</DialogDescription>
          </DialogHeader>
          <ZoneForm isEdit={true} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateZone}>Update Zone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Grant Zone Access</DialogTitle>
            <DialogDescription>
              Assign attendees to <strong>{selectedZone?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Assignment mode tabs */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={assignMode === "manual" ? "default" : "outline"}
                onClick={() => setAssignMode("manual")}
              >
                Select Attendees
              </Button>
              <Button
                size="sm"
                variant={assignMode === "ticket_type" ? "default" : "outline"}
                onClick={() => setAssignMode("ticket_type")}
              >
                By Ticket Type
              </Button>
            </div>

            {assignMode === "ticket_type" ? (
              <div className="space-y-3">
                <Label>Ticket Type</Label>
                <Select value={selectedTicketType} onValueChange={setSelectedTicketType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ticket Types ({allAttendees.length} attendees)</SelectItem>
                    {ticketTypes.map((type) => {
                      const count = allAttendees.filter((a) => a.ticketType === type).length;
                      return (
                        <SelectItem key={type} value={type}>
                          {type} ({count} attendees)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {effectiveRegistrationIds.length} attendee
                  {effectiveRegistrationIds.length !== 1 ? "s" : ""} will be granted access
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Attendee list */}
                <div className="border border-border/40 rounded-lg overflow-auto flex-1 max-h-72">
                  {isLoadingAttendees ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader size="sm" />
                    </div>
                  ) : filteredBulkAttendees.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      No attendees found
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {/* Select all row */}
                      <div className="flex items-center gap-3 px-3 py-2 bg-muted/30">
                        <Checkbox
                          checked={
                            filteredBulkAttendees.length > 0 &&
                            filteredBulkAttendees.every((a) =>
                              selectedRegistrationIds.includes(a.registrationId)
                            )
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRegistrationIds((prev) => [
                                ...new Set([...prev, ...filteredBulkAttendees.map((a) => a.registrationId)]),
                              ]);
                            } else {
                              const filteredIds = new Set(filteredBulkAttendees.map((a) => a.registrationId));
                              setSelectedRegistrationIds((prev) => prev.filter((id) => !filteredIds.has(id)));
                            }
                          }}
                        />
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          Select all ({filteredBulkAttendees.length})
                        </span>
                      </div>
                      {filteredBulkAttendees.map((attendee) => (
                        <div
                          key={attendee.registrationId}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleAttendeeSelection(attendee.registrationId)}
                        >
                          <Checkbox
                            checked={selectedRegistrationIds.includes(attendee.registrationId)}
                            onCheckedChange={() => toggleAttendeeSelection(attendee.registrationId)}
                          />
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                            {attendee.attendeeName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attendee.attendeeName}</p>
                            <p className="text-xs text-muted-foreground truncate">{attendee.email}</p>
                          </div>
                          {attendee.ticketType && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {attendee.ticketType}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {selectedRegistrationIds.length} attendee
                  {selectedRegistrationIds.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkAssign}
              disabled={isAssigning || effectiveRegistrationIds.length === 0}
            >
              {isAssigning ? <Loader size="sm" className="mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Grant Access ({effectiveRegistrationIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader size="lg" className="mb-4" />
            <p className="text-sm text-muted-foreground">Loading facility zones...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zone List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zones ({zones.length})</CardTitle>
                <CardDescription>Click a zone to manage it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {zones.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No zones created yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      Create First Zone
                    </Button>
                  </div>
                ) : (
                  zones.map((zone) => {
                    const percentage = getCapacityPercentage(zone.currentOccupancy, zone.maxCapacity);
                    const isSelected = selectedZone?.id === zone.id;

                    return (
                      <div
                        key={zone.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border/40 hover:border-border hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedZone(zone)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground text-sm">{zone.name}</h3>
                              <Badge variant="secondary" className="text-xs">{zone.code}</Badge>
                            </div>
                            <div className="mt-1.5 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{zone.currentOccupancy} / {zone.maxCapacity ?? "∞"}</span>
                              </div>
                              {zone._count && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{zone._count.facilities ?? 0} facilities</span>
                                </div>
                              )}
                            </div>
                            {zone.maxCapacity && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Capacity</span>
                                  <span className={getCapacityTextColor(percentage)}>{percentage}%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${getCapacityProgressColor(percentage)}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="ml-2 flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => { e.stopPropagation(); openEditDialog(zone); }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Zone Details */}
          <div className="lg:col-span-2">
            {selectedZone ? (
              <Tabs defaultValue="attendees" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="attendees" className="gap-2">
                    <Users className="h-4 w-4" />
                    Attendees
                  </TabsTrigger>
                  <TabsTrigger value="facilities" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Facilities
                  </TabsTrigger>
                  <TabsTrigger value="capacity" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Capacity
                  </TabsTrigger>
                </TabsList>

                {/* Attendees Tab */}
                <TabsContent value="attendees">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">Zone Access</CardTitle>
                          <CardDescription>
                            Attendees with access to {selectedZone.name}
                          </CardDescription>
                        </div>
                        <Button size="sm" className="gap-2" onClick={openBulkAssignDialog}>
                          <UserPlus className="h-4 w-4" />
                          Grant Access
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {zoneAttendees.length === 0 ? (
                        <div className="text-center py-10">
                          <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">No attendees have access to this zone</p>
                          <Button size="sm" variant="outline" className="mt-3 gap-2" onClick={openBulkAssignDialog}>
                            <UserPlus className="h-4 w-4" />
                            Grant Access
                          </Button>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Access Count</TableHead>
                              <TableHead>Last Access</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {zoneAttendees.map((access) => (
                              <TableRow key={access.id}>
                                <TableCell className="font-medium">
                                  {access.registration
                                    ? `${access.registration.user.firstName} ${access.registration.user.lastName}`
                                    : "Unknown"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {access.registration?.user.email ?? "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{access.accessCount}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {access.lastAccessAt
                                    ? new Date(access.lastAccessAt).toLocaleString()
                                    : "Never"}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRevokeAccess(access.registrationId)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Facilities Tab */}
                <TabsContent value="facilities">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Assigned Facilities</CardTitle>
                      <CardDescription>
                        Facilities that belong to {selectedZone.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {facilities.length === 0 ? (
                        <div className="text-center py-10">
                          <MapPin className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No facilities configured for this event yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {facilities.map((facility) => {
                            const isLinked = linkedFacilityIds.has(facility.id);
                            return (
                              <div
                                key={facility.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  isLinked
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-border/40 hover:bg-muted/30"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-foreground">{facility.name}</p>
                                    <p className="text-xs text-muted-foreground">{facility.code}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isLinked ? "outline" : "default"}
                                  className="gap-1.5"
                                  onClick={() =>
                                    isLinked
                                      ? handleRemoveFacility(facility.id)
                                      : handleAssignFacility(facility.id)
                                  }
                                >
                                  {isLinked ? (
                                    <>
                                      <Unlink className="h-3.5 w-3.5" />
                                      Remove
                                    </>
                                  ) : (
                                    <>
                                      <Link className="h-3.5 w-3.5" />
                                      Link
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Capacity Tab */}
                <TabsContent value="capacity">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Capacity Overview</CardTitle>
                      <CardDescription>Real-time occupancy monitoring</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {zoneCapacity ? (
                        <div className="space-y-6">
                          {/* Circular gauge */}
                          <div className="flex justify-center">
                            <div className="relative inline-flex items-center justify-center w-44 h-44">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                  className="text-muted"
                                  strokeWidth="10"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r="40"
                                  cx="50"
                                  cy="50"
                                />
                                <circle
                                  className={zoneCapacity.percentage >= 80 ? "text-destructive" : "text-success"}
                                  strokeWidth="10"
                                  strokeDasharray={`${zoneCapacity.percentage * 2.51} 251`}
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r="40"
                                  cx="50"
                                  cy="50"
                                />
                              </svg>
                              <div className="absolute text-center">
                                <div className="text-3xl font-bold text-foreground">{zoneCapacity.percentage}%</div>
                                <div className="text-xs text-muted-foreground">Capacity</div>
                              </div>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <div className="text-2xl font-bold text-foreground">{zoneCapacity.currentOccupancy}</div>
                              <div className="text-xs text-muted-foreground mt-1">Current</div>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <div className="text-2xl font-bold text-foreground">
                                {zoneCapacity.maxCapacity ?? "∞"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">Maximum</div>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <div className="text-2xl font-bold text-foreground">
                                {zoneCapacity.remainingSpots !== null ? zoneCapacity.remainingSpots : "∞"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">Remaining</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40">
                          <div className="text-center">
                            <Activity className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">No capacity data available</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center">
                    <Shield className="mx-auto h-14 w-14 text-muted-foreground/40 mb-3" />
                    <h3 className="text-base font-medium text-foreground">No Zone Selected</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Select a zone from the list to view and manage details
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityZones;
