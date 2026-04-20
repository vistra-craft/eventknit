import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const prisma = new PrismaClient();

export class SavedSearchService {
  /**
   * Create saved search
   */
  static async createSavedSearch(
    userId: string,
    data: {
      name: string;
      searchQuery: string;
      filters?: Record<string, unknown>;
      notifyOnNewEvents?: boolean;
      notificationFrequency?: string;
    },
  ) {
    try {
      const savedSearch = await prisma.savedSearch.create({
        data: {
          userId,
          name: data.name,
          searchQuery: data.searchQuery,
          filters: data.filters as unknown as Prisma.InputJsonValue,
          notifyOnNewEvents: data.notifyOnNewEvents || false,
          notificationFrequency: data.notificationFrequency || 'DAILY',
        },
      });

      return savedSearch;
    } catch (error) {
      logger.error('Error creating saved search:', error);
      throw error;
    }
  }

  /**
   * Get user's saved searches
   */
  static async getUserSavedSearches(userId: string) {
    try {
      const searches = await prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return searches;
    } catch (error) {
      logger.error('Error getting saved searches:', error);
      throw error;
    }
  }

  /**
   * Update saved search
   */
  static async updateSavedSearch(
    searchId: string,
    userId: string,
    data: {
      name?: string;
      searchQuery?: string;
      filters?: Record<string, unknown>;
      notifyOnNewEvents?: boolean;
      notificationFrequency?: string;
    },
  ) {
    try {
      const search = await prisma.savedSearch.findUnique({
        where: { id: searchId },
      });

      if (!search) {
        throw new ValidationError('Saved search not found');
      }

      if (search.userId !== userId) {
        throw new ValidationError('You can only update your own saved searches');
      }

      const updated = await prisma.savedSearch.update({
        where: { id: searchId },
        data: {
          lastSearchedAt: new Date(),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.searchQuery !== undefined && { searchQuery: data.searchQuery }),
          ...(data.filters !== undefined && { filters: data.filters as unknown as Prisma.InputJsonValue }),
          ...(data.notifyOnNewEvents !== undefined && { notifyOnNewEvents: data.notifyOnNewEvents }),
          ...(data.notificationFrequency !== undefined && { notificationFrequency: data.notificationFrequency }),
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error updating saved search:', error);
      throw error;
    }
  }

  /**
   * Delete saved search
   */
  static async deleteSavedSearch(searchId: string, userId: string) {
    try {
      const search = await prisma.savedSearch.findUnique({
        where: { id: searchId },
      });

      if (!search) {
        throw new ValidationError('Saved search not found');
      }

      if (search.userId !== userId) {
        throw new ValidationError('You can only delete your own saved searches');
      }

      await prisma.savedSearch.delete({
        where: { id: searchId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting saved search:', error);
      throw error;
    }
  }

  /**
   * Execute saved search
   */
  static async executeSavedSearch(searchId: string, userId: string) {
    try {
      const search = await prisma.savedSearch.findUnique({
        where: { id: searchId },
      });

      if (!search) {
        throw new ValidationError('Saved search not found');
      }

      if (search.userId !== userId) {
        throw new ValidationError('You can only execute your own saved searches');
      }

      // Update last searched
      await prisma.savedSearch.update({
        where: { id: searchId },
        data: {
          lastSearchedAt: new Date(),
          resultCount: {
            increment: 1,
          },
        },
      });

      // Parse and return search query/filters for frontend to use
      return {
        searchQuery: search.searchQuery,
        filters: search.filters,
      };
    } catch (error) {
      logger.error('Error executing saved search:', error);
      throw error;
    }
  }
}
