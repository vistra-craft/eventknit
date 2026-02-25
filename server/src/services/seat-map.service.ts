/**
 * Seat Map Service
 * 
 * Manages seat maps for events
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { SeatStatus, SeatType } from '@prisma/client';

export interface CreateSeatMapData {
  eventId: string;
  venueId?: string;
  name?: string;
  layout: any; // Seat map layout configuration
  pricing?: any; // Pricing configuration
  imageUrl?: string;
  width?: number;
  height?: number;
}

export interface UpdateSeatMapData extends Partial<CreateSeatMapData> {
  isActive?: boolean;
}

export class SeatMapService {
  /**
   * Create or update seat map for event
   */
  static async upsertSeatMap(organizerId: string, data: CreateSeatMapData) {
    try {
      // Verify event belongs to organizer
      const event = await prisma.event.findFirst({
        where: {
          id: data.eventId,
          organizerId,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Verify venue if provided
      if (data.venueId) {
        const venue = await prisma.venue.findFirst({
          where: {
            id: data.venueId,
            organizerId,
          },
        });

        if (!venue) {
          throw new NotFoundError('Venue not found');
        }
      }

      // Validate layout structure
      this.validateLayout(data.layout);

      // Create or update seat map
      const seatMap = await prisma.seatMap.upsert({
        where: { eventId: data.eventId },
        create: {
          eventId: data.eventId,
          venueId: data.venueId,
          name: data.name,
          layout: data.layout as any,
          pricing: data.pricing as any,
          imageUrl: data.imageUrl,
          width: data.width,
          height: data.height,
        },
        update: {
          venueId: data.venueId,
          name: data.name,
          layout: data.layout as any,
          pricing: data.pricing as any,
          imageUrl: data.imageUrl,
          width: data.width,
          height: data.height,
        },
      });

      // Generate seats from layout
      await this.generateSeatsFromLayout(seatMap.id, data.layout);

      logger.info(`Upserted seat map for event: ${data.eventId}`);
      return seatMap;
    } catch (error) {
      logger.error('Error upserting seat map:', error);
      throw error;
    }
  }

  /**
   * Get seat map for event
   */
  static async getSeatMapByEventId(eventId: string, organizerId?: string) {
    try {
      const _where: any = { eventId };
      
      const seatMap = await prisma.seatMap.findUnique({
        where: { eventId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              organizerId: true,
            },
          },
          venue: true,
          seats: {
            include: {
              reservations: {
                where: {
                  status: { in: ['reserved', 'confirmed'] },
                },
                include: {
                  registration: {
                    select: {
                      id: true,
                      attendee: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: [
              { sectionId: 'asc' },
              { rowLabel: 'asc' },
              { seatLabel: 'asc' },
            ],
          },
        },
      });

      if (!seatMap) {
        throw new NotFoundError('Seat map not found for this event');
      }

      // Verify organizer access if provided
      if (organizerId && seatMap.event.organizerId !== organizerId) {
        throw new ValidationError('Access denied');
      }

      return seatMap;
    } catch (error) {
      logger.error('Error getting seat map:', error);
      throw error;
    }
  }

  /**
   * Get available seats for event
   */
  static async getAvailableSeats(eventId: string, filters?: {
    sectionId?: string;
    seatType?: SeatType;
    minPrice?: number;
    maxPrice?: number;
  }) {
    try {
      const seatMap = await prisma.seatMap.findUnique({
        where: { eventId },
      });

      if (!seatMap) {
        throw new NotFoundError('Seat map not found');
      }

      const where: any = {
        seatMapId: seatMap.id,
        status: SeatStatus.AVAILABLE,
      };

      if (filters?.sectionId) {
        where.sectionId = filters.sectionId;
      }

      if (filters?.seatType) {
        where.seatType = filters.seatType;
      }

      if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
        where.currentPrice = {};
        if (filters.minPrice !== undefined) {
          where.currentPrice.gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          where.currentPrice.lte = filters.maxPrice;
        }
      }

      const seats = await prisma.seat.findMany({
        where,
        include: {
          reservations: {
            where: {
              status: { in: ['reserved', 'confirmed'] },
            },
          },
        },
        orderBy: [
          { sectionId: 'asc' },
          { rowLabel: 'asc' },
          { seatLabel: 'asc' },
        ],
      });

      // Filter out seats with active reservations
      const availableSeats = seats.filter(seat => seat.reservations.length === 0);

      return availableSeats;
    } catch (error) {
      logger.error('Error getting available seats:', error);
      throw error;
    }
  }

  /**
   * Generate seats from layout configuration
   */
  private static async generateSeatsFromLayout(seatMapId: string, layout: any) {
    try {
      // Check for active reservations before regenerating seats
      const activeReservations = await prisma.seatReservation.count({
        where: {
          seat: { seatMapId },
          status: { in: ['reserved', 'confirmed'] },
          OR: [
            { reservedUntil: null },
            { reservedUntil: { gt: new Date() } },
          ],
        },
      });

      if (activeReservations > 0) {
        throw new ValidationError(
          `Cannot update seat layout: ${activeReservations} active reservation(s) exist. Please wait for all reservations to be completed or expired before modifying the layout.`,
        );
      }

      const sections = layout.sections || [];
      const seats: any[] = [];

      for (const section of sections) {
        const rows = section.rows || [];
        
        for (const row of rows) {
          const rowSeats = row.seats || [];
          
          for (const seatConfig of rowSeats) {
            const seatIdentifier = seatConfig.id || `${section.id}-${row.id}-${seatConfig.label}`;
            
            seats.push({
              seatMapId,
              seatIdentifier,
              sectionId: section.id,
              rowId: row.id,
              rowLabel: row.label,
              seatLabel: seatConfig.label,
              seatType: seatConfig.type || SeatType.STANDARD,
              status: SeatStatus.AVAILABLE,
              basePrice: seatConfig.price ? parseFloat(seatConfig.price) : null,
              currentPrice: seatConfig.price ? parseFloat(seatConfig.price) : null,
              x: seatConfig.x,
              y: seatConfig.y,
              angle: seatConfig.angle,
              metadata: seatConfig.metadata || {},
            });
          }
        }
      }

      // Delete existing seats and create new ones
      await prisma.$transaction([
        prisma.seat.deleteMany({
          where: { seatMapId },
        }),
        ...seats.map(seat => prisma.seat.create({ data: seat })),
      ]);

      logger.info(`Generated ${seats.length} seats for seat map ${seatMapId}`);
    } catch (error) {
      logger.error('Error generating seats from layout:', error);
      throw error;
    }
  }

  /**
   * Validate layout structure
   */
  private static validateLayout(layout: any) {
    if (!layout || !layout.sections || !Array.isArray(layout.sections)) {
      throw new ValidationError('Invalid layout: must have sections array');
    }

    for (const section of layout.sections) {
      if (!section.id || !section.rows || !Array.isArray(section.rows)) {
        throw new ValidationError('Invalid section: must have id and rows array');
      }

      for (const row of section.rows) {
        if (!row.id || !row.seats || !Array.isArray(row.seats)) {
          throw new ValidationError('Invalid row: must have id and seats array');
        }

        for (const seat of row.seats) {
          if (!seat.id && !seat.label) {
            throw new ValidationError('Invalid seat: must have id or label');
          }
        }
      }
    }
  }

  /**
   * Update seat map
   */
  static async updateSeatMap(eventId: string, organizerId: string, data: UpdateSeatMapData) {
    try {
      const seatMap = await this.getSeatMapByEventId(eventId, organizerId);

      if (data.layout) {
        this.validateLayout(data.layout);
      }

      const updated = await prisma.seatMap.update({
        where: { eventId },
        data: {
          ...(data.venueId !== undefined && { venueId: data.venueId }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.layout && { layout: data.layout as any }),
          ...(data.pricing !== undefined && { pricing: data.pricing as any }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.width !== undefined && { width: data.width }),
          ...(data.height !== undefined && { height: data.height }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      // Regenerate seats if layout changed
      if (data.layout) {
        await this.generateSeatsFromLayout(seatMap.id, data.layout);
      }

      logger.info(`Updated seat map for event: ${eventId}`);
      return updated;
    } catch (error) {
      logger.error('Error updating seat map:', error);
      throw error;
    }
  }

  /**
   * Delete seat map
   */
  static async deleteSeatMap(eventId: string, organizerId: string) {
    try {
      await this.getSeatMapByEventId(eventId, organizerId);

      await prisma.seatMap.delete({
        where: { eventId },
      });

      logger.info(`Deleted seat map for event: ${eventId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting seat map:', error);
      throw error;
    }
  }
}
