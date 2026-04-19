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
import { hashToken } from '../utils/password.js';
import { Decimal, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { hashPassword } from '../utils/password.js';
import crypto from 'crypto';
import { emailService } from './email.service.js';
import { TicketService } from './ticket.service.js';
import { TicketPdfQueueService } from './ticket-pdf-queue.service.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { EventCollaborationService } from './event-collaboration.service.js';
import { AuthService } from './auth.service.js';
import { backgroundTasks } from '../utils/background-tasks.js';
import { RefundService } from './refund.service.js';
import { AttendeeCommunicationService } from './attendee-communication.service.js';
import { websocketService } from './websocket.service.js';
import { isValidUUID } from '../utils/id.utils.js';

export interface CreateEventData {
  title: string;
  description: string;
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
    description?: string;
    price: number | string;
    originalPrice?: number | string;
    discountLabel?: string;
    quantity?: number | string;
    maxPerPerson?: number;
    minPerOrder?: number;
    features?: string[];
    isComplementary?: boolean;
    requiresInvitation?: boolean;
    availableFrom?: string;
    availableUntil?: string;
    earlyBirdQuantity?: number;
    salesChannel?: 'online' | 'door' | 'both';
    isHidden?: boolean;
    nameLocked?: boolean; // Ticket is tied to specific attendee name, cannot be transferred
  }>;
  capacity?: number | string;
  image?: string;
  imageFocalX?: number;
  imageFocalY?: number;
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
  // Service fee configuration
  serviceFeeType?: 'percentage' | 'fixed' | 'none';
  serviceFeeValue?: number | string;
  serviceFeePassToAttendee?: boolean;
  // Refund policy configuration
  refundPolicy?: 'no_refunds' | 'full_refund' | 'partial_refund' | 'tiered' | 'custom';
  refundDeadlineDays?: number;
  refundPolicyText?: string;
  refundTiers?: Array<{ daysBeforeEvent: number; refundPercentage: number }>;
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
  // Seat selection
  seatIds?: string[];
  // Consent data
  consent?: {
    marketingConsent?: boolean;
  };
}

export class EventService {
  private static isRetryablePendingRegistration(registration: {
    status: RegistrationStatus;
    paymentStatus: string | null;
  }): boolean {
    return registration.status === RegistrationStatus.PENDING
      && registration.paymentStatus !== 'COMPLETED';
  }

  private static markRegistrationAsResumed<T extends object>(registration: T): T & { resumedPendingPayment: true } {
    return {
      ...registration,
      resumedPendingPayment: true,
    };
  }

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

    // Enforce paid vs free pricing rules
    if (data.isFree === true) {
      if (data.price !== undefined && data.price !== null) {
        const price = typeof data.price === 'string' ? parseFloat(data.price) : Number(data.price);
        if (!isNaN(price) && price > 0) {
          throw new ValidationError('Free events must have a price of 0');
        }
      }
      if (data.ticketTypes && Array.isArray(data.ticketTypes)) {
        for (const ticket of data.ticketTypes) {
          const price = typeof ticket.price === 'string' ? parseFloat(ticket.price) : Number(ticket.price);
          if (!isNaN(price) && price > 0) {
            throw new ValidationError('Free events cannot include paid ticket types');
          }
        }
      }
    }
    if (data.isFree === false) {
      if (data.price !== undefined && data.price !== null) {
        const price = typeof data.price === 'string' ? parseFloat(data.price) : Number(data.price);
        if (!isNaN(price) && price <= 0) {
          throw new ValidationError('Paid events must have a price greater than 0');
        }
      }
      if (data.ticketTypes && Array.isArray(data.ticketTypes)) {
        // For paid events, at least one non-complementary ticket must have price > 0.
        // Free-tier tickets (price 0) are allowed alongside paid ones.
        const hasPaidTicket = data.ticketTypes.some((ticket: Record<string, unknown>) => {
          if (ticket.isComplementary === true) return false;
          const price = typeof ticket.price === 'string' ? parseFloat(ticket.price as string) : Number(ticket.price);
          return !isNaN(price) && price > 0;
        });
        if (!hasPaidTicket) {
          throw new ValidationError('Paid events must have at least one ticket with a price greater than 0');
        }
      }
    }

    // Verify organizer exists and get verification status
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        role: true,
        status: true,
        isIdentityVerified: true,
        verificationLevel: true,
        payoutLimit: true,
        kycStatus: true,
      },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

    // Check account status first — blocked statuses apply to everyone
    if (organizer.status === UserStatus.DEACTIVATED) {
      throw new AuthorizationError('Your account has been deactivated. Please contact support.');
    }
    if (organizer.status === UserStatus.SUSPENDED) {
      throw new AuthorizationError('Your account has been suspended. Please contact support.');
    }

    // Verify organizer can create events (check actual role from database, not token).
    // ATTENDEE users with PENDING_APPROVAL status are allowed — they went through
    // becomeOrganizer() which keeps role as ATTENDEE until their first event is approved.
    const actualRole = organizer.role;
    const isPendingAttendee = actualRole === UserRole.ATTENDEE &&
      organizer.status === UserStatus.PENDING_APPROVAL;

    if (!isPendingAttendee &&
      actualRole !== UserRole.ORGANIZER &&
      actualRole !== UserRole.SUPERADMIN &&
      actualRole !== UserRole.ADMIN) {
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
        // New ticket fields
        if ('description' in ticket && ticket.description) {
          ticketData.description = ticket.description;
        }
        if ('maxPerPerson' in ticket && ticket.maxPerPerson !== undefined) {
          ticketData.maxPerPerson = Number(ticket.maxPerPerson);
        }
        if ('minPerOrder' in ticket && ticket.minPerOrder !== undefined) {
          ticketData.minPerOrder = Number(ticket.minPerOrder);
        }
        if ('earlyBirdQuantity' in ticket && ticket.earlyBirdQuantity !== undefined) {
          ticketData.earlyBirdQuantity = Number(ticket.earlyBirdQuantity);
        }
        if ('salesChannel' in ticket && ticket.salesChannel) {
          ticketData.salesChannel = ticket.salesChannel;
        }
        if ('isHidden' in ticket && ticket.isHidden !== undefined) {
          ticketData.isHidden = ticket.isHidden;
        }
        if ('nameLocked' in ticket && ticket.nameLocked !== undefined) {
          ticketData.nameLocked = ticket.nameLocked;
        }

        return ticketData;
      }) as Prisma.InputJsonValue;
    }

    // Generate a stable ID and unique slug upfront
    const newEventId = crypto.randomUUID();
    const slug = await EventService.generateSlug(data.title);

    // Create event
    const event = await prisma.event.create({
      data: {
        id: newEventId,
        slug,
        title: data.title.trim(),
        description: data.description.trim(),
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
        imageFocalX: data.imageFocalX ?? 50,
        imageFocalY: data.imageFocalY ?? 50,
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
        registrationCode: data.generateRegistrationCode !== false ? await this.generateUniqueRegistrationCode() : null,
        // Service fee configuration
        serviceFeeType: data.serviceFeeType || null,
        serviceFeeValue: data.serviceFeeValue ? new Decimal(Number(data.serviceFeeValue)) : null,
        serviceFeePassToAttendee: data.serviceFeePassToAttendee ?? true,
        // Refund policy configuration
        refundPolicy: data.refundPolicy || null,
        refundSLA: data.refundDeadlineDays ?? 0,
        refundPolicyText: data.refundPolicyText?.trim() || null,
        refundTiers: data.refundTiers ? (data.refundTiers as Prisma.InputJsonValue) : undefined,
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
    declinedOrRecalledCancelled?: boolean; // Filter for declined (REJECTED) or recalled-cancelled (CANCELLED + recalledAt)
    recalledCancelled?: boolean; // Filter for recalled-cancelled only (CANCELLED + recalledAt)
    recalledPending?: boolean; // Filter for recalled-pending (PENDING + recalledAt)
  } = {}) {
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
    };

    logger.debug('[EventService] Received filters:', filters);

    // Handle special filters for recalled events
    if (filters.declinedOrRecalledCancelled) {
      // REJECTED or (CANCELLED + recalledAt IS NOT NULL)
      where.OR = [
        { status: EventStatus.REJECTED },
        {
          AND: [
            { status: EventStatus.CANCELLED },
            { recalledAt: { not: null } },
          ],
        },
      ];
    } else if (filters.recalledCancelled) {
      // CANCELLED + recalledAt IS NOT NULL (recalled events only)
      where.status = EventStatus.CANCELLED;
      where.recalledAt = { not: null };
    } else if (filters.recalledPending) {
      // PENDING + recalledAt IS NOT NULL
      where.status = EventStatus.PENDING;
      where.recalledAt = { not: null };
    } else if (filters.status) {
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
   * Get event by ID or slug. UUID format is matched by ID; anything else is treated as a slug.
   */
  static async getEventById(eventId: string, requestingUserId?: string, isAdmin = false) {
    const isUuid = isValidUUID(eventId);
    const event = await prisma.event.findFirst({
      where: {
        ...(isUuid ? { id: eventId } : { slug: eventId }),
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
            avatar: true,
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
        seatMap: {
          select: { id: true },
        },
      },
      // All fields are included by default, including JSON fields (agenda, exhibitors, speakers, sponsors, socialLinks)
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Access control: non-approved events visible only to organizer and admins
    const isOrganizer = requestingUserId && event.organizerId === requestingUserId;

    if (!isOrganizer && !isAdmin && event.status !== 'APPROVED') {
      throw new NotFoundError('Event not found');
    }

    // Hide organizer email/personal info from public API responses
    if (!isOrganizer && !isAdmin && event.organizer) {
      event.organizer.email = '';
      event.organizer.businessEmail = null;
    }

    // Add sold-out status for each ticket type (without exposing exact counts)
    if (event.ticketTypes && Array.isArray(event.ticketTypes)) {
      const ticketsArray = event.ticketTypes as Record<string, unknown>[];
      const normalizedTicketTypes = Array.from(
        ticketsArray.reduce((map: Map<string, Record<string, unknown>>, ticket: Record<string, unknown>) => {
          const name = typeof ticket?.name === 'string' ? ticket.name.trim() : '';
          if (!name) return map;
          const key = name.toLowerCase();
          if (!map.has(key)) {
            map.set(key, ticket);
          }
          return map;
        }, new Map<string, Record<string, unknown>>()),
      ).map(([, ticket]) => ticket);

      const ticketTypesWithStatus = await Promise.all(
        normalizedTicketTypes.map(async (ticket: Record<string, unknown>) => {
          // Only check capacity if quantity is defined
          if (ticket.quantity !== null && ticket.quantity !== undefined) {
            const soldCount = await prisma.ticketLineItem.aggregate({
              where: {
                registration: {
                  eventId: event.id,
                  status: {
                    in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                  },
                },
                ticketType: ticket.name as string,
              },
              _sum: {
                quantity: true,
              },
            });

            const sold = soldCount._sum.quantity || 0;
            const remaining = (ticket.quantity as number) - sold;

            return {
              ...ticket,
              isSoldOut: remaining <= 0,
            };
          }

          // Unlimited tickets - never sold out
          return {
            ...ticket,
            isSoldOut: false,
          };
        }),
      );

      (event as Record<string, unknown>).ticketTypes = ticketTypesWithStatus;
    }

    // Fetch a few attendee avatars for social proof display (Lu.ma-style)
    const recentAttendees = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] },
      },
      select: {
        attendee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    (event as Record<string, unknown>).attendeeAvatars = (recentAttendees ?? []).map((r) => ({
      id: r.attendee.id,
      firstName: r.attendee.firstName,
      lastName: r.attendee.lastName,
      avatar: r.attendee.avatar,
    }));

    // Check if this event has any active promo codes
    const promoCodeCount = await prisma.promoCode.count({
      where: {
        eventId: event.id,
        isActive: true,
      },
    });
    (event as Record<string, unknown>).hasPromoCodes = promoCodeCount > 0;

    return event;
  }

  /**
   * Get related events scored by multiple relevance signals
   */
  static async getRelatedEvents(eventId: string, limit: number = 8) {
    // Fetch source event with only the fields needed for scoring
    const source = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        category: true,
        tags: true,
        location: true,
        organizerId: true,
        startDate: true,
      },
    });

    if (!source) {
      throw new NotFoundError('Event not found');
    }

    const now = new Date();
    const sourceCity = source.location
      ? source.location.split(',')[0].trim().toLowerCase()
      : '';
    const sourceTags = (source.tags || []).map((t: string) => t.toLowerCase());

    // Build OR conditions for pre-filtering candidates
    const orConditions: Prisma.EventWhereInput[] = [];
    if (source.category) {
      orConditions.push({ category: source.category });
    }
    if (sourceTags.length > 0) {
      orConditions.push({ tags: { hasSome: source.tags || [] } });
    }
    orConditions.push({ organizerId: source.organizerId });
    if (sourceCity) {
      orConditions.push({ location: { startsWith: sourceCity, mode: 'insensitive' } });
    }

    const candidates = await prisma.event.findMany({
      where: {
        id: { not: eventId },
        status: EventStatus.APPROVED,
        type: EventType.PUBLIC,
        deletedAt: null,
        startDate: { gte: now },
        OR: orConditions,
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
      take: 100,
    });

    // Score each candidate
    const scored = candidates.map((event) => {
      let score = 0;

      // Same category: +3
      if (source.category && event.category === source.category) {
        score += 3;
      }

      // Shared tags: +2 per tag (max 10 points)
      if (sourceTags.length > 0 && event.tags) {
        const eventTags = event.tags.map((t: string) => t.toLowerCase());
        const shared = sourceTags.filter((t: string) => eventTags.includes(t)).length;
        score += Math.min(shared * 2, 10);
      }

      // Same organizer: +2
      if (event.organizerId === source.organizerId) {
        score += 2;
      }

      // Same city: +1
      if (sourceCity && event.location) {
        const candidateCity = event.location.split(',')[0].trim().toLowerCase();
        if (candidateCity === sourceCity) {
          score += 1;
        }
      }

      // Time proximity (within 30 days of source startDate): +1
      if (source.startDate && event.startDate) {
        const diffMs = Math.abs(event.startDate.getTime() - source.startDate.getTime());
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 30) {
          score += 1;
        }
      }

      return { event, score };
    });

    // Sort by score DESC, then startDate ASC (soonest first)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.event.startDate.getTime() - b.event.startDate.getTime();
    });

    const topEvents = scored.slice(0, limit).map((s) => s.event);

    return {
      events: topEvents,
      total: topEvents.length,
    };
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
    // Get event with original dates for postponement detection
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizerId: true,
        status: true,
        startDate: true,
        endDate: true,
        venue: true,
        location: true,
        isFree: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Store original values for change detection
    const originalStartDate = event.startDate;
    const originalVenue = event.venue;
    const originalLocation = event.location;
    const effectiveIsFree = data.isFree ?? event.isFree;

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN) {
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
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN) {
      if (event.organizerId !== organizerId && !isCollaborator) {
        throw new AuthorizationError('You do not have permission to update this event');
      }
    }

    // Determine if status should be reset to PENDING
    // Only reset for significant changes, not minor updates like adding an image
    const significantFields = [
      'title', 'description', 'startDate', 'endDate',
      'startTime', 'endTime', 'venue', 'location', 'address', 'isOnline',
      'onlineLink', 'price', 'ticketTypes', 'capacity', 'category', 'type',
      'requirements', 'ageRestriction', 'duration', 'speakers', 'sponsors',
      'exhibitors', 'agenda', 'faqs', 'registrationFields',
    ];

    const hasSignificantChanges = significantFields.some(field => data[field as keyof UpdateEventData] !== undefined);

    // Reset to PENDING if there are significant changes to an approved event,
    // or if a rejected event is edited (allowing resubmission for review).
    // Minor updates (e.g., image changes) don't trigger re-review.
    const shouldResetToPending = hasSignificantChanges && (
      event.status === EventStatus.APPROVED ||
      event.status === EventStatus.REJECTED
    );
    const newStatus = shouldResetToPending ? EventStatus.PENDING : event.status;

    // Prepare update data
    const updateData: Prisma.EventUpdateInput = {
      updatedBy: organizerId,
      status: newStatus, // Reset to PENDING only for significant changes
    };

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
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
      // Recalculate available slots based on actual ticket quantities (not just registration count)
      const ticketAggregation = await prisma.ticketLineItem.aggregate({
        _sum: { quantity: true },
        where: {
          registration: {
            eventId,
            status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] },
          },
        },
      });
      const totalTicketsSold = ticketAggregation._sum?.quantity || 0;
      updateData.availableSlots = capacity ? Math.max(0, capacity - totalTicketsSold) : null;
    }
    if (data.image !== undefined) updateData.image = data.image?.trim();
    if (data.images !== undefined) updateData.images = data.images;
    if (data.imageFocalX !== undefined) updateData.imageFocalX = data.imageFocalX;
    if (data.imageFocalY !== undefined) updateData.imageFocalY = data.imageFocalY;
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

    // Service fee configuration
    if (data.serviceFeeType !== undefined) updateData.serviceFeeType = data.serviceFeeType || null;
    if (data.serviceFeeValue !== undefined) updateData.serviceFeeValue = data.serviceFeeValue ? new Decimal(Number(data.serviceFeeValue)) : null;
    if (data.serviceFeePassToAttendee !== undefined) updateData.serviceFeePassToAttendee = data.serviceFeePassToAttendee;

    // Refund policy configuration
    if (data.refundPolicy !== undefined) updateData.refundPolicy = data.refundPolicy || null;
    if (data.refundDeadlineDays !== undefined) updateData.refundSLA = data.refundDeadlineDays;
    if (data.refundPolicyText !== undefined) updateData.refundPolicyText = data.refundPolicyText?.trim() || null;
    if (data.refundTiers !== undefined) updateData.refundTiers = data.refundTiers ? (data.refundTiers as Prisma.InputJsonValue) : Prisma.DbNull;

    // Validate ticket types data integrity before processing
    if (data.price !== undefined && data.price !== null) {
      const price = typeof data.price === 'string' ? parseFloat(data.price) : Number(data.price);
      if (effectiveIsFree && !isNaN(price) && price > 0) {
        throw new ValidationError('Free events must have a price of 0');
      }
      if (!effectiveIsFree && !isNaN(price) && price <= 0) {
        throw new ValidationError('Paid events must have a price greater than 0');
      }
    }
    if (data.ticketTypes !== undefined && Array.isArray(data.ticketTypes)) {
      for (const ticket of data.ticketTypes) {
        const price = typeof ticket.price === 'string' ? parseFloat(ticket.price) : Number(ticket.price);
        if (effectiveIsFree && !isNaN(price) && price > 0) {
          throw new ValidationError('Free events cannot include paid ticket types');
        }
        // Note: free-tier tickets (price 0) are allowed in paid events.
        // The "at least one paid ticket" check is done below after the loop.

        // Validate complementary tickets
        if (ticket.isComplementary === true) {
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

      // For paid events, at least one non-complementary ticket must have price > 0
      if (!effectiveIsFree) {
        const hasPaidTicket = data.ticketTypes.some((ticket: Record<string, unknown>) => {
          if (ticket.isComplementary === true) return false;
          const p = typeof ticket.price === 'string' ? parseFloat(ticket.price as string) : Number(ticket.price);
          return !isNaN(p) && p > 0;
        });
        if (!hasPaidTicket) {
          throw new ValidationError('Paid events must have at least one ticket with a price greater than 0');
        }
      }
    }

    // Validate quantity floors against sold tickets
    if (data.ticketTypes && Array.isArray(data.ticketTypes) && data.ticketTypes.length > 0) {
      const activeRegistrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          status: { not: 'CANCELLED' },
          paymentStatus: { not: 'FAILED' },
        },
        select: { ticketType: true, ticketLineItems: true },
      });

      // Count sold tickets per type name (supports both line-items and legacy ticketType)
      const soldByType = new Map<string, number>();
      for (const reg of activeRegistrations) {
        const lineItems = reg.ticketLineItems as Array<{ ticketType: string; quantity?: number }> | null;
        if (lineItems && lineItems.length > 0) {
          for (const item of lineItems) {
            soldByType.set(item.ticketType, (soldByType.get(item.ticketType) || 0) + (item.quantity || 1));
          }
        } else if (reg.ticketType) {
          soldByType.set(reg.ticketType, (soldByType.get(reg.ticketType) || 0) + 1);
        }
      }

      for (const ticket of data.ticketTypes) {
        const name = ticket.name as string;
        const newQty = ticket.quantity !== undefined && ticket.quantity !== null ? Number(ticket.quantity) : null;
        const sold = soldByType.get(name) || 0;
        if (sold > 0 && newQty !== null && newQty < sold) {
          throw new ValidationError(
            `Cannot set quantity of "${name}" below ${sold} — that many tickets have already been sold.`,
          );
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
          // New ticket fields
          if ('description' in ticket && ticket.description) {
            ticketData.description = ticket.description;
          }
          if ('maxPerPerson' in ticket && ticket.maxPerPerson !== undefined) {
            ticketData.maxPerPerson = Number(ticket.maxPerPerson);
          }
          if ('minPerOrder' in ticket && ticket.minPerOrder !== undefined) {
            ticketData.minPerOrder = Number(ticket.minPerOrder);
          }
          if ('earlyBirdQuantity' in ticket && ticket.earlyBirdQuantity !== undefined) {
            ticketData.earlyBirdQuantity = Number(ticket.earlyBirdQuantity);
          }
          if ('salesChannel' in ticket && ticket.salesChannel) {
            ticketData.salesChannel = ticket.salesChannel;
          }
          if ('isHidden' in ticket && ticket.isHidden !== undefined) {
            ticketData.isHidden = ticket.isHidden;
          }
          if ('nameLocked' in ticket && ticket.nameLocked !== undefined) {
            ticketData.nameLocked = ticket.nameLocked;
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
    if (data.description !== undefined) changes.push('description');
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

        // Check if date was actually changed (postponement)
        const newStartDate = data.startDate ? new Date(data.startDate) : null;
        const dateWasChanged = newStartDate && originalStartDate &&
          newStartDate.getTime() !== new Date(originalStartDate).getTime();

        // Check if venue/location changed
        const venueChanged = (data.venue !== undefined && data.venue !== originalVenue) ||
          (data.location !== undefined && data.location !== originalLocation);

        if (dateWasChanged) {
          // Send detailed postponement emails
          try {
            await AttendeeCommunicationService.sendEventPostponementEmails(eventId, {
              originalDate: originalStartDate,
              newDate: newStartDate,
              originalLocation: originalVenue || originalLocation,
              newLocation: data.venue || data.location || updatedEvent.venue || updatedEvent.location,
              postponementReason: undefined, // Could be added as parameter in future
              refundOption: true, // Allow refunds for those who can't attend new date
            });
          } catch (emailError) {
            logger.error('Failed to send postponement emails:', emailError);
          }
        } else if (venueChanged) {
          // Send venue update emails
          try {
            await AttendeeCommunicationService.sendEventUpdateEmails(eventId, {
              updateType: 'location',
              updateSummary: `The venue has been changed from "${originalVenue || originalLocation}" to "${data.venue || data.location || updatedEvent.venue || updatedEvent.location}".`,
            });
          } catch (emailError) {
            logger.error('Failed to send venue update emails:', emailError);
          }
        } else if (changes.length > 0) {
          // Send general update emails for other changes
          try {
            await AttendeeCommunicationService.sendEventUpdateEmails(eventId, {
              updateType: 'general',
              updateSummary: `The following aspects of the event have been updated: ${changesText}. Please check the event page for details.`,
            });
          } catch (emailError) {
            logger.error('Failed to send event update emails:', emailError);
          }
        }

        // Notify assigned staff (in-app only)
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
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN) {
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
    // Resolve slug or UUID to actual event
    const isUuid = isValidUUID(eventId);

    // Get event
    const event = await prisma.event.findFirst({
      where: {
        ...(isUuid ? { id: eventId } : { slug: eventId }),
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        organizerId: true,
        status: true,
        isFree: true,
        price: true,
        ticketTypes: true,
        capacity: true,
        availableSlots: true,
        registrationDeadline: true,
        startDate: true,
        maxTicketsPerUser: true, // Purchase limit per user (anti-scalping)
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organizerId === attendeeId) {
      throw new ValidationError('Organizers cannot register for their own events');
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
      include: {
        ticketLineItems: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const isPendingRetryRegistration = Boolean(
      existingRegistration && this.isRetryablePendingRegistration(existingRegistration),
    );
    const existingReservedQuantity = isPendingRetryRegistration
      ? (
        existingRegistration!.ticketLineItems.length > 0
          ? existingRegistration!.ticketLineItems.reduce((sum, item) => sum + item.quantity, 0)
          : (existingRegistration!.quantity || 0)
      )
      : 0;

    if (existingRegistration && existingRegistration.status !== RegistrationStatus.CANCELLED) {
      if (isPendingRetryRegistration) {
        logger.info(
          `[registerForEvent] Updating pending registration ${existingRegistration.id} for attendee ${attendeeId} on event ${eventId}`,
        );
      }
      if (!isPendingRetryRegistration) {
        throw new ConflictError('You are already registered for this event');
      }
    }

    // Calculate requested ticket quantity for purchase limit validation
    const requestedQuantity = data.tickets?.reduce((sum, t) => sum + (t.quantity || 1), 0)
      || data.quantity
      || 1;

    // Check purchase limit per user (anti-scalping measure)
    // Count user's existing confirmed tickets for this event
    const existingTicketCount = await prisma.ticketLineItem.aggregate({
      where: {
        registration: {
          eventId,
          attendeeId,
          ...(isPendingRetryRegistration && existingRegistration
            ? { id: { not: existingRegistration.id } }
            : {}),
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
    const legacyRegistrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        attendeeId,
        ...(isPendingRetryRegistration && existingRegistration
          ? { id: { not: existingRegistration.id } }
          : {}),
        status: {
          in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
        },
        ticketLineItems: {
          none: {},
        },
      },
      select: {
        quantity: true,
      },
    });

    const existingTotal = (existingTicketCount._sum.quantity || 0) +
      legacyRegistrations.reduce((sum, r) => sum + r.quantity, 0);

    const maxPerUser = event.maxTicketsPerUser || 10; // Default to 10 if not set

    if (existingTotal + requestedQuantity > maxPerUser) {
      const remaining = Math.max(0, maxPerUser - existingTotal);
      throw new ValidationError(
        remaining === 0
          ? `You have reached the maximum ticket limit of ${maxPerUser} tickets per person for this event.`
          : `You can only purchase ${remaining} more ticket${remaining === 1 ? '' : 's'} for this event (limit: ${maxPerUser} per person).`,
      );
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
          const existingTicketsAggregate = await prisma.ticketLineItem.aggregate({
            _sum: { quantity: true },
            where: {
              registration: {
                eventId,
                ...(isPendingRetryRegistration && existingRegistration
                  ? { id: { not: existingRegistration.id } }
                  : {}),
                status: {
                  in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                },
              },
              ticketType: selection.ticketType,
            },
          });
          const existingTickets = existingTicketsAggregate._sum.quantity || 0;

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

    // ATOMIC REGISTRATION: Wrap capacity check + registration creation + slot update in transaction
    // This prevents race conditions that could cause overselling (CRITICAL FIX)
    // Uses Serializable isolation level to ensure no concurrent reads/writes can interleave
    const registration = await prisma.$transaction(async (tx) => {
      // Lock the event row using FOR UPDATE to prevent concurrent modifications
      // This ensures only one registration can proceed at a time for this event
      const lockedEvent = await tx.$queryRaw<Array<{
        id: string;
        capacity: number | null;
        availableSlots: number | null;
      }>>`
        SELECT id, capacity, "availableSlots"
        FROM "Event"
        WHERE id = ${eventId}
        FOR UPDATE
      `;

      if (!lockedEvent || lockedEvent.length === 0) {
        throw new NotFoundError('Event not found');
      }

      const eventData = lockedEvent[0];

      // Enforce overall event capacity INSIDE the transaction (atomic check)
      if (eventData.capacity !== null && eventData.capacity > 0) {
        // Count existing active tickets for this event
        const existingTickets = await tx.ticketLineItem.aggregate({
          where: {
            registration: {
              eventId,
              ...(isPendingRetryRegistration && existingRegistration
                ? { id: { not: existingRegistration.id } }
                : {}),
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
            ...(isPendingRetryRegistration && existingRegistration
              ? { id: { not: existingRegistration.id } }
              : {}),
            status: {
              in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
            },
            ticketLineItems: {
              none: {},
            },
          },
        });

        const existingTotalTickets = (existingTickets._sum.quantity || 0) + legacyRegistrations;

        if (existingTotalTickets + totalQuantity > eventData.capacity) {
          const remaining = eventData.capacity - existingTotalTickets;
          throw new ValidationError(
            remaining <= 0
              ? 'Event is sold out. No tickets remaining.'
              : `Insufficient capacity. Only ${remaining} ticket${remaining === 1 ? '' : 's'} remaining.`,
          );
        }
      }

      const registrationPayload = {
        ticketType: legacyTicketType, // Backward compatibility
        quantity: legacyQuantity, // Backward compatibility
        // Store as Decimal(10,2)
        totalAmount: finalAmount,
        registrationData: data.registrationData ? (data.registrationData as Prisma.InputJsonValue) : undefined,
        backupCode,
        status: registrationStatus,
        paymentStatus: event.isFree ? 'COMPLETED' : 'PENDING',
        invitationId: data.invitationId || null,
        // Fraud detection fields (captured at registration time)
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        // Replace ticket line items for multiple ticket types
        ticketLineItems: {
          deleteMany: {},
          ...(ticketLineItems.length > 0 ? {
            create: ticketLineItems.map(item => ({
              ticketType: item.ticketType,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          } : {}),
        },
      };

      // Create or update registration atomically within the transaction
      const newRegistration = isPendingRetryRegistration && existingRegistration
        ? await tx.eventRegistration.update({
          where: { id: existingRegistration.id },
          data: registrationPayload,
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
                currency: true,
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
            attendeeId,
            ...registrationPayload,
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
                currency: true,
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

      // Update available slots atomically within the same transaction
      if (eventData.capacity !== null) {
        const currentSlots = eventData.availableSlots ?? eventData.capacity;
        const slotDelta = isPendingRetryRegistration
          ? (totalQuantity - existingReservedQuantity)
          : totalQuantity;

        if (slotDelta !== 0) {
          const newAvailableSlots = Math.max(0, Math.min(eventData.capacity, currentSlots - slotDelta));

          await tx.event.update({
            where: { id: eventId },
            data: {
              availableSlots: newAvailableSlots,
            },
          });

          logger.debug(`[registerForEvent] Updated availableSlots from ${currentSlots} to ${newAvailableSlots} for event ${eventId} (delta: ${slotDelta})`);
        }
      }

      return newRegistration;
    }, {
      // Use Serializable isolation to prevent phantom reads and ensure consistency
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      // Timeout after 10 seconds to prevent deadlocks
      timeout: 10000,
    });

    // Reserve seats if seat IDs were provided
    if (data.seatIds?.length) {
      try {
        const { SeatSelectionService } = await import('./seat-selection.service.js');
        await SeatSelectionService.reserveSeats(
          eventId,
          data.seatIds,
          registration.id,
          15, // 15-minute reservation timeout
        );
        logger.info(`[registerForEvent] Reserved ${data.seatIds.length} seats for registration ${registration.id}`);
      } catch (seatError) {
        logger.error(`[registerForEvent] Failed to reserve seats for registration ${registration.id}:`, seatError);
        // Don't fail registration — seats can be selected later
      }
    }

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
          marketingConsent: data.consent?.marketingConsent ?? false,
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

    // Check for capacity milestones and notify organizer
    // Note: Available slots are now updated atomically inside the transaction above
    if (event.capacity !== null && event.capacity > 0 && totalQuantity > 0) {
      // Fetch the updated event to get current available slots after the transaction
      const updatedEvent = await prisma.event.findUnique({
        where: { id: eventId },
        select: { availableSlots: true, capacity: true },
      });

      const newAvailableSlots = updatedEvent?.availableSlots ?? 0;
      const currentRegistrations = event.capacity - newAvailableSlots;
      const capacityPercentage = (currentRegistrations / event.capacity) * 100;

      // Send milestone notifications if capacity thresholds are reached
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
            ticketLineItems = (lineItems as Array<{
              ticketType: string;
              quantity: number;
              unitPrice: unknown;
              totalPrice: unknown;
            }>).map((item) => ({
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

        // Email 1: Immediate confirmation — fast, no QR/PDF, sent fire-and-forget
        // Email 1: Confirmation email — pure SMTP, no DB writes, safe to fire-and-forget
        TicketService.sendRegistrationConfirmationEmail({
          registrationId: registration.id,
          eventTitle: registration.event.title,
          eventStartDate: registration.event.startDate,
          eventStartTime: registration.event.startTime,
          eventLocation: registration.event.location,
          eventVenue: registration.event.venue,
          eventImage: registration.event.image,
          attendeeEmail: registration.attendee.email,
          attendeeFirstName: registration.attendee.firstName || '',
          attendeeLastName: registration.attendee.lastName,
          ticketType: registration.ticketType,
          quantity: registration.quantity,
          accountInvitationToken: null, // Authenticated users already have accounts
        }).catch((err) => {
          logger.error(`[registerForEvent] Confirmation email failed for registration ${registration.id}:`, err);
        });

        // Email 2: Queue ticket delivery — tracked because addJob writes to DB (ticketPdfStatus)
        backgroundTasks.run(
          TicketPdfQueueService.addJob({
            registrationId: registration.id,
            eventId: registration.event.id,
            ticketNumber: registration.backupCode || registration.id,
            attendeeName: `${registration.attendee.firstName || ''} ${registration.attendee.lastName || ''}`.trim(),
            attendeeEmail: registration.attendee.email,
            eventTitle: registration.event.title,
            eventDate: new Date(registration.event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            eventLocation: registration.event.venue ? `${registration.event.venue}, ${registration.event.location}` : registration.event.location,
            qrCodeDataUrl: undefined,
            priority: 2,
          }),
          'registerForEvent:ticket-pdf-queue',
        );
        logger.debug(`[registerForEvent] Authenticated user - confirmation email sent, ticket delivery queued for registration ${registration.id}`);

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

    return isPendingRetryRegistration
      ? this.markRegistrationAsResumed(registration)
      : registration;
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
    if (adminRole !== UserRole.SUPERADMIN && adminRole !== UserRole.ADMIN) {
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
        isFree: true,
        organizerId: true,
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

    // For paid events, verify organizer has completed KYC
    if (!event.isFree) {
      const organizer = await prisma.user.findUnique({
        where: { id: event.organizerId },
        select: { kycStatus: true, organizationName: true },
      });

      if (!organizer || organizer.kycStatus !== 'APPROVED') {
        throw new ValidationError(
          `Cannot approve a paid event: the organizer${organizer?.organizationName ? ` (${organizer.organizationName})` : ''} has not completed KYC verification. Please notify the organizer to complete their KYC before approving this event.`,
        );
      }
    }

    // Approve event atomically — use updateMany with status condition to prevent race conditions
    // (two admins approving simultaneously). If no rows are updated, another admin already changed the status.
    const updateResult = await prisma.event.updateMany({
      where: { id: eventId, status: EventStatus.PENDING },
      data: {
        status: EventStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
        // Clear rejection fields if they exist
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    if (updateResult.count === 0) {
      throw new ValidationError('Event status has already been changed by another admin');
    }

    // Fetch the updated event with organizer data for notifications
    const approvedEvent = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
            status: true,
            role: true, // Include role to check for ATTENDEE -> ORGANIZER upgrade
          },
        },
      },
    });

    // Auto-activate organizer account if still pending approval.
    // Also upgrade role from ATTENDEE to ORGANIZER whenever an attendee's event is approved,
    // regardless of whether their account is PENDING or already ACTIVE.
    const userUpdateData: { status?: UserStatus; role?: UserRole } = {};

    if (approvedEvent.organizer.status === UserStatus.PENDING_APPROVAL) {
      userUpdateData.status = UserStatus.ACTIVE;
    }

    if (approvedEvent.organizer.role === UserRole.ATTENDEE) {
      userUpdateData.role = UserRole.ORGANIZER;
      logger.info(
        `Upgrading user ${approvedEvent.organizerId} (${approvedEvent.organizer.email}) from ATTENDEE to ORGANIZER on event approval`,
      );
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: approvedEvent.organizerId },
        data: userUpdateData,
      });
      logger.info(
        `Updated organizer account ${approvedEvent.organizerId} (${approvedEvent.organizer.email}) on event approval`,
      );
    }

    if (
      approvedEvent.organizer.status === UserStatus.PENDING_APPROVAL ||
      approvedEvent.organizer.role === UserRole.ATTENDEE
    ) {
      // Emit the same socket event that the direct organizer-approval admin action emits.
      // Without this, the client's useOrganizerApproval hook (socket + polling path) never
      // detects the status transition, and the "You're Approved!" modal never shows.
      websocketService.emitToRoom(
        `user:${approvedEvent.organizerId}:notifications`,
        'organizer:approved',
        {
          userId: approvedEvent.organizerId,
          status: 'ACTIVE',
          message: 'Your organizer account has been approved!',
        },
      );

      // Send approval email — pure SMTP, no DB writes, safe to fire-and-forget
      emailService.sendOrganizerApprovedEmail(
        approvedEvent.organizer.email,
        approvedEvent.organizer.firstName || '',
      ).catch((err) => {
        logger.error('Failed to send organizer approved email:', err);
      });
    }

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
    if (adminRole !== UserRole.SUPERADMIN && adminRole !== UserRole.ADMIN) {
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

    // Reject event atomically — use updateMany with status condition to prevent race conditions
    const updateResult = await prisma.event.updateMany({
      where: { id: eventId, status: EventStatus.PENDING },
      data: {
        status: EventStatus.REJECTED,
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
      },
    });

    if (updateResult.count === 0) {
      throw new ValidationError('Event status has already been changed by another admin');
    }

    // Fetch the updated event with organizer data for notifications
    const rejectedEvent = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
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

    // Send rejection email — pure SMTP, no DB writes, safe to fire-and-forget
    emailService.sendEventRejectedEmail(
      rejectedEvent.organizer.email,
      rejectedEvent.organizer.firstName || rejectedEvent.organizer.organizationName || '',
      rejectedEvent.title,
      rejectionReason,
    ).catch((err) => {
      logger.error('Failed to send event rejection email:', err);
    });

    // Send in-app notification to organizer
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
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN) {
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

    // Process auto-refunds for all paid registrations
    const refundStats = { requested: 0, processed: 0, failed: 0 };
    try {
      // Get all confirmed registrations with payment transactions
      const paidRegistrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          status: RegistrationStatus.CONFIRMED,
          paymentTransaction: {
            isNot: null,
          },
        },
        include: {
          paymentTransaction: {
            include: {
              refund: true, // Check if refund already exists
            },
          },
          attendee: {
            select: {
              id: true,
            },
          },
        },
      });

      logger.info(`Found ${paidRegistrations.length} paid registrations for event cancellation refunds`);

      // Process refunds for each paid registration that doesn't already have a refund
      for (const registration of paidRegistrations) {
        if (!registration.paymentTransaction) continue;
        if (registration.paymentTransaction.refund) {
          logger.info(`Skipping refund for registration ${registration.id} - refund already exists`);
          continue;
        }
        if (registration.paymentTransaction.paymentStatus !== 'success') {
          logger.info(`Skipping refund for registration ${registration.id} - payment status is ${registration.paymentTransaction.paymentStatus}`);
          continue;
        }

        try {
          // Create refund request
          const refund = await RefundService.createRefund(
            {
              transactionId: registration.paymentTransaction.id,
              refundReason: `Event cancelled${reason ? `: ${reason}` : ''}`,
              refundType: 'full',
              notes: 'Auto-refund triggered by event cancellation',
            },
            organizerId,
            ipAddress,
            userAgent,
          );
          refundStats.requested++;

          // Auto-process the refund
          try {
            await RefundService.processRefund(refund.id, {}, 'SYSTEM', ipAddress, userAgent);
            refundStats.processed++;
            logger.info(`Auto-refund processed for registration ${registration.id}, refund ID: ${refund.id}`);
          } catch (processError) {
            // Refund request created but processing failed - will need manual intervention
            refundStats.failed++;
            logger.error(`Failed to process auto-refund for registration ${registration.id}:`, processError);
          }
        } catch (refundError) {
          refundStats.failed++;
          logger.error(`Failed to create refund for registration ${registration.id}:`, refundError);
        }
      }

      logger.info(
        `Event cancellation refund summary for ${eventId}: ` +
        `${refundStats.requested} requested, ${refundStats.processed} processed, ${refundStats.failed} failed`,
      );
    } catch (error) {
      logger.error('Failed to process event cancellation refunds:', error);
    }

    // Send cancellation emails to all attendees
    try {
      await AttendeeCommunicationService.sendEventCancellationEmails(eventId, {
        cancellationReason: reason,
        refundInfo: refundStats.requested > 0
          ? {
            amount: 'Full refund',
            status: refundStats.processed > 0 ? 'processing' : 'pending',
          }
          : undefined,
      });
    } catch (error) {
      logger.error('Failed to send event cancellation emails:', error);
    }

    // Send in-app notifications
    try {
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

      // Notify organizer with refund summary
      if (refundStats.requested > 0) {
        await NotificationService.sendNotification({
          userId: organizerId,
          type: NotificationType.EVENT_CANCELLED,
          title: `Refund Summary: ${cancelledEvent.title}`,
          message: `Event "${cancelledEvent.title}" has been cancelled.\n\nRefund Summary:\n- ${refundStats.requested} refund(s) requested\n- ${refundStats.processed} processing\n- ${refundStats.failed} failed (may need manual intervention)`,
          priority: NotificationPriority.HIGH,
          eventId,
          data: { refundStats },
        });
      }
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
    if (adminRole !== UserRole.SUPERADMIN && adminRole !== UserRole.ADMIN) {
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
    if (event.status === EventStatus.CANCELLED) {
      throw new ValidationError('Event is already cancelled');
    }
    if (event.status !== EventStatus.APPROVED) {
      throw new ValidationError('Only approved events can be recalled');
    }

    // Prevent recalling/cancelling events that have already started
    if (action === 'CANCELLED') {
      const eventWithDate = await prisma.event.findUnique({
        where: { id: eventId },
        select: { startDate: true },
      });
      if (eventWithDate?.startDate) {
        const startDate = eventWithDate.startDate instanceof Date
          ? eventWithDate.startDate
          : new Date(eventWithDate.startDate);
        if (startDate < new Date()) {
          throw new ValidationError('Cannot cancel an event that has already started. Use the completion flow instead.');
        }
      }
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
      recalledBy: string;
      recalledAt: Date;
      recallReason: string;
      recallAction: string;
    } = {
      status: action === 'PENDING' ? EventStatus.PENDING : EventStatus.CANCELLED,
      updatedBy: adminId,
      recalledBy: adminId,
      recalledAt: new Date(),
      recallReason: reason || 'No reason provided',
      recallAction: action,
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

    // Process auto-refunds if event is being cancelled
    const refundStats = { requested: 0, processed: 0, failed: 0 };
    if (action === 'CANCELLED') {
      try {
        // Get all confirmed registrations with payment transactions
        const paidRegistrations = await prisma.eventRegistration.findMany({
          where: {
            eventId,
            status: RegistrationStatus.CONFIRMED,
            paymentTransaction: {
              isNot: null,
            },
          },
          include: {
            paymentTransaction: {
              include: {
                refund: true,
              },
            },
            attendee: {
              select: {
                id: true,
              },
            },
          },
        });

        logger.info(`Found ${paidRegistrations.length} paid registrations for admin event cancellation refunds`);

        // Process refunds for each paid registration that doesn't already have a refund
        for (const registration of paidRegistrations) {
          if (!registration.paymentTransaction) continue;
          if (registration.paymentTransaction.refund) {
            logger.info(`Skipping refund for registration ${registration.id} - refund already exists`);
            continue;
          }
          if (registration.paymentTransaction.paymentStatus !== 'success') {
            logger.info(`Skipping refund for registration ${registration.id} - payment status is ${registration.paymentTransaction.paymentStatus}`);
            continue;
          }

          try {
            const refund = await RefundService.createRefund(
              {
                transactionId: registration.paymentTransaction.id,
                refundReason: `Event recalled/cancelled by admin${reason ? `: ${reason}` : ''}`,
                refundType: 'full',
                notes: 'Auto-refund triggered by admin event recall',
              },
              adminId,
              ipAddress,
              userAgent,
            );
            refundStats.requested++;

            // Auto-process the refund
            try {
              await RefundService.processRefund(refund.id, {}, 'SYSTEM', ipAddress, userAgent);
              refundStats.processed++;
              logger.info(`Auto-refund processed for registration ${registration.id}, refund ID: ${refund.id}`);
            } catch (processError) {
              refundStats.failed++;
              logger.error(`Failed to process auto-refund for registration ${registration.id}:`, processError);
            }
          } catch (refundError) {
            refundStats.failed++;
            logger.error(`Failed to create refund for registration ${registration.id}:`, refundError);
          }
        }

        logger.info(
          `Admin event cancellation refund summary for ${eventId}: ` +
          `${refundStats.requested} requested, ${refundStats.processed} processed, ${refundStats.failed} failed`,
        );

        // Send cancellation emails to all attendees
        try {
          await AttendeeCommunicationService.sendEventCancellationEmails(eventId, {
            cancellationReason: reason ? `${reason} (Cancelled by platform)` : 'Cancelled by platform',
            refundInfo: refundStats.requested > 0
              ? {
                amount: 'Full refund',
                status: refundStats.processed > 0 ? 'processing' : 'pending',
              }
              : undefined,
          });
        } catch (emailError) {
          logger.error('Failed to send admin event cancellation emails:', emailError);
        }

        // Notify organizer
        await NotificationService.sendNotification({
          userId: recalledEvent.organizer.id,
          type: NotificationType.EVENT_CANCELLED,
          title: `Event Recalled: ${recalledEvent.title}`,
          message: `Your event "${recalledEvent.title}" has been cancelled by the platform.${reason ? `\n\nReason: ${reason}` : ''}\n\nRefund Summary:\n- ${refundStats.requested} refund(s) requested\n- ${refundStats.processed} processing\n- ${refundStats.failed} failed`,
          priority: NotificationPriority.HIGH,
          eventId,
          data: { reason, refundStats },
        });
      } catch (error) {
        logger.error('Failed to process admin event cancellation refunds:', error);
      }
    }

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
    const isAdmin = organizerRole === UserRole.SUPERADMIN || organizerRole === UserRole.ADMIN;
    if (!isAdmin && event.organizerId !== organizerId) {
      throw new AuthorizationError('You do not have permission to view registrations for this event');
    }

    // Get registrations with full payment + form data
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: {
          in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING, RegistrationStatus.CANCELLED],
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
        ticketLineItems: {
          select: {
            ticketType: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
        paymentTransaction: {
          select: {
            id: true,
            transactionNumber: true,
            gatewayReference: true,
            gateway: true,
            amount: true,
            currency: true,
            paymentStatus: true,
            paymentDate: true,
          },
        },
      },
      // registrationData is a direct field on the model, auto-included
      orderBy: { createdAt: 'desc' },
    });

    // Use data access filtering (admins always see everything)
    if (!isAdmin) {
      // Import DataAccessService dynamically to avoid circular dependencies
      const { DataAccessService } = await import('./data-access.service.js');

      // Filter data based on event's organizerDataAccess level (if explicitly set)
      // or fall back to subscription tier filtering
      const dataAccessOverride = event.organizerDataAccess !== 'RESTRICTED'
        ? event.organizerDataAccess
        : undefined;
      return await DataAccessService.filterAttendeeData(
        registrations,
        organizerId,
        eventId,
        undefined,
        undefined,
        dataAccessOverride,
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
    // Get registration with ticket line items for accurate quantity calculation
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
        ticketLineItems: {
          select: {
            quantity: true,
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

    // Calculate actual ticket quantity from line items (or fall back to legacy quantity)
    const totalTickets = registration.ticketLineItems.length > 0
      ? registration.ticketLineItems.reduce((sum, item) => sum + item.quantity, 0)
      : registration.quantity;

    // Cancel registration and update available slots atomically within a transaction
    await prisma.$transaction(async (tx) => {
      await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: attendeeId,
        },
      });

      // Update available slots if capacity exists
      if (registration.event.capacity !== null) {
        const currentSlots = registration.event.availableSlots ?? registration.event.capacity;
        const newAvailableSlots = Math.min(
          registration.event.capacity,
          currentSlots + totalTickets,
        );
        await tx.event.update({
          where: { id: registration.event.id },
          data: {
            availableSlots: newAvailableSlots,
          },
        });
      }
    });

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
    const rawLimit = filters?.limit || 12; // Default 12 for infinite scroll
    const rawPage = filters?.page || 1;
    // Bounds checking to prevent abuse (NaN, negative, or excessively large values)
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 12, 1), 100);
    const page = Math.max(Number.isFinite(rawPage) ? rawPage : 1, 1);
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
        slug: event.slug || null,
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
        ticketEmailStatus: registration.ticketEmailStatus,
        ticketEmailSentAt: registration.ticketEmailSentAt ? registration.ticketEmailSentAt.toISOString() : null,
        ticketEmailError: registration.ticketEmailError,
        // Payment data for attendee visibility
        totalAmount: registration.totalAmount !== null && registration.totalAmount !== undefined
          ? Number(registration.totalAmount)
          : 0,
        paymentStatus: registration.paymentStatus || null,
        paymentMethod: registration.paymentMethod || null,
        isFree: event.isFree,
        currency: event.currency || 'KES',
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
    let eventId = invitation.event.id;

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
      if (this.isRetryablePendingRegistration(existingRegistration)) {
        logger.info(
          `[registerViaInvitation] Reusing pending registration ${existingRegistration.id} for attendee ${user.id} on event ${eventId}`,
        );

        return {
          registration: this.markRegistrationAsResumed(existingRegistration),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isNewUser: !user.isEmailVerified,
          },
          resumedPendingPayment: true,
        };
      }

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
    // Ensure all subsequent queries use the real UUID, not a slug
    eventId = event.id;

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

    // Resolve slug or UUID to actual event
    const isUuid = isValidUUID(eventId);

    // Get event
    const event = await prisma.event.findFirst({
      where: {
        ...(isUuid ? { id: eventId } : { slug: eventId }),
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
    // Ensure all subsequent queries use the real UUID, not a slug
    eventId = event.id;

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

      if (user.status === UserStatus.DEACTIVATED) {
        throw new ConflictError('This account has been deactivated. Please contact support to appeal or wait for the deactivation period to end.');
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
      const accountInvitationTokenHash = hashToken(accountInvitationToken);

      // Store hashed account invitation token in EmailVerification table
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          email: user.email,
          token: accountInvitationTokenHash,
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
      include: {
        ticketLineItems: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const isPendingRetryRegistration = Boolean(
      existingRegistration && this.isRetryablePendingRegistration(existingRegistration),
    );
    const isCancelledReRegistration = existingRegistration?.status === RegistrationStatus.CANCELLED;
    const existingReservedQuantity = isPendingRetryRegistration
      ? (
        existingRegistration!.ticketLineItems.length > 0
          ? existingRegistration!.ticketLineItems.reduce((sum, item) => sum + item.quantity, 0)
          : (existingRegistration!.quantity || 0)
      )
      : 0;

    if (existingRegistration && existingRegistration.status !== RegistrationStatus.CANCELLED) {
      if (!isPendingRetryRegistration) {
        throw new ConflictError('You are already registered for this event');
      }

      logger.info(
        `[registerAsGuest] Updating pending registration ${existingRegistration.id} for attendee ${user.id} on event ${eventId}`,
      );
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

        // Check if ticket requires invitation (complementary/invitation-gated tickets)
        if (ticketConfig.isComplementary || ticketConfig.requiresInvitation) {
          throw new ValidationError(
            `Ticket type "${selection.ticketType}" requires an invitation. Please use the invitation link provided.`,
          );
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
          const existingTicketsAggregate = await prisma.ticketLineItem.aggregate({
            _sum: { quantity: true },
            where: {
              registration: {
                eventId,
                ...(isPendingRetryRegistration && existingRegistration
                  ? { id: { not: existingRegistration.id } }
                  : {}),
                status: {
                  in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
                },
              },
              ticketType: selection.ticketType,
            },
          });
          const existingTickets = existingTicketsAggregate._sum.quantity || 0;

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
    const shouldUpdateExistingRegistration = Boolean(existingRegistration) &&
      (isCancelledReRegistration || isPendingRetryRegistration);
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
              ...(isPendingRetryRegistration && existingRegistration
                ? { id: { not: existingRegistration.id } }
                : {}),
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
            ...(isPendingRetryRegistration && existingRegistration
              ? { id: { not: existingRegistration.id } }
              : {}),
            status: {
              in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
            },
            ticketLineItems: {
              none: {},
            },
          },
        });

        const existingTotalTickets = (existingTickets._sum.quantity || 0) + legacyRegistrations;

        // Check capacity: re-registrations still need to verify capacity hasn't been reduced
        // (The cancelled registration's slot was already restored, so it's not counted in existingTotalTickets)
        if (existingTotalTickets + totalQuantity > lockedEvent.capacity) {
          throw new ValidationError(
            `Event is sold out or insufficient capacity. Only ${lockedEvent.capacity - existingTotalTickets} tickets remaining.`,
          );
        }
      }

      // For backward compatibility, set ticketType and quantity from first ticket or legacy data
      const legacyTicketType = ticketSelections.length > 0 ? ticketSelections[0].ticketType : (guestData.ticketType || null);
      const legacyQuantity = totalQuantity || (guestData.quantity || 1);

      // Create or update registration
      const reg = shouldUpdateExistingRegistration
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
            ...(isCancelledReRegistration
              ? {
                cancelledAt: null, // Clear cancellation timestamp
                cancelledBy: null, // Clear cancellation user
              }
              : {}),
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
                currency: true,
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
                currency: true,
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

      // Update available slots if capacity exists
      if (lockedEvent.capacity !== null) {
        const currentSlots = lockedEvent.availableSlots || lockedEvent.capacity;
        const previousReservedQuantity = isPendingRetryRegistration ? existingReservedQuantity : 0;
        const slotDelta = shouldUpdateExistingRegistration
          ? (totalQuantity - previousReservedQuantity)
          : totalQuantity;

        if (slotDelta !== 0) {
          const newAvailableSlots = Math.max(0, Math.min(lockedEvent.capacity, currentSlots - slotDelta));
          await tx.event.update({
            where: { id: eventId },
            data: {
              availableSlots: newAvailableSlots,
            },
          });
        }
      }

      return reg;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000, // 10 second timeout
    });

    if (isCancelledReRegistration) {
      logger.info(`Re-registration created: ${registration.id} for event: ${eventId} by user: ${user.id} (previously cancelled)`);
    } else if (isPendingRetryRegistration) {
      logger.info(`Pending registration updated: ${registration.id} for event: ${eventId} by user: ${user.id}`);
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
            ticketLineItems = (lineItems as Array<{
              ticketType: string;
              quantity: number;
              unitPrice: unknown;
              totalPrice: unknown;
            }>).map((item) => ({
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

        // Email 1: Immediate confirmation — fast, no QR/PDF, sent fire-and-forget
        // Email 1: Confirmation email — pure SMTP, no DB writes, safe to fire-and-forget
        TicketService.sendRegistrationConfirmationEmail({
          registrationId: registration.id,
          eventTitle: registration.event.title,
          eventStartDate: registration.event.startDate,
          eventStartTime: registration.event.startTime,
          eventLocation: registration.event.location,
          eventVenue: registration.event.venue,
          eventImage: registration.event.image,
          attendeeEmail: registration.attendee.email,
          attendeeFirstName: registration.attendee.firstName || '',
          attendeeLastName: registration.attendee.lastName,
          ticketType: registration.ticketType,
          quantity: registration.quantity,
          accountInvitationToken,
        }).catch((err) => {
          logger.error(`[registerAsGuest] Confirmation email failed for registration ${registration.id}:`, err);
        });

        // Email 2: Queue ticket delivery (QR + PDF) in background
        backgroundTasks.run(
          TicketPdfQueueService.addJob({
            registrationId: registration.id,
            eventId: registration.event.id,
            ticketNumber: registration.backupCode || registration.id,
            attendeeName: `${registration.attendee.firstName || ''} ${registration.attendee.lastName || ''}`.trim(),
            attendeeEmail: registration.attendee.email,
            eventTitle: registration.event.title,
            eventDate: new Date(registration.event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            eventLocation: registration.event.venue ? `${registration.event.venue}, ${registration.event.location}` : registration.event.location,
            qrCodeDataUrl: undefined, // Worker will fetch stored QR from DB
            priority: 2,
          }),
          'registerAsGuest:ticket-pdf-queue',
        );
        logger.debug(`[registerAsGuest] Confirmation email sent, ticket delivery queued for registration ${registration.id}`);

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

    // Issue an access token so the guest can proceed to payment seamlessly
    const tokens = await AuthService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      registration: isPendingRetryRegistration
        ? this.markRegistrationAsResumed(registration)
        : registration,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isNewUser: finalIsNewUser,
        requiresPasswordSetup: !user.password,
      },
      accessToken: tokens.accessToken,
      ...(isPendingRetryRegistration ? { resumedPendingPayment: true } : {}),
    };
  }

  /**
   * Generate a URL-friendly slug from an event title.
   * Appends the first 8 chars of the event ID to guarantee uniqueness.
   * e.g. "Mini Mornings at Unseen – March 3" + id → "mini-mornings-at-unseen-march-3-bc8cbfd6"
   */
  static async generateSlug(title: string, excludeId?: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // remove special chars (keep letters, digits, spaces, hyphens)
      .trim()
      .replace(/\s+/g, '-')         // spaces → hyphens
      .replace(/-+/g, '-')          // collapse multiple hyphens
      .replace(/^-|-$/g, '');       // trim leading/trailing hyphens

    // Guard: ensure the slug can never be mistaken for a UUID.
    // If the base happens to match UUID format (e.g. title is a hex string),
    // prefix with "evt-" so the resolver always treats it as a slug.
    let slug = isValidUUID(base) ? `evt-${base}` : base;
    let counter = 1;
    const maxAttempts = 100;
    while (counter <= maxAttempts) {
      const existing = await prisma.event.findFirst({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!existing) return slug;
      counter++;
      slug = `${base}-${counter}`;
    }
    // Fallback: append random suffix to guarantee uniqueness
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
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
   * Generate a unique registration code, checking database for collisions
   */
  static async generateUniqueRegistrationCode(): Promise<string> {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.generateRegistrationCode();
      const existing = await prisma.event.findFirst({
        where: { registrationCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }
    // Extremely unlikely fallback — append timestamp fragment
    return `${this.generateRegistrationCode()}${Date.now().toString(36).slice(-3).toUpperCase()}`;
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
      userRole !== UserRole.ADMIN
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
      if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN) {
        if (originalEvent.organizerId !== organizerId) {
          throw new AuthorizationError('You do not have permission to duplicate this event');
        }
      }

      // Determine which fields to copy
      const copyFields = data?.copyFields || [
        'description',
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
