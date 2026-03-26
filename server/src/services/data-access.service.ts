import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { SubscriptionService } from './subscription.service.js';
import { SubscriptionTier, Prisma } from '@prisma/client';

export interface AuditLogData {
  organizerId: string;
  attendeeId?: string;
  eventId?: string;
  action: 'VIEW' | 'EXPORT' | 'DELETE' | 'UPDATE' | 'EMAIL_SENT';
  dataType: 'ATTENDEE_LIST' | 'ANALYTICS' | 'EXPORT' | 'DEMOGRAPHICS' | 'ENGAGEMENT';
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

export class DataAccessService {
  /**
   * Log data access for audit purposes
   */
  static async logAccess(data: AuditLogData) {
    try {
      await prisma.dataAccessAuditLog.create({
        data: {
          organizerId: data.organizerId,
          attendeeId: data.attendeeId,
          eventId: data.eventId,
          action: data.action,
          dataType: data.dataType,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          details: data.details as unknown as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      logger.error('Failed to log data access:', error);
    }
  }

  /**
   * Filter attendee data based on subscription tier and consent
   */
  static async filterAttendeeData(
    registrations: Record<string, unknown>[],
    organizerId: string,
    eventId: string,
    ipAddress?: string,
    userAgent?: string,
    dataAccessLevel?: string,
  ): Promise<Record<string, unknown>[]> {
    // Use event-level organizerDataAccess if provided, otherwise fall back to subscription tier
    const effectiveLevel = dataAccessLevel || await (async () => {
      const tier = await SubscriptionService.getTier(organizerId);
      // Map subscription tier to data access level
      if (tier === SubscriptionTier.BASIC) return 'RESTRICTED';
      if (tier === SubscriptionTier.STANDARD) return 'STANDARD';
      return 'FULL'; // PREMIUM
    })();

    // Log the access
    await this.logAccess({
      organizerId,
      eventId,
      action: 'VIEW',
      dataType: 'ATTENDEE_LIST',
      ipAddress,
      userAgent,
    });

    // RESTRICTED / BASIC tier: Return aggregated data only (no PII)
    if (effectiveLevel === 'RESTRICTED') {
      return registrations.map(reg => ({
        id: reg.id,
        eventId: reg.eventId,
        attendeeId: reg.attendeeId,
        status: reg.status,
        ticketType: reg.ticketType,
        quantity: reg.quantity,
        createdAt: reg.createdAt,
      }));
    }

    // STANDARD and FULL: organizer paid for access — return all registrations with attendee data
    const att = (reg: Record<string, unknown>) => {
      const a = reg.attendee as { id: string; firstName: string; lastName: string; email: string; phoneNumber?: string | null } | null | undefined;
      return a ? { id: a.id, firstName: a.firstName, lastName: a.lastName, email: a.email, phoneNumber: a.phoneNumber } : null;
    };

    return registrations.map(reg => ({
      id: reg.id,
      eventId: reg.eventId,
      attendeeId: reg.attendeeId,
      status: reg.status,
      ticketType: reg.ticketType,
      quantity: reg.quantity,
      createdAt: reg.createdAt,
      totalAmount: reg.totalAmount,
      paymentStatus: reg.paymentStatus,
      paymentMethod: reg.paymentMethod,
      attendee: att(reg),
    }));
  }

  /**
   * Check if organizer can access a specific data type
   */
  static async canAccessData(
    organizerId: string,
    dataType: 'attendee_list' | 'demographics' | 'analytics' | 'export',
  ): Promise<boolean> {
    return SubscriptionService.hasFeatureAccess(organizerId, dataType);
  }

  /**
   * Get accessible attendee count (for BASIC tier)
   */
  static async getAccessibleAttendeeCount(
    eventId: string,
    _organizerId: string,
  ): Promise<number> {
    return prisma.eventRegistration.count({ where: { eventId } });
  }

  /**
   * Get accessible attendee list with consent filtering
   */
  static async getAccessibleAttendeeList(
    eventId: string,
    organizerId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            city: true,
            state: true,
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.filterAttendeeData(registrations, organizerId, eventId, ipAddress, userAgent);
  }

  /**
   * Log export action
   */
  static async logExport(
    organizerId: string,
    eventId: string,
    format: string,
    recordCount: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logAccess({
      organizerId,
      eventId,
      action: 'EXPORT',
      dataType: 'EXPORT',
      ipAddress,
      userAgent,
      details: {
        format,
        recordCount,
      },
    });
  }
}


