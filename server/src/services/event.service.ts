import { prisma } from '../config/database';
import { EventStatus, EventType, RegistrationStatus, UserRole, Prisma, UserStatus, InviteType } from '@prisma/client';
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
  ValidationError,
} from '../utils/errors';
import { createAuditLog, AuditActions } from '../utils/audit';
import { logger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { hashPassword } from '../utils/password';
import crypto from 'crypto';

export interface CreateEventData {
  title: string;
  description: string;
  fullDescription?: string;
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
    quantity?: number | string;
    features?: string[];
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
}

export interface UpdateEventData extends Partial<CreateEventData> {
  // Allow partial updates
}

export interface RegisterForEventData {
  ticketType?: string;
  quantity?: number;
  registrationData?: Record<string, unknown>;
}

export class EventService {
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
    // Verify organizer can create events
    if (organizerRole !== UserRole.ORGANIZER &&
        organizerRole !== UserRole.SUPERADMIN &&
        organizerRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers can create events');
    }

    // Verify organizer exists
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { id: true, role: true },
    });

    if (!organizer) {
      throw new NotFoundError('Organizer not found');
    }

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
      ticketTypesJson = data.ticketTypes.map(ticket => ({
        name: ticket.name,
        price: Number(ticket.price),
        quantity: ticket.quantity ? Number(ticket.quantity) : null,
        features: ticket.features || [],
      }));
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        fullDescription: data.fullDescription?.trim(),
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
        type: data.type || EventType.PUBLIC,
        status: EventStatus.PENDING, // Events start as PENDING, need admin approval
        requirements: data.requirements || [],
        ageRestriction: data.ageRestriction?.trim(),
        duration: data.duration?.trim(),
        speakers: data.speakers || undefined,
        sponsors: data.sponsors || undefined,
        faqs: data.faqs || undefined,
        registrationFields: data.registrationFields || undefined,
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
      const { InvitationService } = await import('./invitation.service');
      
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
   */
  static async getEvents(filters: {
    status?: EventStatus;
    category?: string;
    isFree?: boolean;
    organizerId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
    };

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

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

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
        skip: offset,
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      total,
      limit,
      offset,
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

    // If event is being updated after approval, it goes back to PENDING
    const newStatus = event.status === EventStatus.APPROVED
      ? EventStatus.PENDING
      : event.status;

    // Prepare update data
    const updateData: Prisma.EventUpdateInput = {
      updatedBy: organizerId,
      status: newStatus, // Reset to PENDING if was APPROVED
    };

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription?.trim();
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
    if (data.images !== undefined) updateData.images = data.images;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.ageRestriction !== undefined) updateData.ageRestriction = data.ageRestriction?.trim();
    if (data.duration !== undefined) updateData.duration = data.duration?.trim();
    if (data.speakers !== undefined) updateData.speakers = data.speakers;
    if (data.sponsors !== undefined) updateData.sponsors = data.sponsors;
    if (data.faqs !== undefined) updateData.faqs = data.faqs;
    if (data.registrationFields !== undefined) updateData.registrationFields = data.registrationFields;

    // Handle ticket types
    if (data.ticketTypes !== undefined) {
      if (data.ticketTypes.length > 0) {
        updateData.ticketTypes = data.ticketTypes.map(ticket => ({
          name: ticket.name,
          price: Number(ticket.price),
          quantity: ticket.quantity ? Number(ticket.quantity) : null,
          features: ticket.features || [],
        }));
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

    logger.info(`Event updated: ${eventId} by organizer: ${organizerId}`);

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

    // Check if already registered
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

    // Calculate total amount
    const quantity = data.quantity || 1;
    let totalAmount = new Decimal(0);

    if (!event.isFree) {
      if (data.ticketType && event.ticketTypes) {
        const ticketTypes = event.ticketTypes as Array<{ name: string; price: number }>;
        const selectedTicket = ticketTypes.find(t => t.name === data.ticketType);
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
    // For now, free events are automatically CONFIRMED, paid events are PENDING (no payment yet)
    const registrationStatus = event.isFree
      ? RegistrationStatus.CONFIRMED
      : RegistrationStatus.PENDING;

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        attendeeId,
        ticketType: data.ticketType || null,
        quantity,
        totalAmount,
        registrationData: data.registrationData ? (data.registrationData as Prisma.InputJsonValue) : undefined,
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
      userId: attendeeId,
      action: AuditActions.TICKET_PURCHASED,
      entity: 'EventRegistration',
      entityId: registration.id,
      metadata: {
        eventId,
        eventTitle: event.title,
        quantity,
        totalAmount: totalAmount.toString(),
        isFree: event.isFree,
      },
      ipAddress,
      userAgent,
    });

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

    return rejectedEvent;
  }

  /**
   * Get event registrations for an event (organizer function)
   */
  static async getEventRegistrations(
    eventId: string,
    organizerId: string,
    organizerRole: UserRole,
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
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify organizer owns the event (unless admin)
    if (organizerRole !== UserRole.SUPERADMIN && organizerRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== organizerId) {
        throw new AuthorizationError('You do not have permission to view registrations for this event');
      }
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
  static async getUserRegisteredEvents(attendeeId: string) {
    const registrations = await prisma.eventRegistration.findMany({
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
    });

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
      };
    });

    return userEvents;
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
    const { InvitationService } = await import('./invitation.service');
    
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
}

