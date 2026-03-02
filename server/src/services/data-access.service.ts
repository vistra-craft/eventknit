import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { SubscriptionService } from './subscription.service.js';
import { ConsentService } from './consent.service.js';
import { SubscriptionTier } from '@prisma/client';

export interface AuditLogData {
  organizerId: string;
  attendeeId?: string;
  eventId?: string;
  action: 'VIEW' | 'EXPORT' | 'DELETE' | 'UPDATE' | 'EMAIL_SENT';
  dataType: 'ATTENDEE_LIST' | 'ANALYTICS' | 'EXPORT' | 'DEMOGRAPHICS' | 'ENGAGEMENT';
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
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
          details: data.details ? data.details : undefined,
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
  ) {
    const tier = await SubscriptionService.getTier(organizerId);

    // Log the access
    await this.logAccess({
      organizerId,
      eventId,
      action: 'VIEW',
      dataType: 'ATTENDEE_LIST',
      ipAddress,
      userAgent,
    });

    // BASIC tier: Return aggregated data only
    if (tier === SubscriptionTier.BASIC) {
      return registrations.map(reg => ({
        id: reg.id,
        eventId: reg.eventId,
        attendeeId: reg.attendeeId,
        status: reg.status,
        ticketType: reg.ticketType,
        quantity: reg.quantity,
        createdAt: reg.createdAt,
        // No PII data
      }));
    }

    // STANDARD and PREMIUM tiers: Filter by consent
    const filtered = [];

    for (const reg of registrations) {
      // Check if consent exists and operational consent is granted (required for basic data)
      const hasOperationalConsent = await ConsentService.hasConsent(reg.id, 'operational');

      if (!hasOperationalConsent) {
        // Skip this registration if no operational consent
        continue;
      }

      // For STANDARD tier, include basic data if operational consent exists
      if (tier === SubscriptionTier.STANDARD) {
        filtered.push({
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
          attendee: reg.attendee ? {
            id: reg.attendee.id,
            firstName: reg.attendee.firstName,
            lastName: reg.attendee.lastName,
            email: reg.attendee.email,
            phoneNumber: reg.attendee.phoneNumber,
          } : null,
          // No demographics or engagement data
        });
      }

      if (tier === SubscriptionTier.PREMIUM) {
        const _hasMarketingConsent = await ConsentService.hasConsent(reg.id, 'marketing');
        const hasDemographicsConsent = await ConsentService.hasConsent(reg.id, 'demographics');
        const hasAnalyticsConsent = await ConsentService.hasConsent(reg.id, 'analytics');

        const filteredReg: Record<string, unknown> = {
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
          attendee: reg.attendee ? {
            id: reg.attendee.id,
            firstName: reg.attendee.firstName,
            lastName: reg.attendee.lastName,
            email: reg.attendee.email,
            phoneNumber: reg.attendee.phoneNumber,
          } : null,
        };

        // Add demographics if consent exists
        if (hasDemographicsConsent && reg.attendee) {
          filteredReg.attendee = {
            ...filteredReg.attendee,
            // Add demographic fields if available (would need to be added to User model or registrationData)
            // For now, we'll include basic location data if available
            city: reg.attendee.city,
            state: reg.attendee.state,
            country: reg.attendee.country,
          };
        }

        // Add engagement data if consent exists (would need to be calculated/stored separately)
        // This is a placeholder for future implementation
        if (hasAnalyticsConsent) {
          filteredReg.engagement = {
            // Placeholder for engagement metrics
            emailOpens: 0,
            emailClicks: 0,
            sessionViews: 0,
          };
        }

        filtered.push(filteredReg);
      }
    }

    return filtered;
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
    organizerId: string,
  ): Promise<number> {
    const tier = await SubscriptionService.getTier(organizerId);

    if (tier === SubscriptionTier.BASIC) {
      // Return total count only
      return prisma.eventRegistration.count({
        where: { eventId },
      });
    }

    // For STANDARD and PREMIUM, count only consented attendees
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      select: { id: true },
    });

    let count = 0;
    for (const reg of registrations) {
      const hasConsent = await ConsentService.hasConsent(reg.id, 'operational');
      if (hasConsent) {
        count++;
      }
    }

    return count;
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


