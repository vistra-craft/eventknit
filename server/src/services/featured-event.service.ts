import { prisma } from '../config/database.js';
import { UserRole, FeaturedItemType, EventStatus } from '@prisma/client';
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} from '../utils/errors.js';
import { createAuditLog, AuditActions } from '../utils/audit.js';
import { logger } from '../utils/logger.js';

export interface CreateFeaturedEventData {
  type: FeaturedItemType;
  // For EVENT type
  eventId?: string;
  customTitle?: string;
  customImage?: string;
  customCategory?: string;
  // For IMAGE type
  imageUrl?: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
  // Common fields
  displayStartDate?: Date;
  displayEndDate?: Date;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateFeaturedEventData {
  // For EVENT type
  customTitle?: string;
  customImage?: string;
  customCategory?: string;
  // For IMAGE type
  imageUrl?: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
  // Common fields
  displayStartDate?: Date;
  displayEndDate?: Date;
  displayOrder?: number;
  isActive?: boolean;
}

export class FeaturedEventService {
  /**
 * Create a new featured item (event or image)
 */
  static async createFeaturedEvent(
    data: CreateFeaturedEventData,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
  // Verify user can create featured items (only admins)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only admins can create featured items');
    }

    // Validate and set type (handle both string and enum values)
    let type: FeaturedItemType;
    if (data.type) {
      // Convert string to enum if needed
      const typeString = String(data.type).toUpperCase();
      if (typeString === 'EVENT' || typeString === FeaturedItemType.EVENT) {
        type = FeaturedItemType.EVENT;
      } else if (typeString === 'IMAGE' || typeString === FeaturedItemType.IMAGE) {
        type = FeaturedItemType.IMAGE;
      } else {
        throw new ValidationError(`Invalid type: ${data.type}. Must be either 'EVENT' or 'IMAGE'`);
      }
    } else {
      // Default to EVENT if not provided
      type = FeaturedItemType.EVENT;
    }

    // Validate based on type
    if (type === FeaturedItemType.EVENT) {
      if (!data.eventId) {
        throw new ValidationError('eventId is required for EVENT type');
      }

      // Verify event exists and is approved
      const event = await prisma.event.findFirst({
        where: {
          id: data.eventId,
          deletedAt: null,
          status: EventStatus.APPROVED, // Only approved events can be featured
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
    } else if (type === FeaturedItemType.IMAGE) {
    // For IMAGE type, imageUrl is required but will be set by controller after file upload
    // Controller handles file upload and sets imageUrl before calling this service
    // So we only validate if imageUrl is present and not empty
      if (data.imageUrl !== undefined && (!data.imageUrl || data.imageUrl.trim() === '')) {
        throw new ValidationError('imageUrl cannot be empty for IMAGE type');
      }
    }

    // Create featured item
    const featuredEvent = await prisma.featuredEvent.create({
      data: {
        type,
        eventId: type === FeaturedItemType.EVENT ? data.eventId : undefined,
        customTitle: type === FeaturedItemType.EVENT ? data.customTitle : null,
        customImage: type === FeaturedItemType.EVENT ? data.customImage : null,
        customCategory: type === FeaturedItemType.EVENT ? data.customCategory : null,
        imageUrl: type === FeaturedItemType.IMAGE ? data.imageUrl : null,
        title: type === FeaturedItemType.IMAGE ? data.title : null,
        description: type === FeaturedItemType.IMAGE ? data.description : null,
        linkUrl: type === FeaturedItemType.IMAGE ? data.linkUrl : null,
        linkText: type === FeaturedItemType.IMAGE ? data.linkText : null,
        displayStartDate: data.displayStartDate,
        displayEndDate: data.displayEndDate,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
        createdBy: userId,
      },
      include: {
        event: type === FeaturedItemType.EVENT ? {
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
        } : false,
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
        type: data.type,
        eventId: data.eventId || null,
        title: data.type === FeaturedItemType.EVENT ? (featuredEvent.event?.title || null) : data.title,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Featured item created: ${featuredEvent.id} (type: ${data.type})`);

    return featuredEvent;
  }

  /**
   * Get featured item by ID
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
      throw new NotFoundError('Featured item not found');
    }

    return featuredEvent;
  }

  /**
   * Get all active featured items (for public display)
   */
  static async getActiveFeaturedEvents() {
    const now = new Date();

    const featuredEvents = await prisma.featuredEvent.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        AND: [
          {
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
          {
            OR: [
              {
                type: FeaturedItemType.IMAGE,
              },
              {
                type: FeaturedItemType.EVENT,
                event: {
                  status: EventStatus.APPROVED,
                  deletedAt: null,
                },
              },
            ],
          },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            imageFocalX: true,
            imageFocalY: true,
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

    // Transform to unified format for both types
    return featuredEvents.map((fe) => {
      if (fe.type === FeaturedItemType.EVENT && fe.event) {
        // Event-based featured item
        return {
          id: fe.id,
          type: 'EVENT' as const,
          eventId: fe.eventId || '',
          title: fe.customTitle || fe.event.title,
          image: fe.customImage || fe.event.image || '',
          imageFocalX: fe.event.imageFocalX ?? 50,
          imageFocalY: fe.event.imageFocalY ?? 50,
          category: fe.customCategory || fe.event.category || '',
          date: fe.event.startDate,
          time: fe.event.startTime || '',
          venue: fe.event.venue || '',
          location: fe.event.location,
          price: fe.event.isFree ? 'Free' : `From $${fe.event.price?.toString() || '0'}`,
          displayOrder: fe.displayOrder,
          event: fe.event,
        };
      } else {
        // Image-based featured item
        return {
          id: fe.id,
          type: 'IMAGE' as const,
          eventId: null,
          title: fe.title || '',
          image: fe.imageUrl || '',
          imageFocalX: 50,
          imageFocalY: 50,
          category: '',
          date: null,
          time: '',
          venue: '',
          location: '',
          price: '',
          description: fe.description || '',
          linkUrl: fe.linkUrl || null,
          linkText: fe.linkText || null,
          displayOrder: fe.displayOrder,
          event: null,
        };
      }
    });
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
   * Update featured item
   */
  static async updateFeaturedEvent(
    id: string,
    data: UpdateFeaturedEventData,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify user can update featured items (only admins)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only admins can update featured items');
    }

    // Get existing featured item
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
      throw new NotFoundError('Featured item not found');
    }

    // Build update data based on type
    const updateData: {
      displayStartDate?: Date | null;
      displayEndDate?: Date | null;
      displayOrder?: number;
      isActive?: boolean;
      customTitle?: string | null;
      customImage?: string | null;
      customCategory?: string | null;
      imageUrl?: string | null;
      title?: string | null;
      description?: string | null;
      linkUrl?: string | null;
      linkText?: string | null;
    } = {
      displayStartDate: data.displayStartDate,
      displayEndDate: data.displayEndDate,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    };

    if (existing.type === FeaturedItemType.EVENT) {
      // Update event-specific fields
      if (data.customTitle !== undefined) updateData.customTitle = data.customTitle;
      if (data.customImage !== undefined) updateData.customImage = data.customImage;
      if (data.customCategory !== undefined) updateData.customCategory = data.customCategory;
    } else if (existing.type === FeaturedItemType.IMAGE) {
      // Update image-specific fields
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
      if (data.linkText !== undefined) updateData.linkText = data.linkText;
    }

    // Update featured item
    const updated = await prisma.featuredEvent.update({
      where: { id },
      data: updateData,
      include: {
        event: existing.type === FeaturedItemType.EVENT ? {
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
        } : false,
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
        type: existing.type,
        eventId: existing.eventId,
        title: existing.type === FeaturedItemType.EVENT ? (existing.event?.title || null) : existing.title,
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Featured item updated: ${id}`);

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
        type: existing.type,
        eventId: existing.eventId,
        title: existing.type === FeaturedItemType.EVENT ? (existing.event?.title || null) : existing.title,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Featured event deleted: ${id}`);

    return { success: true };
  }
}

