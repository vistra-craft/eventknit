import { useState, useEffect, useCallback } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { 
  UserPlus, 
  QrCode, 
  User,
  Search,
  Clock,
  CheckCircle,
  Mail,
  Phone,
  Edit,
  Trash2,
  BarChart3,
  Users,
  Calendar,
  Award,
  Target,
  RefreshCw,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { ButtonLoader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import { useIsMobile } from "@/hooks/useMobile";
import {
  getOrganizerStaff,
  createOrganizerStaff,
  updateOrganizerStaff,
  deleteOrganizerStaff,
  getOrganizerStaffAssignments,
  getOrganizerTeamSummary,
  getOrganizerTeamPerformance,
  getOrganizerStaffUtilization,
  getEventCoverageAnalysis,
  getStaffAvailability,
  getRoleTemplates,
  type OrganizerStaff,
  type CreateOrganizerStaffData,
  type UpdateOrganizerStaffData,
  type PerformancePeriod,
  type StaffPerformanceMetrics,
  type TeamPerformanceSummary,
  type StaffUtilization,
  type EventCoverage,
  type StaffAvailability,
  type TeamRoleTemplate,
} from "@/lib/organizer-api";

const StaffManagement = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"staff" | "performance">("staff");
  
  // Staff List Tab State
  const [staff, setStaff] = useState<OrganizerStaff[]>([]);
  const [customRoles, setCustomRoles] = useState<TeamRoleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<OrganizerStaff | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Add/Edit Form State
  const [formData, setFormData] = useState<CreateOrganizerStaffData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "ORGANIZER_STAFF",
  });
  
  // Edit form state (includes customRoleId)
  const [editFormData, setEditFormData] = useState<UpdateOrganizerStaffData & { customRoleId?: string | null }>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    customRoleId: null,
  });
  
  // Performance Tab State
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [period, setPeriod] = useState<PerformancePeriod>("month");
  const [performanceTab, setPerformanceTab] = useState<"overview" | "utilization" | "coverage" | "availability">("overview");
  const [teamSummary, setTeamSummary] = useState<TeamPerformanceSummary | null>(null);
  const [teamPerformance, setTeamPerformance] = useState<StaffPerformanceMetrics[]>([]);
  const [utilization, setUtilization] = useState<StaffUtilization | null>(null);
  const [coverage, setCoverage] = useState<EventCoverage | null>(null);
  const [availability, setAvailability] = useState<StaffAvailability | null>(null);

  // Fetch custom roles
  const fetchCustomRoles = useCallback(async () => {
    try {
      const response = await getRoleTemplates(true); // Only active roles
      if (response.success && response.data) {
        setCustomRoles(response.data.templates);
      }
    } catch (error) {
    }
  }, []);

  // Fetch staff list
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrganizerStaff();
      if (response.success && response.data) {
        setStaff(response.data.staff);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      setPerformanceLoading(true);
      const [summaryRes, teamRes, utilizationRes, coverageRes, availabilityRes] = await Promise.all([
        getOrganizerTeamSummary(period),
        getOrganizerTeamPerformance(period, 10),
        getOrganizerStaffUtilization(period),
        getEventCoverageAnalysis(period),
        getStaffAvailability(period),
      ]);

      if (summaryRes.success) setTeamSummary(summaryRes.data);
      if (teamRes.success) setTeamPerformance(teamRes.data.performances);
      if (utilizationRes.success) setUtilization(utilizationRes.data);
      if (coverageRes.success) setCoverage(coverageRes.data);
      if (availabilityRes.success) setAvailability(availabilityRes.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      });
    } finally {
      setPerformanceLoading(false);
    }
  }, [period, toast]);

  useEffect(() => {
    if (activeTab === "staff") {
      fetchStaff();
    } else {
      fetchPerformanceData();
    }
  }, [activeTab, fetchStaff, fetchPerformanceData]);

  // Filter staff
  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    const matchesStatus = filterStatus === "all" || member.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStaff.length / limit);
  const staffStartIndex = (page - 1) * limit;
  const staffEndIndex = staffStartIndex + limit;
  const paginatedStaff = filteredStaff.slice(staffStartIndex, staffEndIndex);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  // Get stats from assignments
  const [assignments, setAssignments] = useState<{ staffId: string; eventId: string }[]>([]);
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await getOrganizerStaffAssignments();
        if (response.success && response.data) {
          setAssignments(response.data.assignments);
        }
      } catch (error) {
      }
    };
    fetchAssignments();
  }, []);

  const getStaffStats = (staffId: string) => {
    const staffAssignments = assignments.filter(a => a.staffId === staffId);
    const eventsAssigned = new Set(staffAssignments.map(a => a.eventId)).size;
    // For tickets scanned, we'd need to query ticket scans - this would require additional API
    const ticketsScanned = 0; // Placeholder - would need getStaffPerformance or similar
    return { eventsAssigned, ticketsScanned };
  };

  // Handle add staff
  const handleAddStaff = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await createOrganizerStaff(formData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member created successfully",
        });
        setShowAddDialog(false);
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phoneNumber: "",
          role: "ORGANIZER_STAFF",
        });
        fetchStaff();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create staff member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit staff
  const handleEditStaff = async () => {
    if (!editingStaff || !formData.firstName || !formData.lastName) {
      return;
    }

    try {
      setSubmitting(true);
      const updateData: UpdateOrganizerStaffData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || undefined,
      };
      const response = await updateOrganizerStaff(editingStaff.id, updateData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member updated successfully",
        });
        setShowEditDialog(false);
        setEditingStaff(null);
        fetchStaff();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update staff member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete staff
  const handleDeleteStaff = async () => {
    if (!deletingStaffId) return;

    try {
      setSubmitting(true);
      const response = await deleteOrganizerStaff(deletingStaffId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Staff member deleted successfully",
        });
        setShowDeleteDialog(false);
        setDeletingStaffId(null);
        fetchStaff();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete staff member",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (staffMember: OrganizerStaff) => {
    setEditingStaff(staffMember);
    setEditFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      phoneNumber: staffMember.phoneNumber || "",
      customRoleId: staffMember.customRoleId || null,
    });
    setShowEditDialog(true);
  };

  // Fetch data on mount
  useEffect(() => {
    fetchCustomRoles();
  }, [fetchCustomRoles]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ORGANIZER_STAFF': return 'Staff';
      case 'ORGANIZER_TELLER': return 'Teller';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return "bg-success-light text-success";
      case 'SUSPENDED': return "bg-warning/10 text-warning";
      case 'DEACTIVATED': return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getCoverageBadge = (status: "adequate" | "understaffed" | "overstaffed") => {
    switch (status) {
      case "adequate":
        return <Badge className="bg-success-light text-success">Adequate</Badge>;
      case "understaffed":
        return <Badge className="bg-destructive/10 text-destructive">Understaffed</Badge>;
      case "overstaffed":
        return <Badge className="bg-warning/10 text-warning">Overstaffed</Badge>;
    }
  };

  const activeStaffCount = staff.filter(m => m.status === 'ACTIVE').length;
  const totalStaffCount = staff.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-page-title mb-2">Staff Management</h1>
          <p className="text-page-subtitle">
            Manage your event staff and track performance
          </p>
        </div>
        {activeTab === "staff" && (
        <Button 
            onClick={() => setShowAddDialog(true)}
            className="w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "staff" ? "default" : "ghost"}
          onClick={() => setActiveTab("staff")}
          className="rounded-b-none"
        >
          <Users className="h-4 w-4 mr-2" />
          Staff List
        </Button>
        <Button
          variant={activeTab === "performance" ? "default" : "ghost"}
          onClick={() => setActiveTab("performance")}
          className="rounded-b-none"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>

      {/* Staff List Tab */}
      {activeTab === "staff" && (
        <>
      {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold text-foreground">{totalStaffCount}</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                    <p className="text-2xl font-bold text-foreground">{activeStaffCount}</p>
              </div>
                  <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-medium text-muted-foreground">Events Assigned</p>
                    <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
              </div>
                  <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                      {staff.filter(m => m.status === 'SUSPENDED').length}
                </p>
              </div>
                  <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="ORGANIZER_STAFF">Staff</SelectItem>
                      <SelectItem value="ORGANIZER_TELLER">Teller</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Staff List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Staff Members</CardTitle>
            <Select value={limit.toString()} onValueChange={(value) => {
              setLimit(parseInt(value, 10));
              setPage(1);
            }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size="md" />
                </div>
              ) : paginatedStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No staff members found
                </div>
              ) : (
                <>
          <div className="space-y-4">
                    {paginatedStaff.map((member) => {
                      const stats = getStaffStats(member.id);
                      return (
              <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-foreground">
                                  {member.firstName} {member.lastName}
                                </h3>
                                {member.isEmailVerified && (
                        <Badge className="bg-success-light text-success text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                        </Badge>
                      )}
                    </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {member.email}
                      </span>
                                {member.phoneNumber && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                                    {member.phoneNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2 flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getRoleLabel(member.role)}
                      </Badge>
                      {member.customRole && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                          {member.customRole.name}
                        </Badge>
                      )}
                      <Badge className={`text-xs ${getStatusColor(member.status)}`}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                          <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <div className="text-muted-foreground">
                                Events: <span className="font-medium text-foreground">{stats.eventsAssigned}</span>
                    </div>
                  </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(member)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeletingStaffId(member.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
                        </div>
                      );
                    })}
          </div>
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div className={`space-y-4 md:space-y-6 ${isMobile ? "p-4" : ""}`}>
          {/* Performance Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className={`${isMobile ? "text-xl" : "text-section-header"}`}>Staff Performance</h2>
              <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>
                Track staff efficiency and ticket scanning metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(value) => setPeriod(value as PerformancePeriod)}>
                <SelectTrigger className={isMobile ? "w-full" : "w-[180px]"}>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchPerformanceData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {!isMobile && "Refresh"}
              </Button>
            </div>
          </div>

          {/* Performance Sub-tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "overview", label: "Overview" },
              { id: "utilization", label: "Utilization" },
              { id: "coverage", label: "Coverage" },
              { id: "availability", label: "Availability" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={performanceTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setPerformanceTab(tab.id as typeof performanceTab)}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {performanceLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader size="lg" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {performanceTab === "overview" && teamSummary && (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{teamSummary.totalStaff}</div>
                        <p className="text-xs text-muted-foreground">{teamSummary.activeStaff} active</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(teamSummary.totalScans)}</div>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(teamSummary.averageScansPerStaff)} avg per staff
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatPercentage(teamSummary.averageAttendanceRate)}
                        </div>
                        <p className="text-xs text-muted-foreground">Average attendance</p>
        </CardContent>
      </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(teamSummary.totalEvents)}</div>
                        <p className="text-xs text-muted-foreground">Events assigned</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Performers */}
                  {teamPerformance.length > 0 && (
      <Card>
        <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                          {teamPerformance.map((performance, index) => (
                            <div
                              key={performance.staffId}
                              className={`flex ${isMobile ? "flex-col" : "items-center justify-between"} gap-3 ${isMobile ? "p-3" : "p-4"} border rounded-lg hover:bg-muted/50 transition-colors`}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className={`flex items-center justify-center ${isMobile ? "w-10 h-10" : "w-12 h-12"} rounded-full bg-primary/10`}>
                                  {index < 3 ? (
                                    <Award className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} text-primary`} />
                                  ) : (
                                    <span className={`${isMobile ? "text-sm" : "text-base"} font-semibold text-primary`}>
                                      #{index + 1}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className={`${isMobile ? "text-base" : ""} font-semibold`}>
                                      {performance.staffName}
                                    </h3>
                                    <Badge variant="outline">{performance.role}</Badge>
                                  </div>
                                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>
                                    {performance.staffEmail}
                                  </p>
                                </div>
                              </div>
                              <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-3 md:gap-4 flex-1`}>
                                <div>
                                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>Scans</p>
                                  <p className={`${isMobile ? "text-base" : "text-lg"} font-semibold`}>
                                    {formatNumber(performance.totalScans)}
                                  </p>
                                </div>
                                <div>
                                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>Events</p>
                                  <p className={`${isMobile ? "text-base" : "text-lg"} font-semibold`}>
                                    {performance.eventsAssigned}
                                  </p>
                                </div>
                                <div>
                                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>Attendance</p>
                                  <p className={`${isMobile ? "text-base" : "text-lg"} font-semibold`}>
                                    {formatPercentage(performance.attendanceRate)}
                                  </p>
                                </div>
              <div>
                                  <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>Avg/Event</p>
                                  <p className={`${isMobile ? "text-base" : "text-lg"} font-semibold`}>
                                    {performance.averageScansPerEvent.toFixed(1)}
                </p>
              </div>
            </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Utilization Tab */}
              {performanceTab === "utilization" && utilization && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Utilization Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{formatPercentage(utilization.utilizationRate)}</div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {utilization.activeStaff} of {utilization.totalStaff} staff active
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Avg Events/Staff</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{utilization.averageEventsPerStaff.toFixed(1)}</div>
                        <p className="text-sm text-muted-foreground mt-2">Average events per staff member</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Avg Hours/Staff</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{utilization.averageHoursPerStaff.toFixed(1)}</div>
                        <p className="text-sm text-muted-foreground mt-2">Average hours per staff member</p>
                      </CardContent>
                    </Card>
                  </div>

                  {utilization.underutilizedStaff.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Underutilized Staff</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {utilization.underutilizedStaff.map((staff) => (
                            <div key={staff.staffId} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
              <div>
                                  <p className="font-semibold">{staff.staffName}</p>
                                  <p className="text-sm text-muted-foreground">{staff.staffEmail}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">{staff.eventsAssigned} events</p>
                                  <p className="text-xs text-muted-foreground">
                                    {staff.totalHoursWorked.toFixed(1)} hours
                </p>
              </div>
            </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {utilization.overutilizedStaff.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Overutilized Staff</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {utilization.overutilizedStaff.map((staff) => (
                            <div key={staff.staffId} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
              <div>
                                  <p className="font-semibold">{staff.staffName}</p>
                                  <p className="text-sm text-muted-foreground">{staff.staffEmail}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">{staff.eventsAssigned} events</p>
                                  <p className="text-xs text-muted-foreground">
                                    {staff.totalHoursWorked.toFixed(1)} hours
                </p>
              </div>
            </div>
          </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Coverage Tab */}
              {performanceTab === "coverage" && coverage && (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Total Events</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{coverage.totalEvents}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>With Staff</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-success">{coverage.eventsWithStaff}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Without Staff</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-destructive">{coverage.eventsWithoutStaff}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Avg Staff/Event</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{coverage.averageStaffPerEvent.toFixed(1)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className={isMobile ? "text-lg" : ""}>Event Coverage Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {coverage.eventsByCoverage.map((event) => (
                          <div key={event.eventId} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{event.eventTitle}</h3>
                              {getCoverageBadge(event.coverageStatus)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Staff Count</p>
                                <p className="font-semibold">{event.staffCount}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Scans</p>
                                <p className="font-semibold">{formatNumber(event.totalScans)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <p className="font-semibold capitalize">{event.coverageStatus}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Availability Tab */}
              {performanceTab === "availability" && availability && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Total Shifts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {formatNumber(availability.overallAvailability.totalShifts)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {availability.overallAvailability.completedShifts} completed
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Avg Availability</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {formatPercentage(availability.overallAvailability.averageAvailabilityRate)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Average availability rate</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={isMobile ? "text-lg" : ""}>Peak Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">
                          {availability.overallAvailability.peakDays.join(", ")}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Most active days</p>
        </CardContent>
      </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className={isMobile ? "text-lg" : ""}>Staff Availability Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {availability.staffAvailability.map((staff) => (
                          <div key={staff.staffId} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold">{staff.staffName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {staff.completedShifts} / {staff.totalShifts} shifts completed
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">{formatPercentage(staff.availabilityRate)}</p>
                                <p className="text-xs text-muted-foreground">Availability</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Avg Shift Duration</p>
                                <p className="font-semibold">{staff.averageShiftDuration.toFixed(1)} hours</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Preferred Days</p>
                                <p className="font-semibold">{staff.preferredDays.join(", ")}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Preferred Times</p>
                                <p className="font-semibold">{staff.preferredTimes.join(", ")}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Completion Rate</p>
                                <p className="font-semibold">
                                  {formatPercentage(
                                    (staff.completedShifts / staff.totalShifts) * 100,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff member account. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: "ORGANIZER_STAFF" | "ORGANIZER_TELLER") => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORGANIZER_STAFF">Staff</SelectItem>
                  <SelectItem value="ORGANIZER_TELLER">Teller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff} disabled={submitting}>
              {submitting && <ButtonLoader />}
              {submitting ? "Creating..." : "Create Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information. Password cannot be changed here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingStaff?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="edit-phoneNumber">Phone Number</Label>
              <Input
                id="edit-phoneNumber"
                type="tel"
                value={editFormData.phoneNumber || ''}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-system-role">System Role</Label>
              <Select value={editingStaff?.role || 'ORGANIZER_STAFF'} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORGANIZER_STAFF">Staff</SelectItem>
                  <SelectItem value="ORGANIZER_TELLER">Teller</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">System role cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="edit-custom-role">Custom Role (Optional)</Label>
              <Select 
                value={editFormData.customRoleId || ''} 
                onValueChange={(value) => setEditFormData({ ...editFormData, customRoleId: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No custom role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No custom role</SelectItem>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Assign a custom role to grant additional permissions to this staff member
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStaff} disabled={submitting}>
              {submitting && <ButtonLoader />}
              {submitting ? "Updating..." : "Update Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStaff} disabled={submitting}>
              {submitting && <ButtonLoader />}
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;

      