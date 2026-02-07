/**
 * Badge Template Service
 * Handles CRUD operations for badge templates
 */

import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { uploadImageToCloudinary, deleteImageFromCloudinary, extractPublicIdFromUrl } from './cloudinary.service.js';

export interface BadgeElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'shape' | 'logo' | 'barcode';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  rotation?: number;
  opacity?: number;
  isLocked?: boolean;
  isVisible?: boolean;
  zIndex?: number;
}

export interface CreateBadgeTemplateInput {
  name: string;
  description?: string;
  width?: number;
  height?: number;
  sizePreset?: string;
  orientation?: 'portrait' | 'landscape';
  backgroundColor?: string;
  elements?: BadgeElement[];
  isDefault?: boolean;
  organizerId?: string;
  eventId?: string;
}

export interface UpdateBadgeTemplateInput {
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  sizePreset?: string;
  orientation?: 'portrait' | 'landscape';
  backgroundColor?: string;
  backgroundImage?: string;
  elements?: BadgeElement[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface BadgeTemplateFilters {
  organizerId?: string;
  eventId?: string;
  isDefault?: boolean;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class BadgeTemplateService {
  /**
   * Create a new badge template
   */
  static async createTemplate(
    data: CreateBadgeTemplateInput,
    createdBy?: string,
  ) {
    try {
      // If setting as default, unset other defaults
      if (data.isDefault) {
        await this.unsetDefaultTemplates(data.organizerId, data.eventId);
      }

      const template = await prisma.badgeTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          width: data.width ?? 101.6,
          height: data.height ?? 76.2,
          sizePreset: data.sizePreset ?? '4x3',
          orientation: data.orientation ?? 'landscape',
          backgroundColor: data.backgroundColor ?? '#ffffff',
          elements: (data.elements ?? []) as any,
          isDefault: data.isDefault ?? false,
          organizerId: data.organizerId,
          eventId: data.eventId,
          createdBy,
        },
      });

      return template;
    } catch (error) {
      logger.error('Failed to create badge template:', error);
      throw new ValidationError('Failed to create badge template');
    }
  }

  /**
   * Get a badge template by ID
   */
  static async getTemplateById(id: string) {
    const template = await prisma.badgeTemplate.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
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

    if (!template) {
      throw new NotFoundError('Badge template not found');
    }

    return template;
  }

  /**
   * Get badge templates with filters
   */
  static async getTemplates(filters: BadgeTemplateFilters) {
    const {
      organizerId,
      eventId,
      isDefault,
      isActive = true,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.BadgeTemplateWhereInput = {
      isActive,
    };

    // Filter by organizer or get platform-wide templates
    if (organizerId) {
      where.OR = [
        { organizerId },
        { organizerId: null }, // Include platform-wide templates
      ];
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.badgeTemplate.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.badgeTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a badge template
   */
  static async updateTemplate(id: string, data: UpdateBadgeTemplateInput) {
    try {
      // Check if template exists
      const existing = await prisma.badgeTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Badge template not found');
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await this.unsetDefaultTemplates(existing.organizerId ?? undefined, existing.eventId ?? undefined);
      }

      const template = await prisma.badgeTemplate.update({
        where: { id },
        data: {
          ...data,
          elements: data.elements as any,
          updatedAt: new Date(),
        },
      });

      return template;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to update badge template:', error);
      throw new ValidationError('Failed to update badge template');
    }
  }

  /**
   * Delete a badge template (soft delete by setting isActive = false)
   */
  static async deleteTemplate(id: string) {
    try {
      const template = await prisma.badgeTemplate.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      return template;
    } catch (error) {
      logger.error('Failed to delete badge template:', error);
      throw new ValidationError('Failed to delete badge template');
    }
  }

  /**
   * Permanently delete a badge template
   */
  static async permanentlyDeleteTemplate(id: string) {
    try {
      await prisma.badgeTemplate.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to permanently delete badge template:', error);
      throw new ValidationError('Failed to delete badge template');
    }
  }

  /**
   * Duplicate a badge template
   */
  static async duplicateTemplate(id: string, newName?: string, createdBy?: string) {
    try {
      const original = await this.getTemplateById(id);

      const template = await prisma.badgeTemplate.create({
        data: {
          name: newName ?? `${original.name} (Copy)`,
          description: original.description,
          width: original.width,
          height: original.height,
          sizePreset: original.sizePreset,
          orientation: original.orientation,
          backgroundColor: original.backgroundColor,
          elements: original.elements as any,
          isDefault: false,
          organizerId: original.organizerId,
          eventId: original.eventId,
          createdBy,
        },
      });

      return template;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to duplicate badge template:', error);
      throw new ValidationError('Failed to duplicate badge template');
    }
  }

  /**
   * Upload background image for a badge template
   */
  static async uploadBackgroundImage(id: string, imageBuffer: Buffer) {
    try {
      // Check if template exists
      const existing = await prisma.badgeTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Badge template not found');
      }

      // Delete old background image if it exists
      if (existing.backgroundImage) {
        const publicId = extractPublicIdFromUrl(existing.backgroundImage);
        if (publicId) {
          await deleteImageFromCloudinary(publicId);
        }
      }

      // Upload new background image to Cloudinary
      const uploadResult = await uploadImageToCloudinary(
        imageBuffer,
        'eventknit/badge-backgrounds',
        {
          width: 2000, // High resolution for print quality
          height: 2000,
          quality: 90,
          format: 'png', // PNG for transparency support
        },
      );

      // Update template with new background image URL
      const template = await prisma.badgeTemplate.update({
        where: { id },
        data: {
          backgroundImage: uploadResult.secureUrl,
          updatedAt: new Date(),
        },
      });

      return template;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to upload background image:', error);
      throw new ValidationError('Failed to upload background image');
    }
  }

  /**
   * Remove background image from a badge template
   */
  static async removeBackgroundImage(id: string) {
    try {
      // Check if template exists
      const existing = await prisma.badgeTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Badge template not found');
      }

      // Delete background image from Cloudinary if it exists
      if (existing.backgroundImage) {
        const publicId = extractPublicIdFromUrl(existing.backgroundImage);
        if (publicId) {
          await deleteImageFromCloudinary(publicId);
        }
      }

      // Remove background image URL from template
      const template = await prisma.badgeTemplate.update({
        where: { id },
        data: {
          backgroundImage: null,
          updatedAt: new Date(),
        },
      });

      return template;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to remove background image:', error);
      throw new ValidationError('Failed to remove background image');
    }
  }

  /**
   * Set a template as default
   */
  static async setDefaultTemplate(id: string) {
    const template = await this.getTemplateById(id);
    await this.unsetDefaultTemplates(template.organizerId ?? undefined, template.eventId ?? undefined);

    return prisma.badgeTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  /**
   * Unset default templates for a scope
   */
  private static async unsetDefaultTemplates(organizerId?: string, eventId?: string) {
    const where: Prisma.BadgeTemplateWhereInput = {
      isDefault: true,
    };

    if (organizerId) {
      where.organizerId = organizerId;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    await prisma.badgeTemplate.updateMany({
      where,
      data: { isDefault: false },
    });
  }

  /**
   * Get default template for scope
   */
  static async getDefaultTemplate(organizerId?: string, eventId?: string) {
    // First try to get event-specific default
    if (eventId) {
      const eventDefault = await prisma.badgeTemplate.findFirst({
        where: {
          eventId,
          isDefault: true,
          isActive: true,
        },
      });
      if (eventDefault) return eventDefault;
    }

    // Then try organizer default
    if (organizerId) {
      const organizerDefault = await prisma.badgeTemplate.findFirst({
        where: {
          organizerId,
          eventId: null,
          isDefault: true,
          isActive: true,
        },
      });
      if (organizerDefault) return organizerDefault;
    }

    // Fall back to platform default
    const platformDefault = await prisma.badgeTemplate.findFirst({
      where: {
        organizerId: null,
        eventId: null,
        isDefault: true,
        isActive: true,
      },
    });

    return platformDefault;
  }

  /**
   * Create default platform templates if none exist
   */
  static async ensureDefaultTemplates() {
    const existing = await prisma.badgeTemplate.findFirst({
      where: {
        organizerId: null,
        eventId: null,
        isActive: true,
      },
    });

    if (existing) return;

    // Create default templates
    const defaultTemplates: CreateBadgeTemplateInput[] = [
      {
        name: 'Standard Badge',
        description: 'Default 4x3 inch badge template',
        width: 101.6,
        height: 76.2,
        sizePreset: '4x3',
        orientation: 'landscape',
        backgroundColor: '#ffffff',
        isDefault: true,
        elements: [
          {
            id: 'header',
            type: 'shape',
            content: '',
            x: 0,
            y: 0,
            width: 101.6,
            height: 20,
            backgroundColor: '#1a1a2e',
            zIndex: 0,
          },
          {
            id: 'eventTitle',
            type: 'text',
            content: '{{eventTitle}}',
            x: 5,
            y: 5,
            width: 91.6,
            height: 10,
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#ffffff',
            zIndex: 1,
          },
          {
            id: 'fullName',
            type: 'text',
            content: '{{fullName}}',
            x: 5,
            y: 28,
            width: 60,
            height: 15,
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'left',
            color: '#1a1a2e',
            zIndex: 1,
          },
          {
            id: 'company',
            type: 'text',
            content: '{{company}}',
            x: 5,
            y: 45,
            width: 60,
            height: 8,
            fontSize: 11,
            textAlign: 'left',
            color: '#666666',
            zIndex: 1,
          },
          {
            id: 'ticketType',
            type: 'text',
            content: '{{ticketType}}',
            x: 5,
            y: 55,
            width: 25,
            height: 8,
            fontSize: 10,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#ffffff',
            backgroundColor: '#e94560',
            borderRadius: 4,
            zIndex: 1,
          },
          {
            id: 'qrCode',
            type: 'qr',
            content: '{{qrCode}}',
            x: 70,
            y: 25,
            width: 28,
            height: 28,
            zIndex: 1,
          },
        ] as BadgeElement[],
      },
      {
        name: 'VIP Badge',
        description: 'Premium gold badge for VIP attendees',
        width: 101.6,
        height: 76.2,
        sizePreset: '4x3',
        orientation: 'landscape',
        backgroundColor: '#fef9e7',
        elements: [
          {
            id: 'header',
            type: 'shape',
            content: '',
            x: 0,
            y: 0,
            width: 101.6,
            height: 20,
            backgroundColor: '#d4af37',
            zIndex: 0,
          },
          {
            id: 'vipLabel',
            type: 'text',
            content: 'VIP',
            x: 5,
            y: 5,
            width: 20,
            height: 10,
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#1a1a2e',
            zIndex: 1,
          },
          {
            id: 'eventTitle',
            type: 'text',
            content: '{{eventTitle}}',
            x: 25,
            y: 5,
            width: 71.6,
            height: 10,
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#1a1a2e',
            zIndex: 1,
          },
          {
            id: 'fullName',
            type: 'text',
            content: '{{fullName}}',
            x: 5,
            y: 28,
            width: 60,
            height: 15,
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'left',
            color: '#1a1a2e',
            zIndex: 1,
          },
          {
            id: 'company',
            type: 'text',
            content: '{{company}}',
            x: 5,
            y: 45,
            width: 60,
            height: 8,
            fontSize: 11,
            textAlign: 'left',
            color: '#666666',
            zIndex: 1,
          },
          {
            id: 'qrCode',
            type: 'qr',
            content: '{{qrCode}}',
            x: 70,
            y: 25,
            width: 28,
            height: 28,
            zIndex: 1,
          },
        ] as BadgeElement[],
      },
    ];

    for (const templateData of defaultTemplates) {
      await this.createTemplate(templateData, 'system');
    }

    logger.info('Default badge templates created');
  }
}
