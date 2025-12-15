/**
 * Venue Service
 * 
 * Manages venues and their configurations
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface CreateVenueData {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: { lat: number; lng: number };
  capacity?: number;
  venueType?: string;
  amenities?: string[];
  defaultSeatMap?: any;
}

export interface UpdateVenueData extends Partial<CreateVenueData> {
  isActive?: boolean;
}

export class VenueService {
  /**
   * Create a venue
   */
  static async createVenue(organizerId: string, data: CreateVenueData) {
    try {
      const venue = await prisma.venue.create({
        data: {
          organizerId,
          name: data.name,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          coordinates: data.coordinates as any,
          capacity: data.capacity,
          venueType: data.venueType,
          amenities: data.amenities || [],
          defaultSeatMap: data.defaultSeatMap as any,
        },
      });

      logger.info(`Created venue: ${venue.id} for organizer ${organizerId}`);
      return venue;
    } catch (error) {
      logger.error('Error creating venue:', error);
      throw error;
    }
  }

  /**
   * Get organizer's venues
   */
  static async getVenues(organizerId: string, filters?: {
    isActive?: boolean;
    venueType?: string;
    search?: string;
  }) {
    try {
      const where: any = { organizerId };

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.venueType) {
        where.venueType = filters.venueType;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const venues = await prisma.venue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return venues;
    } catch (error) {
      logger.error('Error getting venues:', error);
      throw error;
    }
  }

  /**
   * Get venue by ID
   */
  static async getVenueById(venueId: string, organizerId?: string) {
    try {
      const where: any = { id: venueId };
      if (organizerId) {
        where.organizerId = organizerId;
      }

      const venue = await prisma.venue.findFirst({
        where,
        include: {
          seatMaps: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                },
              },
            },
          },
        },
      });

      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      return venue;
    } catch (error) {
      logger.error('Error getting venue:', error);
      throw error;
    }
  }

  /**
   * Update venue
   */
  static async updateVenue(venueId: string, organizerId: string, data: UpdateVenueData) {
    try {
      await this.getVenueById(venueId, organizerId);

      const updated = await prisma.venue.update({
        where: { id: venueId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
          ...(data.coordinates && { coordinates: data.coordinates as any }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.venueType !== undefined && { venueType: data.venueType }),
          ...(data.amenities && { amenities: data.amenities }),
          ...(data.defaultSeatMap && { defaultSeatMap: data.defaultSeatMap as any }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      logger.info(`Updated venue: ${venueId}`);
      return updated;
    } catch (error) {
      logger.error('Error updating venue:', error);
      throw error;
    }
  }

  /**
   * Delete venue
   */
  static async deleteVenue(venueId: string, organizerId: string) {
    try {
      await this.getVenueById(venueId, organizerId);

      // Check if venue is used in any active events
      const activeSeatMaps = await prisma.seatMap.count({
        where: {
          venueId,
          isActive: true,
          event: {
            status: {
              in: ['APPROVED', 'PENDING'],
            },
          },
        },
      });

      if (activeSeatMaps > 0) {
        throw new ValidationError('Cannot delete venue that is used in active events');
      }

      await prisma.venue.delete({
        where: { id: venueId },
      });

      logger.info(`Deleted venue: ${venueId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting venue:', error);
      throw error;
    }
  }
}
