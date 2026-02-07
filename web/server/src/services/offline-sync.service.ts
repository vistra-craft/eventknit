/**
 * Offline Sync Service
 * Handles bulk data downloads for offline mode and batch scan uploads
 */

import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface EventDataForOffline {
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date | null;
  };
  attendees: Array<{
    registrationId: string;
    fullName: string;
    email: string;
    ticketType?: string;
    photo?: string;
    qrCode?: string;
    backupCode?: string;
    isCurrentlyInside: boolean;
    lastCheckInAt?: Date;
    authorizedZones: string[];
  }>;
  zones: Array<{
    zoneId: string;
    name: string;
    code: string;
    maxCapacity?: number;
    currentOccupancy: number;
    accessStart?: Date;
    accessEnd?: Date;
    isActive: boolean;
  }>;
}

export interface BatchScanInput {
  id: string;
  registrationId: string;
  checkpointId: string;
  qrCode: string;
  codeType: string;
  signatureValid: boolean;
  scannedAt: Date;
  scannedBy: string;
  deviceInfo?: any;
}

export interface BatchScanResult {
  successCount: number;
  failureCount: number;
  conflicts: Array<{
    mobileId: string;
    serverId?: string;
    reason: string;
    details: any;
  }>;
}

export interface ScanConflict {
  id: string;
  mobileId: string;
  serverId: string;
  registrationId: string;
  checkpointId: string;
  mobileScanTime: Date;
  serverScanTime: Date;
  timeDifferenceMs: number;
  status: 'pending' | 'resolved';
  resolution?: 'keep_first' | 'keep_latest' | 'keep_both';
}

export class OfflineSyncService {
  /**
   * Get event data for offline caching
   * Includes attendees with zone access and facilities
   */
  static async getEventDataForOffline(
    eventId: string,
    _userId: string,
  ): Promise<EventDataForOffline> {
    // Verify event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Get all registrations with attendee details
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: 'CONFIRMED',
      },
      select: {
        id: true,
        attendee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        ticketLineItems: {
          select: {
            ticketType: true,
          },
          take: 1, // Get first ticket type
        },
        qrCode: true,
        backupCode: true,
        isCurrentlyInside: true,
        checkedInAt: true,
        // Get zone access from AttendeeZoneAccess
        zoneAccess: {
          where: { isActive: true },
          select: {
            zoneId: true,
          },
        },
      },
    });

    const attendees = registrations.map((reg) => ({
      registrationId: reg.id,
      fullName: `${reg.attendee.firstName || ''} ${reg.attendee.lastName || ''}`.trim(),
      email: reg.attendee.email,
      ticketType: reg.ticketLineItems[0]?.ticketType,
      qrCode: reg.qrCode || undefined,
      backupCode: reg.backupCode || undefined,
      isCurrentlyInside: reg.isCurrentlyInside,
      lastCheckInAt: reg.checkedInAt || undefined,
      authorizedZones: reg.zoneAccess.map((za: { zoneId: string }) => za.zoneId),
    }));

    // Get facility zones
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
        accessStart: true,
        accessEnd: true,
        isActive: true,
      },
    });

    const zonesData = zones.map((zone) => ({
      zoneId: zone.id,
      name: zone.name,
      code: zone.code,
      maxCapacity: zone.maxCapacity || undefined,
      currentOccupancy: zone.currentOccupancy,
      accessStart: zone.accessStart || undefined,
      accessEnd: zone.accessEnd || undefined,
      isActive: zone.isActive,
    }));

    return {
      event,
      attendees,
      zones: zonesData,
    };
  }

  /**
   * Process batch scan uploads from mobile devices
   * Handles duplicate detection and conflict resolution
   */
  static async processBatchScans(
    scans: BatchScanInput[],
  ): Promise<BatchScanResult> {
    let successCount = 0;
    let failureCount = 0;
    const conflicts: BatchScanResult['conflicts'] = [];

    for (const scan of scans) {
      try {
        // Check for existing scan with same registration + checkpoint + time window (±5 minutes)
        const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
        const scanTime = new Date(scan.scannedAt);
        const startTime = new Date(scanTime.getTime() - timeWindow);
        const endTime = new Date(scanTime.getTime() + timeWindow);

        const existingScan = await prisma.checkpointScan.findFirst({
          where: {
            registrationId: scan.registrationId,
            checkpointId: scan.checkpointId,
            scannedAt: {
              gte: startTime,
              lte: endTime,
            },
          },
          select: {
            id: true,
            scannedAt: true,
          },
        });

        if (existingScan) {
          // Conflict detected - scan already exists
          const timeDiff = Math.abs(
            scanTime.getTime() - existingScan.scannedAt.getTime(),
          );

          conflicts.push({
            mobileId: scan.id,
            serverId: existingScan.id,
            reason: 'duplicate_scan',
            details: {
              timeDifferenceMs: timeDiff,
              mobileTime: scan.scannedAt,
              serverTime: existingScan.scannedAt,
            },
          });

          failureCount++;
          continue;
        }

        // Get current scan count for this registration at this checkpoint
        const currentScanCount = await prisma.checkpointScan.count({
          where: {
            checkpointId: scan.checkpointId,
            registrationId: scan.registrationId,
          },
        });

        // Get checkpoint to get eventId
        const checkpoint = await prisma.checkpoint.findUnique({
          where: { id: scan.checkpointId },
          select: { eventId: true },
        });

        if (!checkpoint) {
          throw new NotFoundError('Checkpoint not found');
        }

        // Create checkpoint scan directly
        await prisma.checkpointScan.create({
          data: {
            checkpointId: scan.checkpointId,
            registrationId: scan.registrationId,
            eventId: checkpoint.eventId,
            scannedBy: scan.scannedBy,
            scannedAt: new Date(scan.scannedAt),
            scanNumber: currentScanCount + 1,
            isValid: scan.signatureValid,
            deviceId: scan.deviceInfo?.deviceId,
            deviceType: scan.deviceInfo?.deviceType,
          },
        });

        successCount++;
      } catch (error) {
        failureCount++;
        conflicts.push({
          mobileId: scan.id,
          reason: 'processing_error',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    return {
      successCount,
      failureCount,
      conflicts,
    };
  }

  /**
   * Detect conflicts in scan data
   * Finds duplicate scans that occurred within a time window
   */
  static async detectConflicts(
    eventId: string,
    timeWindowMinutes: number = 5,
  ): Promise<ScanConflict[]> {
    const timeWindow = timeWindowMinutes * 60 * 1000;

    // Get all scans for event grouped by registration + checkpoint
    const scans = await prisma.checkpointScan.findMany({
      where: {
        checkpoint: {
          eventId,
        },
      },
      select: {
        id: true,
        registrationId: true,
        checkpointId: true,
        scannedAt: true,
      },
      orderBy: {
        scannedAt: 'asc',
      },
    });

    const conflicts: ScanConflict[] = [];
    const scanGroups = new Map<string, typeof scans>();

    // Group scans by registration + checkpoint
    for (const scan of scans) {
      const key = `${scan.registrationId}-${scan.checkpointId}`;
      if (!scanGroups.has(key)) {
        scanGroups.set(key, []);
      }
      scanGroups.get(key)!.push(scan);
    }

    // Find conflicts within each group
    for (const group of scanGroups.values()) {
      for (let i = 0; i < group.length - 1; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const scan1 = group[i];
          const scan2 = group[j];
          const timeDiff = Math.abs(
            scan2.scannedAt.getTime() - scan1.scannedAt.getTime(),
          );

          if (timeDiff <= timeWindow) {
            conflicts.push({
              id: `conflict-${scan1.id}-${scan2.id}`,
              mobileId: scan2.id, // Assume later scan is from mobile
              serverId: scan1.id,
              registrationId: scan1.registrationId,
              checkpointId: scan1.checkpointId,
              mobileScanTime: scan2.scannedAt,
              serverScanTime: scan1.scannedAt,
              timeDifferenceMs: timeDiff,
              status: 'pending',
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve scan conflict
   * Applies resolution strategy to duplicate scans
   */
  static async resolveConflict(
    conflictId: string,
    resolution: 'keep_first' | 'keep_latest' | 'keep_both',
  ): Promise<void> {
    // Parse conflict ID to get scan IDs
    const [, serverId, mobileId] = conflictId.split('-');

    if (!serverId || !mobileId) {
      throw new ValidationError('Invalid conflict ID');
    }

    const serverScan = await prisma.checkpointScan.findUnique({
      where: { id: serverId },
    });

    const mobileScan = await prisma.checkpointScan.findUnique({
      where: { id: mobileId },
    });

    if (!serverScan || !mobileScan) {
      throw new NotFoundError('Scan not found');
    }

    switch (resolution) {
    case 'keep_first':
      // Delete the later scan
      if (serverScan.scannedAt < mobileScan.scannedAt) {
        await prisma.checkpointScan.delete({ where: { id: mobileId } });
      } else {
        await prisma.checkpointScan.delete({ where: { id: serverId } });
      }
      break;

    case 'keep_latest':
      // Delete the earlier scan
      if (serverScan.scannedAt > mobileScan.scannedAt) {
        await prisma.checkpointScan.delete({ where: { id: mobileId } });
      } else {
        await prisma.checkpointScan.delete({ where: { id: serverId } });
      }
      break;

    case 'keep_both':
      // Keep both scans - no action needed
      break;

    default:
      throw new ValidationError('Invalid resolution strategy');
    }
  }

  /**
   * Get sync status for mobile device
   * Returns pending scan counts and last sync time
   */
  static async getSyncStatus(eventId: string, userId: string) {
    // Get total registrations for event
    const totalAttendees = await prisma.eventRegistration.count({
      where: {
        eventId,
        status: 'CONFIRMED',
      },
    });

    // Get total scans for event
    const totalScans = await prisma.checkpointScan.count({
      where: {
        checkpoint: {
          eventId,
        },
      },
    });

    // Get scans by this user today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userScansToday = await prisma.checkpointScan.count({
      where: {
        checkpoint: {
          eventId,
        },
        scannedBy: userId,
        scannedAt: {
          gte: today,
        },
      },
    });

    return {
      totalAttendees,
      totalScans,
      userScansToday,
      lastUpdated: new Date(),
    };
  }
}
