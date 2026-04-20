import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';
import crypto from 'crypto';

export class EventTemplateService {
  /**
   * Create a new event template
   */
  static async createTemplate(organizerId: string, data: {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    templateData: Prisma.InputJsonValue;
    isPublic?: boolean;
    thumbnail?: string;
  }) {
    try {
      const template = await prisma.eventTemplate.create({
        data: {
          organizerId,
          name: data.name,
          description: data.description,
          category: data.category,
          tags: data.tags || [],
          templateData: data.templateData,
          isPublic: data.isPublic || false,
          thumbnail: data.thumbnail,
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

      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get organizer's templates
   */
  static async getOrganizerTemplates(organizerId: string, filters?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: {
        organizerId: string;
        deletedAt: null;
        category?: string;
        OR?: Array<{
          name?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
        }>;
      } = {
        organizerId,
        deletedAt: null,
      };

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.eventTemplate.findMany({
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
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventTemplate.count({ where }),
      ]);

      return {
        templates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Get public templates
   */
  static async getPublicTemplates(filters?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const where: {
        isPublic: boolean;
        deletedAt: null;
        category?: string;
        OR?: Array<{
          name?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
        }>;
      } = {
        isPublic: true,
        deletedAt: null,
      };

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.eventTemplate.findMany({
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
          },
          orderBy: { usageCount: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventTemplate.count({ where }),
      ]);

      return {
        templates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting public templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(templateId: string, organizerId?: string) {
    try {
      const template = await prisma.eventTemplate.findFirst({
        where: {
          id: templateId,
          deletedAt: null,
          OR: [
            { organizerId },
            { isPublic: true },
          ],
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
          parent: {
            select: {
              id: true,
              name: true,
              version: true,
            },
          },
          versions: {
            select: {
              id: true,
              name: true,
              version: true,
              createdAt: true,
            },
            orderBy: { version: 'desc' },
          },
        },
      });

      if (!template) {
        throw new NotFoundError('Template not found');
      }

      return template;
    } catch (error) {
      logger.error('Error getting template:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(templateId: string, organizerId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    templateData?: Prisma.JsonValue;
    isPublic?: boolean;
    thumbnail?: string;
  }) {
    try {
      const template = await prisma.eventTemplate.findFirst({
        where: {
          id: templateId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!template) {
        throw new NotFoundError('Template not found');
      }

      const updated = await prisma.eventTemplate.update({
        where: { id: templateId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.tags && { tags: data.tags }),
          ...(data.templateData && { templateData: data.templateData }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
          ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Create template version
   */
  static async createTemplateVersion(templateId: string, organizerId: string, data: {
    name?: string;
    description?: string;
    templateData?: Prisma.JsonValue;
  }) {
    try {
      const parent = await prisma.eventTemplate.findFirst({
        where: {
          id: templateId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new NotFoundError('Template not found');
      }

      // Get latest version number
      const latestVersion = await prisma.eventTemplate.findFirst({
        where: {
          parentId: templateId,
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const newVersion = (latestVersion?.version || parent.version) + 1;

      const version = await prisma.eventTemplate.create({
        data: {
          organizerId,
          parentId: templateId,
          name: data.name || `${parent.name} (v${newVersion})`,
          description: data.description || parent.description,
          category: parent.category,
          tags: parent.tags,
          templateData: (data.templateData || parent.templateData) as unknown as Prisma.InputJsonValue,
          isPublic: false,
          version: newVersion,
        },
      });

      return version;
    } catch (error) {
      logger.error('Error creating template version:', error);
      throw error;
    }
  }

  /**
   * Share template (generate share token)
   */
  static async shareTemplate(templateId: string, organizerId: string) {
    try {
      const template = await prisma.eventTemplate.findFirst({
        where: {
          id: templateId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!template) {
        throw new NotFoundError('Template not found');
      }

      const shareToken = crypto.randomBytes(32).toString('hex');

      const updated = await prisma.eventTemplate.update({
        where: { id: templateId },
        data: {
          isShared: true,
          shareToken,
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error sharing template:', error);
      throw error;
    }
  }

  /**
   * Use template to create event
   */
  static async useTemplate(templateId: string, organizerId: string) {
    try {
      const template = await prisma.eventTemplate.findFirst({
        where: {
          id: templateId,
          deletedAt: null,
          OR: [
            { organizerId },
            { isPublic: true },
            { isShared: true },
          ],
        },
      });

      if (!template) {
        throw new NotFoundError('Template not found');
      }

      // Increment usage count
      await prisma.eventTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1,
          },
          lastUsedAt: new Date(),
        },
      });

      return {
        templateData: template.templateData,
        templateName: template.name,
      };
    } catch (error) {
      logger.error('Error using template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(templateId: string, organizerId: string) {
    try {
      const template = await prisma.eventTemplate.findFirst({
        where: {
          id: templateId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!template) {
        throw new NotFoundError('Template not found');
      }

      // Soft delete
      await prisma.eventTemplate.update({
        where: { id: templateId },
        data: {
          deletedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Duplicate event as template
   */
  static async createTemplateFromEvent(eventId: string, organizerId: string, data: {
    name: string;
    description?: string;
  }) {
    try {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Extract template data from event
      const templateData = {
        title: event.title,
        description: event.description,
        fullDescription: event.fullDescription,
        organizerDescription: event.organizerDescription,
        category: event.category,
        tags: event.tags,
        venue: event.venue,
        location: event.location,
        address: event.address,
        isOnline: event.isOnline,
        onlineLink: event.onlineLink,
        coordinates: event.coordinates,
        isFree: event.isFree,
        price: event.price,
        ticketTypes: event.ticketTypes,
        capacity: event.capacity,
        requirements: event.requirements,
        ageRestriction: event.ageRestriction,
        duration: event.duration,
        speakers: event.speakers,
        sponsors: event.sponsors,
        faqs: event.faqs,
        registrationFields: event.registrationFields,
      };

      const template = await prisma.eventTemplate.create({
        data: {
          organizerId,
          name: data.name,
          description: data.description,
          category: event.category,
          tags: event.tags,
          templateData,
          thumbnail: event.image,
        },
      });

      return template;
    } catch (error) {
      logger.error('Error creating template from event:', error);
      throw error;
    }
  }
}
