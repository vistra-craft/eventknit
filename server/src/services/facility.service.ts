import { prisma } from '../config/database.js';
import { Prisma, FacilityType } from '@prisma/client';

export interface FacilityData {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  location?: string;
  isActive?: boolean;
  allowCheckIn?: boolean;
  allowCheckOut?: boolean;
  allowRegistration?: boolean;
  facilityType?: FacilityType;
  sortOrder?: number;
}

export interface FacilityStats {
  totalScans: number;
  checkIns: number;
  checkOuts: number;
  uniqueAttendees: number;
  lastScanAt: Date | null;
}

export interface FacilityWithStats {
  id: string;
  eventId: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  location: string | null;
  isActive: boolean;
  allowCheckIn: boolean;
  allowCheckOut: boolean;
  allowRegistration: boolean;
  facilityType: FacilityType;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  stats?: FacilityStats;
}

export class FacilityService {
  /**
   * Create a new facility for an event
   */
  static async createFacility(eventId: string, data: FacilityData): Promise<FacilityWithStats> {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Check for duplicate code
    const existingFacility = await prisma.eventFacility.findUnique({
      where: {
        eventId_code: {
          eventId,
          code: data.code.toUpperCase(),
        },
      },
    });

    if (existingFacility) {
      throw new Error('A facility with this code already exists for this event');
    }

    // Get the highest sort order for this event
    const maxSortOrder = await prisma.eventFacility.aggregate({
      where: { eventId },
      _max: { sortOrder: true },
    });

    const facility = await prisma.eventFacility.create({
      data: {
        eventId,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        icon: data.icon,
        color: data.color,
        location: data.location,
        isActive: data.isActive ?? true,
        allowCheckIn: data.allowCheckIn ?? true,
        allowCheckOut: data.allowCheckOut ?? true,
        allowRegistration: data.allowRegistration ?? false,
        facilityType: data.facilityType ?? FacilityType.CHECK_IN,
        sortOrder: data.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
      },
    });

    return {
      ...facility,
      stats: {
        totalScans: 0,
        checkIns: 0,
        checkOuts: 0,
        uniqueAttendees: 0,
        lastScanAt: null,
      },
    };
  }

  /**
   * Create default "Main Entrance" facility for an event
   */
  static async createDefaultFacility(eventId: string): Promise<FacilityWithStats> {
    // Check if any facilities exist
    const existingCount = await prisma.eventFacility.count({
      where: { eventId },
    });

    if (existingCount > 0) {
      throw new Error('Facilities already exist for this event');
    }

    return this.createFacility(eventId, {
      name: 'Main Entrance',
      code: 'ENT',
      description: 'Main entrance for event check-in',
      icon: 'shield',
      color: '#3b82f6', // Blue
      isActive: true,
      allowCheckIn: true,
      allowCheckOut: true,
      sortOrder: 1,
    });
  }

  /**
   * Get all facilities for an event
   */
  static async getFacilities(
    eventId: string,
    options?: {
      includeStats?: boolean;
      activeOnly?: boolean;
    },
  ): Promise<FacilityWithStats[]> {
    const where: Prisma.EventFacilityWhereInput = { eventId };

    if (options?.activeOnly) {
      where.isActive = true;
    }

    const facilities = await prisma.eventFacility.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    if (!options?.includeStats) {
      return facilities as FacilityWithStats[];
    }

    // Get stats for each facility
    const facilitiesWithStats = await Promise.all(
      facilities.map(async (facility) => {
        const stats = await this.getFacilityStats(facility.id);
        return {
          ...facility,
          stats,
        };
      }),
    );

    return facilitiesWithStats;
  }

  /**
   * Get a facility by ID
   */
  static async getFacilityById(id: string): Promise<FacilityWithStats | null> {
    const facility = await prisma.eventFacility.findUnique({
      where: { id },
    });

    if (!facility) {
      return null;
    }

    const stats = await this.getFacilityStats(id);

    return {
      ...facility,
      stats,
    };
  }

  /**
   * Update a facility
   */
  static async updateFacility(
    id: string,
    data: Partial<FacilityData>,
  ): Promise<FacilityWithStats> {
    const facility = await prisma.eventFacility.findUnique({
      where: { id },
    });

    if (!facility) {
      throw new Error('Facility not found');
    }

    // If code is being updated, check for duplicates
    if (data.code && data.code.toUpperCase() !== facility.code) {
      const existingFacility = await prisma.eventFacility.findUnique({
        where: {
          eventId_code: {
            eventId: facility.eventId,
            code: data.code.toUpperCase(),
          },
        },
      });

      if (existingFacility) {
        throw new Error('A facility with this code already exists for this event');
      }
    }

    const updated = await prisma.eventFacility.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code?.toUpperCase(),
        description: data.description,
        icon: data.icon,
        color: data.color,
        location: data.location,
        isActive: data.isActive,
        allowCheckIn: data.allowCheckIn,
        allowCheckOut: data.allowCheckOut,
        allowRegistration: data.allowRegistration,
        facilityType: data.facilityType,
        sortOrder: data.sortOrder,
      },
    });

    const stats = await this.getFacilityStats(id);

    return {
      ...updated,
      stats,
    };
  }

  /**
   * Delete a facility
   */
  static async deleteFacility(id: string): Promise<{ success: boolean; message: string }> {
    const facility = await prisma.eventFacility.findUnique({
      where: { id },
      include: {
        _count: {
          select: { scans: true },
        },
      },
    });

    if (!facility) {
      throw new Error('Facility not found');
    }

    // If facility has scans, soft delete (deactivate) instead
    if (facility._count.scans > 0) {
      await prisma.eventFacility.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        success: true,
        message: 'Facility has been deactivated because it has scan history',
      };
    }

    // Otherwise, hard delete
    await prisma.eventFacility.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Facility deleted successfully',
    };
  }

  /**
   * Reorder facilities
   */
  static async reorderFacilities(
    eventId: string,
    orderedIds: string[],
  ): Promise<FacilityWithStats[]> {
    // Update sort order for each facility
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.eventFacility.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );

    return this.getFacilities(eventId);
  }

  /**
   * Get statistics for a facility
   */
  static async getFacilityStats(facilityId: string): Promise<FacilityStats> {
    const [totalScans, checkIns, checkOuts, uniqueAttendees, lastScan] = await Promise.all([
      // Total scans
      prisma.ticketScan.count({
        where: { facilityId },
      }),
      // Check-ins
      prisma.ticketScan.count({
        where: {
          facilityId,
          scanType: { in: ['CHECK_IN', 'MANUAL_CHECK_IN'] },
        },
      }),
      // Check-outs
      prisma.ticketScan.count({
        where: {
          facilityId,
          scanType: { in: ['CHECK_OUT', 'MANUAL_CHECK_OUT'] },
        },
      }),
      // Unique attendees
      prisma.ticketScan.groupBy({
        by: ['registrationId'],
        where: { facilityId },
      }),
      // Last scan
      prisma.ticketScan.findFirst({
        where: { facilityId },
        orderBy: { scannedAt: 'desc' },
        select: { scannedAt: true },
      }),
    ]);

    return {
      totalScans,
      checkIns,
      checkOuts,
      uniqueAttendees: uniqueAttendees.length,
      lastScanAt: lastScan?.scannedAt ?? null,
    };
  }

  /**
   * Get facility by code for an event
   */
  static async getFacilityByCode(eventId: string, code: string): Promise<FacilityWithStats | null> {
    const facility = await prisma.eventFacility.findUnique({
      where: {
        eventId_code: {
          eventId,
          code: code.toUpperCase(),
        },
      },
    });

    if (!facility) {
      return null;
    }

    return {
      ...facility,
      stats: await this.getFacilityStats(facility.id),
    };
  }

  /**
   * Ensure at least one facility exists for an event
   * Creates default if none exist
   */
  static async ensureDefaultFacility(eventId: string): Promise<FacilityWithStats[]> {
    const facilities = await this.getFacilities(eventId, { activeOnly: true });

    if (facilities.length === 0) {
      const defaultFacility = await this.createDefaultFacility(eventId);
      return [defaultFacility];
    }

    return facilities;
  }

  /**
   * Get facilities that allow registration for an event
   */
  static async getRegistrationFacilities(eventId: string): Promise<FacilityWithStats[]> {
    const facilities = await prisma.eventFacility.findMany({
      where: {
        eventId,
        isActive: true,
        allowRegistration: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const facilitiesWithStats = await Promise.all(
      facilities.map(async (facility) => {
        const stats = await this.getFacilityStats(facility.id);
        return {
          ...facility,
          stats,
        };
      }),
    );

    return facilitiesWithStats;
  }

  /**
   * Get facilities by type for an event
   */
  static async getFacilitiesByType(eventId: string, facilityType: FacilityType): Promise<FacilityWithStats[]> {
    const facilities = await prisma.eventFacility.findMany({
      where: {
        eventId,
        isActive: true,
        facilityType,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const facilitiesWithStats = await Promise.all(
      facilities.map(async (facility) => {
        const stats = await this.getFacilityStats(facility.id);
        return {
          ...facility,
          stats,
        };
      }),
    );

    return facilitiesWithStats;
  }
}
