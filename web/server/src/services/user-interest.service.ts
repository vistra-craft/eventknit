import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const prisma = new PrismaClient();

export class UserInterestService {
  /**
   * Add or update user interest
   */
  static async upsertInterest(
    userId: string,
    data: {
      category: string;
      subcategory?: string;
      tags?: string[];
      weight?: number;
    },
  ) {
    try {
      const interest = await prisma.userInterest.upsert({
        where: {
          userId_category: {
            userId,
            category: data.category,
          },
        },
        create: {
          userId,
          category: data.category,
          subcategory: data.subcategory,
          tags: data.tags || [],
          weight: data.weight || 1,
        },
        update: {
          subcategory: data.subcategory,
          tags: data.tags,
          weight: data.weight,
        },
      });

      return interest;
    } catch (error) {
      logger.error('Error upserting interest:', error);
      throw error;
    }
  }

  /**
   * Get user interests
   */
  static async getUserInterests(userId: string) {
    try {
      const interests = await prisma.userInterest.findMany({
        where: { userId },
        orderBy: [
          { weight: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return interests;
    } catch (error) {
      logger.error('Error getting user interests:', error);
      throw error;
    }
  }

  /**
   * Remove interest
   */
  static async removeInterest(userId: string, category: string) {
    try {
      await prisma.userInterest.delete({
        where: {
          userId_category: {
            userId,
            category,
          },
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error removing interest:', error);
      throw error;
    }
  }

  /**
   * Update interest weight
   */
  static async updateInterestWeight(
    userId: string,
    category: string,
    weight: number,
  ) {
    try {
      if (weight < 1 || weight > 10) {
        throw new ValidationError('Weight must be between 1 and 10');
      }

      const interest = await prisma.userInterest.update({
        where: {
          userId_category: {
            userId,
            category,
          },
        },
        data: { weight },
      });

      return interest;
    } catch (error) {
      logger.error('Error updating interest weight:', error);
      throw error;
    }
  }
}
