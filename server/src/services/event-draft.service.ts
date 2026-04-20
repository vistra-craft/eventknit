import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { Prisma } from '@prisma/client';

export class EventDraftService {
  /**
   * Create a new event draft
   */
  static async createDraft(organizerId: string, data: {
    draftData: Prisma.InputJsonValue;
    collaborators?: string[];
  }) {
    try {
      const draft = await prisma.eventDraft.create({
        data: {
          organizerId,
          draftData: data.draftData,
          collaborators: data.collaborators ? { users: data.collaborators } : undefined,
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

      return draft;
    } catch (error) {
      logger.error('Error creating draft:', error);
      throw error;
    }
  }

  /**
   * Get organizer's drafts
   */
  static async getOrganizerDrafts(organizerId: string, filters?: {
    page?: number;
    limit?: number;
  }) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const [drafts, total] = await Promise.all([
        prisma.eventDraft.findMany({
          where: {
            organizerId,
            deletedAt: null,
          },
          include: {
            organizer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.eventDraft.count({
          where: {
            organizerId,
            deletedAt: null,
          },
        }),
      ]);

      return {
        drafts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting drafts:', error);
      throw error;
    }
  }

  /**
   * Get draft by ID
   */
  static async getDraftById(draftId: string, organizerId: string) {
    try {
      const draft = await prisma.eventDraft.findFirst({
        where: {
          id: draftId,
          organizerId,
          deletedAt: null,
        },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          parent: {
            select: {
              id: true,
              version: true,
              createdAt: true,
            },
          },
          versions: {
            select: {
              id: true,
              version: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { version: 'desc' },
          },
        },
      });

      if (!draft) {
        throw new NotFoundError('Draft not found');
      }

      return draft;
    } catch (error) {
      logger.error('Error getting draft:', error);
      throw error;
    }
  }

  /**
   * Update draft
   */
  static async updateDraft(draftId: string, organizerId: string, data: {
    draftData?: Prisma.JsonValue;
    collaborators?: string[];
  }) {
    try {
      const draft = await prisma.eventDraft.findFirst({
        where: {
          id: draftId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!draft) {
        throw new NotFoundError('Draft not found');
      }

      const updated = await prisma.eventDraft.update({
        where: { id: draftId },
        data: {
          ...(data.draftData && { draftData: data.draftData }),
          ...(data.collaborators && { collaborators: { users: data.collaborators } }),
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error updating draft:', error);
      throw error;
    }
  }

  /**
   * Create draft version
   */
  static async createDraftVersion(draftId: string, organizerId: string, data: {
    draftData?: Prisma.JsonValue;
  }) {
    try {
      const parent = await prisma.eventDraft.findFirst({
        where: {
          id: draftId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new NotFoundError('Draft not found');
      }

      // Get latest version number
      const latestVersion = await prisma.eventDraft.findFirst({
        where: {
          parentId: draftId,
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const newVersion = (latestVersion?.version || parent.version) + 1;

      const version = await prisma.eventDraft.create({
        data: {
          organizerId,
          parentId: draftId,
          draftData: (data.draftData || parent.draftData) as unknown as Prisma.InputJsonValue,
          version: newVersion,
          collaborators: parent.collaborators ?? Prisma.JsonNull,
        },
      });

      return version;
    } catch (error) {
      logger.error('Error creating draft version:', error);
      throw error;
    }
  }

  /**
   * Schedule draft for publication
   */
  static async scheduleDraft(draftId: string, organizerId: string, scheduledPublishAt: Date) {
    try {
      const draft = await prisma.eventDraft.findFirst({
        where: {
          id: draftId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!draft) {
        throw new NotFoundError('Draft not found');
      }

      if (scheduledPublishAt <= new Date()) {
        throw new ValidationError('Scheduled publish date must be in the future');
      }

      const updated = await prisma.eventDraft.update({
        where: { id: draftId },
        data: {
          scheduledPublishAt,
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error scheduling draft:', error);
      throw error;
    }
  }

  /**
   * Publish draft (create event from draft)
   */
  static async publishDraft(draftId: string, organizerId: string) {
    try {
      const draft = await prisma.eventDraft.findFirst({
        where: {
          id: draftId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!draft) {
        throw new NotFoundError('Draft not found');
      }

      // Mark draft as published
      await prisma.eventDraft.update({
        where: { id: draftId },
        data: {
          publishedAt: new Date(),
        },
      });

      // Return draft data for event creation
      return {
        draftData: draft.draftData,
        draftId: draft.id,
      };
    } catch (error) {
      logger.error('Error publishing draft:', error);
      throw error;
    }
  }

  /**
   * Delete draft
   */
  static async deleteDraft(draftId: string, organizerId: string) {
    try {
      const draft = await prisma.eventDraft.findFirst({
        where: {
          id: draftId,
          organizerId,
          deletedAt: null,
        },
      });

      if (!draft) {
        throw new NotFoundError('Draft not found');
      }

      // Soft delete
      await prisma.eventDraft.update({
        where: { id: draftId },
        data: {
          deletedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting draft:', error);
      throw error;
    }
  }
}
