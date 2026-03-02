import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

export class EventUpdatesSubscriptionService {
  /**
   * Subscribe to event updates
   */
  static async subscribeToEvent(
    userId: string,
    eventId: string,
    updateTypes: string[] = ['SCHEDULE', 'VENUE', 'CANCELLATION', 'ANNOUNCEMENT'],
    channels: string[] = ['EMAIL', 'PUSH', 'IN_APP'],
  ) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const subscription = await prisma.eventUpdateSubscription.upsert({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        create: {
          userId,
          eventId,
          updateTypes,
          channels,
          isActive: true,
        },
        update: {
          updateTypes,
          channels,
          isActive: true,
          unsubscribedAt: null,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
            },
          },
        },
      });

      logger.info(`User ${userId} subscribed to event ${eventId}`);
      return subscription;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error subscribing to event:', error);
      throw new ValidationError(`Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unsubscribe from event updates
   */
  static async unsubscribeFromEvent(userId: string, eventId: string) {
    try {
      const subscription = await prisma.eventUpdateSubscription.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      await prisma.eventUpdateSubscription.update({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        data: {
          isActive: false,
          unsubscribedAt: new Date(),
        },
      });

      logger.info(`User ${userId} unsubscribed from event ${eventId}`);
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error unsubscribing:', error);
      throw new ValidationError(`Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's subscriptions
   */
  static async getUserSubscriptions(userId: string, activeOnly: boolean = true) {
    try {
      const where: Prisma.EventUpdateSubscriptionWhereInput = { 
        userId,
        ...(activeOnly && { isActive: true }),
      };

      const subscriptions = await prisma.eventUpdateSubscription.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              location: true,
              image: true,
              status: true,
            },
          },
        },
        orderBy: { subscribedAt: 'desc' },
      });

      return subscriptions;
    } catch (error: unknown) {
      logger.error('Error fetching subscriptions:', error);
      throw new ValidationError(`Failed to fetch subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update subscription preferences
   */
  static async updateSubscriptionPreferences(
    userId: string,
    eventId: string,
    preferences: {
      updateTypes?: string[];
      channels?: string[];
    },
  ) {
    try {
      const subscription = await prisma.eventUpdateSubscription.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });

      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }

      const updated = await prisma.eventUpdateSubscription.update({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        data: {
          updateTypes: preferences.updateTypes || subscription.updateTypes,
          channels: preferences.channels || subscription.channels,
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

      return updated;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating subscription:', error);
      throw new ValidationError(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
