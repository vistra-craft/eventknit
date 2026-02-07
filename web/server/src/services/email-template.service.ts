import { prisma } from '../config/database.js';
import { UserRole, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateEmailTemplateData {
  name: string;
  subject?: string;
  htmlContent: string;
  textContent?: string;
  description?: string;
  category?: string; // campaign, announcement, notification, system
  variables?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateEmailTemplateData {
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  description?: string;
  category?: string;
  variables?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface TemplateFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class EmailTemplateService {
  /**
   * Create a new email template
   */
  static async createTemplate(
    data: CreateEmailTemplateData,
    createdBy: string,
    userRole: UserRole,
  ) {
    try {
      // Only admins and staff can create templates
      if (
        userRole !== UserRole.SUPERADMIN &&
        userRole !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can create email templates');
      }

      // Validate required fields
      if (!data.name || !data.htmlContent) {
        throw new ValidationError('Name and HTML content are required');
      }

      // If setting as default, unset other defaults in the same category
      if (data.isDefault) {
        await prisma.emailTemplate.updateMany({
          where: {
            category: data.category || null,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const template = await prisma.emailTemplate.create({
        data: {
          name: data.name,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          description: data.description,
          category: data.category,
          variables: data.variables
            ? (data.variables as Prisma.InputJsonValue)
            : undefined,
          isActive: data.isActive ?? true,
          isDefault: data.isDefault ?? false,
          createdBy,
        },
      });

      logger.info(`Email template created: ${template.id} by user ${createdBy}`);
      return template;
    } catch (error) {
      logger.error('Failed to create email template:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(templateId: string) {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
        include: {
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

      if (!template) {
        throw new NotFoundError('Email template not found');
      }

      return template;
    } catch (error) {
      logger.error(`Failed to get template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get all templates with filters
   */
  static async getTemplates(filters?: TemplateFilters) {
    try {
      const where: Prisma.EmailTemplateWhereInput = {};

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.emailTemplate.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: filters?.limit ?? 50,
          skip: filters?.offset ?? 0,
        }),
        prisma.emailTemplate.count({ where }),
      ]);

      return {
        templates,
        pagination: {
          total,
          limit: filters?.limit ?? 50,
          offset: filters?.offset ?? 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get templates:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(
    templateId: string,
    data: UpdateEmailTemplateData,
    userId: string,
    userRole: UserRole,
  ) {
    try {
      // Only admins can update templates
      if (
        userRole !== UserRole.SUPERADMIN &&
        userRole !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can update email templates');
      }

      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundError('Email template not found');
      }

      // If setting as default, unset other defaults in the same category
      if (data.isDefault) {
        await prisma.emailTemplate.updateMany({
          where: {
            id: { not: templateId },
            category: data.category ?? template.category ?? null,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const updated = await prisma.emailTemplate.update({
        where: { id: templateId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.subject !== undefined && { subject: data.subject }),
          ...(data.htmlContent && { htmlContent: data.htmlContent }),
          ...(data.textContent !== undefined && { textContent: data.textContent }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.variables !== undefined && {
            variables: data.variables as Prisma.InputJsonValue,
          }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });

      logger.info(`Email template updated: ${templateId} by user ${userId}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(
    templateId: string,
    userId: string,
    userRole: UserRole,
  ) {
    try {
      // Only admins can delete templates
      if (
        userRole !== UserRole.SUPERADMIN &&
        userRole !== UserRole.ADMIN_STAFF
      ) {
        throw new AuthorizationError('Only admins can delete email templates');
      }

      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundError('Email template not found');
      }

      // Check if template is in use
      const usageCount = await prisma.bulkMessage.count({
        where: { templateId },
      });

      if (usageCount > 0) {
        throw new ValidationError(
          `Cannot delete template: it is used by ${usageCount} bulk message(s)`,
        );
      }

      await prisma.emailTemplate.delete({
        where: { id: templateId },
      });

      logger.info(`Email template deleted: ${templateId} by user ${userId}`);
    } catch (error) {
      logger.error(`Failed to delete template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  static renderTemplate(
    htmlContent: string,
    subject?: string,
    variables?: Record<string, string | number | boolean>,
  ): { html: string; subject: string; text?: string } {
    let renderedHtml = htmlContent;
    let renderedSubject = subject || '';

    if (variables) {
      // Replace variables in format {variableName}
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        renderedHtml = renderedHtml.replace(regex, String(value));
        renderedSubject = renderedSubject.replace(regex, String(value));
      });
    }

    // Extract plain text from HTML (simple version)
    const textContent = renderedHtml
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    return {
      html: renderedHtml,
      subject: renderedSubject,
      text: textContent,
    };
  }

  /**
   * Get default template for category
   */
  static async getDefaultTemplate(category?: string) {
    try {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          isDefault: true,
          isActive: true,
          ...(category ? { category } : {}),
        },
      });

      return template;
    } catch (error) {
      logger.error('Failed to get default template:', error);
      return null;
    }
  }

  /**
   * Increment usage count
   */
  static async incrementUsage(templateId: string) {
    try {
      await prisma.emailTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logger.error(`Failed to increment usage for template ${templateId}:`, error);
      // Don't throw - this is not critical
    }
  }
}




