import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/useToast";
import {
  getEventZones,
  createFacilityZone,
  updateFacilityZone,
  deleteFacilityZone,
  bulkAssignAttendeesToZone,
  getZoneAttendees,
  revokeZoneAccess,
  checkZoneCapacity,
  type FacilityZone,
  type AttendeeZoneAccess,
  type ZoneCapacityInfo,
} from "@/lib/facility-zone-api";
import { getEventById } from "@/lib/event-api";
import { getFacilities } from "@/lib/facility-api";

interface Event {
  id: string;
  name: string;
  venueMaxCapacity: number | null;
  venueCurrentOccupancy: number;
}

interface EventFacility {
  id: string;
  name: string;
  type: string;
  maxCapacity: number | null;
}

const FacilityZones: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  useNavigate(); // Keep hook call for potential future use
  const { toast } = useToast();

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [zones, setZones] = useState<FacilityZone[]>([]);
  const [, setFacilities] = useState<EventFacility[]>([]);
  const [selectedZone, setSelectedZone] = useState<FacilityZone | null>(null);
  const [zoneAttendees, setZoneAttendees] = useState<AttendeeZoneAccess[]>([]);
  const [zoneCapacity, setZoneCapacity] = useState<ZoneCapacityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);

  // Form states
  const [zoneName, setZoneName] = useState("");
  const [zoneCode, setZoneCode] = useState("");
  const [maxCapacity, setMaxCapacity] = useState<number | null>(null);
  const [accessStart, setAccessStart] = useState<string>("");
  const [accessEnd, setAccessEnd] = useState<string>("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  // Load data functions wrapped in useCallback
  const loadEventData = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await getEventById(eventId);
      if (response.success && response.data?.event) {
        // Cast through unknown to handle partial type overlap
        setEvent(response.data.event as unknown as Event);
      }
    } catch (error) {
      console.error("Error loading event:", error);
    }
  }, [eventId]);

  const loadZones = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const response = await getEventZones(eventId, { includeCount: true });
      if (response.success && response.data?.zones) {
        setZones(response.data.zones);
        // Select first zone by default
        if (response.data.zones.length > 0) {
          setSelectedZone((prev) => prev ?? response.data!.zones[0]);
        }
      }
    } catch (error) {
      console.error("Error loading zones:", error);
      toast({
        title: "Error",
        description: "Failed to load facility zones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toast]);

  const loadFacilities = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await getFacilities(eventId);
      if (response.success && response.data) {
        // Cast through unknown to handle type differences
        setFacilities(response.data as unknown as EventFacility[]);
      }
    } catch (error) {
      console.error("Error loading facilities:", error);
    }
  }, [eventId]);

  const loadZoneDetails = useCallback(async () => {
    if (!selectedZone) return;
    try {
      // Load attendees
      const attendeesResponse = await getZoneAttendees(selectedZone.id, { isActive: true });
      if (attendeesResponse.success && attendeesResponse.data?.attendees) {
        setZoneAttendees(attendeesResponse.data.attendees);
      }

      // Load capacity info
      const capacityResponse = await checkZoneCapacity(selectedZone.id);
      if (capacityResponse.success && capacityResponse.data?.capacity) {
        setZoneCapacity(capacityResponse.data.capacity);
      }
    } catch (error) {
      console.error("Error loading zone details:", error);
    }
  }, [selectedZone]);

  // Load data
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

  const handleCreateZone = async () => {
    if (!eventId || !zoneName || !zoneCode) {
      toast({
        title: "Validation Error",
        description: "Zone name and code are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await createFacilityZone({
        eventId,
        name: zoneName,
        code: zoneCode,
        maxCapacity: maxCapacity || undefined,
        accessStart: accessStart || undefined,
        accessEnd: accessEnd || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Facility zone created successfully",
        });
        setCreateDialogOpen(false);
        resetForm();
        loadZones();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create facility zone",
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
        toast({
          title: "Success",
          description: "Facility zone updated successfully",
        });
        setEditDialogOpen(false);
        resetForm();
        loadZones();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update facility zone",
        variant: "destructive",
      });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Are you sure you want to delete this zone? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await deleteFacilityZone(zoneId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Facility zone deleted successfully",
        });
        if (selectedZone?.id === zoneId) {
          setSelectedZone(null);
        }
        loadZones();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete facility zone",
        variant: "destructive",
      });
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedZone || selectedAttendees.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one attendee",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await bulkAssignAttendeesToZone(
        selectedZone.id,
        selectedAttendees
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully assigned ${response.data?.successCount || 0} attendees`,
        });
        setBulkAssignDialogOpen(false);
        setSelectedAttendees([]);
        loadZoneDetails();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign attendees",
        variant: "destructive",
      });
    }
  };

  const handleRevokeAccess = async (registrationId: string) => {
    if (!selectedZone) return;

    try {
      const response = await revokeZoneAccess(selectedZone.id, registrationId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Access revoked successfully",
        });
        loadZoneDetails();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke access",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (zone: FacilityZone) => {
    setSelectedZone(zone);
    setZoneName(zone.name);
    setZoneCode(zone.code);
    setMaxCapacity(zone.maxCapacity);
    setAccessStart(zone.accessStart || "");
    setAccessEnd(zone.accessEnd || "");
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setZoneName("");
    setZoneCode("");
    setMaxCapacity(null);
    setAccessStart("");
    setAccessEnd("");
    setSelectedAttendees([]);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 95) return "bg-red-500";
    if (percentage >= 80) return "bg-amber-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getCapacityPercentage = (current: number, max: number | null) => {
    if (!max) return 0;
    return Math.min(100, Math.round((current / max) * 100));
  };

  if (!eventId) {
    return (
        <div className="p-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No Event Selected</h3>
            <p className="mt-2 text-sm text-gray-500">
              Please select an event to manage facility zones
            </p>
          </div>
        </div>
    );
  }

  return (
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                Facility Access Control
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage facility zones, attendee access permissions, and capacity limits for {event?.name}
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Zone
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Facility Zone</DialogTitle>
                  <DialogDescription>
                    Define a new access control zone for facilities
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="zoneName">Zone Name</Label>
                    <Input
                      id="zoneName"
                      placeholder="VIP Lounge"
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zoneCode">Zone Code</Label>
                    <Input
                      id="zoneCode"
                      placeholder="VIP"
                      value={zoneCode}
                      onChange={(e) => setZoneCode(e.target.value.toUpperCase())}
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxCapacity">Maximum Capacity (Optional)</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={maxCapacity || ""}
                      onChange={(e) => setMaxCapacity(e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accessStart">Access Start Time (Optional)</Label>
                    <Input
                      id="accessStart"
                      type="datetime-local"
                      value={accessStart}
                      onChange={(e) => setAccessStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accessEnd">Access End Time (Optional)</Label>
                    <Input
                      id="accessEnd"
                      type="datetime-local"
                      value={accessEnd}
                      onChange={(e) => setAccessEnd(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateZone}>Create Zone</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Loading facility zones...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zone List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Zones ({zones.length})</CardTitle>
                  <CardDescription>Click a zone to view details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {zones.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No zones created yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
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
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedZone(zone)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {zone.code}
                                </Badge>
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {zone.currentOccupancy} / {zone.maxCapacity || "∞"}
                                  </span>
                                </div>
                                {zone._count && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <MapPin className="h-3 w-3" />
                                    <span>{zone._count.facilities || 0} facilities</span>
                                  </div>
                                )}
                              </div>
                              {zone.maxCapacity && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Capacity</span>
                                    <span>{percentage}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${getCapacityColor(percentage)}`}
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
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(zone);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteZone(zone.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
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
                            <CardTitle>Zone Access</CardTitle>
                            <CardDescription>
                              Manage attendees with access to {selectedZone.name}
                            </CardDescription>
                          </div>
                          <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Bulk Assign
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Bulk Assign Attendees</DialogTitle>
                                <DialogDescription>
                                  Grant zone access to multiple attendees at once
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                  This feature requires attendee selection. Integrate with your attendee management system.
                                </p>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleBulkAssign}>Assign</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {zoneAttendees.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">No attendees assigned yet</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Access Count</TableHead>
                                <TableHead>Last Access</TableHead>
                                <TableHead>Actions</TableHead>
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
                                  <TableCell>{access.registration?.user.email}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{access.accessCount}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {access.lastAccessAt
                                      ? new Date(access.lastAccessAt).toLocaleString()
                                      : "Never"}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
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
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Assigned Facilities</CardTitle>
                            <CardDescription>
                              Facilities that belong to {selectedZone.name}
                            </CardDescription>
                          </div>
                          <Button size="sm" className="gap-2" disabled title="Coming soon">
                            <Plus className="h-4 w-4" />
                            Assign Facility
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Facility assignment management - integrate with facility data
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Capacity Tab */}
                  <TabsContent value="capacity">
                    <Card>
                      <CardHeader>
                        <CardTitle>Capacity Overview</CardTitle>
                        <CardDescription>Real-time occupancy monitoring</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {zoneCapacity ? (
                          <div className="space-y-6">
                            <div className="text-center">
                              <div className="relative inline-flex items-center justify-center w-48 h-48">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                  <circle
                                    className="text-gray-200"
                                    strokeWidth="10"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                  />
                                  <circle
                                    className={zoneCapacity.percentage >= 80 ? "text-red-500" : "text-green-500"}
                                    strokeWidth="10"
                                    strokeDasharray={`${zoneCapacity.percentage * 2.51} 251`}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                                  />
                                </svg>
                                <div className="absolute">
                                  <div className="text-4xl font-bold">{zoneCapacity.percentage}%</div>
                                  <div className="text-sm text-gray-600">Capacity</div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-gray-900">{zoneCapacity.currentOccupancy}</div>
                                <div className="text-sm text-gray-600">Current</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {zoneCapacity.maxCapacity || "∞"}
                                </div>
                                <div className="text-sm text-gray-600">Maximum</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {zoneCapacity.remainingSpots !== null ? zoneCapacity.remainingSpots : "∞"}
                                </div>
                                <div className="text-sm text-gray-600">Remaining</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Activity className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">Loading capacity data...</p>
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
                      <Shield className="mx-auto h-16 w-16 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No Zone Selected</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Select a zone from the list to view and manage details
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Edit Zone Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Facility Zone</DialogTitle>
              <DialogDescription>Update zone settings and configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editZoneName">Zone Name</Label>
                <Input
                  id="editZoneName"
                  placeholder="VIP Lounge"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editZoneCode">Zone Code</Label>
                <Input
                  id="editZoneCode"
                  placeholder="VIP"
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="editMaxCapacity">Maximum Capacity (Optional)</Label>
                <Input
                  id="editMaxCapacity"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={maxCapacity || ""}
                  onChange={(e) => setMaxCapacity(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <Label htmlFor="editAccessStart">Access Start Time (Optional)</Label>
                <Input
                  id="editAccessStart"
                  type="datetime-local"
                  value={accessStart}
                  onChange={(e) => setAccessStart(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editAccessEnd">Access End Time (Optional)</Label>
                <Input
                  id="editAccessEnd"
                  type="datetime-local"
                  value={accessEnd}
                  onChange={(e) => setAccessEnd(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateZone}>Update Zone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default FacilityZones;
