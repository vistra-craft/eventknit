import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface SavedEventWithDetails {
  id: string;
  eventId: string;
  savedAt: Date;
  notes: string | null;
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
    venueName: string | null;
    coverImage: string | null;
    category: string | null;
    eventType: string;
    status: string;
    basePrice: number | null;
    currency: string;
  };
}

export class SavedEventService {
  /**
   * Get all saved events for a user
   */
  static async getSavedEvents(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    }
  ): Promise<{
    events: SavedEventWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      event: {
        deletedAt: null,
      },
    };

    if (options?.search) {
      where.event.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { location: { contains: options.search, mode: 'insensitive' } },
        { venueName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.category) {
      where.event.category = options.category;
    }

    const [events, total] = await Promise.all([
      prisma.savedEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { savedAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              location: true,
              venueName: true,
              coverImage: true,
              category: true,
              eventType: true,
              status: true,
              basePrice: true,
              currency: true,
            },
          },
        },
      }),
      prisma.savedEvent.count({ where }),
    ]);

    return {
      events: events as SavedEventWithDetails[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Save an event for a user
   */
  static async saveEvent(
    userId: string,
    eventId: string,
    notes?: string
  ): Promise<SavedEventWithDetails> {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.deletedAt) {
      throw new ValidationError('Cannot save a deleted event');
    }

    // Check if already saved
    const existing = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existing) {
      throw new ValidationError('Event is already saved');
    }

    const savedEvent = await prisma.savedEvent.create({
      data: {
        userId,
        eventId,
        notes,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            venueName: true,
            coverImage: true,
            category: true,
            eventType: true,
            status: true,
            basePrice: true,
            currency: true,
          },
        },
      },
    });

    logger.info(`User ${userId} saved event ${eventId}`);
    return savedEvent as SavedEventWithDetails;
  }

  /**
   * Remove a saved event
   */
  static async unsaveEvent(userId: string, eventId: string): Promise<void> {
    const savedEvent = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!savedEvent) {
      throw new NotFoundError('Saved event not found');
    }

    await prisma.savedEvent.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    logger.info(`User ${userId} unsaved event ${eventId}`);
  }

  /**
   * Check if an event is saved by a user
   */
  static async isEventSaved(userId: string, eventId: string): Promise<boolean> {
    const savedEvent = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return !!savedEvent;
  }

  /**
   * Check multiple events saved status
   */
  static async getEventsSavedStatus(
    userId: string,
    eventIds: string[]
  ): Promise<Record<string, boolean>> {
    const savedEvents = await prisma.savedEvent.findMany({
      where: {
        userId,
        eventId: { in: eventIds },
      },
      select: { eventId: true },
    });

    const savedSet = new Set(savedEvents.map((s) => s.eventId));
    return eventIds.reduce(
      (acc, id) => {
        acc[id] = savedSet.has(id);
        return acc;
      },
      {} as Record<string, boolean>
    );
  }

  /**
   * Update notes for a saved event
   */
  static async updateNotes(
    userId: string,
    eventId: string,
    notes: string
  ): Promise<SavedEventWithDetails> {
    const savedEvent = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!savedEvent) {
      throw new NotFoundError('Saved event not found');
    }

    const updated = await prisma.savedEvent.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: { notes },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            venueName: true,
            coverImage: true,
            category: true,
            eventType: true,
            status: true,
            basePrice: true,
            currency: true,
          },
        },
      },
    });

    return updated as SavedEventWithDetails;
  }

  /**
   * Get saved event count for a user
   */
  static async getSavedCount(userId: string): Promise<number> {
    return prisma.savedEvent.count({
      where: { userId },
    });
  }
}
