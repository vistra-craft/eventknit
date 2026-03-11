import { prisma } from '../config/database.js';
import { EventStatus, ManagedClientType, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateManagedEventData {
  // Client info
  clientName: string;
  clientType: ManagedClientType;
  clientContactEmail?: string;
  clientContactPhone?: string;
  clientContractRef?: string;
  // Event info
  title: string;
  description: string;
  location: string;
  startDate: string | Date;
  endDate?: string | Date;
  startTime?: string;
  endTime?: string;
  isFree: boolean;
  price?: number;
  capacity?: number;
  category?: string;
  tags?: string[];
  venue?: string;
  isOnline?: boolean;
  onlineLink?: string;
  image?: string;
  timezone?: string;
}

export class ManagedEventService {
  static async getManagedEvents(filters: {
    status?: string;
    clientType?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { status, clientType, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      isManaged: true,
      deletedAt: null,
      ...(status && { status: status as EventStatus }),
      ...(clientType && { clientType: clientType as ManagedClientType }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { clientName: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startDate: true,
          endDate: true,
          location: true,
          venue: true,
          isFree: true,
          price: true,
          capacity: true,
          availableSlots: true,
          image: true,
          clientName: true,
          clientType: true,
          clientContactEmail: true,
          clientContactPhone: true,
          clientContractRef: true,
          managedByAdminId: true,
          managedByAdmin: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdAt: true,
          updatedAt: true,
          _count: { select: { registrations: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getManagedEventById(eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, isManaged: true, deletedAt: null },
      include: {
        managedByAdmin: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { registrations: true } },
      },
    });
    if (!event) throw new NotFoundError('Managed event not found');
    return event;
  }

  static async createManagedEvent(data: CreateManagedEventData, adminId: string) {
    if (!data.clientName) throw new ValidationError('Client name is required');
    if (!data.clientType) throw new ValidationError('Client type is required');
    if (!data.title) throw new ValidationError('Event title is required');
    if (!data.location) throw new ValidationError('Event location is required');
    if (!data.startDate) throw new ValidationError('Start date is required');

    // Generate slug from title
    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        location: data.location,
        venue: data.venue,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        isFree: data.isFree,
        price: data.price ? data.price : undefined,
        capacity: data.capacity,
        category: data.category,
        tags: data.tags || [],
        isOnline: data.isOnline || false,
        onlineLink: data.onlineLink,
        image: data.image,
        timezone: data.timezone || 'UTC',
        status: EventStatus.APPROVED, // Managed events are auto-approved
        // Client info
        isManaged: true,
        clientName: data.clientName,
        clientType: data.clientType,
        clientContactEmail: data.clientContactEmail,
        clientContactPhone: data.clientContactPhone,
        clientContractRef: data.clientContractRef,
        managedByAdminId: adminId,
        // Organizer is the admin user
        organizerId: adminId,
        createdBy: adminId,
      },
      include: {
        managedByAdmin: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    logger.info(`Managed event created: ${event.id} for client: ${data.clientName} by admin: ${adminId}`);
    return event;
  }

  static async updateManagedEvent(eventId: string, data: Partial<CreateManagedEventData>, adminId: string) {
    const existing = await prisma.event.findFirst({
      where: { id: eventId, isManaged: true, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Managed event not found');

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.location && { location: data.location }),
        ...(data.venue !== undefined && { venue: data.venue }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.isFree !== undefined && { isFree: data.isFree }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.clientName && { clientName: data.clientName }),
        ...(data.clientType && { clientType: data.clientType }),
        ...(data.clientContactEmail !== undefined && { clientContactEmail: data.clientContactEmail }),
        ...(data.clientContactPhone !== undefined && { clientContactPhone: data.clientContactPhone }),
        ...(data.clientContractRef !== undefined && { clientContractRef: data.clientContractRef }),
        updatedBy: adminId,
      },
      include: {
        managedByAdmin: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    logger.info(`Managed event updated: ${eventId} by admin: ${adminId}`);
    return event;
  }

  static async cancelManagedEvent(eventId: string, adminId: string, reason?: string) {
    const existing = await prisma.event.findFirst({
      where: { id: eventId, isManaged: true, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Managed event not found');

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.CANCELLED,
        updatedBy: adminId,
      },
    });

    logger.info(`Managed event cancelled: ${eventId} by admin: ${adminId}. Reason: ${reason}`);
    return event;
  }

  static async getManagedEventStats() {
    const now = new Date();

    const [total, active, upcoming, byClientType] = await Promise.all([
      prisma.event.count({ where: { isManaged: true, deletedAt: null } }),
      prisma.event.count({
        where: {
          isManaged: true,
          deletedAt: null,
          status: EventStatus.APPROVED,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.event.count({
        where: {
          isManaged: true,
          deletedAt: null,
          status: EventStatus.APPROVED,
          startDate: { gt: now },
        },
      }),
      prisma.event.groupBy({
        by: ['clientType'],
        where: { isManaged: true, deletedAt: null },
        _count: true,
      }),
    ]);

    return { total, active, upcoming, byClientType };
  }
}
