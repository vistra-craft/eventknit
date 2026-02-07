import { prisma } from '../config/database.js';
import { UserRole } from '@prisma/client';

/**
 * Staff Performance Metrics Interface
 */
export interface StaffPerformanceMetrics {
  staffId: string;
  staffName: string;
  staffEmail: string;
  role: string;
  
  // Event metrics
  eventsAssigned: number;
  eventsCompleted: number;
  eventsActive: number;
  
  // Scan metrics
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  averageScansPerEvent: number;
  reEntryScans: number;
  
  // Attendance metrics
  totalShifts: number;
  completedShifts: number;
  attendanceRate: number; // Percentage
  
  // Time-based metrics
  totalHoursWorked: number;
  averageHoursPerEvent: number;
  
  // Role-specific metrics
  responseTime?: number; // For support staff (in minutes)
  campaignEngagement?: number; // For marketers (percentage)
  
  // Recent activity
  lastScanAt?: Date;
  lastEventAt?: Date;
}

/**
 * Team Performance Summary
 */
export interface TeamPerformanceSummary {
  totalStaff: number;
  activeStaff: number;
  totalEvents: number;
  totalScans: number;
  averageScansPerStaff: number;
  averageAttendanceRate: number;
  topPerformers: StaffPerformanceMetrics[];
}

/**
 * Performance Period
 */
export type PerformancePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * Staff Performance Service
 * Tracks and calculates staff performance metrics
 */
export class StaffPerformanceService {
  /**
   * Get date range for performance period
   */
  private static getDateRange(period: PerformancePeriod): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2020); // Arbitrary early date
      break;
    }
    
    return { start, end };
  }

  /**
   * Get performance metrics for a specific staff member
   */
  static async getStaffPerformance(
    staffId: string,
    period: PerformancePeriod = 'all',
  ): Promise<StaffPerformanceMetrics | null> {
    const { start, end } = this.getDateRange(period);
    
    // Get staff user info
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!staff) {
      return null;
    }

    // Get staff assignments in period
    const assignments = await prisma.eventStaff.findMany({
      where: {
        staffId,
        assignedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    // Get scans performed by this staff member
    const scans = await prisma.ticketScan.findMany({
      where: {
        scannedBy: staffId,
        scannedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Calculate metrics
    const eventsAssigned = assignments.length;
    const eventsCompleted = assignments.filter(
      (a) => a.event.status === 'COMPLETED' || a.event.status === 'CANCELLED',
    ).length;
    const eventsActive = assignments.filter(
      (a) => a.event.status === 'APPROVED',
    ).length;

    const totalScans = scans.length;
    const successfulScans = scans.filter((s) => s.isValid).length;
    const failedScans = scans.filter((s) => !s.isValid).length;
    const reEntryScans = scans.filter((s) => s.isReEntry).length;
    const averageScansPerEvent = eventsAssigned > 0 ? totalScans / eventsAssigned : 0;

    // Calculate attendance/shift metrics
    const shiftsWithTimes = assignments.filter(
      (a) => a.shiftStart && a.shiftEnd,
    );
    const totalShifts = shiftsWithTimes.length;
    const completedShifts = shiftsWithTimes.filter((a) => {
      if (!a.shiftEnd) return false;
      return new Date(a.shiftEnd) <= end;
    }).length;
    const attendanceRate = totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0;

    // Calculate hours worked
    let totalHoursWorked = 0;
    shiftsWithTimes.forEach((a) => {
      if (a.shiftStart && a.shiftEnd) {
        const hours = (new Date(a.shiftEnd).getTime() - new Date(a.shiftStart).getTime()) / (1000 * 60 * 60);
        totalHoursWorked += hours;
      }
    });
    const averageHoursPerEvent = eventsAssigned > 0 ? totalHoursWorked / eventsAssigned : 0;

    // Get last scan and event
    const lastScan = scans.length > 0 ? scans.sort((a, b) => 
      new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
    )[0] : null;
    const lastEvent = assignments.length > 0 ? assignments.sort((a, b) => 
      new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
    )[0] : null;

    // Role-specific metrics (placeholder - would need additional data sources)
    let responseTime: number | undefined;
    let campaignEngagement: number | undefined;

    if (staff.role === UserRole.SUPPORT) {
      // TODO: Calculate average response time from support tickets
      responseTime = undefined;
    }

    if (staff.role === UserRole.MARKETER) {
      // TODO: Calculate campaign engagement from marketing campaigns
      campaignEngagement = undefined;
    }

    return {
      staffId: staff.id,
      staffName: `${staff.firstName} ${staff.lastName}`,
      staffEmail: staff.email,
      role: staff.role,
      eventsAssigned,
      eventsCompleted,
      eventsActive,
      totalScans,
      successfulScans,
      failedScans,
      averageScansPerEvent: Math.round(averageScansPerEvent * 100) / 100,
      reEntryScans,
      totalShifts,
      completedShifts,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
      averageHoursPerEvent: Math.round(averageHoursPerEvent * 100) / 100,
      responseTime,
      campaignEngagement,
      lastScanAt: lastScan?.scannedAt,
      lastEventAt: lastEvent?.assignedAt,
    };
  }

  /**
   * Get performance metrics for multiple staff members
   */
  static async getTeamPerformance(
    staffType: 'ADMIN_STAFF' | 'ORGANIZER_STAFF',
    period: PerformancePeriod = 'all',
    limit?: number,
  ): Promise<StaffPerformanceMetrics[]> {
    const { start } = this.getDateRange(period);
    
    // Get all staff of the specified type who have assignments
    const staffAssignments = await prisma.eventStaff.findMany({
      where: {
        staffType,
        assignedAt: {
          gte: start,
        },
      },
      select: {
        staffId: true,
      },
      distinct: ['staffId'],
    });

    const staffIds = staffAssignments.map((a) => a.staffId);
    
    if (limit) {
      staffIds.splice(limit);
    }

    // Get performance for each staff member
    const performances = await Promise.all(
      staffIds.map((staffId) => this.getStaffPerformance(staffId, period)),
    );

    return performances.filter((p): p is StaffPerformanceMetrics => p !== null);
  }

  /**
   * Get team performance summary
   */
  static async getTeamSummary(
    staffType: 'ADMIN_STAFF' | 'ORGANIZER_STAFF',
    period: PerformancePeriod = 'all',
  ): Promise<TeamPerformanceSummary> {
    const { start, end } = this.getDateRange(period);
    
    // Get all staff of the specified type
    const staffAssignments = await prisma.eventStaff.findMany({
      where: {
        staffType,
        assignedAt: {
          gte: start,
        },
      },
      select: {
        staffId: true,
      },
      distinct: ['staffId'],
    });

    const staffIds = staffAssignments.map((a) => a.staffId);
    const totalStaff = staffIds.length;

    // Get all scans in period
    const allScans = await prisma.ticketScan.findMany({
      where: {
        scannedBy: { in: staffIds },
        scannedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalScans = allScans.length;
    const averageScansPerStaff = totalStaff > 0 ? totalScans / totalStaff : 0;

    // Get all events
    const allEvents = await prisma.eventStaff.findMany({
      where: {
        staffType,
        assignedAt: {
          gte: start,
        },
      },
      select: {
        eventId: true,
      },
      distinct: ['eventId'],
    });

    const totalEvents = allEvents.length;

    // Get performance for all staff
    const performances = await Promise.all(
      staffIds.map((staffId) => this.getStaffPerformance(staffId, period)),
    );

    const validPerformances = performances.filter(
      (p): p is StaffPerformanceMetrics => p !== null,
    );

    // Calculate average attendance rate
    const totalAttendanceRate = validPerformances.reduce(
      (sum, p) => sum + p.attendanceRate,
      0,
    );
    const averageAttendanceRate =
      validPerformances.length > 0
        ? totalAttendanceRate / validPerformances.length
        : 0;

    // Get top performers (by total scans)
    const topPerformers = validPerformances
      .sort((a, b) => b.totalScans - a.totalScans)
      .slice(0, 10);

    // Count active staff (staff with recent activity)
    const activeStaff = validPerformances.filter(
      (p) => p.lastScanAt && new Date(p.lastScanAt) >= start,
    ).length;

    return {
      totalStaff,
      activeStaff,
      totalEvents,
      totalScans,
      averageScansPerStaff: Math.round(averageScansPerStaff * 100) / 100,
      averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
      topPerformers,
    };
  }

  /**
   * Get performance trends for a staff member
   */
  static async getPerformanceTrends(
    staffId: string,
    period: PerformancePeriod = 'month',
  ): Promise<{
    date: string;
    scans: number;
    events: number;
  }[]> {
    const { start, end } = this.getDateRange(period);
    
    // Get scans grouped by date
    const scans = await prisma.ticketScan.findMany({
      where: {
        scannedBy: staffId,
        scannedAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        scannedAt: true,
      },
    });

    // Get assignments grouped by date
    const assignments = await prisma.eventStaff.findMany({
      where: {
        staffId,
        assignedAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        assignedAt: true,
      },
    });

    // Group by date
    const scanByDate = new Map<string, number>();
    const eventsByDate = new Map<string, number>();

    scans.forEach((scan) => {
      const date = new Date(scan.scannedAt).toISOString().split('T')[0];
      scanByDate.set(date, (scanByDate.get(date) || 0) + 1);
    });

    assignments.forEach((assignment) => {
      const date = new Date(assignment.assignedAt).toISOString().split('T')[0];
      eventsByDate.set(date, (eventsByDate.get(date) || 0) + 1);
    });

    // Combine and sort
    const allDates = new Set([...scanByDate.keys(), ...eventsByDate.keys()]);
    const trends = Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        scans: scanByDate.get(date) || 0,
        events: eventsByDate.get(date) || 0,
      }));

    return trends;
  }

  /**
   * Get organizer staff utilization metrics
   * Shows how effectively staff are being utilized across events
   */
  static async getOrganizerStaffUtilization(
    organizerId: string,
    period: PerformancePeriod = 'month',
  ): Promise<{
    totalStaff: number;
    activeStaff: number;
    utilizationRate: number; // Percentage of staff actively working
    averageEventsPerStaff: number;
    averageHoursPerStaff: number;
    underutilizedStaff: StaffPerformanceMetrics[];
    overutilizedStaff: StaffPerformanceMetrics[];
  }> {
    const { start, end } = this.getDateRange(period);

    // Get all organizer staff assignments
    const staffAssignments = await prisma.eventStaff.findMany({
      where: {
        staffType: 'ORGANIZER_STAFF',
        assignedAt: {
          gte: start,
          lte: end,
        },
        event: {
          organizerId,
        },
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      distinct: ['staffId'],
    });

    const staffIds = staffAssignments.map((a) => a.staffId);
    const totalStaff = staffIds.length;

    // Get performance for each staff member
    const performances = await Promise.all(
      staffIds.map((staffId) => this.getStaffPerformance(staffId, period)),
    );

    const validPerformances = performances.filter(
      (p): p is StaffPerformanceMetrics => p !== null,
    );

    const activeStaff = validPerformances.filter(
      (p) => p.eventsAssigned > 0 || p.totalScans > 0,
    ).length;

    const utilizationRate = totalStaff > 0 ? (activeStaff / totalStaff) * 100 : 0;
    const averageEventsPerStaff =
      totalStaff > 0
        ? validPerformances.reduce((sum, p) => sum + p.eventsAssigned, 0) / totalStaff
        : 0;
    const averageHoursPerStaff =
      totalStaff > 0
        ? validPerformances.reduce((sum, p) => sum + p.totalHoursWorked, 0) / totalStaff
        : 0;

    // Identify underutilized staff (less than 2 events or less than 10 hours)
    const underutilizedStaff = validPerformances.filter(
      (p) => p.eventsAssigned < 2 || p.totalHoursWorked < 10,
    );

    // Identify overutilized staff (more than 10 events or more than 80 hours)
    const overutilizedStaff = validPerformances.filter(
      (p) => p.eventsAssigned > 10 || p.totalHoursWorked > 80,
    );

    return {
      totalStaff,
      activeStaff,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      averageEventsPerStaff: Math.round(averageEventsPerStaff * 100) / 100,
      averageHoursPerStaff: Math.round(averageHoursPerStaff * 100) / 100,
      underutilizedStaff,
      overutilizedStaff,
    };
  }

  /**
   * Get event coverage analysis
   * Shows which events have adequate staff coverage
   */
  static async getEventCoverageAnalysis(
    organizerId: string,
    period: PerformancePeriod = 'month',
  ): Promise<{
    totalEvents: number;
    eventsWithStaff: number;
    eventsWithoutStaff: number;
    averageStaffPerEvent: number;
    eventsByCoverage: {
      eventId: string;
      eventTitle: string;
      staffCount: number;
      totalScans: number;
      coverageStatus: 'adequate' | 'understaffed' | 'overstaffed';
    }[];
  }> {
    const { start, end } = this.getDateRange(period);

    // Get all events in period
    const events = await prisma.event.findMany({
      where: {
        organizerId,
        startDate: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    });

    const totalEvents = events.length;

    // Get staff assignments per event
    const eventStaffCounts = await prisma.eventStaff.groupBy({
      by: ['eventId'],
      where: {
        event: {
          organizerId,
        },
        assignedAt: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        staffId: true,
      },
    });

    const eventsWithStaff = eventStaffCounts.length;
    const eventsWithoutStaff = totalEvents - eventsWithStaff;

    // Get scan counts per event
    const eventScanCounts = await prisma.ticketScan.groupBy({
      by: ['eventId'],
      where: {
        event: {
          organizerId,
        },
        scannedAt: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
    });

    const scanCountMap = new Map(
      eventScanCounts.map((e) => [e.eventId, e._count.id]),
    );

    const staffCountMap = new Map(
      eventStaffCounts.map((e) => [e.eventId, e._count.staffId]),
    );

    const averageStaffPerEvent =
      eventsWithStaff > 0
        ? eventStaffCounts.reduce((sum, e) => sum + e._count.staffId, 0) / eventsWithStaff
        : 0;

    // Analyze coverage for each event
    const eventsByCoverage = events.map((event) => {
      const staffCount = staffCountMap.get(event.id) || 0;
      const totalScans = scanCountMap.get(event.id) || 0;

      // Determine coverage status
      let coverageStatus: 'adequate' | 'understaffed' | 'overstaffed';
      if (staffCount === 0) {
        coverageStatus = 'understaffed';
      } else if (staffCount > 5) {
        coverageStatus = 'overstaffed';
      } else {
        coverageStatus = 'adequate';
      }

      return {
        eventId: event.id,
        eventTitle: event.title,
        staffCount,
        totalScans,
        coverageStatus,
      };
    });

    return {
      totalEvents,
      eventsWithStaff,
      eventsWithoutStaff,
      averageStaffPerEvent: Math.round(averageStaffPerEvent * 100) / 100,
      eventsByCoverage,
    };
  }

  /**
   * Get staff availability tracking
   * Shows staff availability patterns and scheduling insights
   */
  static async getStaffAvailability(
    organizerId: string,
    period: PerformancePeriod = 'month',
  ): Promise<{
    staffAvailability: {
      staffId: string;
      staffName: string;
      totalShifts: number;
      completedShifts: number;
      availabilityRate: number;
      averageShiftDuration: number;
      preferredDays: string[];
      preferredTimes: string[];
    }[];
    overallAvailability: {
      totalShifts: number;
      completedShifts: number;
      averageAvailabilityRate: number;
      peakDays: string[];
    };
  }> {
    const { start, end } = this.getDateRange(period);

    // Get all staff assignments with shift times
    const assignments = await prisma.eventStaff.findMany({
      where: {
        staffType: 'ORGANIZER_STAFF',
        event: {
          organizerId,
        },
        assignedAt: {
          gte: start,
          lte: end,
        },
        shiftStart: {
          not: null,
        },
        shiftEnd: {
          not: null,
        },
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // Group by staff member
    const staffMap = new Map<
      string,
      {
        staffId: string;
        staffName: string;
        shifts: typeof assignments;
      }
    >();

    assignments.forEach((assignment) => {
      const staffId = assignment.staffId;
      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          staffId,
          staffName: `${assignment.staff.firstName} ${assignment.staff.lastName}`,
          shifts: [],
        });
      }
      staffMap.get(staffId)!.shifts.push(assignment);
    });

    // Calculate availability metrics per staff
    const staffAvailability = Array.from(staffMap.values()).map((staff) => {
      const totalShifts = staff.shifts.length;
      const completedShifts = staff.shifts.filter(
        (s) => s.shiftEnd && new Date(s.shiftEnd) <= end,
      ).length;

      const availabilityRate =
        totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0;

      // Calculate average shift duration
      let totalDuration = 0;
      staff.shifts.forEach((shift) => {
        if (shift.shiftStart && shift.shiftEnd) {
          totalDuration +=
            new Date(shift.shiftEnd).getTime() - new Date(shift.shiftStart).getTime();
        }
      });
      const averageShiftDuration =
        totalShifts > 0 ? totalDuration / totalShifts / (1000 * 60 * 60) : 0; // Convert to hours

      // Analyze preferred days and times
      const dayCounts = new Map<string, number>();
      const timeCounts = new Map<string, number>();

      staff.shifts.forEach((shift) => {
        if (shift.shiftStart) {
          const date = new Date(shift.shiftStart);
          const day = date.toLocaleDateString('en-US', { weekday: 'long' });
          const hour = date.getHours();
          const timeSlot = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

          dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
          timeCounts.set(timeSlot, (timeCounts.get(timeSlot) || 0) + 1);
        }
      });

      const preferredDays = Array.from(dayCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => day);

      const preferredTimes = Array.from(timeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([time]) => time);

      return {
        staffId: staff.staffId,
        staffName: staff.staffName,
        totalShifts,
        completedShifts,
        availabilityRate: Math.round(availabilityRate * 100) / 100,
        averageShiftDuration: Math.round(averageShiftDuration * 100) / 100,
        preferredDays,
        preferredTimes,
      };
    });

    // Calculate overall availability
    const totalShifts = assignments.length;
    const completedShifts = assignments.filter(
      (a) => a.shiftEnd && new Date(a.shiftEnd) <= end,
    ).length;
    const averageAvailabilityRate =
      staffAvailability.length > 0
        ? staffAvailability.reduce((sum, s) => sum + s.availabilityRate, 0) /
          staffAvailability.length
        : 0;

    // Find peak days
    const allDayCounts = new Map<string, number>();
    assignments.forEach((assignment) => {
      if (assignment.shiftStart) {
        const day = new Date(assignment.shiftStart).toLocaleDateString('en-US', {
          weekday: 'long',
        });
        allDayCounts.set(day, (allDayCounts.get(day) || 0) + 1);
      }
    });

    const peakDays = Array.from(allDayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    return {
      staffAvailability,
      overallAvailability: {
        totalShifts,
        completedShifts,
        averageAvailabilityRate: Math.round(averageAvailabilityRate * 100) / 100,
        peakDays,
      },
    };
  }
}


