import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class InvoiceTemplateService {
  /**
   * Create invoice template
   */
  static async createTemplate(data: {
    name: string;
    description?: string;
    type?: string;
    htmlContent: string;
    cssContent?: string;
    variables?: Record<string, unknown>;
    isDefault?: boolean;
    createdBy?: string;
  }) {
    try {
      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.invoiceTemplate.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const template = await prisma.invoiceTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type || 'STANDARD',
          htmlContent: data.htmlContent,
          cssContent: data.cssContent,
          variables: (data.variables || {}) as any,
          isDefault: data.isDefault || false,
          isActive: true,
          createdBy: data.createdBy,
        },
      });

      logger.info(`Invoice template created: ${template.id}`);
      return template;
    } catch (error: any) {
      logger.error('Error creating invoice template:', error);
      throw new ValidationError(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Get all templates
   */
  static async getTemplates(filters?: {
    type?: string;
    isActive?: boolean;
    includeInactive?: boolean;
  }) {
    try {
      const where: any = {};

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      } else if (!filters?.includeInactive) {
        where.isActive = true;
      }

      const templates = await prisma.invoiceTemplate.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return templates;
    } catch (error: any) {
      logger.error('Error fetching templates:', error);
      throw new ValidationError(`Failed to fetch templates: ${error.message}`);
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(templateId: string) {
    try {
      const template = await prisma.invoiceTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundError('Invoice template not found');
      }

      return template;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching template:', error);
      throw new ValidationError(`Failed to fetch template: ${error.message}`);
    }
  }

  /**
   * Get default template
   */
  static async getDefaultTemplate() {
    try {
      const template = await prisma.invoiceTemplate.findFirst({
        where: { isDefault: true, isActive: true },
      });

      if (!template) {
        throw new NotFoundError('No default invoice template found');
      }

      return template;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching default template:', error);
      throw new ValidationError(`Failed to fetch default template: ${error.message}`);
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(
    templateId: string,
    data: {
      name?: string;
      description?: string;
      type?: string;
      htmlContent?: string;
      cssContent?: string;
      variables?: Record<string, unknown>;
      isDefault?: boolean;
      isActive?: boolean;
    },
  ) {
    try {
      const template = await prisma.invoiceTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundError('Invoice template not found');
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.invoiceTemplate.updateMany({
          where: {
            isDefault: true,
            id: { not: templateId },
          },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.invoiceTemplate.update({
        where: { id: templateId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.type && { type: data.type }),
          ...(data.htmlContent && { htmlContent: data.htmlContent }),
          ...(data.cssContent !== undefined && { cssContent: data.cssContent }),
          ...(data.variables && { variables: data.variables as any }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      logger.info(`Invoice template updated: ${templateId}`);
      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating template:', error);
      throw new ValidationError(`Failed to update template: ${error.message}`);
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(templateId: string) {
    try {
      const template = await prisma.invoiceTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundError('Invoice template not found');
      }

      if (template.isDefault) {
        throw new ValidationError('Cannot delete default template. Set another template as default first.');
      }

      await prisma.invoiceTemplate.delete({
        where: { id: templateId },
      });

      logger.info(`Invoice template deleted: ${templateId}`);
      return { success: true };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error deleting template:', error);
      throw new ValidationError(`Failed to delete template: ${error.message}`);
    }
  }
}
