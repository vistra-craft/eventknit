/**
 * Dashboard Analytics Service
 * Provides real-time metrics, staff performance, facility heatmaps, and attendance trends
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

// ==================== Types ====================

export interface RealtimeMetrics {
  totalCheckedIn: number;
  totalScans: number;
  currentOccupancy: number;
  activeStaff: number;
  recentScansPerMinute: number;
}

export interface RecentScan {
  id: string;
  scannedAt: Date;
  checkpointName: string;
  facilityName?: string;
  zoneName?: string;
  attendee: {
    id: string;
    fullName: string;
    email: string;
    ticketType?: string;
    photo?: string;
  };
  scannedBy: {
    id: string;
    fullName: string;
  };
}

export interface HeatmapData {
  facility: string;
  facilityId: string;
  hourlyScans: {
    hour: string; // ISO timestamp of the hour
    scanCount: number;
  }[];
}

export interface StaffMetric {
  staffId: string;
  staffName: string;
  totalScans: number;
  scansPerHour: number;
  avgScanTime: number; // seconds between scans
  lastScanAt?: Date;
}

export interface CapacityStatus {
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  currentOccupancy: number;
  maxCapacity: number | null;
  percentFull: number;
  isFull: boolean;
}

export interface AttendanceTrend {
  timestamp: string; // ISO timestamp
  scanCount: number;
  checkInCount: number;
}

export class DashboardAnalyticsService {
  /**
   * Get real-time metrics for event dashboard
   */
  static async getRealtimeMetrics(eventId: string): Promise<RealtimeMetrics> {
    try {
      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, venueCurrentOccupancy: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Total checked-in attendees (those who have checked in at least once)
      const totalCheckedIn = await prisma.eventRegistration.count({
        where: {
          eventId,
          checkedInAt: { not: null },
        },
      });

      // Total scans (all checkpoint scans for this event)
      const totalScans = await prisma.checkpointScan.count({
        where: {
          eventId,
        },
      });

      // Current occupancy from event record
      const currentOccupancy = event.venueCurrentOccupancy || 0;

      // Active staff (staff who scanned in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeStaffResult = await prisma.checkpointScan.groupBy({
        by: ['scannedBy'],
        where: {
          eventId,
          scannedAt: {
            gte: fiveMinutesAgo,
          },
        },
        _count: true,
      });
      const activeStaff = activeStaffResult.length;

      // Recent scans per minute (last 5 minutes)
      const recentScansCount = await prisma.checkpointScan.count({
        where: {
          eventId,
          scannedAt: {
            gte: fiveMinutesAgo,
          },
        },
      });
      const recentScansPerMinute = Math.round((recentScansCount / 5) * 10) / 10;

      logger.info(`Fetched realtime metrics for event: ${eventId}`);

      return {
        totalCheckedIn,
        totalScans,
        currentOccupancy,
        activeStaff,
        recentScansPerMinute,
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to fetch realtime metrics:', error);
      throw new ValidationError('Failed to fetch realtime metrics');
    }
  }

  /**
   * Get recent scans with attendee details
   */
  static async getRecentScans(eventId: string, limit: number = 100): Promise<RecentScan[]> {
    try {
      const scans = await prisma.checkpointScan.findMany({
        where: {
          eventId,
        },
        orderBy: {
          scannedAt: 'desc',
        },
        take: limit,
        include: {
          checkpoint: {
            select: {
              id: true,
              name: true,
            },
          },
          registration: {
            include: {
              attendee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      // Get staff user information for all unique scannedBy IDs
      const staffIds = [...new Set(scans.map((scan) => scan.scannedBy))];
      const staffUsers = await prisma.user.findMany({
        where: {
          id: { in: staffIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });
      const staffMap = new Map(staffUsers.map((u) => [u.id, u]));

      const recentScans: RecentScan[] = scans.map((scan) => {
        const staff = staffMap.get(scan.scannedBy);
        return {
          id: scan.id,
          scannedAt: scan.scannedAt,
          checkpointName: scan.checkpoint.name,
          facilityName: undefined, // Checkpoint doesn't have facility relation
          zoneName: undefined, // Checkpoint doesn't have zone relation
          attendee: {
            id: scan.registration.attendee.id,
            fullName: `${scan.registration.attendee.firstName || ''} ${scan.registration.attendee.lastName || ''}`.trim() || 'Unknown',
            email: scan.registration.attendee.email,
            ticketType: scan.registration.ticketType || undefined,
            photo: scan.registration.attendee.avatar || undefined,
          },
          scannedBy: {
            id: scan.scannedBy,
            fullName: staff
              ? `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Unknown'
              : 'Unknown',
          },
        };
      });

      logger.info(`Fetched ${recentScans.length} recent scans for event: ${eventId}`);
      return recentScans;
    } catch (error) {
      logger.error('Failed to fetch recent scans:', error);
      throw new ValidationError('Failed to fetch recent scans');
    }
  }

  /**
   * Get facility heatmap data (scans grouped by hour x facility)
   * Note: Since Checkpoint doesn't have facility relation, we use checkpoint names as grouping
   */
  static async getFacilityHeatmap(
    eventId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HeatmapData[]> {
    try {
      // Get all checkpoints for the event (using checkpoints instead of facilities)
      const checkpoints = await prisma.checkpoint.findMany({
        where: {
          eventId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Get scans grouped by checkpoint and hour
      const scans = await prisma.checkpointScan.findMany({
        where: {
          eventId,
          scannedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          scannedAt: true,
          checkpointId: true,
        },
      });

      // Group scans by checkpoint and hour
      const heatmapData: HeatmapData[] = checkpoints.map((checkpoint) => {
        const checkpointScans = scans.filter(
          (scan) => scan.checkpointId === checkpoint.id,
        );

        // Group by hour
        const hourlyMap = new Map<string, number>();
        checkpointScans.forEach((scan) => {
          const hour = new Date(scan.scannedAt);
          hour.setMinutes(0, 0, 0);
          const hourKey = hour.toISOString();
          hourlyMap.set(hourKey, (hourlyMap.get(hourKey) || 0) + 1);
        });

        // Convert to array
        const hourlyScans = Array.from(hourlyMap.entries()).map(([hour, scanCount]) => ({
          hour,
          scanCount,
        }));

        return {
          facility: checkpoint.name,
          facilityId: checkpoint.id,
          hourlyScans,
        };
      });

      logger.info(`Generated heatmap data for ${checkpoints.length} checkpoints`);
      return heatmapData;
    } catch (error) {
      logger.error('Failed to generate facility heatmap:', error);
      throw new ValidationError('Failed to generate facility heatmap');
    }
  }

  /**
   * Get staff performance metrics
   */
  static async getStaffMetrics(eventId: string): Promise<StaffMetric[]> {
    try {
      // Get all scans for this event
      const staffScans = await prisma.checkpointScan.findMany({
        where: {
          eventId,
        },
        orderBy: {
          scannedAt: 'asc',
        },
        select: {
          scannedAt: true,
          scannedBy: true,
        },
      });

      // Get all unique staff IDs
      const staffIds = [...new Set(staffScans.map((scan) => scan.scannedBy))];

      // Fetch staff user information
      const staffUsers = await prisma.user.findMany({
        where: {
          id: { in: staffIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });
      const staffUserMap = new Map(staffUsers.map((u) => [u.id, u]));

      // Group by staff
      const staffMap = new Map<string, { scans: Date[] }>();
      staffScans.forEach((scan) => {
        const staffId = scan.scannedBy;
        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            scans: [],
          });
        }
        staffMap.get(staffId)!.scans.push(scan.scannedAt);
      });

      // Calculate metrics for each staff member
      const metrics: StaffMetric[] = Array.from(staffMap.entries()).map(
        ([staffId, data]) => {
          const staffUser = staffUserMap.get(staffId);
          const staffName = staffUser
            ? `${staffUser.firstName || ''} ${staffUser.lastName || ''}`.trim() || 'Unknown'
            : 'Unknown';

          const totalScans = data.scans.length;
          const firstScan = data.scans[0];
          const lastScan = data.scans[data.scans.length - 1];

          // Calculate scans per hour
          const hoursDiff = (lastScan.getTime() - firstScan.getTime()) / (1000 * 60 * 60);
          const scansPerHour = hoursDiff > 0 ? Math.round((totalScans / hoursDiff) * 10) / 10 : 0;

          // Calculate average time between scans
          let totalTimeDiff = 0;
          for (let i = 1; i < data.scans.length; i++) {
            totalTimeDiff += data.scans[i].getTime() - data.scans[i - 1].getTime();
          }
          const avgScanTime = data.scans.length > 1
            ? Math.round(totalTimeDiff / (data.scans.length - 1) / 1000)
            : 0;

          return {
            staffId,
            staffName,
            totalScans,
            scansPerHour,
            avgScanTime,
            lastScanAt: lastScan,
          };
        },
      );

      // Sort by total scans (descending)
      metrics.sort((a, b) => b.totalScans - a.totalScans);

      logger.info(`Calculated metrics for ${metrics.length} staff members`);
      return metrics;
    } catch (error) {
      logger.error('Failed to calculate staff metrics:', error);
      throw new ValidationError('Failed to calculate staff metrics');
    }
  }

  /**
   * Get capacity overview for all zones
   */
  static async getCapacityOverview(eventId: string): Promise<CapacityStatus[]> {
    try {
      const zones = await prisma.facilityZone.findMany({
        where: {
          eventId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          maxCapacity: true,
          currentOccupancy: true,
        },
      });

      const capacityStatuses: CapacityStatus[] = zones.map((zone) => {
        const percentFull = zone.maxCapacity
          ? Math.round((zone.currentOccupancy / zone.maxCapacity) * 100)
          : 0;
        const isFull = zone.maxCapacity ? zone.currentOccupancy >= zone.maxCapacity : false;

        return {
          zoneId: zone.id,
          zoneName: zone.name,
          zoneCode: zone.code,
          currentOccupancy: zone.currentOccupancy,
          maxCapacity: zone.maxCapacity,
          percentFull,
          isFull,
        };
      });

      logger.info(`Fetched capacity overview for ${zones.length} zones`);
      return capacityStatuses;
    } catch (error) {
      logger.error('Failed to fetch capacity overview:', error);
      throw new ValidationError('Failed to fetch capacity overview');
    }
  }

  /**
   * Get attendance trend (hourly or daily scan counts)
   * Note: CheckpointScan doesn't have an 'action' field, so we track all scans
   * and use registration status changes for check-in counts
   */
  static async getAttendanceTrend(
    eventId: string,
    interval: 'hourly' | 'daily' = 'hourly',
  ): Promise<AttendanceTrend[]> {
    try {
      // Get event start date or default to 24 hours ago
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { startDate: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const startDate = event.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      // Get all scans
      const scans = await prisma.checkpointScan.findMany({
        where: {
          eventId,
          scannedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          scannedAt: true,
          scanNumber: true, // Use scanNumber to identify first scans (check-ins)
        },
      });

      // Group by interval
      const trendMap = new Map<string, { scanCount: number; checkInCount: number }>();

      scans.forEach((scan) => {
        const date = new Date(scan.scannedAt);

        if (interval === 'hourly') {
          date.setMinutes(0, 0, 0);
        } else {
          date.setHours(0, 0, 0, 0);
        }

        const key = date.toISOString();
        if (!trendMap.has(key)) {
          trendMap.set(key, { scanCount: 0, checkInCount: 0 });
        }

        const data = trendMap.get(key)!;
        data.scanCount++;
        // Consider scanNumber === 1 as a check-in (first scan at this checkpoint)
        if (scan.scanNumber === 1) {
          data.checkInCount++;
        }
      });

      // Convert to array
      const trends: AttendanceTrend[] = Array.from(trendMap.entries())
        .map(([timestamp, data]) => ({
          timestamp,
          scanCount: data.scanCount,
          checkInCount: data.checkInCount,
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      logger.info(`Generated ${interval} attendance trend with ${trends.length} data points`);
      return trends;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to generate attendance trend:', error);
      throw new ValidationError('Failed to generate attendance trend');
    }
  }
}
