import { prisma } from '../config/database.js';
import { WorkstationService } from './workstation.service.js';
import { LockService } from './lock.service.js';
import { logger } from '../utils/logger.js';
import { CheckpointType, RegistrationStatus } from '@prisma/client';

// Interfaces
export interface CheckpointCreateInput {
  eventId: string;
  name: string;
  type?: CheckpointType;
  description?: string;
  location?: string;
  stationCode?: string;
  quota?: number;
  quotaEnforced?: boolean;
  eligibilityRules?: EligibilityRules;
  activeFrom?: Date;
  activeTo?: Date;
  displayOrder?: number;
  createdBy?: string;
}

export interface CheckpointUpdateInput {
  name?: string;
  type?: CheckpointType;
  description?: string;
  location?: string;
  stationCode?: string;
  quota?: number;
  quotaEnforced?: boolean;
  eligibilityRules?: EligibilityRules;
  activeFrom?: Date;
  activeTo?: Date;
  isActive?: boolean;
  displayOrder?: number;
}

export interface EligibilityRules {
  ticketTypes?: string[]; // Allowed ticket types
  tags?: string[]; // Required tags in registration data
  all?: boolean; // If true, all attendees are eligible
  excludeTicketTypes?: string[]; // Excluded ticket types
}

export interface CheckpointScanResult {
  success: boolean;
  scanId?: string;
  checkpointId: string;
  registrationId: string;
  attendeeName?: string;
  ticketType?: string;
  scanNumber?: number;
  quotaRemaining?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface CheckpointStats {
  checkpointId: string;
  checkpointName: string;
  type: CheckpointType;
  totalScans: number;
  uniqueAttendees: number;
  quota: number;
  activeNow: boolean;
}

export class CheckpointService {
  /**
   * Create a new checkpoint
   */
  static async createCheckpoint(data: CheckpointCreateInput) {
    try {
      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
        select: { id: true, title: true },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // Check for duplicate station code
      if (data.stationCode) {
        const existing = await prisma.checkpoint.findFirst({
          where: {
            eventId: data.eventId,
            stationCode: data.stationCode,
          },
        });
        if (existing) {
          throw new Error(`Station code "${data.stationCode}" already exists for this event`);
        }
      }

      const checkpoint = await prisma.checkpoint.create({
        data: {
          eventId: data.eventId,
          name: data.name,
          type: data.type || CheckpointType.CUSTOM,
          description: data.description,
          location: data.location,
          stationCode: data.stationCode,
          quota: data.quota ?? 1,
          quotaEnforced: data.quotaEnforced ?? true,
          eligibilityRules: data.eligibilityRules as object,
          activeFrom: data.activeFrom,
          activeTo: data.activeTo,
          displayOrder: data.displayOrder ?? 0,
          createdBy: data.createdBy,
        },
      });

      return checkpoint;
    } catch (error) {
      logger.error('Error creating checkpoint:', error);
      throw error;
    }
  }

  /**
   * Get checkpoint by ID
   */
  static async getCheckpointById(checkpointId: string) {
    try {
      const checkpoint = await prisma.checkpoint.findUnique({
        where: { id: checkpointId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
            },
          },
          _count: {
            select: {
              scans: true,
              staffAssignments: true,
            },
          },
        },
      });

      return checkpoint;
    } catch (error) {
      logger.error('Error getting checkpoint:', error);
      throw error;
    }
  }

  /**
   * Get checkpoints for an event
   */
  static async getEventCheckpoints(
    eventId: string,
    options: {
      type?: CheckpointType;
      isActive?: boolean;
      includeStats?: boolean;
    } = {},
  ) {
    try {
      const where: { eventId: string; type?: CheckpointType; isActive?: boolean } = { eventId };

      if (options.type) {
        where.type = options.type;
      }

      if (options.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      const checkpoints = await prisma.checkpoint.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              scans: true,
              staffAssignments: true,
            },
          },
        },
      });

      if (options.includeStats) {
        // Get unique attendee counts per checkpoint
        const statsPromises = checkpoints.map(async (cp) => {
          const uniqueAttendees = await prisma.checkpointScan.groupBy({
            by: ['registrationId'],
            where: { checkpointId: cp.id, isValid: true },
          });

          return {
            ...cp,
            stats: {
              totalScans: cp._count.scans,
              uniqueAttendees: uniqueAttendees.length,
              staffCount: cp._count.staffAssignments,
            },
          };
        });

        return Promise.all(statsPromises);
      }

      return checkpoints;
    } catch (error) {
      logger.error('Error getting event checkpoints:', error);
      throw error;
    }
  }

  /**
   * Update checkpoint
   */
  static async updateCheckpoint(checkpointId: string, data: CheckpointUpdateInput) {
    try {
      const checkpoint = await prisma.checkpoint.update({
        where: { id: checkpointId },
        data: {
          ...data,
          eligibilityRules: data.eligibilityRules as object,
        },
      });

      return checkpoint;
    } catch (error) {
      logger.error('Error updating checkpoint:', error);
      throw error;
    }
  }

  /**
   * Delete checkpoint
   */
  static async deleteCheckpoint(checkpointId: string) {
    try {
      await prisma.checkpoint.delete({
        where: { id: checkpointId },
      });

      return true;
    } catch (error) {
      logger.error('Error deleting checkpoint:', error);
      throw error;
    }
  }

  /**
   * Duplicate checkpoint
   */
  static async duplicateCheckpoint(checkpointId: string, newName?: string) {
    try {
      const original = await prisma.checkpoint.findUnique({
        where: { id: checkpointId },
      });

      if (!original) {
        throw new Error('Checkpoint not found');
      }

      const duplicate = await prisma.checkpoint.create({
        data: {
          eventId: original.eventId,
          name: newName || `${original.name} (Copy)`,
          type: original.type,
          description: original.description,
          location: original.location,
          stationCode: null, // Don't copy station code to avoid conflicts
          quota: original.quota,
          quotaEnforced: original.quotaEnforced,
          eligibilityRules: original.eligibilityRules as object,
          activeFrom: original.activeFrom,
          activeTo: original.activeTo,
          displayOrder: original.displayOrder + 1,
          createdBy: original.createdBy,
        },
      });

      return duplicate;
    } catch (error) {
      logger.error('Error duplicating checkpoint:', error);
      throw error;
    }
  }

  /**
   * Check if attendee is eligible for checkpoint
   */
  static async checkEligibility(
    checkpointId: string,
    registrationId: string,
  ): Promise<{ eligible: boolean; reason?: string }> {
    try {
      const checkpoint = await prisma.checkpoint.findUnique({
        where: { id: checkpointId },
        select: {
          eligibilityRules: true,
          isActive: true,
          activeFrom: true,
          activeTo: true,
        },
      });

      if (!checkpoint) {
        return { eligible: false, reason: 'Checkpoint not found' };
      }

      // Check if checkpoint is active
      if (!checkpoint.isActive) {
        return { eligible: false, reason: 'Checkpoint is not active' };
      }

      // Check time window
      const now = new Date();
      if (checkpoint.activeFrom && now < checkpoint.activeFrom) {
        return { eligible: false, reason: 'Checkpoint not yet open' };
      }
      if (checkpoint.activeTo && now > checkpoint.activeTo) {
        return { eligible: false, reason: 'Checkpoint has closed' };
      }

      // Get registration details
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: {
          ticketType: true,
          registrationData: true,
          status: true,
        },
      });

      if (!registration) {
        return { eligible: false, reason: 'Registration not found' };
      }

      if (registration.status !== RegistrationStatus.CONFIRMED) {
        return { eligible: false, reason: 'Registration not confirmed' };
      }

      // Check eligibility rules
      const rules = checkpoint.eligibilityRules as EligibilityRules | null;

      if (!rules || rules.all === true) {
        return { eligible: true };
      }

      // Check excluded ticket types
      if (rules.excludeTicketTypes && rules.excludeTicketTypes.length > 0) {
        if (registration.ticketType && rules.excludeTicketTypes.includes(registration.ticketType)) {
          return { eligible: false, reason: 'Ticket type not eligible' };
        }
      }

      // Check allowed ticket types
      if (rules.ticketTypes && rules.ticketTypes.length > 0) {
        if (!registration.ticketType || !rules.ticketTypes.includes(registration.ticketType)) {
          return { eligible: false, reason: 'Ticket type not eligible' };
        }
      }

      // Check tags in registration data
      if (rules.tags && rules.tags.length > 0) {
        const regData = registration.registrationData as Record<string, unknown> | null;
        const regTags = regData?.tags as string[] | undefined;

        if (!regTags || !rules.tags.some((tag) => regTags.includes(tag))) {
          return { eligible: false, reason: 'Required tag not found' };
        }
      }

      return { eligible: true };
    } catch (error) {
      logger.error('Error checking eligibility:', error);
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Get attendee's scan count at checkpoint
   */
  static async getAttendeeScanCount(checkpointId: string, registrationId: string): Promise<number> {
    const count = await prisma.checkpointScan.count({
      where: {
        checkpointId,
        registrationId,
        isValid: true,
      },
    });

    return count;
  }

  /**
   * Scan attendee at checkpoint
   */
  static async scanCheckpoint(
    code: string,
    checkpointId: string,
    eventId: string,
    scannedBy: string,
    options: {
      deviceId?: string;
      deviceType?: string;
      ipAddress?: string;
      userAgent?: string;
      location?: { lat: number; lng: number };
      notes?: string;
    } = {},
  ): Promise<CheckpointScanResult> {
    try {
      // First validate the ticket using workstation service
      const validation = await WorkstationService.validateTicket(code, eventId);

      if (!validation.isValid || !validation.registrationId) {
        return {
          success: false,
          checkpointId,
          registrationId: validation.registrationId || '',
          errorCode: validation.errorCode || 'INVALID_TICKET',
          errorMessage: validation.errorMessage || 'Invalid ticket',
        };
      }

      const registrationId = validation.registrationId;

      // Get checkpoint details
      const checkpoint = await prisma.checkpoint.findUnique({
        where: { id: checkpointId },
        select: {
          id: true,
          name: true,
          quota: true,
          quotaEnforced: true,
          isActive: true,
          activeFrom: true,
          activeTo: true,
          eventId: true,
        },
      });

      if (!checkpoint) {
        return {
          success: false,
          checkpointId,
          registrationId,
          errorCode: 'CHECKPOINT_NOT_FOUND',
          errorMessage: 'Checkpoint not found',
        };
      }

      // Verify checkpoint belongs to event
      if (checkpoint.eventId !== eventId) {
        return {
          success: false,
          checkpointId,
          registrationId,
          errorCode: 'WRONG_EVENT',
          errorMessage: 'Checkpoint does not belong to this event',
        };
      }

      // Check eligibility
      const eligibility = await this.checkEligibility(checkpointId, registrationId);
      if (!eligibility.eligible) {
        return {
          success: false,
          checkpointId,
          registrationId,
          errorCode: 'NOT_ELIGIBLE',
          errorMessage: eligibility.reason || 'Not eligible for this checkpoint',
        };
      }

      // Acquire lock to prevent race conditions
      const lockKey = `checkpoint:${checkpointId}:${registrationId}`;
      const lockValue = await LockService.acquireLockWithRetry(lockKey, 5000, 3, 100);

      if (!lockValue) {
        logger.warn(`Lock acquisition failed for ${lockKey}`);
      }

      try {
        // Check quota
        const currentScanCount = await this.getAttendeeScanCount(checkpointId, registrationId);

        if (checkpoint.quotaEnforced && checkpoint.quota > 0 && currentScanCount >= checkpoint.quota) {
          return {
            success: false,
            checkpointId,
            registrationId,
            scanNumber: currentScanCount,
            quotaRemaining: 0,
            errorCode: 'QUOTA_EXCEEDED',
            errorMessage: `Maximum scans (${checkpoint.quota}) reached for this checkpoint`,
          };
        }

        // Get registration details for response
        const registration = await prisma.eventRegistration.findUnique({
          where: { id: registrationId },
          include: {
            attendee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        const scanNumber = currentScanCount + 1;

        // Create scan record
        const scan = await prisma.checkpointScan.create({
          data: {
            checkpointId,
            registrationId,
            eventId,
            scannedBy,
            scanNumber,
            isValid: true,
            deviceId: options.deviceId,
            deviceType: options.deviceType,
            ipAddress: options.ipAddress,
            userAgent: options.userAgent,
            location: options.location,
            notes: options.notes,
          },
        });

        const quotaRemaining = checkpoint.quota === 0 ? -1 : checkpoint.quota - scanNumber;

        return {
          success: true,
          scanId: scan.id,
          checkpointId,
          registrationId,
          attendeeName: registration
            ? `${registration.attendee.firstName || ''} ${registration.attendee.lastName || ''}`.trim()
            : undefined,
          ticketType: registration?.ticketType || undefined,
          scanNumber,
          quotaRemaining: quotaRemaining >= 0 ? quotaRemaining : undefined,
        };
      } finally {
        if (lockValue) {
          await LockService.releaseLock(lockKey, lockValue);
        }
      }
    } catch (error) {
      logger.error('Error scanning checkpoint:', error);
      return {
        success: false,
        checkpointId,
        registrationId: '',
        errorCode: 'SCAN_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during scan',
      };
    }
  }

  /**
   * Get checkpoint scans
   */
  static async getCheckpointScans(
    checkpointId: string,
    options: {
      page?: number;
      limit?: number;
      scannedBy?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const where: {
        checkpointId: string;
        scannedBy?: string;
        scannedAt?: { gte?: Date; lte?: Date };
      } = { checkpointId };

      if (options.scannedBy) {
        where.scannedBy = options.scannedBy;
      }

      if (options.startDate || options.endDate) {
        where.scannedAt = {};
        if (options.startDate) where.scannedAt.gte = options.startDate;
        if (options.endDate) where.scannedAt.lte = options.endDate;
      }

      const [scans, total] = await Promise.all([
        prisma.checkpointScan.findMany({
          where,
          skip,
          take: limit,
          orderBy: { scannedAt: 'desc' },
          include: {
            registration: {
              include: {
                attendee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),
        prisma.checkpointScan.count({ where }),
      ]);

      return {
        scans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting checkpoint scans:', error);
      throw error;
    }
  }

  /**
   * Get checkpoint statistics
   */
  static async getCheckpointStats(checkpointId: string): Promise<CheckpointStats | null> {
    try {
      const checkpoint = await prisma.checkpoint.findUnique({
        where: { id: checkpointId },
        select: {
          id: true,
          name: true,
          type: true,
          quota: true,
          isActive: true,
          activeFrom: true,
          activeTo: true,
        },
      });

      if (!checkpoint) return null;

      const [totalScans, uniqueAttendees] = await Promise.all([
        prisma.checkpointScan.count({
          where: { checkpointId, isValid: true },
        }),
        prisma.checkpointScan.groupBy({
          by: ['registrationId'],
          where: { checkpointId, isValid: true },
        }),
      ]);

      const now = new Date();
      const activeNow =
        checkpoint.isActive &&
        (!checkpoint.activeFrom || now >= checkpoint.activeFrom) &&
        (!checkpoint.activeTo || now <= checkpoint.activeTo);

      return {
        checkpointId: checkpoint.id,
        checkpointName: checkpoint.name,
        type: checkpoint.type,
        totalScans,
        uniqueAttendees: uniqueAttendees.length,
        quota: checkpoint.quota,
        activeNow,
      };
    } catch (error) {
      logger.error('Error getting checkpoint stats:', error);
      throw error;
    }
  }

  /**
   * Get event checkpoint summary
   */
  static async getEventCheckpointSummary(eventId: string) {
    try {
      const checkpoints = await prisma.checkpoint.findMany({
        where: { eventId },
        include: {
          _count: {
            select: { scans: true },
          },
        },
      });

      const totalRegistrations = await prisma.eventRegistration.count({
        where: {
          eventId,
          status: RegistrationStatus.CONFIRMED,
        },
      });

      const summaryPromises = checkpoints.map(async (cp) => {
        const uniqueScans = await prisma.checkpointScan.groupBy({
          by: ['registrationId'],
          where: { checkpointId: cp.id, isValid: true },
        });

        return {
          id: cp.id,
          name: cp.name,
          type: cp.type,
          stationCode: cp.stationCode,
          isActive: cp.isActive,
          quota: cp.quota,
          totalScans: cp._count.scans,
          uniqueAttendees: uniqueScans.length,
          completionRate: totalRegistrations > 0 ? (uniqueScans.length / totalRegistrations) * 100 : 0,
        };
      });

      const summary = await Promise.all(summaryPromises);

      return {
        eventId,
        totalRegistrations,
        checkpoints: summary,
      };
    } catch (error) {
      logger.error('Error getting event checkpoint summary:', error);
      throw error;
    }
  }

  /**
   * Assign staff to checkpoint
   */
  static async assignStaff(
    checkpointId: string,
    staffId: string,
    assignedBy: string,
    options: {
      shiftStart?: Date;
      shiftEnd?: Date;
    } = {},
  ) {
    try {
      const assignment = await prisma.checkpointStaff.upsert({
        where: {
          checkpointId_staffId: {
            checkpointId,
            staffId,
          },
        },
        create: {
          checkpointId,
          staffId,
          assignedBy,
          shiftStart: options.shiftStart,
          shiftEnd: options.shiftEnd,
          isActive: true,
        },
        update: {
          assignedBy,
          shiftStart: options.shiftStart,
          shiftEnd: options.shiftEnd,
          isActive: true,
        },
      });

      return assignment;
    } catch (error) {
      logger.error('Error assigning staff:', error);
      throw error;
    }
  }

  /**
   * Remove staff from checkpoint
   */
  static async removeStaff(checkpointId: string, staffId: string) {
    try {
      await prisma.checkpointStaff.delete({
        where: {
          checkpointId_staffId: {
            checkpointId,
            staffId,
          },
        },
      });

      return true;
    } catch (error) {
      logger.error('Error removing staff:', error);
      throw error;
    }
  }

  /**
   * Get checkpoint staff
   */
  static async getCheckpointStaff(checkpointId: string) {
    try {
      const staff = await prisma.checkpointStaff.findMany({
        where: { checkpointId, isActive: true },
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return staff;
    } catch (error) {
      logger.error('Error getting checkpoint staff:', error);
      throw error;
    }
  }

  /**
   * Get attendee checkpoint status
   */
  static async getAttendeeCheckpointStatus(registrationId: string, eventId: string) {
    try {
      const checkpoints = await prisma.checkpoint.findMany({
        where: { eventId, isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      const statusPromises = checkpoints.map(async (cp) => {
        const scans = await prisma.checkpointScan.findMany({
          where: {
            checkpointId: cp.id,
            registrationId,
            isValid: true,
          },
          orderBy: { scannedAt: 'desc' },
        });

        const eligibility = await this.checkEligibility(cp.id, registrationId);

        return {
          checkpointId: cp.id,
          checkpointName: cp.name,
          type: cp.type,
          stationCode: cp.stationCode,
          quota: cp.quota,
          scansUsed: scans.length,
          quotaRemaining: cp.quota === 0 ? -1 : Math.max(0, cp.quota - scans.length),
          isEligible: eligibility.eligible,
          eligibilityReason: eligibility.reason,
          lastScan: scans[0]?.scannedAt || null,
        };
      });

      return Promise.all(statusPromises);
    } catch (error) {
      logger.error('Error getting attendee checkpoint status:', error);
      throw error;
    }
  }
}
