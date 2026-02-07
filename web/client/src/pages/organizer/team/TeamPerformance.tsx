import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  Users,
  Calendar,
  Award,
  Target,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useIsMobile } from "@/hooks/useMobile";
import { useToast } from "@/hooks/useToast";
import {
  getOrganizerTeamSummary,
  getOrganizerTeamPerformance,
  getOrganizerStaffUtilization,
  getEventCoverageAnalysis,
  getStaffAvailability,
  type PerformancePeriod,
  type StaffPerformanceMetrics,
  type TeamPerformanceSummary,
  type StaffUtilization,
  type EventCoverage,
  type StaffAvailability,
} from "@/lib/organizer-api";

const TeamPerformance = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PerformancePeriod>("month");
  const [activeTab, setActiveTab] = useState<"overview" | "utilization" | "coverage" | "availability">("overview");

  // Data states
  const [teamSummary, setTeamSummary] = useState<TeamPerformanceSummary | null>(null);
  const [teamPerformance, setTeamPerformance] = useState<StaffPerformanceMetrics[]>([]);
  const [utilization, setUtilization] = useState<StaffUtilization | null>(null);
  const [coverage, setCoverage] = useState<EventCoverage | null>(null);
  const [availability, setAvailability] = useState<StaffAvailability | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
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
      console.error("Error fetching performance data:", error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  /* eslint-disable @typescript-eslint/no-unused-vars */
  // @ts-expect-error - Intentionally unused, reserved for future implementation
  const _getPerformanceColor = (value: number, type: "accuracy" | "time") => {
    if (type === "accuracy") {
      if (value >= 95) return "text-success";
      if (value >= 90) return "text-warning";
      return "text-destructive";
    } else {
      if (value <= 2) return "text-success";
      if (value <= 3) return "text-warning";
      return "text-destructive";
    }
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 ${isMobile ? "p-4" : ""}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-page-title"}`}>Team Performance</h1>
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
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {!isMobile && "Refresh"}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Overview" },
          { id: "utilization", label: "Utilization" },
          { id: "coverage", label: "Coverage" },
          { id: "availability", label: "Availability" },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="whitespace-nowrap"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && teamSummary && (
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
                <CardDescription className={isMobile ? "text-xs" : ""}>
                  Staff members with highest performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance.map((performance, index) => (
                    <div
                      key={performance.staffId}
                      className={`flex ${isMobile ? "flex-col" : "items-center justify-between"} gap-3 ${isMobile ? "p-3" : "p-4"} border rounded-lg hover:bg-muted/50 transition-colors`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`flex items-center justify-center ${isMobile ? "w-10 h-10" : "w-12 h-12"} rounded-full bg-primary/10`}
                        >
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
                      <div
                        className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-3 md:gap-4 flex-1`}
                      >
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
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        onClick={() => navigate(`/organizer/staff-performance/${performance.staffId}`)}
                        className={isMobile ? "w-full" : ""}
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Utilization Tab */}
      {activeTab === "utilization" && utilization && (
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
                <CardDescription className={isMobile ? "text-xs" : ""}>
                  Staff with less than 2 events or 10 hours
                </CardDescription>
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
                <CardDescription className={isMobile ? "text-xs" : ""}>
                  Staff with more than 10 events or 80 hours
                </CardDescription>
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
      {activeTab === "coverage" && coverage && (
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
              <CardDescription className={isMobile ? "text-xs" : ""}>
                Staff coverage status for each event
              </CardDescription>
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
      {activeTab === "availability" && availability && (
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
              <CardDescription className={isMobile ? "text-xs" : ""}>
                Individual staff availability patterns
              </CardDescription>
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
    </div>
  );
};

export default TeamPerformance;
