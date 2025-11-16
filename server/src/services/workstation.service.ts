import { prisma } from '../config/database.js';
import { TicketSecurityService } from './ticket-security.service.js';
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

      return {
        success: true,
        registrationId,
        eventId,
        attendeeName: `${updatedRegistration.attendee.firstName || ''} ${updatedRegistration.attendee.lastName || ''}`.trim(),
        ticketType: updatedRegistration.ticketType,
        checkedInAt: now,
      };
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

      return {
        success: true,
        registrationId,
        checkedOutAt: now,
      };
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
}

