import { prisma } from '../config/database.js';
import { UserRole } from '@prisma/client';
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../utils/errors.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { logger } from '../utils/logger.js';

export interface CreateFeaturedEventData {
  eventId: string;
  customTitle?: string;
  customImage?: string;
  customCategory?: string;
  displayStartDate?: Date;
  displayEndDate?: Date;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateFeaturedEventData {
  customTitle?: string;
  customImage?: string;
  customCategory?: string;
  displayStartDate?: Date;
  displayEndDate?: Date;
  displayOrder?: number;
  isActive?: boolean;
}

export class FeaturedEventService {
  /**
   * Create a new featured event
   */
  static async createFeaturedEvent(
    data: CreateFeaturedEventData,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify user can create featured events (only admins)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only admins can create featured events');
    }

    // Verify event exists and is approved
    const event = await prisma.event.findFirst({
      where: {
        id: data.eventId,
        deletedAt: null,
        status: 'APPROVED', // Only approved events can be featured
      },
      select: {
        id: true,
        title: true,
        image: true,
        category: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found or not approved');
    }

    // Check if event is already featured and active
    const existingFeatured = await prisma.featuredEvent.findFirst({
      where: {
        eventId: data.eventId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingFeatured) {
      throw new ConflictError('This event is already featured');
    }

    // Create featured event
    const featuredEvent = await prisma.featuredEvent.create({
      data: {
        eventId: data.eventId,
        customTitle: data.customTitle,
        customImage: data.customImage,
        customCategory: data.customCategory,
        displayStartDate: data.displayStartDate,
        displayEndDate: data.displayEndDate,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
        createdBy: userId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            category: true,
            startDate: true,
            startTime: true,
            venue: true,
            location: true,
            price: true,
            isFree: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.FEATURED_EVENT_CREATED,
      entity: 'FeaturedEvent',
      entityId: featuredEvent.id,
      metadata: {
        eventId: data.eventId,
        eventTitle: event.title,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Featured event created: ${featuredEvent.id} for event: ${data.eventId}`);

    return featuredEvent;
  }

  /**
   * Get featured event by ID
   */
  static async getFeaturedEventById(id: string) {
    const featuredEvent = await prisma.featuredEvent.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            category: true,
            startDate: true,
            startTime: true,
            venue: true,
            location: true,
            price: true,
            isFree: true,
            description: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!featuredEvent) {
      throw new NotFoundError('Featured event not found');
    }

    return featuredEvent;
  }

  /**
   * Get all active featured events (for public display)
   */
  static async getActiveFeaturedEvents() {
    const now = new Date();

    const featuredEvents = await prisma.featuredEvent.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          {
            displayStartDate: null,
            displayEndDate: null,
          },
          {
            displayStartDate: {
              lte: now,
            },
            displayEndDate: null,
          },
          {
            displayStartDate: null,
            displayEndDate: {
              gte: now,
            },
          },
          {
            displayStartDate: {
              lte: now,
            },
            displayEndDate: {
              gte: now,
            },
          },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            category: true,
            startDate: true,
            startTime: true,
            venue: true,
            location: true,
            price: true,
            isFree: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Transform to include custom fields or fallback to event fields
    return featuredEvents.map((fe) => ({
      id: fe.id,
      eventId: fe.eventId,
      title: fe.customTitle || fe.event.title,
      image: fe.customImage || fe.event.image || '',
      category: fe.customCategory || fe.event.category || '',
      date: fe.event.startDate,
      time: fe.event.startTime || '',
      venue: fe.event.venue || '',
      location: fe.event.location,
      price: fe.event.isFree ? 'Free' : `From $${fe.event.price?.toString() || '0'}`,
      displayOrder: fe.displayOrder,
      event: fe.event,
    }));
  }

  /**
   * Get all featured events (admin view)
   */
  static async getAllFeaturedEvents() {
    const featuredEvents = await prisma.featuredEvent.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            category: true,
            startDate: true,
            startTime: true,
            venue: true,
            location: true,
            price: true,
            isFree: true,
            status: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return featuredEvents;
  }

  /**
   * Update featured event
   */
  static async updateFeaturedEvent(
    id: string,
    data: UpdateFeaturedEventData,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify user can update featured events (only admins)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only admins can update featured events');
    }

    // Get existing featured event
    const existing = await prisma.featuredEvent.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Featured event not found');
    }

    // Update featured event
    const updated = await prisma.featuredEvent.update({
      where: { id },
      data: {
        customTitle: data.customTitle,
        customImage: data.customImage,
        customCategory: data.customCategory,
        displayStartDate: data.displayStartDate,
        displayEndDate: data.displayEndDate,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            category: true,
            startDate: true,
            startTime: true,
            venue: true,
            location: true,
            price: true,
            isFree: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.FEATURED_EVENT_UPDATED,
      entity: 'FeaturedEvent',
      entityId: id,
      metadata: {
        eventId: existing.eventId,
        eventTitle: existing.event.title,
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Featured event updated: ${id}`);

    return updated;
  }

  /**
   * Delete featured event (soft delete)
   */
  static async deleteFeaturedEvent(
    id: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify user can delete featured events (only admins)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only admins can delete featured events');
    }

    // Get existing featured event
    const existing = await prisma.featuredEvent.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Featured event not found');
    }

    // Soft delete
    await prisma.featuredEvent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.FEATURED_EVENT_DELETED,
      entity: 'FeaturedEvent',
      entityId: id,
      metadata: {
        eventId: existing.eventId,
        eventTitle: existing.event.title,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Featured event deleted: ${id}`);

    return { success: true };
  }
}

