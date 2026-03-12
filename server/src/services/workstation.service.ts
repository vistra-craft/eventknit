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
  attendeeName?: string;
  ticketType?: string | null;
  errorCode?: string;
  errorMessage?: string;
}

export interface EventScanConfig {
  allowReEntry: boolean;
  requireCheckOut: boolean;
  maxReEntries: number | null;
}

export interface VoidCheckInResult {
  success: boolean;
  registrationId: string;
  eventId?: string;
  attendeeName?: string;
  scanId?: string;
  errorCode?: string;
  errorMessage?: string;
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
   * Now supports three formats:
   * - SIGNED: New Ed25519 signed format (header.payload.signature)
   * - LEGACY_QR: Legacy HMAC format (registrationId|eventId|email|timestamp|signature)
   * - BACKUP_CODE: Alphanumeric backup code
   */
  private static detectCodeType(code: string): 'QR_CODE' | 'BACKUP_CODE' {
    const format = TicketSecurityService.detectTicketFormat(code);
    // Map to existing type for backward compatibility
    if (format === 'SIGNED' || format === 'LEGACY') {
      return 'QR_CODE';
    }
    return 'BACKUP_CODE';
  }

  /**
   * Get detailed ticket format for signature verification
   */
  private static getTicketFormat(code: string): 'SIGNED' | 'LEGACY' | 'BACKUP' {
    return TicketSecurityService.detectTicketFormat(code);
  }

  /**
   * Validate session belongs to event and return session metadata
   */
  private static async getSessionInfo(sessionId: string, eventId: string): Promise<{ id: string; dayOfEvent: number } | null> {
    const session = await prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        eventId,
      },
      select: {
        id: true,
        dayOfEvent: true,
      },
    });

    return session ? { id: session.id, dayOfEvent: session.dayOfEvent } : null;
  }

  /**
   * Parse QR code and extract registration ID
   * Supports both signed (Ed25519) and legacy (HMAC) formats
   */
  private static parseQRCode(ticketData: string): {
    registrationId: string;
    eventId: string;
    email: string;
    timestamp: number;
    signature?: string;
    format: 'SIGNED' | 'LEGACY';
  } | null {
    const format = this.getTicketFormat(ticketData);

    if (format === 'SIGNED') {
      // Parse new Ed25519 signed format
      const payload = TicketSecurityService.verifySignedTicket(ticketData);
      if (!payload) {
        return null;
      }
      return {
        registrationId: payload.rid,
        eventId: payload.eid,
        email: payload.sub,
        timestamp: payload.iat,
        format: 'SIGNED',
      };
    } else if (format === 'LEGACY') {
      // Parse legacy HMAC format
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
        format: 'LEGACY',
      };
    }

    return null;
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
  /**
   * Core check-in state machine — called by scanTicket and manualCheckIn.
   * Accepts an already-validated registration ID + signature metadata.
   */
  private static async performCheckIn(
    registrationId: string,
    eventId: string,
    scannedBy: string,
    validationMeta: { codeType: 'QR_CODE' | 'BACKUP_CODE'; signatureVerified: boolean },
    facility?: string,
    deviceId?: string,
    deviceType?: string,
    ipAddress?: string,
    userAgent?: string,
    location?: { lat: number; lng: number },
    sessionId?: string,
  ): Promise<ScanResult> {
    // Acquire distributed lock to prevent concurrent scans on the same ticket.
    // Fail-hard: if Redis is unavailable or another process holds the lock after
    // retries, we reject the scan rather than risk a double check-in.
    const lockKey = `scan:${registrationId}:${eventId}`;
    const lockValue = await LockService.acquireLockWithRetry(lockKey, 5000, 3, 100);
    if (!lockValue) {
      logger.error(`Lock acquisition failed for ${lockKey} — rejecting scan to prevent double check-in`);
      return {
        success: false,
        registrationId,
        eventId,
        checkedInAt: new Date(),
        errorCode: 'LOCK_FAILED',
        errorMessage: 'System is busy processing another scan for this ticket. Please try again in a moment.',
      };
    }

    try {
      const scanConfig = await this.getEventScanConfig(eventId);
      if (!scanConfig) {
        return { success: false, registrationId, eventId, checkedInAt: new Date(), errorCode: 'INVALID_EVENT', errorMessage: 'Event not found' };
      }

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
        return { success: false, registrationId, eventId, checkedInAt: new Date(), errorCode: 'INVALID_TICKET', errorMessage: 'Registration not found' };
      }

      if (existingRegistration.isCurrentlyInside) {
        return { success: false, registrationId, eventId, checkedInAt: new Date(), errorCode: 'ALREADY_SCANNED', errorMessage: 'Ticket has already been checked in' };
      }

      const isReEntry = existingRegistration.checkedInAt !== null && !existingRegistration.isCurrentlyInside;

      if (isReEntry) {
        if (validationMeta.codeType === 'QR_CODE' && !validationMeta.signatureVerified) {
          return { success: false, registrationId, eventId, checkedInAt: new Date(), errorCode: 'INVALID_SIGNATURE', errorMessage: 'Invalid signature for re-entry' };
        }
        if (!scanConfig.allowReEntry) {
          return { success: false, registrationId, eventId, checkedInAt: new Date(), errorCode: 'REENTRY_NOT_ALLOWED', errorMessage: 'Re-entry is not allowed for this event' };
        }
        if (scanConfig.requireCheckOut && !existingRegistration.checkedOutAt) {
          return { success: false, registrationId, eventId, checkedInAt: new Date(), errorCode: 'CHECKOUT_REQUIRED', errorMessage: 'Ticket must be checked out before re-entry' };
        }
        if (scanConfig.maxReEntries !== null && existingRegistration.reEntryCount >= scanConfig.maxReEntries) {
          return { success: false, registrationId, eventId, checkedInAt: new Date(), errorCode: 'MAX_REENTRIES_EXCEEDED', errorMessage: `Maximum re-entries (${scanConfig.maxReEntries}) exceeded` };
        }
      }

      const canCheckIn = await VenueCapacityService.canCheckIn(eventId);
      if (!canCheckIn) {
        return { success: false, registrationId, eventId, checkedInAt: new Date(), errorCode: 'VENUE_AT_CAPACITY', errorMessage: 'Venue is at maximum capacity. Check-in is temporarily blocked.' };
      }

      const now = new Date();

      let sessionInfo: { id: string; dayOfEvent: number } | null = null;
      if (sessionId) {
        sessionInfo = await this.getSessionInfo(sessionId, eventId);
        if (!sessionInfo) {
          return { success: false, registrationId, eventId, checkedInAt: now, errorCode: 'INVALID_SESSION', errorMessage: 'Session not found for this event' };
        }
      } else {
        const activeAttendance = await prisma.sessionAttendance.findFirst({
          where: { registrationId, checkedOutAt: null, session: { eventId } },
          orderBy: { checkedInAt: 'desc' },
          include: { session: { select: { dayOfEvent: true } } },
        });
        if (activeAttendance) {
          sessionInfo = { id: activeAttendance.sessionId, dayOfEvent: activeAttendance.session.dayOfEvent };
        }
      }

      let previousScanId: string | undefined;
      if (isReEntry) {
        const previousScan = await prisma.ticketScan.findFirst({
          where: { registrationId, eventId, scanType: ScanType.CHECK_OUT },
          orderBy: { scannedAt: 'desc' },
        });
        previousScanId = previousScan?.id;
      }

      const updateData: {
        checkedInAt: Date; checkedInBy: string; ticketStatus: TicketStatus;
        isCurrentlyInside: boolean; lastScanFacility: string | null;
        reEntryCount?: { increment: number };
      } = {
        checkedInAt: now, checkedInBy: scannedBy,
        ticketStatus: TicketStatus.DEACTIVATED,
        isCurrentlyInside: true, lastScanFacility: facility || null,
      };
      if (isReEntry) updateData.reEntryCount = { increment: 1 };

      const updatedRegistration = await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: updateData,
        include: { attendee: { select: { firstName: true, lastName: true } } },
      });

      await prisma.ticketScan.create({
        data: {
          registrationId, eventId, sessionId: sessionInfo?.id,
          scanType: ScanType.CHECK_IN, scannedBy,
          facility: facility || null, deviceId: deviceId || null,
          deviceType: deviceType || null, isValid: true, isReEntry,
          previousScanId: previousScanId || null,
          ipAddress: ipAddress || null, userAgent: userAgent || null,
          location: location || undefined, dayOfEvent: sessionInfo?.dayOfEvent,
        },
      });

      if (sessionInfo) {
        await prisma.sessionAttendance.upsert({
          where: { sessionId_registrationId: { sessionId: sessionInfo.id, registrationId } },
          update: { checkedInAt: now, attended: true },
          create: { sessionId: sessionInfo.id, registrationId, checkedInAt: now, attended: true },
        });
      }

      if (validationMeta.codeType === 'QR_CODE' && !validationMeta.signatureVerified) {
        logger.warn(`QR code scanned with invalid signature: registrationId=${registrationId}, eventId=${eventId}`);
      }

      try {
        const alerts = await VenueCapacityService.incrementOccupancy(eventId);
        if (alerts.length > 0) {
          AlertService.sendCapacityAlerts(alerts).catch((err) => {
            logger.error('Failed to send capacity alerts', { error: err, eventId });
          });
        }
      } catch (capacityError) {
        logger.error('Failed to update venue occupancy', { error: capacityError, eventId });
      }

      return {
        success: true, registrationId, eventId,
        attendeeName: `${updatedRegistration.attendee.firstName || ''} ${updatedRegistration.attendee.lastName || ''}`.trim(),
        ticketType: updatedRegistration.ticketType,
        checkedInAt: now,
      };
    } finally {
      if (lockValue) await LockService.releaseLock(lockKey, lockValue);
    }
  }

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
    sessionId?: string,
  ): Promise<ScanResult> {
    try {
      const sessionInfo = sessionId ? await this.getSessionInfo(sessionId, eventId) : null;
      if (sessionId && !sessionInfo) {
        return {
          success: false,
          registrationId: '',
          eventId,
          checkedInAt: new Date(),
          errorCode: 'INVALID_SESSION',
          errorMessage: 'Session not found for this event',
        };
      }

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

      return this.performCheckIn(
        registrationId, eventId, scannedBy,
        { codeType: validation.codeType ?? 'QR_CODE', signatureVerified: validation.signatureVerified ?? false },
        facility, deviceId, deviceType, ipAddress, userAgent, location, sessionId,
      );
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
    sessionId?: string,
  ): Promise<CheckOutResult> {
    try {
      // Validate ticket is currently inside
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: {
          isCurrentlyInside: true,
          eventId: true,
          ticketType: true,
          attendee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
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

      // Acquire distributed lock to prevent concurrent checkouts.
      // Fail-hard: reject rather than risk a double checkout.
      const lockKey = `scan:${registrationId}:${registration.eventId}`;
      const lockValue = await LockService.acquireLockWithRetry(lockKey, 5000, 3, 100);

      if (!lockValue) {
        logger.error(`Lock acquisition failed for ${lockKey} — rejecting checkout to prevent double checkout`);
        return {
          success: false,
          registrationId,
          checkedOutAt: new Date(),
          errorCode: 'LOCK_FAILED',
          errorMessage: 'System is busy processing another scan for this ticket. Please try again in a moment.',
        };
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

        // Resolve session info and compute duration for this checkout
        let sessionInfo: { id: string; dayOfEvent: number } | null = null;
        let attendanceCheckedInAt: Date | null = null;

        if (sessionId) {
          sessionInfo = await this.getSessionInfo(sessionId, registration.eventId);
          if (!sessionInfo) {
            return {
              success: false,
              registrationId,
              checkedOutAt: now,
              errorCode: 'INVALID_SESSION',
              errorMessage: 'Session not found for this event',
            };
          }

          const existingAttendance = await prisma.sessionAttendance.findUnique({
            where: {
              sessionId_registrationId: {
                sessionId: sessionInfo.id,
                registrationId,
              },
            },
            select: { checkedInAt: true },
          });

          attendanceCheckedInAt = existingAttendance?.checkedInAt ?? null;
        } else {
          const activeAttendance = await prisma.sessionAttendance.findFirst({
            where: {
              registrationId,
              checkedOutAt: null,
              session: {
                eventId: registration.eventId,
              },
            },
            orderBy: { checkedInAt: 'desc' },
            include: {
              session: { select: { dayOfEvent: true } },
            },
          });

          if (activeAttendance) {
            sessionInfo = { id: activeAttendance.sessionId, dayOfEvent: activeAttendance.session.dayOfEvent };
            attendanceCheckedInAt = activeAttendance.checkedInAt;
          }
        }

        const durationSeconds = attendanceCheckedInAt
          ? Math.max(0, Math.round((now.getTime() - attendanceCheckedInAt.getTime()) / 1000))
          : undefined;

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
            sessionId: sessionInfo?.id,
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
            dayOfEvent: sessionInfo?.dayOfEvent,
            durationSeconds,
          },
        });

        if (sessionInfo) {
          const attendance = await prisma.sessionAttendance.findUnique({
            where: {
              sessionId_registrationId: {
                sessionId: sessionInfo.id,
                registrationId,
              },
            },
          });

          if (attendance) {
            await prisma.sessionAttendance.update({
              where: { id: attendance.id },
              data: {
                checkedOutAt: now,
                durationSeconds,
                attended: true,
              },
            });
          } else {
            await prisma.sessionAttendance.create({
              data: {
                sessionId: sessionInfo.id,
                registrationId,
                checkedOutAt: now,
                durationSeconds,
                attended: true,
              },
            });
          }
        }

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
          attendeeName: `${registration.attendee.firstName || ''} ${registration.attendee.lastName || ''}`.trim(),
          ticketType: registration.ticketType,
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
    sessionId?: string,
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

      // Perform check-in directly by registration ID — no code validation needed
      // since we already resolved the registration via searchAttendees.
      const scanResult = await this.performCheckIn(
        registration.registrationId,
        eventId,
        scannedBy,
        { codeType: 'BACKUP_CODE', signatureVerified: false },
        facility,
        deviceId,
        deviceType,
        undefined,
        undefined,
        undefined,
        sessionId,
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
    sessionId?: string,
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
        undefined,
        undefined,
        undefined,
        sessionId,
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

  // ─── Organizer Scan Analytics (with ownership verification) ───

  private static async verifyEventOwnership(eventId: string, organizerId: string, isAdmin = false): Promise<void> {
    const event = await prisma.event.findFirst({
      where: { id: eventId, ...(isAdmin ? {} : { organizerId }) },
      select: { id: true },
    });
    if (!event) {
      throw new Error('Event not found or access denied');
    }
  }

  static async getOrganizerEventScanOverview(eventId: string, organizerId: string, isAdmin = false) {
    await this.verifyEventOwnership(eventId, organizerId, isAdmin);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        allowReEntry: true,
        requireCheckOut: true,
        maxReEntries: true,
        scanSettings: true,
      },
    });

    const [totalAttendees, checkedInCount, currentlyInsideCount, reEntrySum] = await Promise.all([
      prisma.eventRegistration.count({ where: { eventId } }),
      prisma.eventRegistration.count({ where: { eventId, checkedInAt: { not: null } } }),
      prisma.eventRegistration.count({ where: { eventId, isCurrentlyInside: true } }),
      prisma.eventRegistration.aggregate({ where: { eventId }, _sum: { reEntryCount: true } }),
    ]);

    const checkedOutCount = checkedInCount - currentlyInsideCount;
    const scansToday = await prisma.ticketScan.count({
      where: {
        eventId,
        scannedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    return {
      config: {
        allowReEntry: event?.allowReEntry ?? false,
        requireCheckOut: event?.requireCheckOut ?? false,
        maxReEntries: event?.maxReEntries ?? null,
        scanSettings: event?.scanSettings ?? null,
      },
      statistics: {
        totalAttendees,
        checkedIn: checkedInCount,
        currentlyInside: currentlyInsideCount,
        checkedOut: checkedOutCount,
        reEntries: reEntrySum._sum.reEntryCount ?? 0,
        scansToday,
      },
    };
  }

  static async getOrganizerEventScans(
    eventId: string,
    organizerId: string,
    filters: { scanType?: string; page?: number; limit?: number },
    isAdmin = false,
  ) {
    await this.verifyEventOwnership(eventId, organizerId, isAdmin);

    const pageNum = filters.page ?? 1;
    const limitNum = filters.limit ?? 20;
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { eventId };
    if (filters.scanType) {
      where.scanType = filters.scanType;
    }

    const [scans, total] = await Promise.all([
      prisma.ticketScan.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          registration: {
            include: {
              attendee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { scannedAt: 'desc' },
      }),
      prisma.ticketScan.count({ where }),
    ]);

    const scannerIds = [...new Set(scans.map((s) => s.scannedBy))];
    const scanners = await prisma.user.findMany({
      where: { id: { in: scannerIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const scannerMap = new Map(scanners.map((s) => [s.id, s]));

    return {
      scans: scans.map((scan) => {
        const scanner = scannerMap.get(scan.scannedBy);
        return {
          id: scan.id,
          registrationId: scan.registrationId,
          eventId: scan.eventId,
          scanType: scan.scanType,
          scannedAt: scan.scannedAt,
          scannedBy: scanner ? `${scanner.firstName || ''} ${scanner.lastName || ''}`.trim() : scan.scannedBy,
          facility: scan.facility,
          session: scan.sessionId,
          attendeeName: `${scan.registration.attendee.firstName || ''} ${scan.registration.attendee.lastName || ''}`.trim(),
          ticketType: scan.registration.ticketType,
          isReEntry: scan.isReEntry,
          isValid: scan.isValid,
          scanLocation: scan.location,
        };
      }),
      total,
      pagination: { page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  static async getOrganizerEventAttendees(
    eventId: string,
    organizerId: string,
    filters: { page?: number; limit?: number },
    isAdmin = false,
  ) {
    await this.verifyEventOwnership(eventId, organizerId, isAdmin);

    const pageNum = filters.page ?? 1;
    const limitNum = filters.limit ?? 20;
    const skip = (pageNum - 1) * limitNum;

    const [attendees, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: { eventId },
        skip,
        take: limitNum,
        include: {
          attendee: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
        },
        orderBy: { checkedInAt: 'desc' },
      }),
      prisma.eventRegistration.count({ where: { eventId } }),
    ]);

    return {
      attendees: attendees.map((reg) => ({
        registrationId: reg.id,
        visitorId: reg.attendee.id,
        attendeeName: `${reg.attendee.firstName || ''} ${reg.attendee.lastName || ''}`.trim(),
        firstName: reg.attendee.firstName,
        lastName: reg.attendee.lastName,
        email: reg.attendee.email,
        phoneNumber: reg.attendee.phoneNumber,
        ticketType: reg.ticketType,
        ticketStatus: reg.ticketStatus,
        isCurrentlyInside: reg.isCurrentlyInside,
        checkedInAt: reg.checkedInAt,
        checkedOutAt: reg.checkedOutAt,
        reEntryCount: reg.reEntryCount,
        lastScanFacility: reg.lastScanFacility,
        registeredAt: reg.createdAt,
      })),
      total,
      pagination: { page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  static async updateOrganizerEventScanConfig(
    eventId: string,
    organizerId: string,
    updates: { allowReEntry?: boolean; requireCheckOut?: boolean; maxReEntries?: number | null },
    isAdmin = false,
  ) {
    await this.verifyEventOwnership(eventId, organizerId, isAdmin);

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updates,
      select: { allowReEntry: true, requireCheckOut: true, maxReEntries: true, scanSettings: true },
    });

    return {
      allowReEntry: event.allowReEntry,
      requireCheckOut: event.requireCheckOut,
      maxReEntries: event.maxReEntries,
      scanSettings: event.scanSettings,
    };
  }

  /**
   * Void / reverse a check-in.
   * Resets EventRegistration to pre-check-in state and creates a VOID TicketScan
   * for the audit trail. Requires ADMIN_STAFF or higher (enforced at route level).
   */
  static async voidCheckIn(
    registrationId: string,
    voidedBy: string,
    reason?: string,
  ): Promise<VoidCheckInResult> {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      select: {
        eventId: true,
        checkedInAt: true,
        isCurrentlyInside: true,
        reEntryCount: true,
        attendee: { select: { firstName: true, lastName: true } },
      },
    });

    if (!registration) {
      return { success: false, registrationId, errorCode: 'INVALID_TICKET', errorMessage: 'Registration not found' };
    }

    if (!registration.checkedInAt) {
      return { success: false, registrationId, errorCode: 'NOT_CHECKED_IN', errorMessage: 'This ticket has never been checked in' };
    }

    const lockKey = `scan:${registrationId}:${registration.eventId}`;
    const lockValue = await LockService.acquireLockWithRetry(lockKey, 5000, 3, 100);
    if (!lockValue) {
      logger.error(`Lock acquisition failed for void on ${lockKey}`);
      return { success: false, registrationId, errorCode: 'LOCK_FAILED', errorMessage: 'System busy, please try again' };
    }

    try {
      // Reset registration to pre-check-in state
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          checkedInAt: null,
          checkedInBy: null,
          checkedOutAt: null,
          isCurrentlyInside: false,
          ticketStatus: TicketStatus.ACTIVE,
          lastScanFacility: null,
          ...(registration.reEntryCount > 0 ? { reEntryCount: { decrement: 1 } } : {}),
        },
      });

      // Decrement venue occupancy if the attendee was marked inside
      if (registration.isCurrentlyInside) {
        try {
          await VenueCapacityService.decrementOccupancy(registration.eventId);
        } catch (err) {
          logger.error('Failed to decrement venue occupancy on void', { err, registrationId });
        }
      }

      // Create VOID scan record for the audit trail
      const voidScan = await prisma.ticketScan.create({
        data: {
          registrationId,
          eventId: registration.eventId,
          scanType: ScanType.VOID,
          scannedBy: voidedBy,
          isValid: true,
          isReEntry: false,
          notes: reason ?? 'Check-in voided by staff',
        },
      });

      const attendeeName = `${registration.attendee.firstName ?? ''} ${registration.attendee.lastName ?? ''}`.trim();

      return {
        success: true,
        registrationId,
        eventId: registration.eventId,
        attendeeName,
        scanId: voidScan.id,
      };
    } finally {
      await LockService.releaseLock(lockKey, lockValue);
    }
  }
}

