import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '../utils/errors';
import { createAuditLog, AuditActions } from '../utils/audit';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'qrcode' | 'barcode' | 'line' | 'rectangle';
  x: number;
  y: number;
  xPercent?: number;
  yPercent?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  text?: string;
  content?: string; // For dynamic content like {attendeeName}, {eventTitle}
  field?: string; // Field name for dynamic content
  rotation?: number;
  align?: 'left' | 'center' | 'right';
  zIndex?: number;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  backgroundUrl?: string;
  width?: number;
  height?: number;
  unit?: 'px' | 'mm' | 'in';
  elements?: TemplateElement[];
  isDefault?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  backgroundUrl?: string;
  width?: number;
  height?: number;
  unit?: 'px' | 'mm' | 'in';
  elements?: TemplateElement[];
  isDefault?: boolean;
}

export class TemplateService {
  /**
   * Create a new ticket template for an event
   */
  static async createTemplate(
    eventId: string,
    data: CreateTemplateData,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify user can create templates
    if (userRole !== UserRole.ORGANIZER &&
        userRole !== UserRole.SUPERADMIN &&
        userRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers and admins can create templates');
    }

    // Get event and verify ownership
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify organizer owns the event (unless admin)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== userId) {
        throw new AuthorizationError('You do not have permission to create templates for this event');
      }
    }

    // Validate template data
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Template name is required');
    }

    if (data.width && data.width < 1) {
      throw new ValidationError('Template width must be at least 1');
    }

    if (data.height && data.height < 1) {
      throw new ValidationError('Template height must be at least 1');
    }

    // If setting as default, unset other defaults for this event
    if (data.isDefault) {
      await prisma.ticketTemplate.updateMany({
        where: {
          eventId,
          isDefault: true,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create template
    const template = await prisma.ticketTemplate.create({
      data: {
        eventId,
        name: data.name.trim(),
        description: data.description?.trim(),
        backgroundUrl: data.backgroundUrl?.trim(),
        width: data.width || null,
        height: data.height || null,
        unit: data.unit || 'px',
        elements: data.elements ? (data.elements as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        isDefault: data.isDefault || false,
        createdBy: userId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.TEMPLATE_CREATED,
      entity: 'TicketTemplate',
      entityId: template.id,
      metadata: {
        eventId,
        eventTitle: event.title,
        templateName: data.name,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Template created: ${template.id} for event: ${eventId} by user: ${userId}`);

    return template;
  }

  /**
   * Get all templates for an event
   */
  static async getEventTemplates(
    eventId: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Verify user can view templates
    if (userRole !== UserRole.ORGANIZER &&
        userRole !== UserRole.SUPERADMIN &&
        userRole !== UserRole.ADMIN_STAFF) {
      throw new AuthorizationError('Only organizers and admins can view templates');
    }

    // Get event and verify ownership
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
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      if (event.organizerId !== userId) {
        throw new AuthorizationError('You do not have permission to view templates for this event');
      }
    }

    // Get templates
    const templates = await prisma.ticketTemplate.findMany({
      where: {
        eventId,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return templates;
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(
    templateId: string,
    userId: string,
    userRole: UserRole,
  ) {
    // Get template
    const template = await prisma.ticketTemplate.findFirst({
      where: {
        id: templateId,
        deletedAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Verify organizer owns the event (unless admin)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      if (template.event.organizerId !== userId) {
        throw new AuthorizationError('You do not have permission to view this template');
      }
    }

    return template;
  }

  /**
   * Get default template for an event
   */
  static async getDefaultTemplate(eventId: string) {
    const template = await prisma.ticketTemplate.findFirst({
      where: {
        eventId,
        isDefault: true,
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

    return template;
  }

  /**
   * Update template
   */
  static async updateTemplate(
    templateId: string,
    data: UpdateTemplateData,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get template
    const template = await prisma.ticketTemplate.findFirst({
      where: { id: templateId },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Verify organizer owns the event (unless admin)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      if (template.event.organizerId !== userId) {
        throw new AuthorizationError('You do not have permission to update this template');
      }
    }

    // Validate data
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Template name cannot be empty');
    }

    if (data.width !== undefined && data.width < 1) {
      throw new ValidationError('Template width must be at least 1');
    }

    if (data.height !== undefined && data.height < 1) {
      throw new ValidationError('Template height must be at least 1');
    }

    // If setting as default, unset other defaults for this event
    if (data.isDefault === true) {
      await prisma.ticketTemplate.updateMany({
        where: {
          eventId: template.eventId,
          id: { not: templateId },
          isDefault: true,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update template
    const updateData: Prisma.TicketTemplateUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.backgroundUrl !== undefined) updateData.backgroundUrl = data.backgroundUrl?.trim() || null;
    if (data.width !== undefined) updateData.width = data.width || null;
    if (data.height !== undefined) updateData.height = data.height || null;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.elements !== undefined) {
      updateData.elements = data.elements ? (data.elements as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const updatedTemplate = await prisma.ticketTemplate.update({
      where: { id: templateId },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.TEMPLATE_UPDATED,
      entity: 'TicketTemplate',
      entityId: templateId,
      metadata: {
        eventId: template.eventId,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Template updated: ${templateId} by user: ${userId}`);

    return updatedTemplate;
  }

  /**
   * Delete template (soft delete)
   */
  static async deleteTemplate(
    templateId: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get template
    const template = await prisma.ticketTemplate.findFirst({
      where: { id: templateId },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Verify organizer owns the event (unless admin)
    if (userRole !== UserRole.SUPERADMIN && userRole !== UserRole.ADMIN_STAFF) {
      if (template.event.organizerId !== userId) {
        throw new AuthorizationError('You do not have permission to delete this template');
      }
    }

    // Soft delete
    await prisma.ticketTemplate.update({
      where: { id: templateId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: AuditActions.TEMPLATE_DELETED,
      entity: 'TicketTemplate',
      entityId: templateId,
      metadata: {
        eventId: template.eventId,
        templateName: template.name,
      },
      ipAddress,
      userAgent,
    });

    logger.info(`Template deleted: ${templateId} by user: ${userId}`);
  }

  /**
   * Duplicate template
   */
  static async duplicateTemplate(
    templateId: string,
    newName: string,
    userId: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get original template
    const originalTemplate = await this.getTemplateById(templateId, userId, userRole);

    // Create new template with same data
    const newTemplate = await this.createTemplate(
      originalTemplate.eventId,
      {
        name: newName,
        description: originalTemplate.description || undefined,
        backgroundUrl: originalTemplate.backgroundUrl || undefined,
        width: originalTemplate.width || undefined,
        height: originalTemplate.height || undefined,
        unit: (originalTemplate.unit as 'px' | 'mm' | 'in') || undefined,
        elements: originalTemplate.elements ? (originalTemplate.elements as unknown as TemplateElement[]) : undefined,
        isDefault: false, // Don't duplicate default status
      },
      userId,
      userRole,
      ipAddress,
      userAgent,
    );

    return newTemplate;
  }
}

