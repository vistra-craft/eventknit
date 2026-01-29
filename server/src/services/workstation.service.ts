import { prisma } from '../config/database.js';
import { TicketSecurityService } from './ticket-security.service.js';
import { LockService } from './lock.service.js';
import { VenueCapacityService } from './venue-capacity.service.js';
import { AlertService } from './alert.service.js';
import { logger } from '../utils/logger.js';
import { TicketStatus, ScanType, EventStatus, RegistrationStatus } from '@prisma/client';

export interface TicketValidationResult {
  isValid: boolean;
  registrationId?: string;
  eventId?: string;
  errorCode?: string;
  errorMessage?: string;
  codeType?: 'QR_CODE' | 'BACKUP_CODE';
  signatureVerified?: boolean;
}

export interface ScanResult {
  success: boolean;
  registrationId: string;
  eventId: string;
  attendeeName?: string;
  ticketType?: string | null;
  checkedInAt: Date;
  errorCode?: string;
  errorMessage?: string;
}

export interface CheckOutResult {
  success: boolean;
  registrationId: string;
  checkedOutAt: Date;
  errorCode?: string;
  errorMessage?: string;
}

export interface EventScanConfig {
  allowReEntry: boolean;
  requireCheckOut: boolean;
  maxReEntries: number | null;
}

export interface AttendeeSearchResult {
  registrationId: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketType: string | null;
  ticketStatus: TicketStatus;
  isCurrentlyInside: boolean;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  reEntryCount: number;
  backupCode: string | null;
}

export interface ManualCheckInResult extends ScanResult {
  isManual: boolean;
}

export interface ManualCheckOutResult extends CheckOutResult {
  isManual: boolean;
}

export class WorkstationService {
  /**
   * Detect code type (QR code or backup code)
   */
  private static detectCodeType(code: string): 'QR_CODE' | 'BACKUP_CODE' {
    // QR codes contain pipe separators
    if (code.includes('|')) {
      return 'QR_CODE';
    }
    // Backup codes are alphanumeric, typically 10 characters
    return 'BACKUP_CODE';
  }

  /**
   * Parse QR code and extract registration ID
   */
  private static parseQRCode(ticketData: string): {
    registrationId: string;
    eventId: string;
    email: string;
    timestamp: number;
    signature?: string;
  } | null {
    const verification = TicketSecurityService.verifyTicketSignature(ticketData);
    
    if (!verification.isValid || !verification.registrationId || !verification.eventId) {
      return null;
    }

    return {
      registrationId: verification.registrationId,
      eventId: verification.eventId,
      email: verification.email || '',
      timestamp: verification.timestamp || 0,
      signature: verification.signature,
    };
  }

  /**
   * Find registration by backup code
   */
  private static async findRegistrationByBackupCode(
    backupCode: string,
    eventId: string,
  ): Promise<{ registrationId: string; eventId: string } | null> {
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        backupCode,
        eventId,
        status: RegistrationStatus.CONFIRMED,
      },
      select: {
        id: true,
        eventId: true,
      },
    });

    if (!registration) {
      return null;
    }

    return {
      registrationId: registration.id,
      eventId: registration.eventId,
    };
  }

  /**
   * Get event scan configuration
   */
  static async getEventScanConfig(eventId: string): Promise<EventScanConfig | null> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          allowReEntry: true,
          requireCheckOut: true,
          maxReEntries: true,
        },
      });

      if (!event) {
        return null;
      }

      return {
        allowReEntry: event.allowReEntry,
        requireCheckOut: event.requireCheckOut,
        maxReEntries: event.maxReEntries,
      };
    } catch (error) {
      logger.error('Error fetching event scan config:', error);
      return null;
    }
  }

  /**
   * Validate ticket (QR code or backup code)
   */
  static async validateTicket(
    code: string,
    eventId: string,
  ): Promise<TicketValidationResult> {
    try {
      const codeType = this.detectCodeType(code);
      let registrationId: string | undefined;
      let signatureVerified = false;

      if (codeType === 'QR_CODE') {
        // Parse QR code
        const parsed = this.parseQRCode(code);
        if (!parsed) {
          return {
            isValid: false,
            errorCode: 'INVALID_SIGNATURE',
            errorMessage: 'Invalid QR code format or signature verification failed',
            codeType: 'QR_CODE',
            signatureVerified: false,
          };
        }

        registrationId = parsed.registrationId;
        signatureVerified = true; // If parsed successfully, signature is valid

        // Verify event ID matches
        if (parsed.eventId !== eventId) {
          return {
            isValid: false,
            registrationId,
            eventId: parsed.eventId,
            errorCode: 'WRONG_EVENT',
            errorMessage: 'This ticket is for a different event',
            codeType: 'QR_CODE',
            signatureVerified: true,
          };
        }
      } else {
        // Backup code
        const found = await this.findRegistrationByBackupCode(code, eventId);
        if (!found) {
          return {
            isValid: false,
            errorCode: 'INVALID_TICKET',
            errorMessage: 'Backup code not found or invalid',
            codeType: 'BACKUP_CODE',
            signatureVerified: false,
          };
        }

        registrationId = found.registrationId;
        // Backup codes don't have signature verification (Option A - Simple)
        signatureVerified = false;
      }

      if (!registrationId) {
        return {
          isValid: false,
          errorCode: 'INVALID_TICKET',
          errorMessage: 'Could not determine registration ID',
        };
      }

      // Fetch registration and event for validation
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          event: {
            select: {
              id: true,
              status: true,
              endDate: true,
            },
          },
        },
      });

      if (!registration) {
        return {
          isValid: false,
          registrationId,
          errorCode: 'INVALID_TICKET',
          errorMessage: 'Registration not found',
        };
      }

      // Validate registration status
      if (registration.status !== RegistrationStatus.CONFIRMED) {
        return {
          isValid: false,
          registrationId,
          eventId: registration.eventId,
          errorCode: 'RESTRICTED',
          errorMessage: 'Registration is not confirmed',
        };
      }

      // Validate ticket status
      if (registration.ticketStatus === TicketStatus.EXPIRED) {
        return {
          isValid: false,
          registrationId,
          eventId: registration.eventId,
          errorCode: 'EXPIRED',
          errorMessage: 'Ticket has expired',
        };
      }

      if (registration.ticketStatus === TicketStatus.CANCELLED) {
        return {
          isValid: false,
          registrationId,
          eventId: registration.eventId,
          errorCode: 'RESTRICTED',
          errorMessage: 'Ticket has been cancelled',
        };
      }

      // Validate event status
      if (registration.event.status !== EventStatus.APPROVED) {
        return {
          isValid: false,
          registrationId,
          eventId: registration.eventId,
          errorCode: 'RESTRICTED',
          errorMessage: 'Event is not approved',
        };
      }

      // Check if event has ended
      if (registration.event.endDate && new Date(registration.event.endDate) < new Date()) {
        return {
          isValid: false,
          registrationId,
          eventId: registration.eventId,
          errorCode: 'EXPIRED',
          errorMessage: 'Event has ended',
        };
      }

      // Verify event ID matches
      if (registration.eventId !== eventId) {
        return {
          isValid: false,
          registrationId,
          eventId: registration.eventId,
          errorCode: 'WRONG_EVENT',
          errorMessage: 'This ticket is for a different event',
        };
      }

      return {
        isValid: true,
        registrationId,
        eventId: registration.eventId,
        codeType,
        signatureVerified,
      };
    } catch (error) {
      logger.error('Error validating ticket:', error);
      return {
        isValid: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during validation',
      };
    }
  }

  /**
   * Scan ticket (check-in)
   */
  static async scanTicket(
    code: string,
    eventId: string,
    scannedBy: string,
    facility?: string,
    deviceId?: string,
    deviceType?: string,
    ipAddress?: string,
    userAgent?: string,
    location?: { lat: number; lng: number },
  ): Promise<ScanResult> {
    try {
      // Validate ticket first
      const validation = await this.validateTicket(code, eventId);

      if (!validation.isValid || !validation.registrationId) {
        return {
          success: false,
          registrationId: validation.registrationId || '',
          eventId,
          checkedInAt: new Date(),
          errorCode: validation.errorCode || 'VALIDATION_ERROR',
          errorMessage: validation.errorMessage || 'Ticket validation failed',
        };
      }

      const registrationId = validation.registrationId;

      // Acquire distributed lock to prevent concurrent scans
      // If Redis is not available, proceed without locking (with warning)
      const lockKey = `scan:${registrationId}:${eventId}`;
      const lockValue = await LockService.acquireLockWithRetry(lockKey, 5000, 3, 100);

      if (!lockValue) {
        logger.warn(`Lock acquisition failed for ${lockKey} - proceeding without lock (Redis may not be available)`);
      }

      try {
        // Get event scan configuration
        const scanConfig = await this.getEventScanConfig(eventId);
        if (!scanConfig) {
          return {
            success: false,
            registrationId,
            eventId,
            checkedInAt: new Date(),
            errorCode: 'INVALID_EVENT',
            errorMessage: 'Event not found',
          };
        }

        // Check if already scanned (prevent double scan)
        const existingRegistration = await prisma.eventRegistration.findUnique({
          where: { id: registrationId },
          select: {
            isCurrentlyInside: true,
            ticketStatus: true,
            checkedInAt: true,
            reEntryCount: true,
            checkedOutAt: true,
          },
        });

        if (!existingRegistration) {
          return {
            success: false,
            registrationId,
            eventId,
            checkedInAt: new Date(),
            errorCode: 'INVALID_TICKET',
            errorMessage: 'Registration not found',
          };
        }

        // Check if already checked in (not a re-entry)
        if (existingRegistration.isCurrentlyInside) {
          return {
            success: false,
            registrationId,
            eventId,
            checkedInAt: new Date(),
            errorCode: 'ALREADY_SCANNED',
            errorMessage: 'Ticket has already been checked in',
          };
        }

        // Handle re-entry scenario (ticket was previously checked in but is not currently inside)
        // This covers both ACTIVE (re-entry allowed) and DEACTIVATED (re-entry not allowed) cases
        const isReEntry = existingRegistration.checkedInAt !== null && !existingRegistration.isCurrentlyInside;

        if (isReEntry) {
          // Verify signature on re-entry (prevent replay attacks)
          if (validation.codeType === 'QR_CODE' && validation.signatureVerified === false) {
            return {
              success: false,
              registrationId,
              eventId,
              checkedInAt: new Date(),
              errorCode: 'INVALID_SIGNATURE',
              errorMessage: 'Invalid signature for re-entry',
            };
          }

          // Check if re-entry is allowed
          if (!scanConfig.allowReEntry) {
            return {
              success: false,
              registrationId,
              eventId,
              checkedInAt: new Date(),
              errorCode: 'REENTRY_NOT_ALLOWED',
              errorMessage: 'Re-entry is not allowed for this event',
            };
          }

          // Check if check-out is required before re-entry
          if (scanConfig.requireCheckOut && !existingRegistration.checkedOutAt) {
            return {
              success: false,
              registrationId,
              eventId,
              checkedInAt: new Date(),
              errorCode: 'CHECKOUT_REQUIRED',
              errorMessage: 'Ticket must be checked out before re-entry',
            };
          }

          // Validate re-entry count against maxReEntries
          if (scanConfig.maxReEntries !== null && existingRegistration.reEntryCount >= scanConfig.maxReEntries) {
            return {
              success: false,
              registrationId,
              eventId,
              checkedInAt: new Date(),
              errorCode: 'MAX_REENTRIES_EXCEEDED',
              errorMessage: `Maximum re-entries (${scanConfig.maxReEntries}) exceeded`,
            };
          }
        }

        // Check venue capacity before allowing check-in
        const canCheckIn = await VenueCapacityService.canCheckIn(eventId);
        if (!canCheckIn) {
          return {
            success: false,
            registrationId,
            eventId,
            checkedInAt: new Date(),
            errorCode: 'VENUE_AT_CAPACITY',
            errorMessage: 'Venue is at maximum capacity. Check-in is temporarily blocked.',
          };
        }

        const now = new Date();

        // Find previous scan for re-entry linking
        let previousScanId: string | undefined;
        if (isReEntry) {
          const previousScan = await prisma.ticketScan.findFirst({
            where: {
              registrationId,
              eventId,
              scanType: ScanType.CHECK_OUT,
            },
            orderBy: {
              scannedAt: 'desc',
            },
          });
          previousScanId = previousScan?.id;
        }

        // Update registration
        const updateData: {
          checkedInAt: Date;
          checkedInBy: string;
          ticketStatus: TicketStatus;
          isCurrentlyInside: boolean;
          lastScanFacility: string | null;
          reEntryCount?: { increment: number };
        } = {
          checkedInAt: now,
          checkedInBy: scannedBy,
          ticketStatus: TicketStatus.DEACTIVATED,
          isCurrentlyInside: true,
          lastScanFacility: facility || null,
        };

        // Increment re-entry count if this is a re-entry
        if (isReEntry) {
          updateData.reEntryCount = { increment: 1 };
        }

        const updatedRegistration = await prisma.eventRegistration.update({
          where: { id: registrationId },
          data: updateData,
          include: {
            attendee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Create scan record
        await prisma.ticketScan.create({
          data: {
            registrationId,
            eventId,
            scanType: ScanType.CHECK_IN,
            scannedBy,
            facility: facility || null,
            deviceId: deviceId || null,
            deviceType: deviceType || null,
            isValid: true,
            isReEntry,
            previousScanId: previousScanId || null,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            location: location || undefined,
          },
        });

        // Log signature verification status for security monitoring
        if (validation.codeType === 'QR_CODE' && validation.signatureVerified === false) {
          logger.warn(`QR code scanned with invalid signature: registrationId=${registrationId}, eventId=${eventId}`);
        }

        // Update venue occupancy and check for capacity alerts
        try {
          const alerts = await VenueCapacityService.incrementOccupancy(eventId);
          if (alerts.length > 0) {
            // Send capacity alerts asynchronously (don't block check-in)
            AlertService.sendCapacityAlerts(alerts).catch((err) => {
              logger.error('Failed to send capacity alerts', { error: err, eventId });
            });
          }
        } catch (capacityError) {
          // Log but don't fail the check-in if capacity tracking fails
          logger.error('Failed to update venue occupancy', { error: capacityError, eventId });
        }

        return {
          success: true,
          registrationId,
          eventId,
          attendeeName: `${updatedRegistration.attendee.firstName || ''} ${updatedRegistration.attendee.lastName || ''}`.trim(),
          ticketType: updatedRegistration.ticketType,
          checkedInAt: now,
        };
      } finally {
        // Always release the lock if we acquired one
        if (lockValue) {
          await LockService.releaseLock(lockKey, lockValue);
        }
      }
    } catch (error) {
      logger.error('Error scanning ticket:', error);
      return {
        success: false,
        registrationId: '',
        eventId,
        checkedInAt: new Date(),
        errorCode: 'SCAN_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during scan',
      };
    }
  }

  /**
   * Check out ticket
   */
  static async checkOut(
    registrationId: string,
    scannedBy: string,
    facility?: string,
    deviceId?: string,
    deviceType?: string,
    ipAddress?: string,
    userAgent?: string,
    location?: { lat: number; lng: number },
  ): Promise<CheckOutResult> {
    try {
      // Validate ticket is currently inside
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: {
          isCurrentlyInside: true,
          eventId: true,
        },
      });

      if (!registration) {
        return {
          success: false,
          registrationId,
          checkedOutAt: new Date(),
          errorCode: 'INVALID_TICKET',
          errorMessage: 'Registration not found',
        };
      }

      if (!registration.isCurrentlyInside) {
        return {
          success: false,
          registrationId,
          checkedOutAt: new Date(),
          errorCode: 'NOT_CHECKED_IN',
          errorMessage: 'Ticket is not currently checked in',
        };
      }

      // Acquire distributed lock to prevent concurrent checkouts
      // If Redis is not available, proceed without locking (with warning)
      const lockKey = `scan:${registrationId}:${registration.eventId}`;
      const lockValue = await LockService.acquireLockWithRetry(lockKey, 5000, 3, 100);

      if (!lockValue) {
        logger.warn(`Lock acquisition failed for ${lockKey} - proceeding without lock (Redis may not be available)`);
      }

      try {
        // Get event scan configuration
        const scanConfig = await this.getEventScanConfig(registration.eventId);
        if (!scanConfig) {
          return {
            success: false,
            registrationId,
            checkedOutAt: new Date(),
            errorCode: 'INVALID_EVENT',
            errorMessage: 'Event not found',
          };
        }

        // Verify allowReEntry is enabled (checkout is only meaningful if re-entry is allowed)
        // However, we still allow checkout even if re-entry isn't allowed (they just can't come back)
        // This is useful for tracking purposes

        const now = new Date();

        // Update registration
        // Set ticketStatus to ACTIVE only if re-entry is allowed, otherwise keep it DEACTIVATED
        await prisma.eventRegistration.update({
          where: { id: registrationId },
          data: {
            checkedOutAt: now,
            checkedOutBy: scannedBy,
            isCurrentlyInside: false,
            ticketStatus: scanConfig.allowReEntry ? TicketStatus.ACTIVE : TicketStatus.DEACTIVATED,
          },
        });

        // Create scan record
        await prisma.ticketScan.create({
          data: {
            registrationId,
            eventId: registration.eventId,
            scanType: ScanType.CHECK_OUT,
            scannedBy,
            facility: facility || null,
            deviceId: deviceId || null,
            deviceType: deviceType || null,
            isValid: true,
            isReEntry: false,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            location: location || undefined,
          },
        });

        // Update venue occupancy (decrement on check-out)
        try {
          await VenueCapacityService.decrementOccupancy(registration.eventId);
        } catch (capacityError) {
          // Log but don't fail the check-out if capacity tracking fails
          logger.error('Failed to decrement venue occupancy', { error: capacityError, eventId: registration.eventId });
        }

        return {
          success: true,
          registrationId,
          checkedOutAt: now,
        };
      } finally {
        // Always release the lock if we acquired one
        if (lockValue) {
          await LockService.releaseLock(lockKey, lockValue);
        }
      }
    } catch (error) {
      logger.error('Error checking out ticket:', error);
      return {
        success: false,
        registrationId,
        checkedOutAt: new Date(),
        errorCode: 'CHECKOUT_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during checkout',
      };
    }
  }

  /**
   * Search attendees by various criteria
   */
  static async searchAttendees(
    searchTerm: string,
    eventId: string,
    limit: number = 20,
  ): Promise<AttendeeSearchResult[]> {
    try {
      // Try to find by registration ID first (exact match)
      if (searchTerm.length > 10) {
        const byRegistrationId = await prisma.eventRegistration.findFirst({
          where: {
            id: searchTerm,
            eventId,
          },
          include: {
            attendee: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        });

        if (byRegistrationId) {
          return [
            {
              registrationId: byRegistrationId.id,
              eventId: byRegistrationId.eventId,
              attendeeName: `${byRegistrationId.attendee.firstName || ''} ${byRegistrationId.attendee.lastName || ''}`.trim(),
              attendeeEmail: byRegistrationId.attendee.email,
              ticketType: byRegistrationId.ticketType,
              ticketStatus: byRegistrationId.ticketStatus,
              isCurrentlyInside: byRegistrationId.isCurrentlyInside,
              checkedInAt: byRegistrationId.checkedInAt,
              checkedOutAt: byRegistrationId.checkedOutAt,
              reEntryCount: byRegistrationId.reEntryCount,
              backupCode: byRegistrationId.backupCode,
            },
          ];
        }
      }

      // Try to find by backup code (exact match)
      const byBackupCode = await prisma.eventRegistration.findFirst({
        where: {
          backupCode: searchTerm,
          eventId,
        },
        include: {
          attendee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (byBackupCode) {
        return [
          {
            registrationId: byBackupCode.id,
            eventId: byBackupCode.eventId,
            attendeeName: `${byBackupCode.attendee.firstName || ''} ${byBackupCode.attendee.lastName || ''}`.trim(),
            attendeeEmail: byBackupCode.attendee.email,
            ticketType: byBackupCode.ticketType,
            ticketStatus: byBackupCode.ticketStatus,
            isCurrentlyInside: byBackupCode.isCurrentlyInside,
            checkedInAt: byBackupCode.checkedInAt,
            checkedOutAt: byBackupCode.checkedOutAt,
            reEntryCount: byBackupCode.reEntryCount,
            backupCode: byBackupCode.backupCode,
          },
        ];
      }

      // Search by name, email, or phone (partial match)
      // Split search term to handle full names (e.g., "John Doe" -> ["John", "Doe"])
      const searchTerms = searchTerm.trim().split(/\s+/);
      const firstNameTerm = searchTerms[0] || '';
      const lastNameTerm = searchTerms.length > 1 ? searchTerms.slice(1).join(' ') : '';

      // Build OR conditions for attendee search
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attendeeConditions: any[] = [
        // Match email
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        // Match phone
        {
          phoneNumber: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ];

      // Add first name condition if we have a first name term
      if (firstNameTerm) {
        attendeeConditions.push({
          firstName: {
            contains: firstNameTerm,
            mode: 'insensitive' as const,
          },
        });
      }

      // Add last name condition if we have a last name term
      if (lastNameTerm) {
        attendeeConditions.push({
          lastName: {
            contains: lastNameTerm,
            mode: 'insensitive' as const,
          },
        });
      }

      // Add full name AND condition if we have both
      if (firstNameTerm && lastNameTerm) {
        attendeeConditions.push({
          AND: [
            {
              firstName: {
                contains: firstNameTerm,
                mode: 'insensitive' as const,
              },
            },
            {
              lastName: {
                contains: lastNameTerm,
                mode: 'insensitive' as const,
              },
            },
          ],
        });
      }

      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          OR: [
            {
              attendee: {
                OR: attendeeConditions,
              },
            },
          ],
        },
        include: {
          attendee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return registrations.map((reg) => ({
        registrationId: reg.id,
        eventId: reg.eventId,
        attendeeName: `${reg.attendee.firstName || ''} ${reg.attendee.lastName || ''}`.trim(),
        attendeeEmail: reg.attendee.email,
        ticketType: reg.ticketType,
        ticketStatus: reg.ticketStatus,
        isCurrentlyInside: reg.isCurrentlyInside,
        checkedInAt: reg.checkedInAt,
        checkedOutAt: reg.checkedOutAt,
        reEntryCount: reg.reEntryCount,
        backupCode: reg.backupCode,
      }));
    } catch (error) {
      logger.error('Error searching attendees:', error);
      return [];
    }
  }

  /**
   * Manual check-in by search term
   */
  static async manualCheckIn(
    searchTerm: string,
    eventId: string,
    scannedBy: string,
    facility?: string,
    deviceId?: string,
    deviceType?: string,
  ): Promise<ManualCheckInResult> {
    try {
      // Search for registration - use limit 2 to detect multiple matches
      const results = await this.searchAttendees(searchTerm, eventId, 2);

      if (results.length === 0) {
        return {
          success: false,
          registrationId: '',
          eventId,
          checkedInAt: new Date(),
          errorCode: 'NOT_FOUND',
          errorMessage: 'No registration found matching search term',
          isManual: true,
        };
      }

      if (results.length > 1) {
        return {
          success: false,
          registrationId: '',
          eventId,
          checkedInAt: new Date(),
          errorCode: 'MULTIPLE_MATCHES',
          errorMessage: 'Multiple registrations found. Please be more specific.',
          isManual: true,
        };
      }

      const registration = results[0];

      // Check if search term is a QR code - verify signature if so
      let signatureVerified: boolean | undefined;
      if (this.detectCodeType(searchTerm) === 'QR_CODE') {
        const verification = TicketSecurityService.verifyTicketSignature(searchTerm);
        signatureVerified = verification.isValid;
        
        if (!signatureVerified) {
          logger.warn(`Manual check-in attempted with invalid QR code signature: registrationId=${registration.registrationId}, eventId=${eventId}`);
        }
      }

      // Perform check-in using scanTicket logic
      // We'll use the registration ID directly since we found it
      const scanResult = await this.scanTicket(
        registration.backupCode || registration.registrationId,
        eventId,
        scannedBy,
        facility,
        deviceId,
        deviceType,
      );

      if (!scanResult.success) {
        return {
          ...scanResult,
          isManual: true,
        };
      }

      // Update the scan record to mark it as manual
      await prisma.ticketScan.updateMany({
        where: {
          registrationId: registration.registrationId,
          eventId,
          scannedBy,
          scanType: ScanType.CHECK_IN,
        },
        data: {
          scanType: ScanType.MANUAL_CHECK_IN,
        },
      });

      // Log signature verification status for audit
      if (signatureVerified !== undefined) {
        logger.info(`Manual check-in signature verification: registrationId=${registration.registrationId}, verified=${signatureVerified}`);
      }

      return {
        ...scanResult,
        isManual: true,
      };
    } catch (error) {
      logger.error('Error performing manual check-in:', error);
      return {
        success: false,
        registrationId: '',
        eventId,
        checkedInAt: new Date(),
        errorCode: 'MANUAL_CHECKIN_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during manual check-in',
        isManual: true,
      };
    }
  }

  /**
   * Manual check-out by search term
   */
  static async manualCheckOut(
    searchTerm: string,
    eventId: string,
    scannedBy: string,
    facility?: string,
    deviceId?: string,
    deviceType?: string,
  ): Promise<ManualCheckOutResult> {
    try {
      // Search for registration - use limit 2 to detect multiple matches
      const results = await this.searchAttendees(searchTerm, eventId, 2);

      if (results.length === 0) {
        return {
          success: false,
          registrationId: '',
          checkedOutAt: new Date(),
          errorCode: 'NOT_FOUND',
          errorMessage: 'No registration found matching search term',
          isManual: true,
        };
      }

      if (results.length > 1) {
        return {
          success: false,
          registrationId: '',
          checkedOutAt: new Date(),
          errorCode: 'MULTIPLE_MATCHES',
          errorMessage: 'Multiple registrations found. Please be more specific.',
          isManual: true,
        };
      }

      const registration = results[0];

      // Perform check-out using checkOut logic
      const checkoutResult = await this.checkOut(
        registration.registrationId,
        scannedBy,
        facility,
        deviceId,
        deviceType,
      );

      if (!checkoutResult.success) {
        return {
          ...checkoutResult,
          isManual: true,
        };
      }

      // Update the scan record to mark it as manual
      await prisma.ticketScan.updateMany({
        where: {
          registrationId: registration.registrationId,
          eventId,
          scannedBy,
          scanType: ScanType.CHECK_OUT,
        },
        data: {
          scanType: ScanType.MANUAL_CHECK_OUT,
        },
      });

      return {
        ...checkoutResult,
        isManual: true,
      };
    } catch (error) {
      logger.error('Error performing manual check-out:', error);
      return {
        success: false,
        registrationId: '',
        checkedOutAt: new Date(),
        errorCode: 'MANUAL_CHECKOUT_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during manual check-out',
        isManual: true,
      };
    }
  }
}

