import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateConsentData {
  operationalConsent?: boolean; // Always enforced as true
  marketingConsent?: boolean;
  demographicsConsent?: boolean;
  analyticsConsent?: boolean;
}

export interface UpdateConsentData {
  marketingConsent?: boolean;
  demographicsConsent?: boolean;
  analyticsConsent?: boolean;
}

export class ConsentService {
  /**
   * Create consent record for a registration
   */
  static async createConsent(
    registrationId: string,
    attendeeId: string,
    eventId: string,
    data: CreateConsentData,
  ) {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        attendee: true,
        event: true,
      },
    });

    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (registration.attendeeId !== attendeeId) {
      throw new ValidationError('Registration does not belong to this attendee');
    }

    if (registration.eventId !== eventId) {
      throw new ValidationError('Registration does not belong to this event');
    }

    const existingConsent = await prisma.attendeeConsent.findUnique({
      where: { registrationId },
    });

    if (existingConsent) {
      throw new ValidationError('Consent already exists for this registration');
    }

    const consent = await prisma.attendeeConsent.create({
      data: {
        attendeeId,
        eventId,
        registrationId,
        operationalConsent: true, // Required for ticket delivery
        marketingConsent: data.marketingConsent ?? false,
        demographicsConsent: data.demographicsConsent ?? false,
        analyticsConsent: data.analyticsConsent ?? false,
        consentVersion: '1.0',
      },
    });

    logger.info(`Consent created for registration ${registrationId}`);
    return consent;
  }

  /**
   * Get consent for a registration
   */
  static async getConsent(registrationId: string, attendeeId: string) {
    const consent = await prisma.attendeeConsent.findUnique({
      where: { registrationId },
      include: {
        attendee: {
          select: {
            id: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!consent) return null;

    if (consent.attendeeId !== attendeeId) {
      throw new ValidationError('You do not have permission to view this consent');
    }

    return consent;
  }

  /**
   * Update consent (attendee can update their own consent)
   */
  static async updateConsent(
    registrationId: string,
    attendeeId: string,
    data: UpdateConsentData,
  ) {
    const consent = await prisma.attendeeConsent.findUnique({
      where: { registrationId },
    });

    if (!consent) {
      throw new NotFoundError('Consent not found');
    }

    if (consent.attendeeId !== attendeeId) {
      throw new ValidationError('You do not have permission to update this consent');
    }

    const revokeAll =
      data.marketingConsent === false &&
      data.demographicsConsent === false &&
      data.analyticsConsent === false;

    const updated = await prisma.attendeeConsent.update({
      where: { registrationId },
      data: {
        marketingConsent: data.marketingConsent ?? consent.marketingConsent,
        demographicsConsent: data.demographicsConsent ?? consent.demographicsConsent,
        analyticsConsent: data.analyticsConsent ?? consent.analyticsConsent,
        revokedAt: revokeAll ? new Date() : null,
      },
    });

    logger.info(`Consent updated for registration ${registrationId}`);
    return updated;
  }

  /**
   * Get consents for an event (organizer view)
   */
  static async getEventConsents(eventId: string, organizerId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return prisma.attendeeConsent.findMany({
      where: { eventId },
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
      orderBy: { consentedAt: 'desc' },
    });
  }

  /**
   * Check if attendee has given consent for a specific type
   */
  static async hasConsent(
    registrationId: string,
    consentType: 'operational' | 'marketing' | 'demographics' | 'analytics',
  ): Promise<boolean> {
    const consent = await prisma.attendeeConsent.findUnique({
      where: { registrationId },
    });

    if (!consent) return false;

    switch (consentType) {
      case 'operational':
        return consent.operationalConsent;
      case 'marketing':
        return consent.marketingConsent;
      case 'demographics':
        return consent.demographicsConsent;
      case 'analytics':
        return consent.analyticsConsent;
    }
  }

  /**
   * Get consent statistics for an event
   */
  static async getEventConsentStats(eventId: string, organizerId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const totalRegistrations = await prisma.eventRegistration.count({
      where: { eventId },
    });

    const consents = await prisma.attendeeConsent.findMany({
      where: { eventId },
    });

    const count = (key: keyof typeof consents[number]) =>
      consents.filter(c => c[key]).length;

    const operationalCount = count('operationalConsent');
    const marketingCount = count('marketingConsent');
    const demographicsCount = count('demographicsConsent');
    const analyticsCount = count('analyticsConsent');

    return {
      totalRegistrations,
      totalConsents: consents.length,
      operational: {
        count: operationalCount,
        percentage:
          totalRegistrations > 0
            ? (operationalCount / totalRegistrations) * 100
            : 0,
      },
      marketing: {
        count: marketingCount,
        percentage:
          consents.length > 0 ? (marketingCount / consents.length) * 100 : 0,
      },
      demographics: {
        count: demographicsCount,
        percentage:
          consents.length > 0 ? (demographicsCount / consents.length) * 100 : 0,
      },
      analytics: {
        count: analyticsCount,
        percentage:
          consents.length > 0 ? (analyticsCount / consents.length) * 100 : 0,
      },
    };
  }
}
