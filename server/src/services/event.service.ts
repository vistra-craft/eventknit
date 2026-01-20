import { prisma } from '../config/database.js';
import { EventStatus, EventType, RegistrationStatus, UserRole, Prisma, UserStatus, InviteType, DataAccessLevel } from '@prisma/client';
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
  ValidationError,
} from '../utils/errors.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { logger } from '../utils/logger.js';
import { Decimal, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { hashPassword } from '../utils/password.js';
import crypto from 'crypto';
import { emailService as _emailService } from './email.service.js';
import { TicketService } from './ticket.service.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { EventCollaborationService } from './event-collaboration.service.js';

export interface CreateEventData {
  title: string;
  description: string;
  fullDescription?: string;
  organizerDescription?: string;
  category?: string;
  tags?: string[];
  startDate: Date | string;
  endDate?: Date | string;
  startTime?: string;
  endTime?: string;
  registrationDeadline?: Date | string;
  venue?: string;
  location: string;
  address?: string;
  isOnline?: boolean;
  onlineLink?: string;
  coordinates?: { lat: number; lng: number };
  isFree: boolean;
  price?: number | string;
  ticketTypes?: Array<{
    name: string;
    price: number | string;
    originalPrice?: number | string;
    discountLabel?: string;
    quantity?: number | string;
    features?: string[];
    isComplementary?: boolean;
    requiresInvitation?: boolean;
    availableFrom?: string;
    availableUntil?: string;
  }>;
  capacity?: number | string;
  image?: string;
  images?: string[];
  type?: EventType;
  requirements?: string[];
  ageRestriction?: string;
  duration?: string;
  speakers?: Array<{ name: string; title: string; bio: string; image?: string }>;
  sponsors?: Array<{ name: string; level: string; logo: string }>;
  exhibitors?: Array<{ name: string; description?: string; logo?: string; contactEmail?: string; booth?: string }>;
  agenda?: Array<{
    title: string;
    description?: string;
    date?: string; // Optional date for multi-day events (defaults to event start date)
    startTime: string;
    endTime: string;
    speakers?: string[]; // IDs of speakers
  }>;
  socialLinks?: Record<string, string>;
  faqs?: Array<{ question: string; answer: string }>;
  registrationFields?: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  generateRegistrationCode?: boolean; // Auto-generate registration code (default: true)
  timezone?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  // Allow partial updates
}

export interface TicketSelection {
  ticketType: string;
  quantity: number;
}

export interface RegisterForEventData {
  // New: Support multiple ticket types
  tickets?: TicketSelection[];
  // Deprecated: Use tickets array instead. Kept for backward compatibility
  ticketType?: string;
  quantity?: number;
  registrationData?: Record<string, unknown>;
  invitationId?: string; // For complementary tickets
  promoCode?: string; // Promo code to apply
  // Consent data
  consent?: {
    operationalConsent?: boolean; // Default: true (required)
    marketingConsent?: boolean;
    demographicsConsent?: boolean;
    analyticsConsent?: boolean;
  };
}

export class EventService {
  /**
   * Validate and sync registration status with payment status
   * Ensures status consistency across the application
   */
  static validateAndSyncStatus(
    currentStatus: RegistrationStatus,
    currentPaymentStatus: string,
    newPaymentStatus?: string,
    newStatus?: RegistrationStatus,
  ): { status: RegistrationStatus; paymentStatus: string } {
    // Define valid status combinations
    const validCombinations: Record<string, RegistrationStatus[]> = {
      COMPLETED: [RegistrationStatus.CONFIRMED],
      PENDING: [RegistrationStatus.PENDING],
      FAILED: [RegistrationStatus.PENDING, RegistrationStatus.CANCELLED],
    };

    // Determine final payment status
    const finalPaymentStatus = newPaymentStatus || currentPaymentStatus;

    // Determine final registration status
    let finalStatus = newStatus || currentStatus;

    // Validate and sync status based on payment status
    if (finalPaymentStatus === 'COMPLETED') {
      // Payment completed - registration must be CONFIRMED
      if (finalStatus !== RegistrationStatus.CONFIRMED) {
        finalStatus = RegistrationStatus.CONFIRMED;
      }
    } else if (finalPaymentStatus === 'PENDING') {
      // Payment pending - registration should be PENDING (unless already CANCELLED)
      if (finalStatus === RegistrationStatus.CONFIRMED) {
        // This shouldn't happen, but if it does, keep CONFIRMED
        // (might be a free event that was confirmed)
      } else if (finalStatus !== RegistrationStatus.CANCELLED) {
        finalStatus = RegistrationStatus.PENDING;
      }
    } else if (finalPaymentStatus === 'FAILED') {
      // Payment failed - registration can be PENDING (for retry) or CANCELLED
      if (finalStatus === RegistrationStatus.CONFIRMED) {
        // This is inconsistent - payment failed but status is confirmed
        // Keep as PENDING to allow retry
        finalStatus = RegistrationStatus.PENDING;
      }
      // If already CANCELLED, keep it as CANCELLED
    }

    // Validate the final combination
    const validStatuses = validCombinations[finalPaymentStatus] || [];
    if (validStatuses.length > 0 && !validStatuses.includes(finalStatus)) {
      logger.warn(
        `Invalid status combination detected: paymentStatus=${finalPaymentStatus}, status=${finalStatus}. Auto-correcting...`,
      );
      // Auto-correct to first valid status
      finalStatus = validStatuses[0];
    }

    return {
      status: finalStatus,
      paymentStatus: finalPaymentStatus,
    };
  }

  /**
   * Create a new event
   */
  static async createEvent(
    data: CreateEventData,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate ticket types data integrity - before any other processing
    if (data.ticketTypes && Array.isArray(data.ticketTypes)) {
      for (const ticket of data.ticketTypes) {
        // Validate complementary tickets
        if (ticket.isComplementary === true) {
          const price = typeof ticket.price === 'string' ? parseFloat(ticket.price) : Number(ticket.price);
          if (price !== 0 && !isNaN(price)) {
            throw new ValidationError('Complementary tickets must have price of 0');
          }
        }

        // Validate discount: if originalPrice exists, it must be > current price
        if (ticket.originalPrice !== undefined && ticket.originalPrice !== null) {
          const origPrice = typeof ticket.originalPrice === 'string' ? parseFloat(ticket.originalPrice) : Number(ticket.originalPrice);
          const currPrice = typeof ticket.price === 'string' ? parseFloat(ticket.price) : Number(ticket.price);
          if (!isNaN(origPrice) && !isNaN(currPrice) && origPrice <= currPrice) {
            throw new ValidationError('Original price must be greater than current price for discounts');
          }
        }

        // Validate early bird date ranges
        if (ticket.availableFrom && ticket.availableUntil) {
          const fromDate = new Date(ticket.availableFrom);
          const untilDate = new Date(ticket.availableUntil);
          if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
            throw new ValidationError('Early bird dates must be valid date strings');
          }
          if (fromDate >= untilDate) {
            throw new ValidationError('Early bird "available from" date must be before "available until" date');
          }
        }
      }
    }

    // Verify organizer exists and get verification status
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        role: true,
        isIdentityVerified: true,
        verificationLevel: true,
        payoutLimit: true,
        kycStatus: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Verify organizer can create events (check actual role from database, not token)
    const actualRole = organizer.role;
    if (actualRole !== UserRole.ORGANIZER &&
      actualRole !== UserRole.SUPERADMIN &&
      actualRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers and admins can create events');
    }

    // Note: Eventbrite-style approach - no verification required to CREATE events
    // Verification is only required to RECEIVE payouts (handled in disbursement service)

    // Validate pricing
    if (!data.isFree && !data.price && (!data.ticketTypes || data.ticketTypes.length === 0)) {
      throw new ValidationError('Price or ticket types are required for paid events');
    }

    // Calculate available slots (initially same as capacity)
    const capacity = data.capacity ? Number(data.capacity) : null;
    const availableSlots = capacity;

    // Prepare ticket types JSON
    let ticketTypesJson: Prisma.InputJsonValue | undefined = undefined;
    if (data.ticketTypes && data.ticketTypes.length > 0) {
      ticketTypesJson = data.ticketTypes.map(ticket => {
        const ticketData: Record<string, unknown> = {
          name: ticket.name,
          price: Number(ticket.price),
          quantity: ticket.quantity ? Number(ticket.quantity) : null,
          features: ticket.features || [],
        };

        // Add optional fields if present
        if ('originalPrice' in ticket && ticket.originalPrice !== undefined) {
          ticketData.originalPrice = Number(ticket.originalPrice);
        }
        if ('discountLabel' in ticket && ticket.discountLabel) {
          ticketData.discountLabel = ticket.discountLabel;
        }
        if ('isComplementary' in ticket && ticket.isComplementary !== undefined) {
          ticketData.isComplementary = ticket.isComplementary;
        }
        if ('requiresInvitation' in ticket && ticket.requiresInvitation !== undefined) {
          ticketData.requiresInvitation = ticket.requiresInvitation;
        }
        if ('availableFrom' in ticket && ticket.availableFrom) {
          ticketData.availableFrom = ticket.availableFrom;
        }
        if ('availableUntil' in ticket && ticket.availableUntil) {
          ticketData.availableUntil = ticket.availableUntil;
        }

        return ticketData;
      }) as Prisma.InputJsonValue;
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        fullDescription: data.fullDescription?.trim(),
        organizerDescription: data.organizerDescription?.trim(),
        category: data.category?.trim(),
        tags: data.tags || [],
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        startTime: data.startTime?.trim(),
        endTime: data.endTime?.trim(),
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
        venue: data.venue?.trim(),
        location: data.location.trim(),
        address: data.address?.trim(),
        isOnline: data.isOnline || false,
        onlineLink: data.onlineLink?.trim(),
        coordinates: data.coordinates || undefined,
        isFree: data.isFree,
        price: data.price ? new Decimal(Number(data.price)) : null,
        ticketTypes: ticketTypesJson || undefined,
        capacity,
        availableSlots,
        image: data.image?.trim(),
        images: data.images || [],
        timezone: data.timezone || null,
        type: data.type || EventType.PUBLIC,
        status: EventStatus.PENDING, // Events start as PENDING, need admin approval
        requirements: data.requirements || [],
        ageRestriction: data.ageRestriction?.trim(),
        duration: data.duration?.trim(),
        speakers: data.speakers || undefined,
        sponsors: data.sponsors || undefined,
        exhibitors: data.exhibitors || undefined,
        agenda: data.agenda || undefined,
        socialLinks: data.socialLinks || undefined,
        faqs: data.faqs || undefined,
        registrationFields: data.registrationFields || undefined,
        registrationCode: data.generateRegistrationCode !== false ? this.generateRegistrationCode() : null,
        organizerId,
        createdBy: organizerId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.EVENT_CREATED,
      entity: 'Event',
      entityId: event.id,
      metadata: {
        eventTitle: event.title,
        eventType: event.type,
        isFree: event.isFree,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Event created: ${event.id} by organizer: ${organizerId}`);

    // Auto-generate default invitation links for the event
    try {
      const { InvitationService } = await import('./invitation.service.js');

      // Generate default links for different invite types
      const defaultInviteTypes: InviteType[] = [InviteType.ATTENDEE, InviteType.SPEAKER, InviteType.EXHIBITOR];

      for (const inviteType of defaultInviteTypes) {
        try {
          await InvitationService.createInvitation(
            event.id,
            {
              inviteType,
              title: `${inviteType.charAt(0) + inviteType.slice(1).toLowerCase()} Registration`,
            },
            organizerId,
            organizerRole,
            ipAddress,
            userAgent,
          );
        } catch (error) {
          // Log but don't fail event creation if invitation creation fails
          logger.warn(`Failed to create default ${inviteType} invitation for event ${event.id}:`, error);
        }
      }
    } catch (error) {
      // Log but don't fail event creation if invitation creation fails
      logger.warn(`Failed to create default invitations for event ${event.id}:`, error);
    }

    return event;
  }

  /**
   * Get all events (with filters)
   * Supports both page+limit (preferred) and offset+limit (backward compatibility)
   */
  static async getEvents(filters: {
    status?: EventStatus;
    category?: string;
    isFree?: boolean;
    organizerId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    page?: number;
    type?: EventType;
    dateFrom?: string; // ISO date string - filter events starting from this date
    dateTo?: string; // ISO date string - filter events starting before this date
  } = {}) {
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
    };

    logger.debug('[EventService] Received filters:', filters);

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isFree !== undefined) {
      where.isFree = filters.isFree;
    }

    if (filters.organizerId) {
      where.organizerId = filters.organizerId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    // Date range filtering
    if (filters.dateFrom || filters.dateTo) {
      where.startDate = {};
      if (filters.dateFrom) {
        where.startDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.startDate.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    logger.debug('[EventService] Prisma where clause:', JSON.stringify(where, null, 2));

    const limit = filters.limit || 50;
    // Support both page and offset for backward compatibility
    let skip = 0;
    if (filters.page !== undefined) {
      skip = (filters.page - 1) * limit;
    } else if (filters.offset !== undefined) {
      skip = filters.offset;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              organizationName: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.event.count({ where }),
    ]);

    logger.debug('[EventService] Database query results:', {
      eventCount: events.length,
      total,
      events: events.map(e => ({ id: e.id, title: e.title, status: e.status, type: e.type })),
    });

    const page = filters.page !== undefined ? filters.page : Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      events,
      total,
      limit,
      page,
      totalPages,
      // Keep offset for backward compatibility
      offset: skip,
    };
  }

  /**
   * Get event by ID
   */
  static async getEventById(eventId: string) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
            businessEmail: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                },
              },
            },
          },
        },
      },
      // All fields are included by default, including JSON fields (agenda, exhibitors, speakers, sponsors, socialLinks)
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  /**
   * Update event
   */
  static async updateEvent(
    eventId: string,
    data: UpdateEventData,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizerId: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== organizerId) {
        throw new AuthorizationError('You do not have permission to update this event');
      }
    }

    // Check if user is a collaborator with edit permissions
    const isCollaborator = await prisma.eventCollaborator.findFirst({
      where: {
        eventId,
        collaboratorId: organizerId,
        isActive: true,
        acceptedAt: { not: null },
        canEdit: true,
      },
    });

    // Verify organizer owns the event or is a collaborator (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== organizerId && !isCollaborator) {
        throw new AuthorizationError('You do not have permission to update this event');
      }
    }

    // Determine if status should be reset to PENDING
    // Only reset for significant changes, not minor updates like adding an image
    const significantFields = [
      'title', 'description', 'fullDescription', 'startDate', 'endDate',
      'startTime', 'endTime', 'venue', 'location', 'address', 'isOnline',
      'onlineLink', 'price', 'ticketTypes', 'capacity', 'category', 'type',
      'requirements', 'ageRestriction', 'duration', 'speakers', 'sponsors',
      'exhibitors', 'agenda', 'faqs', 'registrationFields',
    ];

    const hasSignificantChanges = significantFields.some(field => data[field as keyof UpdateEventData] !== undefined);

    // Only reset to PENDING if there are significant changes (not just image/media updates)
    const newStatus = (event.status === EventStatus.APPROVED && hasSignificantChanges)
      ? EventStatus.PENDING
      : event.status;

    // Prepare update data
    const updateData: Prisma.EventUpdateInput = {
      updatedBy: organizerId,
      status: newStatus, // Reset to PENDING only for significant changes
    };

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription?.trim();
    if (data.organizerDescription !== undefined) updateData.organizerDescription = data.organizerDescription?.trim();
    if (data.category !== undefined) updateData.category = data.category?.trim();
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.startTime !== undefined) updateData.startTime = data.startTime?.trim();
    if (data.endTime !== undefined) updateData.endTime = data.endTime?.trim();
    if (data.registrationDeadline !== undefined) {
      updateData.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
    }
    if (data.venue !== undefined) updateData.venue = data.venue?.trim();
    if (data.location !== undefined) updateData.location = data.location.trim();
    if (data.address !== undefined) updateData.address = data.address?.trim();
    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;
    if (data.onlineLink !== undefined) updateData.onlineLink = data.onlineLink?.trim();
    if (data.coordinates !== undefined) updateData.coordinates = data.coordinates;
    if (data.isFree !== undefined) updateData.isFree = data.isFree;
    if (data.price !== undefined) updateData.price = data.price ? new Decimal(Number(data.price)) : null;
    if (data.capacity !== undefined) {
      const capacity = data.capacity ? Number(data.capacity) : null;
      updateData.capacity = capacity;
      // Recalculate available slots based on current registrations
      const currentRegistrations = await prisma.eventRegistration.count({
        where: {
          eventId,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
          },
        },
      });
      updateData.availableSlots = capacity ? capacity - currentRegistrations : null;
    }
    if (data.image !== undefined) updateData.image = data.image?.trim();
    if (data.image !== undefined) updateData.image = data.image?.trim();
    if (data.images !== undefined) updateData.images = data.images;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.ageRestriction !== undefined) updateData.ageRestriction = data.ageRestriction?.trim();
    if (data.duration !== undefined) updateData.duration = data.duration?.trim();
    if (data.speakers !== undefined) updateData.speakers = data.speakers;
    if (data.sponsors !== undefined) updateData.sponsors = data.sponsors;
    if (data.exhibitors !== undefined) updateData.exhibitors = data.exhibitors;
    if (data.agenda !== undefined) updateData.agenda = data.agenda;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
    if (data.faqs !== undefined) updateData.faqs = data.faqs;
    if (data.registrationFields !== undefined) updateData.registrationFields = data.registrationFields;

    // Validate ticket types data integrity before processing
    if (data.ticketTypes !== undefined && Array.isArray(data.ticketTypes)) {
      for (const ticket of data.ticketTypes) {
        // Validate complementary tickets
        if (ticket.isComplementary === true) {
          const price = typeof ticket.price === 'string' ? parseFloat(ticket.price) : Number(ticket.price);
          if (price !== 0 && !isNaN(price)) {
            throw new ValidationError('Complementary tickets must have price of 0');
          }
        }

        // Validate discount: if originalPrice exists, it must be > current price
        if (ticket.originalPrice !== undefined && ticket.originalPrice !== null) {
          const origPrice = typeof ticket.originalPrice === 'string' ? parseFloat(ticket.originalPrice) : Number(ticket.originalPrice);
          const currPrice = typeof ticket.price === 'string' ? parseFloat(ticket.price) : Number(ticket.price);
          if (!isNaN(origPrice) && !isNaN(currPrice) && origPrice <= currPrice) {
            throw new ValidationError('Original price must be greater than current price for discounts');
          }
        }

        // Validate early bird date ranges
        if (ticket.availableFrom && ticket.availableUntil) {
          const fromDate = new Date(ticket.availableFrom);
          const untilDate = new Date(ticket.availableUntil);
          if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
            throw new ValidationError('Early bird dates must be valid date strings');
          }
          if (fromDate >= untilDate) {
            throw new ValidationError('Early bird "available from" date must be before "available until" date');
          }
        }
      }
    }

    // Handle ticket types
    if (data.ticketTypes !== undefined) {
      if (data.ticketTypes.length > 0) {
        updateData.ticketTypes = data.ticketTypes.map(ticket => {
          const ticketData: Record<string, unknown> = {
            name: ticket.name,
            price: Number(ticket.price),
            quantity: ticket.quantity ? Number(ticket.quantity) : null,
            features: ticket.features || [],
          };

          // Add optional fields if present
          if ('originalPrice' in ticket && ticket.originalPrice !== undefined) {
            ticketData.originalPrice = Number(ticket.originalPrice);
          }
          if ('discountLabel' in ticket && ticket.discountLabel) {
            ticketData.discountLabel = ticket.discountLabel;
          }
          if ('isComplementary' in ticket && ticket.isComplementary !== undefined) {
            ticketData.isComplementary = ticket.isComplementary;
          }
          if ('requiresInvitation' in ticket && ticket.requiresInvitation !== undefined) {
            ticketData.requiresInvitation = ticket.requiresInvitation;
          }
          if ('availableFrom' in ticket && ticket.availableFrom) {
            ticketData.availableFrom = ticket.availableFrom;
          }
          if ('availableUntil' in ticket && ticket.availableUntil) {
            ticketData.availableUntil = ticket.availableUntil;
          }

          return ticketData;
        }) as Prisma.InputJsonValue;
      } else {
        updateData.ticketTypes = Prisma.JsonNull;
      }
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
      },
    });

    // Track what changed for notifications
    const changes: string[] = [];
    if (data.title !== undefined) changes.push('title');
    if (data.startDate !== undefined || data.startTime !== undefined) changes.push('date/time');
    if (data.venue !== undefined || data.location !== undefined || data.address !== undefined) changes.push('venue/location');
    if (data.description !== undefined || data.fullDescription !== undefined) changes.push('description');
    if (data.capacity !== undefined) changes.push('capacity');
    if (data.price !== undefined || data.ticketTypes !== undefined) changes.push('pricing');

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.EVENT_UPDATED,
      entity: 'Event',
      entityId: eventId,
      metadata: {
        eventTitle: updatedEvent.title,
      },
      ipAddress,
      userAgent,
    });

    // Log activity
    await EventCollaborationService.logActivity(
      eventId,
      organizerId,
      'event_updated',
      { changes: Object.keys(data) },
      ipAddress,
      userAgent,
    );

    logger.info(`Event updated: ${eventId} by organizer: ${organizerId}`);

    // Send notifications if event was approved and has registered attendees
    if (event.status === EventStatus.APPROVED && changes.length > 0) {
      try {
        const changesText = changes.join(', ');
        const isTimeChange = changes.includes('date/time');
        const isVenueChange = changes.includes('venue/location');

        // Notify registered attendees
        await NotificationService.sendEventNotification(
          eventId,
          isTimeChange ? NotificationType.EVENT_TIME_CHANGED : isVenueChange ? NotificationType.EVENT_VENUE_CHANGED : NotificationType.EVENT_UPDATE,
          `Event Updated: ${updatedEvent.title}`,
          `The event "${updatedEvent.title}" has been updated. Changes: ${changesText}.${isTimeChange ? ' Please check the new date and time.' : ''}${isVenueChange ? ' Please check the new venue/location.' : ''}`,
          'attendees',
          undefined,
          NotificationPriority.MEDIUM,
          { changes },
        );

        // Notify assigned staff
        await NotificationService.sendEventNotification(
          eventId,
          NotificationType.EVENT_UPDATE_FOR_STAFF,
          `Event Updated: ${updatedEvent.title}`,
          `The event "${updatedEvent.title}" you are assigned to has been updated. Changes: ${changesText}.`,
          'staff',
          undefined,
          NotificationPriority.MEDIUM,
          { changes },
        );
      } catch (error) {
        // Log error but don't fail the update
        logger.error('Failed to send event update notifications:', error);
      }
    }

    return updatedEvent;
  }

  /**
   * Delete event (soft delete)
   */
  static async deleteEvent(
    eventId: string,
    organizerId: string,
    organizerRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizerId: true,
        title: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== organizerId) {
        throw new AuthorizationError('You do not have permission to delete this event');
      }
    }

    // Eventbrite-style rule:
    // - Only drafts/unpublished (PENDING/REJECTED) can be deleted
    // - Published/approved events must be cancelled or unpublished instead
    if (
      event.status !== EventStatus.PENDING &&
      event.status !== EventStatus.REJECTED
    ) {
      throw new ValidationError(
        'Published events cannot be deleted. Please cancel or unpublish the event instead.',
      );
    }

    // Safety check: prevent deletion if event has any registrations
    const registrationCount = await prisma.eventRegistration.count({
      where: { eventId },
    });
    if (registrationCount > 0) {
      throw new ValidationError(
        `Cannot delete event with ${registrationCount} registration(s). Please cancel registrations first or cancel the event instead.`,
      );
    }

    // Safety check: prevent deletion if event has any payment history
    const paymentCount = await prisma.eventPaymentTransaction.count({
      where: { eventId },
    });
    if (paymentCount > 0) {
      throw new ValidationError(
        'Cannot delete event with payment history. Please cancel the event instead to preserve financial records.',
      );
    }

    // Soft delete
    await prisma.event.update({
      where: { id: eventId },
      data: {
        deletedAt: new Date(),
        updatedBy: organizerId,
      },
    });

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.EVENT_DELETED,
      entity: 'Event',
      entityId: eventId,
      metadata: {
        eventTitle: event.title,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Event deleted: ${eventId} by organizer: ${organizerId}`);
  }

  /**
   * Register for an event (purchase/register)
   */
  static async registerForEvent(
    eventId: string,
    attendeeId: string,
    data: RegisterForEventData = {},
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        isFree: true,
        price: true,
        ticketTypes: true,
        capacity: true,
        availableSlots: true,
        registrationDeadline: true,
        startDate: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if event is approved
    if (event.status !== EventStatus.APPROVED) {
      throw new ValidationError('Event is not available for registration');
    }

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      throw new ValidationError('Registration deadline has passed');
    }

    // Check if event has already started
    if (new Date(event.startDate) < new Date()) {
      throw new ValidationError('Event has already started');
    }

    // Check if already registered (for capacity we still need to count total tickets, but block exact duplicates)
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_attendeeId: {
          eventId,
          attendeeId,
        },
      },
    });

    if (existingRegistration && existingRegistration.status !== RegistrationStatus.CANCELLED) {
      throw new ConflictError('You are already registered for this event');
    }

    // Process tickets: Support both new tickets array and legacy ticketType/quantity
    let ticketSelections: TicketSelection[] = [];

    if (data.tickets && data.tickets.length > 0) {
      // New format: multiple ticket types
      ticketSelections = data.tickets;
    } else if (data.ticketType) {
      // Legacy format: single ticket type (backward compatibility)
      ticketSelections = [{
        ticketType: data.ticketType,
        quantity: data.quantity || 1,
      }];
    } else if (!event.isFree && event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0) {
      // If event has ticket types but none selected, throw error
      throw new ValidationError('Please select at least one ticket type');
    } else if (!event.isFree && !event.price) {
      throw new ValidationError('Ticket type is required for this event');
    }

    // Validate tickets and calculate total amount
    let totalAmount = new Decimal(0);
    let isComplementaryTicket = false;
    let totalQuantity = 0;
    const ticketLineItems: Array<{
      ticketType: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    if (!event.isFree && ticketSelections.length > 0) {
      const ticketTypes = event.ticketTypes as Array<{
        name: string;
        price: number;
        originalPrice?: number;
        isComplementary?: boolean;
        requiresInvitation?: boolean;
        availableFrom?: string;
        availableUntil?: string;
        quantity?: number;
      }> | null;

      if (!ticketTypes || ticketTypes.length === 0) {
        throw new ValidationError('Event has no ticket types configured');
      }

      for (const selection of ticketSelections) {
        if (selection.quantity <= 0) {
          throw new ValidationError(`Invalid quantity for ticket type: ${selection.ticketType}`);
        }

        const ticketConfig = ticketTypes.find(t => t.name === selection.ticketType);
        if (!ticketConfig) {
          throw new ValidationError(`Invalid ticket type: ${selection.ticketType}`);
        }

        // Check if ticket is complementary
        const isComplementary = ticketConfig.isComplementary === true || ticketConfig.price === 0;
        if (isComplementary) {
          isComplementaryTicket = true;
        }

        // Check if ticket requires invitation
        if (ticketConfig.isComplementary || ticketConfig.requiresInvitation) {
          if (!data.invitationId) {
            throw new ValidationError(
              `Ticket type "${selection.ticketType}" requires an invitation. Please use the invitation link provided.`,
            );
          }
          // Verify invitation is valid and matches ticket type
          const invitation = await prisma.eventInvitation.findUnique({
            where: { id: data.invitationId },
          });
          if (!invitation || invitation.eventId !== eventId || !invitation.isActive) {
            throw new ValidationError('Invalid or expired invitation');
          }
        }

        // Check early bird availability
        const { isTicketTypeAvailable } = await import('../utils/ticket-helpers.js');
        const availability = isTicketTypeAvailable(ticketConfig);
        if (!availability.available) {
          throw new ValidationError(
            `Ticket type "${selection.ticketType}" is not available: ${availability.reason || 'Not available'}`,
          );
        }

        // Check ticket quantity limit
        if (ticketConfig.quantity !== null && ticketConfig.quantity !== undefined) {
          // Count existing registrations for this ticket type
          const existingTickets = await prisma.ticketLineItem.count({
            where: {
              registration: {
                eventId,
                status: {
                  in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                },
              },
              ticketType: selection.ticketType,
            },
          });

          if (existingTickets + selection.quantity > ticketConfig.quantity) {
            throw new ValidationError(
              `Insufficient tickets available for "${selection.ticketType}". Only ${ticketConfig.quantity - existingTickets} remaining.`,
            );
          }
        }

        // Calculate price for this ticket type
        const unitPrice = ticketConfig.price;
        const lineTotal = new Decimal(Number(unitPrice) * selection.quantity);
        totalAmount = totalAmount.plus(lineTotal);
        totalQuantity += selection.quantity;

        ticketLineItems.push({
          ticketType: selection.ticketType,
          quantity: selection.quantity,
          unitPrice: Number(unitPrice),
          totalPrice: Number(lineTotal),
        });
      }
    } else if (!event.isFree && event.price) {
      // Legacy: Single price event without ticket types
      const quantity = data.quantity || 1;
      totalAmount = new Decimal(Number(event.price) * quantity);
      totalQuantity = quantity;
    } else if (event.isFree) {
      // Free event: count total quantity
      totalQuantity = ticketSelections.reduce((sum, t) => sum + t.quantity, 0) || (data.quantity || 1);
    }

    // Apply promo code discount if provided
    let discountAmount = new Decimal(0);
    let promoCodeId: string | null = null;

    if (data.promoCode && totalAmount.gt(0)) {
      const { PromoCodeService } = await import('./promo-code.service.js');
      // Use first ticket type for promo code validation (or null if no tickets)
      const firstTicketType = ticketSelections.length > 0 ? ticketSelections[0].ticketType : (data.ticketType || null);
      const validation = await PromoCodeService.validatePromoCode(
        data.promoCode,
        eventId,
        firstTicketType,
        Number(totalAmount),
        attendeeId,
      );

      if (!validation.valid) {
        throw new ValidationError(validation.error || 'Invalid promo code');
      }

      if (validation.discountAmount && validation.promoCodeId) {
        discountAmount = new Decimal(validation.discountAmount);
        promoCodeId = validation.promoCodeId;
      }
    }

    const finalAmount = totalAmount.minus(discountAmount);

    // Enforce overall event capacity BEFORE creating registration (Eventbrite-style)
    if (event.capacity !== null && event.capacity > 0) {
      // Count existing active tickets for this event
      const existingTicketsForEvent = await prisma.ticketLineItem.count({
        where: {
          registration: {
            eventId,
            status: {
              in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
            },
          },
        },
      });

      const projectedTotalTickets = existingTicketsForEvent + totalQuantity;
      if (projectedTotalTickets > event.capacity) {
        throw new ValidationError('Event capacity exceeded. Not enough tickets remaining for this registration.');
      }
    }

    // Check capacity (using total quantity from all ticket types)
    if (event.capacity !== null && totalQuantity > 0) {
      // Count total tickets (not registrations) for capacity check
      const existingTickets = await prisma.ticketLineItem.aggregate({
        where: {
          registration: {
            eventId,
            status: {
              in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
            },
          },
        },
        _sum: {
          quantity: true,
        },
      });

      // Also count legacy registrations without ticket line items
      const legacyRegistrations = await prisma.eventRegistration.count({
        where: {
          eventId,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
          },
          ticketLineItems: {
            none: {},
          },
        },
      });

      const existingTotalTickets = (existingTickets._sum.quantity || 0) + legacyRegistrations;

      if (existingTotalTickets + totalQuantity > event.capacity) {
        throw new ValidationError(
          `Event is sold out or insufficient capacity. Only ${event.capacity - existingTotalTickets} tickets remaining.`,
        );
      }
    }

    // Generate backup ticket code
    const backupCode = TicketService.generateBackupTicketCode();

    // Create registration
    // Free events and complementary tickets (price = 0) are automatically CONFIRMED
    // Paid events are PENDING (no payment yet)
    const registrationStatus = (event.isFree || isComplementaryTicket)
      ? RegistrationStatus.CONFIRMED
      : RegistrationStatus.PENDING;

    // For backward compatibility, set ticketType and quantity from first ticket or legacy data
    const legacyTicketType = ticketSelections.length > 0 ? ticketSelections[0].ticketType : (data.ticketType || null);
    const legacyQuantity = totalQuantity || (data.quantity || 1);

    // Create registration first (need registration.id for QR code generation)
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId,
        ticketType: legacyTicketType, // Backward compatibility
        quantity: legacyQuantity, // Backward compatibility
        // Store as Decimal(10,2)
        totalAmount: finalAmount,
        registrationData: data.registrationData ? (data.registrationData as Prisma.InputJsonValue) : undefined,
        backupCode,
        status: registrationStatus,
        paymentStatus: event.isFree ? 'COMPLETED' : 'PENDING',
        invitationId: data.invitationId || null,
        // Create ticket line items for multiple ticket types
        ticketLineItems: ticketLineItems.length > 0 ? {
          create: ticketLineItems.map(item => ({
            ticketType: item.ticketType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        } : undefined,
      },
      include: {
        ticketLineItems: true, // Include ticket line items for multiple ticket types
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            startTime: true,
            endTime: true,
            venue: true,
            location: true,
            address: true,
            isOnline: true,
            onlineLink: true,
            image: true,
            organizer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                organizationName: true,
                email: true,
              },
            },
          },
        },
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyAffiliation: true,
          },
        },
      },
    });

    // Generate QR code immediately at registration time (like Eventbrite/vf-ticket)
    // This ensures QR code is always available and stored for fast access
    try {
      const ticketData = TicketService.generateTicketData(
        registration.id,
        event.id,
        registration.attendee.email,
      );
      const qrCodeDataUrl = await TicketService.generateQRCode(ticketData);

      // Store QR code in database for fast access
      await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          qrCodeDataUrl,
          qrCodeGeneratedAt: new Date(),
        },
      });

      logger.debug(`[registerForEvent] QR code generated and stored for registration ${registration.id}`);
    } catch (qrError) {
      // Log error but don't fail registration - QR code can be generated later
      logger.error(`[registerForEvent] Failed to generate QR code for registration ${registration.id}:`, {
        error: qrError instanceof Error ? qrError.message : String(qrError),
        stack: qrError instanceof Error ? qrError.stack : undefined,
      });
      // Registration still succeeds - QR code will be generated when email is sent
    }

    // Create promo code redemption if promo code was used
    if (promoCodeId && discountAmount.gt(0)) {
      const { PromoCodeService } = await import('./promo-code.service.js');
      await PromoCodeService.applyPromoCode(
        promoCodeId,
        registration.id,
        attendeeId,
        Number(totalAmount),
        Number(discountAmount),
      );
    }

    // Create consent record for data sharing
    try {
      const { ConsentService } = await import('./consent.service.js');
      await ConsentService.createConsent(
        registration.id,
        attendeeId,
        eventId,
        {
          operationalConsent: data.consent?.operationalConsent ?? true, // Default: true (required)
          marketingConsent: data.consent?.marketingConsent ?? false,
          demographicsConsent: data.consent?.demographicsConsent ?? false,
          analyticsConsent: data.consent?.analyticsConsent ?? false,
        },
      );
      logger.debug(`[registerForEvent] Consent created for registration ${registration.id}`);
    } catch (consentError) {
      // Log error but don't fail registration - consent can be created later
      logger.error(`[registerForEvent] Failed to create consent for registration ${registration.id}:`, {
        error: consentError instanceof Error ? consentError.message : String(consentError),
      });
      // Registration still succeeds - consent can be created/updated later
    }

    // Update available slots if capacity exists (using totalQuantity)
    let newAvailableSlots: number | null = null;
    if (event.capacity !== null && totalQuantity > 0) {
      newAvailableSlots = (event.availableSlots || event.capacity) - totalQuantity;
      await prisma.event.update({
        where: { id: eventId },
        data: {
          availableSlots: Math.max(0, newAvailableSlots),
        },
      });

      // Check for capacity milestones and notify organizer
      if (event.capacity > 0 && newAvailableSlots >= 0) {
        const currentRegistrations = event.capacity - newAvailableSlots;
        const capacityPercentage = (currentRegistrations / event.capacity) * 100;

        try {
          // Get event with organizer info
          const eventWithOrganizer = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
              organizerId: true,
              title: true,
            },
          });

          if (eventWithOrganizer) {
            // 50% milestone
            if (capacityPercentage >= 50 && capacityPercentage < 75) {
              // Check if 50% notification already sent
              const existingNotification = await prisma.notification.findFirst({
                where: {
                  eventId,
                  type: NotificationType.REGISTRATION_MILESTONE_50,
                  createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
                  },
                },
              });

              if (!existingNotification) {
                await NotificationService.sendNotification({
                  userId: eventWithOrganizer.organizerId,
                  type: NotificationType.REGISTRATION_MILESTONE_50,
                  title: `50% Capacity Reached: ${eventWithOrganizer.title}`,
                  message: `Great news! Your event "${eventWithOrganizer.title}" has reached 50% capacity (${currentRegistrations}/${event.capacity} registrations).`,
                  priority: NotificationPriority.MEDIUM,
                  eventId,
                  data: {
                    currentRegistrations,
                    capacity: event.capacity,
                    percentage: 50,
                  },
                });
              }
            }

            // 75% milestone
            if (capacityPercentage >= 75 && capacityPercentage < 100) {
              // Check if 75% notification already sent
              const existingNotification = await prisma.notification.findFirst({
                where: {
                  eventId,
                  type: NotificationType.REGISTRATION_MILESTONE_75,
                  createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
                  },
                },
              });

              if (!existingNotification) {
                await NotificationService.sendNotification({
                  userId: eventWithOrganizer.organizerId,
                  type: NotificationType.REGISTRATION_MILESTONE_75,
                  title: `75% Capacity Reached: ${eventWithOrganizer.title}`,
                  message: `Excellent! Your event "${eventWithOrganizer.title}" has reached 75% capacity (${currentRegistrations}/${event.capacity} registrations).`,
                  priority: NotificationPriority.MEDIUM,
                  eventId,
                  data: {
                    currentRegistrations,
                    capacity: event.capacity,
                    percentage: 75,
                  },
                });
              }
            }

            // 100% capacity reached
            if (newAvailableSlots === 0) {
              // Check if 100% notification already sent
              const existingNotification = await prisma.notification.findFirst({
                where: {
                  eventId,
                  type: NotificationType.REGISTRATION_MILESTONE_100,
                  createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
                  },
                },
              });

              if (!existingNotification) {
                await NotificationService.sendNotification({
                  userId: eventWithOrganizer.organizerId,
                  type: NotificationType.REGISTRATION_MILESTONE_100,
                  title: `Event Sold Out: ${eventWithOrganizer.title}`,
                  message: `Congratulations! Your event "${eventWithOrganizer.title}" is now sold out (${currentRegistrations}/${event.capacity} registrations).`,
                  priority: NotificationPriority.HIGH,
                  eventId,
                  data: {
                    currentRegistrations,
                    capacity: event.capacity,
                    percentage: 100,
                  },
                });

                // Also notify attendees that event is full (for waitlist)
                await NotificationService.sendEventNotification(
                  eventId,
                  NotificationType.CAPACITY_FULL,
                  `Event Sold Out: ${eventWithOrganizer.title}`,
                  `The event "${eventWithOrganizer.title}" has reached full capacity. If you haven't registered yet, you can join the waitlist to be notified if spots become available.`,
                  'attendees',
                  undefined,
                  NotificationPriority.MEDIUM,
                );
              }
            }
          }
        } catch (error) {
          // Log error but don't fail registration
          logger.error('Failed to send capacity milestone notifications:', error);
        }
      }
    }

    // Audit log
    await createAuditLog({
      userId: attendeeId,
      action: AuditActions.TICKET_PURCHASED,
      entity: 'EventRegistration',
      entityId: registration.id,
      metadata: {
        eventId,
        eventTitle: event.title,
        quantity: totalQuantity,
        totalAmount: finalAmount.toString(),
        originalAmount: totalAmount.toString(),
        discountAmount: discountAmount.toString(),
        promoCode: data.promoCode || null,
        isFree: event.isFree,
      },
      ipAddress,
      userAgent,
    });

    // Send ticket email and notification for free events
    if (event.isFree || isComplementaryTicket) {
      // Send ticket email immediately for free events
      try {
        logger.debug('[registerForEvent] Authenticated user - preparing ticket email for free event');

        // Safely extract ticketLineItems if they exist
        // Type assertion needed because Prisma types may not fully include ticketLineItems relation
        const registrationWithLineItems = registration as typeof registration & {
          ticketLineItems?: Array<{
            ticketType: string;
            quantity: number;
            unitPrice: number; // Decimal from Prisma
            totalPrice: number; // Decimal from Prisma
          }>;
        };

        let ticketLineItems: Array<{
          ticketType: string;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }> | undefined;

        try {
          logger.debug('[registerForEvent] Authenticated user - extracting ticketLineItems');
          // Safely access ticketLineItems - it may not exist if Prisma query didn't include it
          const lineItems = (registrationWithLineItems as unknown as { ticketLineItems?: unknown[] }).ticketLineItems;
          logger.debug('[registerForEvent] Authenticated user - ticketLineItems raw value:', lineItems ? `${Array.isArray(lineItems) ? lineItems.length : 'not array'} items` : 'undefined/null');

          if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
            ticketLineItems = lineItems.map((item: {
              ticketType: string;
              quantity: number;
              unitPrice: number;
              totalPrice: number;
            }) => ({
              ticketType: item.ticketType,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
            }));
            logger.debug(`[registerForEvent] Authenticated user - successfully extracted ${ticketLineItems.length} ticket line items`);
          } else {
            logger.debug('[registerForEvent] Authenticated user - no ticket line items to extract');
          }
        } catch (lineItemsError) {
          // If ticketLineItems extraction fails, just log and continue without them
          logger.warn(`[registerForEvent] Authenticated user - failed to extract ticketLineItems for registration ${registration.id}:`, {
            error: lineItemsError instanceof Error ? lineItemsError.message : String(lineItemsError),
            stack: lineItemsError instanceof Error ? lineItemsError.stack : undefined,
          });
          ticketLineItems = undefined;
        }

        logger.debug(`[registerForEvent] Authenticated user - calling TicketService.sendTicketEmail for registration ${registration.id}`);
        // Send email asynchronously (non-blocking) - user gets immediate response
        TicketService.sendTicketEmail({
          id: registration.id,
          ticketType: registration.ticketType,
          quantity: registration.quantity,
          totalAmount: registration.totalAmount,
          createdAt: registration.createdAt,
          backupCode: registration.backupCode,
          registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
          ticketLineItems,
          event: registration.event,
          attendee: registration.attendee,
        }).catch((error) => {
          // Log email error but don't fail registration - email can be resent later
          logger.error('[registerForEvent] Authenticated user - failed to send ticket email (async):', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            registrationId: registration.id,
            eventId,
            attendeeEmail: registration.attendee.email,
          });
          // Don't fail registration if email fails - status already tracked in database
        });
        // Email status will be updated in database by sendTicketEmail
        logger.debug(`[registerForEvent] Authenticated user - ticket email sending started (async) for registration ${registration.id}`);

        // Send in-app notification (separate try-catch to ensure it's sent even if email fails)
        try {
          await NotificationService.sendNotification({
            userId: attendeeId,
            type: NotificationType.REGISTRATION_CONFIRMED,
            title: `Registration Confirmed: ${event.title}`,
            message: `Your registration for "${event.title}" has been confirmed! Your ticket has been sent to your email.`,
            priority: NotificationPriority.HIGH,
            eventId: event.id,
            registrationId: registration.id,
            data: {
              eventDate: registration.event.startDate,
              eventTime: registration.event.startTime || null,
              venue: registration.event.venue || null,
              location: registration.event.location,
            },
          });
        } catch (error) {
          logger.error('Failed to send registration confirmed notification:', error);
          // Don't fail registration if notification fails
        }
      } catch (error) {
        // Log error but don't fail registration - email/notification can be sent later
        logger.error('[registerForEvent] Authenticated user - error in ticket email/notification flow:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          registrationId: registration.id,
          eventId,
        });
      }
    }

    logger.info(`Registration created: ${registration.id} for event: ${eventId} by attendee: ${attendeeId}`);

    return registration;
  }

  /**
   * Approve event (admin function)
   */
  static async approveEvent(
    eventId: string,
    adminId: string,
    adminRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify admin
    if (adminRole !== UserRole.SUPERADMIN && adminRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only admins can approve events');
    }

    // Get event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.status === EventStatus.APPROVED) {
      throw new ValidationError('Event is already approved');
    }

    if (event.status === EventStatus.REJECTED) {
      throw new ValidationError('Cannot approve a rejected event. Organizer must resubmit.');
    }

    // Approve event
    const approvedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
        // Clear rejection fields if they exist
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: adminId,
      action: AuditActions.EVENT_APPROVED,
      entity: 'Event',
      entityId: eventId,
      metadata: {
        eventTitle: approvedEvent.title,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Event approved: ${eventId} by admin: ${adminId}`);

    // Send notification to organizer
    try {
      await NotificationService.sendNotification({
        userId: approvedEvent.organizerId,
        type: NotificationType.EVENT_APPROVED,
        title: `Event Approved: ${approvedEvent.title}`,
        message: `Your event "${approvedEvent.title}" has been approved and is now live on EventKnit. Attendees can now register for your event.`,
        priority: NotificationPriority.HIGH,
        eventId,
        data: {
          eventTitle: approvedEvent.title,
          approvedAt: approvedEvent.approvedAt,
        },
      });
    } catch (error) {
      // Log error but don't fail the approval
      logger.error('Failed to send event approval notification:', error);
    }

    return approvedEvent;
  }

  /**
   * Reject event (admin function)
   */
  static async rejectEvent(
    eventId: string,
    rejectionReason: string,
    adminId: string,
    adminRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify admin
    if (adminRole !== UserRole.SUPERADMIN && adminRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only admins can reject events');
    }

    // Get event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.status === EventStatus.REJECTED) {
      throw new ValidationError('Event is already rejected');
    }

    if (event.status === EventStatus.APPROVED) {
      throw new ValidationError('Cannot reject an approved event. Use recall instead.');
    }

    // Reject event
    const rejectedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.REJECTED,
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: adminId,
      action: AuditActions.EVENT_REJECTED,
      entity: 'Event',
      entityId: eventId,
      metadata: {
        eventTitle: rejectedEvent.title,
        rejectionReason,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Event rejected: ${eventId} by admin: ${adminId}`);

    // Send notification to organizer
    try {
      await NotificationService.sendNotification({
        userId: rejectedEvent.organizerId,
        type: NotificationType.EVENT_REJECTED,
        title: `Event Rejected: ${rejectedEvent.title}`,
        message: `Your event "${rejectedEvent.title}" has been rejected.\n\nReason: ${rejectionReason}\n\nYou can review the feedback and resubmit your event for approval.`,
        priority: NotificationPriority.HIGH,
        eventId,
        data: {
          eventTitle: rejectedEvent.title,
          rejectionReason,
          rejectedAt: rejectedEvent.rejectedAt,
        },
      });
    } catch (error) {
      // Log error but don't fail the rejection
      logger.error('Failed to send event rejection notification:', error);
    }

    return rejectedEvent;
  }

  /**
   * Cancel event (organizer function)
   */
  static async cancelEvent(
    eventId: string,
    organizerId: string,
    organizerRole: UserRole,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizerId: true,
        title: true,
        status: true,
        startDate: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== organizerId) {
        throw new AuthorizationError('You do not have permission to cancel this event');
      }
    }

    // Check if event is approved
    if (event.status !== EventStatus.APPROVED) {
      throw new ValidationError('Only approved events can be cancelled');
    }

    // Check if event has already started
    if (event.startDate) {
      const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
      const now = new Date();
      if (startDate < now) {
        throw new ValidationError('Cannot cancel an event that has already started');
      }
    }

    // Cancel event
    const cancelledEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.CANCELLED,
        updatedBy: organizerId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: organizerId,
      action: AuditActions.EVENT_CANCELLED,
      entity: 'Event',
      entityId: eventId,
      metadata: {
        eventTitle: cancelledEvent.title,
        reason: reason || 'No reason provided',
        cancelledBy: 'organizer',
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Event cancelled: ${eventId} by organizer: ${organizerId}`);

    // Send notifications
    try {
      // Notify all registered attendees
      await NotificationService.sendEventNotification(
        eventId,
        NotificationType.EVENT_CANCELLED,
        `Event Cancelled: ${cancelledEvent.title}`,
        `The event "${cancelledEvent.title}" has been cancelled.${reason ? `\n\nReason: ${reason}` : ''}\n\nIf you paid for this event, you will receive a full refund.`,
        'attendees',
        undefined,
        NotificationPriority.HIGH,
        { reason: reason || null },
      );

      // Notify assigned staff
      await NotificationService.sendEventNotification(
        eventId,
        NotificationType.EVENT_CANCELLED_FOR_STAFF,
        `Event Cancelled: ${cancelledEvent.title}`,
        `The event "${cancelledEvent.title}" you were assigned to has been cancelled.${reason ? `\n\nReason: ${reason}` : ''}`,
        'staff',
        undefined,
        NotificationPriority.MEDIUM,
        { reason: reason || null },
      );
    } catch (error) {
      // Log error but don't fail the cancellation
      logger.error('Failed to send event cancellation notifications:', error);
    }

    return cancelledEvent;
  }

  /**
   * Recall event (admin function - pull down approved event)
   */
  static async recallEvent(
    eventId: string,
    action: 'PENDING' | 'CANCELLED',
    adminId: string,
    adminRole: UserRole,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify admin
    if (adminRole !== UserRole.SUPERADMIN && adminRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only admins can recall events');
    }

    // Validate action
    if (action !== 'PENDING' && action !== 'CANCELLED') {
      throw new ValidationError('Action must be either PENDING or CANCELLED');
    }

    // Get event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if event is approved
    if (event.status !== EventStatus.APPROVED) {
      throw new ValidationError('Only approved events can be recalled');
    }

    // Prepare update data
    const updateData: {
      status: EventStatus;
      updatedBy: string;
      approvedBy?: null;
      approvedAt?: null;
      rejectedBy?: null;
      rejectedAt?: null;
      rejectionReason?: null;
    } = {
      status: action === 'PENDING' ? EventStatus.PENDING : EventStatus.CANCELLED,
      updatedBy: adminId,
    };

    // If setting to PENDING, clear approval fields
    if (action === 'PENDING') {
      updateData.approvedBy = null;
      updateData.approvedAt = null;
      updateData.rejectedBy = null;
      updateData.rejectedAt = null;
      updateData.rejectionReason = null;
    }

    // Update event
    const recalledEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: adminId,
      action: action === 'PENDING' ? AuditActions.EVENT_UPDATED : AuditActions.EVENT_CANCELLED,
      entity: 'Event',
      entityId: eventId,
      metadata: {
        eventTitle: recalledEvent.title,
        action: action === 'PENDING' ? 'recalled_to_pending' : 'recalled_cancelled',
        reason: reason || 'No reason provided',
        recalledBy: 'admin',
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Event recalled: ${eventId} by admin: ${adminId} - Action: ${action}`);

    return recalledEvent;
  }

  /**
   * Update organizer data access level for an event (admin only)
   */
  static async updateOrganizerDataAccess(
    eventId: string,
    dataAccessLevel: DataAccessLevel,
    adminId: string,
  ) {
    // Verify event exists
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Update data access level
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        organizerDataAccess: dataAccessLevel,
        updatedBy: adminId,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: adminId,
      action: AuditActions.EVENT_UPDATED,
      entity: 'Event',
      entityId: eventId,
      metadata: {
        field: 'organizerDataAccess',
        oldValue: event.organizerDataAccess,
        newValue: dataAccessLevel,
      },
    });

    logger.info(`Organizer data access updated for event: ${eventId} to ${dataAccessLevel} by admin: ${adminId}`);

    return updatedEvent;
  }

  /**
   * Bulk update organizer data access level for multiple events (admin only)
   */
  static async bulkUpdateOrganizerDataAccess(
    eventIds: string[],
    dataAccessLevel: DataAccessLevel,
    adminId: string,
  ) {
    if (!eventIds || eventIds.length === 0) {
      throw new ValidationError('At least one event ID is required');
    }

    // Verify all events exist
    const events = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
        deletedAt: null,
      },
      select: {
        id: true,
        organizerDataAccess: true,
      },
    });

    if (events.length !== eventIds.length) {
      const foundIds = events.map(e => e.id);
      const missingIds = eventIds.filter(id => !foundIds.includes(id));
      throw new NotFoundError(`Events not found: ${missingIds.join(', ')}`);
    }

    // Bulk update data access level
    const result = await prisma.event.updateMany({
      where: {
        id: { in: eventIds },
        deletedAt: null,
      },
      data: {
        organizerDataAccess: dataAccessLevel,
        updatedBy: adminId,
      },
    });

    // Create audit logs for each event
    await Promise.all(
      events.map(event =>
        createAuditLog({
          userId: adminId,
          action: AuditActions.EVENT_UPDATED,
          entity: 'Event',
          entityId: event.id,
          metadata: {
            field: 'organizerDataAccess',
            oldValue: event.organizerDataAccess,
            newValue: dataAccessLevel,
            bulkUpdate: true,
          },
        }),
      ),
    );

    logger.info(`Bulk organizer data access updated for ${result.count} events to ${dataAccessLevel} by admin: ${adminId}`);

    return {
      updatedCount: result.count,
      eventIds,
    };
  }

  /**
   * Get event registrations for an event (organizer function)
   * Filters data based on organizerDataAccess level
   */
  static async getEventRegistrations(
    eventId: string,
    organizerId: string,
    organizerRole: UserRole,
  ) {
    // Get event with data access level
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizerId: true,
        organizerDataAccess: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify organizer owns the event (unless admin)
    const isAdmin = organizerRole === UserRole.SUPERADMIN || organizerRole === UserRole.ADMIN_STAFF;
    if (!isAdmin && event.organizerId !== organizerId) {
      throw new AuthorizationError('You do not have permission to view registrations for this event');
    }

    // Get registrations
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: {
          in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
        },
      },
      include: {
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Use new tier-based filtering system (admins always see everything)
    if (!isAdmin) {
      // Import DataAccessService dynamically to avoid circular dependencies
      const { DataAccessService } = await import('./data-access.service.js');

      // Filter data based on subscription tier and consent
      return await DataAccessService.filterAttendeeData(
        registrations,
        organizerId,
        eventId,
      );
    }

    // Admins see everything including transaction IDs
    return registrations;
  }

  /**
   * Cancel registration (attendee function)
   */
  static async cancelRegistration(
    registrationId: string,
    attendeeId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get registration
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            capacity: true,
            availableSlots: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    // Verify attendee owns the registration
    if (registration.attendeeId !== attendeeId) {
      throw new AuthorizationError('You do not have permission to cancel this registration');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new ValidationError('Registration is already cancelled');
    }

    // Cancel registration
    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: attendeeId,
      },
    });

    // Update available slots if capacity exists
    if (registration.event.capacity !== null) {
      const newAvailableSlots = (registration.event.availableSlots || registration.event.capacity) + registration.quantity;
      await prisma.event.update({
        where: { id: registration.event.id },
        data: {
          availableSlots: Math.min(registration.event.capacity, newAvailableSlots),
        },
      });
    }

    // Audit log
    await createAuditLog({
      userId: attendeeId,
      action: AuditActions.TICKET_CANCELLED,
      entity: 'EventRegistration',
      entityId: registrationId,
      metadata: {
        eventId: registration.event.id,
        eventTitle: registration.event.title,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Registration cancelled: ${registrationId} by attendee: ${attendeeId}`);
  }

  /**
   * Get user's registered events (for user dashboard)
   */
  static async getUserRegisteredEvents(
    attendeeId: string,
    filters?: {
      page?: number;
      limit?: number;
    },
  ) {
    const limit = filters?.limit || 12; // Default 12 for infinite scroll
    const page = filters?.page || 1;
    const skip = (page - 1) * limit;

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: {
          attendeeId,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
          },
        },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.eventRegistration.count({
        where: {
          attendeeId,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
          },
        },
      }),
    ]);

    // Transform registrations to dashboard format
    const userEvents = registrations.map(registration => {
      const event = registration.event;
      const now = new Date();
      let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';

      if (event.status === EventStatus.COMPLETED || (event.endDate && new Date(event.endDate) < now)) {
        status = 'completed';
      } else if (event.startDate && new Date(event.startDate) <= now) {
        status = 'ongoing';
      }

      // Format date range
      let dateString = '';
      if (event.startDate) {
        const startDate = new Date(event.startDate);
        if (event.endDate) {
          const endDate = new Date(event.endDate);
          if (startDate.toDateString() === endDate.toDateString()) {
            dateString = startDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          } else {
            dateString = `${startDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })} - ${endDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}`;
          }
        } else {
          dateString = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      }

      return {
        id: event.id,
        title: event.title,
        date: dateString,
        location: event.location,
        type: event.isOnline ? 'Online' : 'In-Person',
        image: event.image || '',
        registrationDate: registration.createdAt.toISOString().split('T')[0],
        venue: event.venue || '',
        description: event.description,
        status,
        category: event.category || '',
        // Include registration data for badge/ticket features
        registrationId: registration.id,
        ticketType: registration.ticketType,
        backupCode: registration.backupCode,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      events: userEvents,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Register for an event via invitation link (public - no auth required)
   */
  static async registerViaInvitation(
    token: string,
    registrationData: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Import InvitationService here to avoid circular dependency
    const { InvitationService } = await import('./invitation.service.js');

    // Get and validate invitation
    const invitation = await InvitationService.getInvitationByToken(token);
    const eventId = invitation.event.id;

    // Extract email from registration data (required field)
    const email = registrationData.email as string;
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Email is required for registration');
    }

    // Extract other required fields from registration data
    const firstName = registrationData.firstName as string;
    const lastName = registrationData.lastName as string;
    if (!firstName || !lastName) {
      throw new ValidationError('First name and last name are required');
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Create user account if doesn't exist (with temporary password)
    if (!user) {
      // Generate a random password (user can reset it later)
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(tempPassword);

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          otherName: registrationData.otherName as string | undefined,
          phoneNumber: registrationData.phoneNumber as string | undefined,
          companyAffiliation: registrationData.companyAffiliation as string | undefined,
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
          isEmailVerified: false, // Email verification can be done later
        },
      });

      // TODO: Send welcome email with password reset link
      logger.info(`User created via invitation: ${user.id} for event: ${eventId}`);
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_attendeeId: {
          eventId,
          attendeeId: user.id,
        },
      },
    });

    if (existingRegistration && existingRegistration.status !== RegistrationStatus.CANCELLED) {
      throw new ConflictError('You are already registered for this event');
    }

    // Get event details for validation
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        isFree: true,
        price: true,
        ticketTypes: true,
        capacity: true,
        availableSlots: true,
        registrationDeadline: true,
        startDate: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate event status
    if (event.status !== EventStatus.APPROVED) {
      throw new ValidationError('Event is not available for registration');
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      throw new ValidationError('Registration deadline has passed');
    }

    // Check if event has started
    if (new Date(event.startDate) < new Date()) {
      throw new ValidationError('Event has already started');
    }

    // Calculate total amount (default to free or check ticket type)
    const quantity = (registrationData.quantity as number) || 1;
    let totalAmount = new Decimal(0);

    if (!event.isFree) {
      const ticketType = registrationData.ticketType as string | undefined;
      if (ticketType && event.ticketTypes) {
        const ticketTypes = event.ticketTypes as Array<{ name: string; price: number }>;
        const selectedTicket = ticketTypes.find(t => t.name === ticketType);
        if (!selectedTicket) {
          throw new ValidationError('Invalid ticket type');
        }
        totalAmount = new Decimal(Number(selectedTicket.price) * quantity);
      } else if (event.price) {
        totalAmount = new Decimal(Number(event.price) * quantity);
      } else {
        throw new ValidationError('Ticket type is required for this event');
      }
    }

    // Check capacity
    if (event.capacity !== null) {
      const currentRegistrations = await prisma.eventRegistration.count({
        where: {
          eventId,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
          },
        },
      });

      if (currentRegistrations + quantity > event.capacity) {
        throw new ValidationError('Event is sold out or insufficient capacity');
      }
    }

    // Create registration
    const registrationStatus = event.isFree
      ? RegistrationStatus.CONFIRMED
      : RegistrationStatus.PENDING;

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId: user.id,
        invitationId: invitation.id,
        ticketType: registrationData.ticketType as string | undefined || null,
        quantity,
        totalAmount,
        registrationData: registrationData as Prisma.InputJsonValue,
        status: registrationStatus,
        paymentStatus: event.isFree ? 'COMPLETED' : 'PENDING',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            venue: true,
            location: true,
          },
        },
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Update invitation used count
    await prisma.eventInvitation.update({
      where: { id: invitation.id },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });

    // Update available slots if capacity exists
    if (event.capacity !== null) {
      const newAvailableSlots = (event.availableSlots || event.capacity) - quantity;
      await prisma.event.update({
        where: { id: eventId },
        data: {
          availableSlots: Math.max(0, newAvailableSlots),
        },
      });
    }

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: AuditActions.REGISTRATION_VIA_INVITATION,
      entity: 'EventRegistration',
      entityId: registration.id,
      metadata: {
        eventId,
        eventTitle: event.title,
        invitationId: invitation.id,
        inviteType: invitation.inviteType,
        quantity,
        totalAmount: totalAmount.toString(),
        isFree: event.isFree,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Registration via invitation: ${registration.id} for event: ${eventId} by user: ${user.id}`);

    return {
      registration,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isNewUser: !user.isEmailVerified, // Indicate if this is a new user
      },
    };
  }

  /**
   * Register for event as guest (public - no auth required)
   * Creates account if needed and sends magic link for immediate access
   */
  static async registerAsGuest(
    eventId: string,
    guestData: {
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      // New: Support multiple ticket types
      tickets?: TicketSelection[];
      // Deprecated: Use tickets array instead. Kept for backward compatibility
      ticketType?: string;
      quantity?: number;
      registrationData?: Record<string, unknown>;
    },
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate required fields
    const email = guestData.email?.toLowerCase().trim();
    const firstName = guestData.firstName?.trim();
    const lastName = guestData.lastName?.trim();

    if (!email || !firstName || !lastName) {
      throw new ValidationError('Email, first name, and last name are required');
    }

    // Get event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        isFree: true,
        price: true,
        ticketTypes: true,
        capacity: true,
        availableSlots: true,
        registrationDeadline: true,
        startDate: true,
        venue: true,
        location: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if event is approved
    if (event.status !== EventStatus.APPROVED) {
      throw new ValidationError('Event is not available for registration');
    }

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      throw new ValidationError('Registration deadline has passed');
    }

    // Check if event has already started
    if (new Date(event.startDate) < new Date()) {
      throw new ValidationError('Event has already started');
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    let userCreatedInThisRequest = false;

    // Create user account if doesn't exist (passwordless)
    // Use try-catch to handle race condition where user might be created between check and create
    if (!user) {
      // Check for SUSPENDED or DEACTIVATED users with this email
      const existingUser = await prisma.user.findFirst({
        where: { email },
        select: { status: true },
      });

      if (existingUser?.status === UserStatus.SUSPENDED) {
        throw new ConflictError('This account has been permanently suspended. Please contact support for assistance.');
      }

      if (existingUser?.status === UserStatus.DEACTIVATED) {
        throw new ConflictError('This account has been deactivated. Please contact support to appeal or wait for the deactivation period to end.');
      }

      // Create passwordless account (user can set password later)
      // Handle race condition: if user is created by another request, catch unique constraint error
      try {
        user = await prisma.user.create({
          data: {
            email,
            password: null, // Passwordless account
            firstName,
            lastName,
            phoneNumber: guestData.phoneNumber?.trim(),
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
            isEmailVerified: true, // Email verified from checkout
            emailVerifiedAt: new Date(),
          },
        });

        userCreatedInThisRequest = true;
        logger.info(`Guest user created: ${user.id} for event: ${eventId}`);
      } catch (error: unknown) {
        // Handle race condition: if user was created by another concurrent request
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
          // User was created by another request - fetch the existing user
          user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            // This shouldn't happen, but handle it gracefully
            throw new ConflictError('User account creation failed. Please try again.');
          }

          userCreatedInThisRequest = false; // User was NOT created in this request
          logger.info(`User already exists (race condition handled): ${user.id} for event: ${eventId}`);
        } else {
          // Re-throw other errors
          throw error;
        }
      }
    }

    // Determine if user is new (created in this request)
    // This is used to determine if we should send account invitation email
    const finalIsNewUser = userCreatedInThisRequest;

    // Continue with existing user logic
    if (user) {
      // Check user status
      if (user.status === UserStatus.SUSPENDED) {
        throw new ConflictError('This account has been permanently suspended. Please contact support for assistance.');
      }

      // Update existing user profile data if new information is provided
      const updateData: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        isEmailVerified?: boolean;
        emailVerifiedAt?: Date;
      } = {};

      // Update name fields if provided and different
      if (firstName && firstName !== user.firstName) {
        updateData.firstName = firstName;
      }
      if (lastName && lastName !== user.lastName) {
        updateData.lastName = lastName;
      }
      if (guestData.phoneNumber?.trim() && guestData.phoneNumber.trim() !== user.phoneNumber) {
        updateData.phoneNumber = guestData.phoneNumber.trim();
      }

      // Verify email if not already verified
      if (!user.isEmailVerified) {
        updateData.isEmailVerified = true;
        updateData.emailVerifiedAt = new Date();
      }

      // Update user if there are changes
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        logger.info(`Updated existing user profile: ${user.id} for event: ${eventId}`);
      }
    }

    // Recalculate userHasPassword after potential user creation/update
    const finalUserHasPassword = user.password !== null && user.password !== undefined;

    // Generate account invitation token early (only for new users or existing users without passwords)
    // This allows us to include the account setup link in the first (and only) registration email
    let accountInvitationToken: string | undefined;
    if (finalIsNewUser || !finalUserHasPassword) {
      accountInvitationToken = crypto.randomBytes(32).toString('hex');
      const accountInvitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store account invitation token in EmailVerification table
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          email: user.email,
          token: accountInvitationToken,
          expiresAt: accountInvitationExpiresAt,
          verified: false,
        },
      });
      logger.debug(`[registerAsGuest] Account invitation token generated and stored for user ${user.id}`);
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_attendeeId: {
          eventId,
          attendeeId: user.id,
        },
      },
    });

    if (existingRegistration && existingRegistration.status !== RegistrationStatus.CANCELLED) {
      throw new ConflictError('You are already registered for this event');
    }

    // Process tickets: Support both new tickets array and legacy ticketType/quantity
    let ticketSelections: TicketSelection[] = [];

    if (guestData.tickets && guestData.tickets.length > 0) {
      // New format: multiple ticket types
      ticketSelections = guestData.tickets;
    } else if (guestData.ticketType) {
      // Legacy format: single ticket type (backward compatibility)
      ticketSelections = [{
        ticketType: guestData.ticketType,
        quantity: guestData.quantity || 1,
      }];
    } else if (!event.isFree && event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0) {
      // If event has ticket types but none selected, throw error
      throw new ValidationError('Please select at least one ticket type');
    } else if (!event.isFree && !event.price) {
      throw new ValidationError('Ticket type is required for this event');
    }

    // Validate tickets and calculate total amount
    let totalAmount = new Decimal(0);
    let totalQuantity = 0;
    const ticketLineItems: Array<{
      ticketType: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    if (!event.isFree && ticketSelections.length > 0) {
      const ticketTypes = event.ticketTypes as Array<{
        name: string;
        price: number;
        originalPrice?: number;
        isComplementary?: boolean;
        requiresInvitation?: boolean;
        availableFrom?: string;
        availableUntil?: string;
        quantity?: number;
      }> | null;

      if (!ticketTypes || ticketTypes.length === 0) {
        throw new ValidationError('Event has no ticket types configured');
      }

      for (const selection of ticketSelections) {
        if (selection.quantity <= 0) {
          throw new ValidationError(`Invalid quantity for ticket type: ${selection.ticketType}`);
        }

        const ticketConfig = ticketTypes.find(t => t.name === selection.ticketType);
        if (!ticketConfig) {
          throw new ValidationError(`Invalid ticket type: ${selection.ticketType}`);
        }

        // Check early bird availability
        const { isTicketTypeAvailable } = await import('../utils/ticket-helpers.js');
        const availability = isTicketTypeAvailable(ticketConfig);
        if (!availability.available) {
          throw new ValidationError(
            `Ticket type "${selection.ticketType}" is not available: ${availability.reason || 'Not available'}`,
          );
        }

        // Check ticket quantity limit
        if (ticketConfig.quantity !== null && ticketConfig.quantity !== undefined) {
          // Count existing tickets for this ticket type
          const existingTickets = await prisma.ticketLineItem.count({
            where: {
              registration: {
                eventId,
                status: {
                  in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                },
              },
              ticketType: selection.ticketType,
            },
          });

          if (existingTickets + selection.quantity > ticketConfig.quantity) {
            throw new ValidationError(
              `Insufficient tickets available for "${selection.ticketType}". Only ${ticketConfig.quantity - existingTickets} remaining.`,
            );
          }
        }

        // Calculate price for this ticket type
        const unitPrice = ticketConfig.price;
        const lineTotal = new Decimal(Number(unitPrice) * selection.quantity);
        totalAmount = totalAmount.plus(lineTotal);
        totalQuantity += selection.quantity;

        ticketLineItems.push({
          ticketType: selection.ticketType,
          quantity: selection.quantity,
          unitPrice: Number(unitPrice),
          totalPrice: Number(lineTotal),
        });
      }
    } else if (!event.isFree && event.price) {
      // Legacy: Single price event without ticket types
      const quantity = guestData.quantity || 1;
      totalAmount = new Decimal(Number(event.price) * quantity);
      totalQuantity = quantity;
    } else if (event.isFree) {
      // Free event: count total quantity
      totalQuantity = ticketSelections.reduce((sum, t) => sum + t.quantity, 0) || (guestData.quantity || 1);
    }

    // Generate backup ticket code
    const backupCode = TicketService.generateBackupTicketCode();

    // Determine registration status
    const registrationStatus = event.isFree
      ? RegistrationStatus.CONFIRMED
      : RegistrationStatus.PENDING;

    // Use transaction with Serializable isolation level to prevent capacity race condition
    // This ensures atomic capacity check and registration creation
    const isReRegistration = existingRegistration && existingRegistration.status === RegistrationStatus.CANCELLED;
    const registration = await prisma.$transaction(async (tx) => {
      // Fetch event within transaction (will be serialized with other concurrent transactions)
      const lockedEvent = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          capacity: true,
          availableSlots: true,
        },
      });

      if (!lockedEvent) {
        throw new NotFoundError('Event not found');
      }

      // Check capacity within transaction (atomic with registration creation)
      if (lockedEvent.capacity !== null && totalQuantity > 0) {
        // Count total tickets (not registrations) for capacity check
        const existingTickets = await tx.ticketLineItem.aggregate({
          where: {
            registration: {
              eventId,
              status: {
                in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
              },
            },
          },
          _sum: {
            quantity: true,
          },
        });

        // Also count legacy registrations without ticket line items
        const legacyRegistrations = await tx.eventRegistration.count({
          where: {
            eventId,
            status: {
              in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
            },
            ticketLineItems: {
              none: {},
            },
          },
        });

        const existingTotalTickets = (existingTickets._sum.quantity || 0) + legacyRegistrations;

        // For re-registrations, we don't need to check capacity (slot already reserved)
        if (!isReRegistration && existingTotalTickets + totalQuantity > lockedEvent.capacity) {
          throw new ValidationError(
            `Event is sold out or insufficient capacity. Only ${lockedEvent.capacity - existingTotalTickets} tickets remaining.`,
          );
        }
      }

      // For backward compatibility, set ticketType and quantity from first ticket or legacy data
      const legacyTicketType = ticketSelections.length > 0 ? ticketSelections[0].ticketType : (guestData.ticketType || null);
      const legacyQuantity = totalQuantity || (guestData.quantity || 1);

      // Create or update registration
      const reg = isReRegistration
        ? await tx.eventRegistration.update({
          where: {
            eventId_attendeeId: {
              eventId,
              attendeeId: user.id,
            },
          },
          data: {
            ticketType: legacyTicketType, // Backward compatibility
            quantity: legacyQuantity, // Backward compatibility
            totalAmount,
            registrationData: guestData.registrationData ? (guestData.registrationData as Prisma.InputJsonValue) : undefined,
            backupCode,
            status: registrationStatus,
            paymentStatus: event.isFree ? 'COMPLETED' : 'PENDING',
            cancelledAt: null, // Clear cancellation timestamp
            cancelledBy: null, // Clear cancellation user
            // Delete old ticket line items and create new ones
            ticketLineItems: {
              deleteMany: {},
              create: ticketLineItems.map(item => ({
                ticketType: item.ticketType,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
          },
          include: {
            ticketLineItems: true, // Include ticket line items for multiple ticket types
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                startTime: true,
                endTime: true,
                venue: true,
                location: true,
                address: true,
                isOnline: true,
                onlineLink: true,
                image: true,
                organizer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    organizationName: true,
                    email: true,
                  },
                },
              },
            },
            attendee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                companyAffiliation: true,
              },
            },
          },
        })
        : await tx.eventRegistration.create({
          data: {
            eventId,
            attendeeId: user.id,
            ticketType: legacyTicketType, // Backward compatibility
            quantity: legacyQuantity, // Backward compatibility
            totalAmount,
            registrationData: guestData.registrationData ? (guestData.registrationData as Prisma.InputJsonValue) : undefined,
            // Create ticket line items for multiple ticket types
            ticketLineItems: ticketLineItems.length > 0 ? {
              create: ticketLineItems.map(item => ({
                ticketType: item.ticketType,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            } : undefined,
            backupCode,
            status: registrationStatus,
            paymentStatus: event.isFree ? 'COMPLETED' : 'PENDING',
          },
          include: {
            ticketLineItems: true, // Include ticket line items for multiple ticket types
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                startTime: true,
                endTime: true,
                venue: true,
                location: true,
                address: true,
                isOnline: true,
                onlineLink: true,
                image: true,
                organizer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    organizationName: true,
                    email: true,
                  },
                },
              },
            },
            attendee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                companyAffiliation: true,
              },
            },
          },
        });

      // Update available slots if capacity exists (only for new registrations)
      if (lockedEvent.capacity !== null && !isReRegistration) {
        const newAvailableSlots = (lockedEvent.availableSlots || lockedEvent.capacity) - totalQuantity;
        await tx.event.update({
          where: { id: eventId },
          data: {
            availableSlots: Math.max(0, newAvailableSlots),
          },
        });
      }

      return reg;
    }, {
      isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
      timeout: 10000, // 10 second timeout
    });

    if (isReRegistration) {
      logger.info(`Re-registration created: ${registration.id} for event: ${eventId} by user: ${user.id} (previously cancelled)`);
    }

    // Generate QR code immediately at registration time (like Eventbrite/vf-ticket)
    // This ensures QR code is always available and stored for fast access
    try {
      const ticketData = TicketService.generateTicketData(registration.id, event.id, user.email);
      const qrCodeDataUrl = await TicketService.generateQRCode(ticketData);

      // Store QR code in database for fast access
      await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          qrCodeDataUrl,
          qrCodeGeneratedAt: new Date(),
        },
      });

      logger.debug(`[registerAsGuest] QR code generated and stored for registration ${registration.id}`);
    } catch (qrError) {
      // Log error but don't fail registration - QR code can be generated later
      logger.error(`[registerAsGuest] Failed to generate QR code for registration ${registration.id}:`, {
        error: qrError instanceof Error ? qrError.message : String(qrError),
        stack: qrError instanceof Error ? qrError.stack : undefined,
      });
      // Registration still succeeds - QR code will be generated when email is sent
    }

    // Send appropriate email based on event type
    // For free events: Send ticket email immediately
    // For paid events: Send payment pending email (ticket email will be sent after payment confirmation)
    logger.debug(`[registerForEvent] Starting email sending process for event ${eventId}, isFree: ${event.isFree}, registrationId: ${registration.id}`);

    try {
      if (event.isFree) {
        // Free event - send ticket email immediately
        logger.debug('[registerForEvent] Processing free event - preparing ticket email');

        // Type assertion needed because Prisma types may not fully include ticketLineItems relation
        // The query includes ticketLineItems, but TypeScript may not infer it correctly
        const registrationWithLineItems = registration as typeof registration & {
          ticketLineItems?: Array<{
            ticketType: string;
            quantity: number;
            unitPrice: number; // Decimal from Prisma
            totalPrice: number; // Decimal from Prisma
          }>;
        };

        // Safely extract ticketLineItems if they exist
        let ticketLineItems: Array<{
          ticketType: string;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }> | undefined;

        try {
          logger.debug('[registerForEvent] Extracting ticketLineItems from registration');
          // Safely access ticketLineItems - it may not exist if Prisma query didn't include it
          const lineItems = (registrationWithLineItems as unknown as { ticketLineItems?: unknown[] }).ticketLineItems;
          logger.debug('[registerForEvent] ticketLineItems raw value:', lineItems ? `${Array.isArray(lineItems) ? lineItems.length : 'not array'} items` : 'undefined/null');

          if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
            ticketLineItems = lineItems.map((item: {
              ticketType: string;
              quantity: number;
              unitPrice: number;
              totalPrice: number;
            }) => ({
              ticketType: item.ticketType,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
            }));
            logger.debug(`[registerForEvent] Successfully extracted ${ticketLineItems.length} ticket line items`);
          } else {
            logger.debug(`[registerForEvent] No ticket line items to extract (lineItems: ${lineItems ? 'exists but empty' : 'does not exist'})`);
          }
        } catch (lineItemsError) {
          // If ticketLineItems extraction fails, just log and continue without them
          logger.warn(`[registerForEvent] Failed to extract ticketLineItems for registration ${registration.id}:`, {
            error: lineItemsError instanceof Error ? lineItemsError.message : String(lineItemsError),
            stack: lineItemsError instanceof Error ? lineItemsError.stack : undefined,
          });
          ticketLineItems = undefined;
        }

        // Send email asynchronously (non-blocking) - user gets immediate response
        logger.debug(`[registerForEvent] Calling TicketService.sendTicketEmail for registration ${registration.id}`);
        TicketService.sendTicketEmail({
          id: registration.id,
          ticketType: registration.ticketType,
          quantity: registration.quantity,
          totalAmount: registration.totalAmount,
          createdAt: registration.createdAt,
          backupCode: registration.backupCode,
          registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
          ticketLineItems,
          accountInvitationToken, // Consolidated: Send setup link in ticket email
          event: registration.event,
          attendee: registration.attendee,
        }).catch((emailError) => {
          // Log email error but don't fail registration - email can be resent later
          logger.error(`[registerForEvent] Failed to send ticket email (async) to ${user.email} for event ${eventId}:`, {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            stack: emailError instanceof Error ? emailError.stack : undefined,
            registrationId: registration.id,
            eventId,
            userEmail: user.email,
          });
          // Registration still succeeds even if email fails - status already tracked in database
        });
        // Email status will be updated in database by sendTicketEmail
        logger.debug(`[registerForEvent] Ticket email sending started (async) for registration ${registration.id}`);

        // Send registration confirmed notification for free events
        try {
          await NotificationService.sendNotification({
            userId: user.id,
            type: NotificationType.REGISTRATION_CONFIRMED,
            title: `Registration Confirmed: ${event.title}`,
            message: `Your registration for "${event.title}" has been confirmed! Your ticket has been sent to your email.`,
            priority: NotificationPriority.HIGH,
            eventId: event.id,
            registrationId: registration.id,
            data: {
              eventDate: registration.event.startDate,
              eventTime: registration.event.startTime,
              venue: registration.event.venue,
              location: registration.event.location,
            },
          });
        } catch (error) {
          logger.error('Failed to send registration confirmed notification:', error);
          // Don't fail registration if notification fails
        }
      } else {
        // Paid event - send payment pending email
        logger.debug('[registerForEvent] Processing paid event - preparing payment pending email');
        // Note: Payment URL will be generated by frontend, so we don't include it here
        try {
          logger.debug(`[registerForEvent] Calling TicketService.sendPaymentPendingEmail for registration ${registration.id}`);
          await TicketService.sendPaymentPendingEmail({
            id: registration.id,
            ticketType: registration.ticketType,
            quantity: registration.quantity,
            totalAmount: registration.totalAmount,
            createdAt: registration.createdAt,
            backupCode: registration.backupCode,
            registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
            accountInvitationToken, // Consolidated: Include setup link in payment pending if available
            event: registration.event,
            attendee: registration.attendee,
          });
          logger.info(`[registerForEvent] Payment pending email sent successfully to: ${user.email} for paid event: ${eventId}`);
        } catch (emailError) {
          // Log email error but don't fail registration - email can be resent later
          logger.error(`[registerForEvent] Failed to send payment pending email to ${user.email} for event ${eventId}:`, {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            stack: emailError instanceof Error ? emailError.stack : undefined,
            registrationId: registration.id,
            eventId,
            userEmail: user.email,
          });
          // Registration still succeeds even if email fails
        }
      }
    } catch (error) {
      // Log error but don't fail registration
      // For free events: ticket email failure is logged but registration succeeds
      // For paid events: payment pending email failure is logged but registration succeeds
      // Ticket email will be sent after payment confirmation
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(`[registerForEvent] Outer catch: Failed to send ${event.isFree ? 'ticket' : 'payment pending'} email:`, {
        error: errorMessage,
        stack: errorStack,
        eventId,
        userEmail: user.email,
        registrationId: registration.id,
        errorType: error?.constructor?.name || typeof error,
      });
      // Don't throw error - registration is complete, email is optional
      // This catch should never be reached if inner try-catches are working properly
    }

    logger.debug(`[registerForEvent] Email sending process completed for registration ${registration.id}`);

    // Account invitation email logic removed - consolidated into Ticket Confirmation email above

    // Audit log
    await createAuditLog({
      userId: user.id,
      action: AuditActions.TICKET_PURCHASED,
      entity: 'EventRegistration',
      entityId: registration.id,
      metadata: {
        eventId,
        eventTitle: event.title,
        quantity: totalQuantity,
        totalAmount: totalAmount.toString(),
        isFree: event.isFree,
        isGuestCheckout: true,
        isNewUser: finalIsNewUser,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Guest registration created: ${registration.id} for event: ${eventId} by user: ${user.id}`);

    // Generate access token for guest user so they can immediately view their ticket
    const { generateAccessToken, generateRefreshToken, parseExpiresIn } = await import('../utils/jwt.js');
    const { config } = await import('../config/index.js');

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const expiresIn = parseExpiresIn(config.jwt.expiresIn);

    return {
      registration,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isNewUser: finalIsNewUser,
      },
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Generate a unique registration code for SMS/USSD registration
   * Format: 6-8 alphanumeric characters (uppercase)
   */
  static generateRegistrationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, I, 1)
    let code = '';

    // Generate 6-8 character code
    const length = 6 + Math.floor(Math.random() * 3); // 6, 7, or 8 characters

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  /**
   * Generate or regenerate registration code for an event
   */
  static async generateEventRegistrationCode(
    eventId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<string> {
    // Verify user has permission
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        organizerId: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Only organizer, admin, or superadmin can generate codes
    if (
      event.organizerId !== userId &&
      userRole !== UserRole.SUPERADMIN &&
      userRole !== UserRole.ADMIN_STAFF
    ) {
      throw new AuthorizationError('Only event organizer or admin can generate registration codes');
    }

    // Generate unique code (retry if collision)
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateRegistrationCode();
      const existing = await prisma.event.findUnique({
        where: { registrationCode: code },
        select: { id: true },
      });

      if (!existing) {
        break; // Code is unique
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique registration code after multiple attempts');
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);

    // Update event with new code
    await prisma.event.update({
      where: { id: eventId },
      data: { registrationCode: code },
    });

    logger.info(`Generated registration code ${code} for event ${eventId}`);

    return code;
  }

  /**
   * Duplicate an event
   */
  static async duplicateEvent(
    eventId: string,
    organizerId: string,
    organizerRole: UserRole,
    data?: {
      title?: string;
      copyFields?: string[]; // Fields to copy: 'dates', 'pricing', 'location', 'ticketTypes', 'speakers', 'sponsors', etc.
      excludeFields?: string[]; // Fields to exclude
    },
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      // Get original event
      const originalEvent = await prisma.event.findFirst({
        where: {
          id: eventId,
          deletedAt: null,
        },
      });

      if (!originalEvent) {
        throw new NotFoundError('Event not found');
      }

      // Verify organizer owns the event (unless admin)
      if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
        if (originalEvent.organizerId !== organizerId) {
          throw new AuthorizationError('You do not have permission to duplicate this event');
        }
      }

      // Determine which fields to copy
      const copyFields = data?.copyFields || [
        'description',
        'fullDescription',
        'organizerDescription',
        'category',
        'tags',
        'venue',
        'location',
        'address',
        'isOnline',
        'onlineLink',
        'coordinates',
        'isFree',
        'price',
        'ticketTypes',
        'capacity',
        'requirements',
        'ageRestriction',
        'duration',
        'speakers',
        'sponsors',
        'faqs',
        'registrationFields',
      ];

      const excludeFields = data?.excludeFields || [];

      // Prepare new event data
      const newEventData: Prisma.EventCreateInput = {
        title: data?.title || `${originalEvent.title} (Copy)`,
        organizer: {
          connect: { id: organizerId },
        },
        status: EventStatus.PENDING, // New event starts as pending
        type: originalEvent.type,
        createdBy: organizerId,
        updatedBy: organizerId,
        description: originalEvent.description || 'Event description pending',
        startDate: originalEvent.startDate || new Date(),
        location: originalEvent.location || 'To be announced',
      };

      // Copy selected fields
      if (copyFields.includes('description') && !excludeFields.includes('description')) {
        newEventData.description = originalEvent.description;
      }
      if (copyFields.includes('fullDescription') && !excludeFields.includes('fullDescription')) {
        newEventData.fullDescription = originalEvent.fullDescription;
      }
      if (copyFields.includes('organizerDescription') && !excludeFields.includes('organizerDescription')) {
        newEventData.organizerDescription = originalEvent.organizerDescription;
      }
      if (copyFields.includes('category') && !excludeFields.includes('category')) {
        newEventData.category = originalEvent.category;
      }
      if (copyFields.includes('tags') && !excludeFields.includes('tags')) {
        newEventData.tags = originalEvent.tags;
      }
      if (copyFields.includes('venue') && !excludeFields.includes('venue')) {
        newEventData.venue = originalEvent.venue;
      }
      if (copyFields.includes('location') && !excludeFields.includes('location')) {
        newEventData.location = originalEvent.location;
      }
      if (copyFields.includes('address') && !excludeFields.includes('address')) {
        newEventData.address = originalEvent.address;
      }
      if (copyFields.includes('isOnline') && !excludeFields.includes('isOnline')) {
        newEventData.isOnline = originalEvent.isOnline;
      }
      if (copyFields.includes('onlineLink') && !excludeFields.includes('onlineLink')) {
        newEventData.onlineLink = originalEvent.onlineLink;
      }
      if (copyFields.includes('coordinates') && !excludeFields.includes('coordinates')) {
        newEventData.coordinates = originalEvent.coordinates as Prisma.InputJsonValue;
      }
      if (copyFields.includes('isFree') && !excludeFields.includes('isFree')) {
        newEventData.isFree = originalEvent.isFree;
      }
      if (copyFields.includes('price') && !excludeFields.includes('price')) {
        newEventData.price = originalEvent.price;
      }
      if (copyFields.includes('ticketTypes') && !excludeFields.includes('ticketTypes')) {
        newEventData.ticketTypes = originalEvent.ticketTypes as Prisma.InputJsonValue;
      }
      if (copyFields.includes('capacity') && !excludeFields.includes('capacity')) {
        newEventData.capacity = originalEvent.capacity;
        newEventData.availableSlots = originalEvent.capacity;
      }
      if (copyFields.includes('requirements') && !excludeFields.includes('requirements')) {
        newEventData.requirements = originalEvent.requirements;
      }
      if (copyFields.includes('ageRestriction') && !excludeFields.includes('ageRestriction')) {
        newEventData.ageRestriction = originalEvent.ageRestriction;
      }
      if (copyFields.includes('duration') && !excludeFields.includes('duration')) {
        newEventData.duration = originalEvent.duration;
      }
      if (copyFields.includes('speakers') && !excludeFields.includes('speakers')) {
        newEventData.speakers = originalEvent.speakers as Prisma.InputJsonValue;
      }
      if (copyFields.includes('sponsors') && !excludeFields.includes('sponsors')) {
        newEventData.sponsors = originalEvent.sponsors as Prisma.InputJsonValue;
      }
      if (copyFields.includes('faqs') && !excludeFields.includes('faqs')) {
        newEventData.faqs = originalEvent.faqs as Prisma.InputJsonValue;
      }
      if (copyFields.includes('registrationFields') && !excludeFields.includes('registrationFields')) {
        newEventData.registrationFields = originalEvent.registrationFields as Prisma.InputJsonValue;
      }

      // Ensure required fields are present even if not explicitly copied
      newEventData.description = newEventData.description || originalEvent.description || 'Event description pending';
      newEventData.startDate = newEventData.startDate || originalEvent.startDate || new Date();
      newEventData.location = newEventData.location || originalEvent.location || 'To be announced';

      // Dates are not copied by default - user must set new dates
      // But if dates are in copyFields, copy them
      if (copyFields.includes('dates') && !excludeFields.includes('dates')) {
        newEventData.startDate = originalEvent.startDate;
        newEventData.endDate = originalEvent.endDate;
        newEventData.startTime = originalEvent.startTime;
        newEventData.endTime = originalEvent.endTime;
        newEventData.registrationDeadline = originalEvent.registrationDeadline;
      }

      // Images are not copied by default
      if (copyFields.includes('images') && !excludeFields.includes('images')) {
        newEventData.image = originalEvent.image;
        newEventData.images = originalEvent.images;
      }

      // Create new event
      const duplicatedEvent = await prisma.event.create({
        data: newEventData,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organizationName: true,
            },
          },
        },
      });

      // Audit log
      await createAuditLog({
        userId: organizerId,
        action: AuditActions.EVENT_CREATED,
        entity: 'Event',
        entityId: duplicatedEvent.id,
        metadata: {
          eventTitle: duplicatedEvent.title,
          duplicatedFrom: eventId,
        },
        ipAddress,
        userAgent,
      });

      logger.info(`Event duplicated: ${eventId} -> ${duplicatedEvent.id} by organizer: ${organizerId}`);

      return duplicatedEvent;
    } catch (error) {
      logger.error('Error duplicating event:', error);
      throw error;
    }
  }
}
