/**
 * Social Media Post Templates Service
 * 
 * Manages reusable post templates for social media
 */

import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { NotFoundError } from '../../utils/errors';

export interface CreatePostTemplateData {
  name: string;
  description?: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  content: string;
  variables?: string[]; // e.g., ['eventTitle', 'eventDate', 'eventUrl']
  mediaPlaceholders?: string[]; // e.g., ['eventImage', 'logo']
  isPublic?: boolean;
}

export class PostTemplatesService {
  /**
   * Create a post template
   */
  static async createTemplate(organizerId: string, data: CreatePostTemplateData) {
    try {
      const template = await prisma.socialMediaPostTemplate.create({
        data: {
          organizerId,
          name: data.name,
          description: data.description,
          platform: data.platform,
          content: data.content,
          variables: data.variables || [],
          mediaPlaceholders: data.mediaPlaceholders || [],
          isPublic: data.isPublic || false,
        },
      });

      logger.info(`Created post template: ${template.id} for organizer ${organizerId}`);
      return template;
    } catch (error) {
      logger.error('Error creating post template:', error);
      throw error;
    }
  }

  /**
   * Get organizer's templates
   */
  static async getTemplates(organizerId: string, filters?: {
    platform?: string;
    isPublic?: boolean;
  }) {
    try {
      const where: any = {
        organizerId,
      };

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      if (filters?.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }

      const templates = await prisma.socialMediaPostTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return templates;
    } catch (error) {
      logger.error('Error getting post templates:', error);
      throw error;
    }
  }

  /**
   * Get public templates
   */
  static async getPublicTemplates(filters?: {
    platform?: string;
  }) {
    try {
      const where: any = {
        isPublic: true,
      };

      if (filters?.platform) {
        where.platform = filters.platform;
      }

      const templates = await prisma.socialMediaPostTemplate.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              organizationName: true,
            },
          },
        },
        orderBy: { usageCount: 'desc' },
      });

      return templates;
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
      const where: any = { id: templateId };
      
      if (organizerId) {
        where.organizerId = organizerId;
      } else {
        // If no organizerId, only return public templates
        where.isPublic = true;
      }

      const template = await prisma.socialMediaPostTemplate.findFirst({
        where,
      });

      if (!template) {
        throw new NotFoundError('Post template not found');
      }

      return template;
    } catch (error) {
      logger.error('Error getting template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  static renderTemplate(
    templateContent: string,
    variables: Record<string, string>,
  ): string {
    let rendered = templateContent;

    // Replace variables in format {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    return rendered;
  }

  /**
   * Use template to create a post
   */
  static async useTemplate(
    templateId: string,
    organizerId: string,
    variables: Record<string, string>,
  ) {
    try {
      const template = await this.getTemplateById(templateId, organizerId);
      
      const renderedContent = this.renderTemplate(template.content, variables);

      // Increment usage count
      await prisma.socialMediaPostTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      return {
        content: renderedContent,
        platform: template.platform,
        mediaPlaceholders: template.mediaPlaceholders,
      };
    } catch (error) {
      logger.error('Error using template:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(
    templateId: string,
    organizerId: string,
    data: Partial<CreatePostTemplateData>,
  ) {
    try {
      await this.getTemplateById(templateId, organizerId);

      const updated = await prisma.socialMediaPostTemplate.update({
        where: { id: templateId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.content && { content: data.content }),
          ...(data.variables && { variables: data.variables }),
          ...(data.mediaPlaceholders && { mediaPlaceholders: data.mediaPlaceholders }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        },
      });

      logger.info(`Updated post template: ${templateId}`);
      return updated;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(templateId: string, organizerId: string) {
    try {
      await this.getTemplateById(templateId, organizerId);

      await prisma.socialMediaPostTemplate.delete({
        where: { id: templateId },
      });

      logger.info(`Deleted post template: ${templateId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }
}
