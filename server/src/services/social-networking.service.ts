import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

const prisma = new PrismaClient();

export class SocialNetworkingService {
  /**
   * Follow a user
   */
  static async followUser(followerId: string, followingId: string) {
    try {
      if (followerId === followingId) {
        throw new ValidationError('You cannot follow yourself');
      }

      // Check if already following
      const existing = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existing) {
        throw new ValidationError('You are already following this user');
      }

      const follow = await prisma.userFollow.create({
        data: {
          followerId,
          followingId,
        },
        include: {
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organizationName: true,
            },
          },
        },
      });

      return follow;
    } catch (error) {
      logger.error('Error following user:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(followerId: string, followingId: string) {
    try {
      await prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error unfollowing user:', error);
      throw error;
    }
  }

  /**
   * Get user's followers
   */
  static async getFollowers(
    userId: string,
    filters?: {
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const [follows, total] = await Promise.all([
        prisma.userFollow.findMany({
          where: { followingId: userId },
          include: {
            follower: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                organizationName: true,
              },
            },
          },
          orderBy: { followedAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.userFollow.count({ where: { followingId: userId } }),
      ]);

      return {
        followers: follows.map((f) => f.follower),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting followers:', error);
      throw error;
    }
  }

  /**
   * Get users that a user is following
   */
  static async getFollowing(
    userId: string,
    filters?: {
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const [follows, total] = await Promise.all([
        prisma.userFollow.findMany({
          where: { followerId: userId },
          include: {
            following: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                organizationName: true,
              },
            },
          },
          orderBy: { followedAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.userFollow.count({ where: { followerId: userId } }),
      ]);

      return {
        following: follows.map((f) => f.following),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error('Error getting following:', error);
      throw error;
    }
  }

  /**
   * Check if user is following another user
   */
  static async isFollowing(followerId: string, followingId: string) {
    try {
      const follow = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return { isFollowing: !!follow };
    } catch (error) {
      logger.error('Error checking follow status:', error);
      throw error;
    }
  }

  /**
   * Get user profile with social stats
   */
  static async getUserProfile(userId: string, viewerId?: string) {
    try {
      const [user, followersCount, followingCount, isFollowing] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
            companyAffiliation: true,
            createdAt: true,
            preferences: {
              select: {
                profileVisibility: true,
                showEmail: true,
                showPhone: true,
              },
            },
            _count: {
              select: {
                eventRegistrations: true,
                eventsCreated: true,
              },
            },
          },
        }),
        prisma.userFollow.count({ where: { followingId: userId } }),
        prisma.userFollow.count({ where: { followerId: userId } }),
        viewerId
          ? prisma.userFollow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: viewerId,
                  followingId: userId,
                },
              },
            })
          : null,
      ]);

      if (!user) {
        throw new ValidationError('User not found');
      }

      // Check profile visibility
      if (
        user.preferences?.profileVisibility === 'private' &&
        viewerId !== userId &&
        !isFollowing
      ) {
        throw new ValidationError('This profile is private');
      }

      return {
        ...user,
        followersCount,
        followingCount,
        isFollowing: !!isFollowing,
        canView: true,
      };
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }
}
