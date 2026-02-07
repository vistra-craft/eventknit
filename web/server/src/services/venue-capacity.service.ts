/**
 * Venue Capacity Service
 * Manages venue-wide and zone-level capacity tracking with threshold alerts
 */

import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CapacityStatus {
  eventId: string;
  maxCapacity: number | null;
  currentOccupancy: number;
  availableCapacity: number | null;
  percentageFilled: number;
  isAtCapacity: boolean;
  thresholdBreached: number | null; // 70, 80, 90, 95, or null
}

export interface ZoneCapacityStatus {
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  maxCapacity: number | null;
  currentOccupancy: number;
  availableCapacity: number | null;
  percentageFilled: number;
  isAtCapacity: boolean;
}

export interface CapacityAlert {
  eventId: string;
  type: 'venue' | 'zone';
  zoneId?: string;
  zoneName?: string;
  threshold: number;
  currentOccupancy: number;
  maxCapacity: number;
  percentageFilled: number;
  timestamp: Date;
}

export interface CapacityHistoryEntry {
  timestamp: Date;
  venueOccupancy: number;
  zones: Array<{
    zoneId: string;
    zoneName: string;
    occupancy: number;
  }>;
}

const CAPACITY_THRESHOLDS = [70, 80, 90, 95, 100];

export class VenueCapacityService {
  /**
   * Set venue maximum capacity
   */
  static async setVenueCapacity(
    eventId: string,
    maxCapacity: number | null,
  ): Promise<void> {
    if (maxCapacity !== null && maxCapacity < 0) {
      throw new ValidationError('Maximum capacity cannot be negative');
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { venueMaxCapacity: maxCapacity },
    });

    logger.info('Venue capacity updated', {
      eventId,
      maxCapacity,
    });
  }

  /**
   * Get current venue occupancy (count of checked-in attendees)
   */
  static async getCurrentOccupancy(eventId: string): Promise<number> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { venueCurrentOccupancy: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event.venueCurrentOccupancy;
  }

  /**
   * Get full capacity status for venue
   */
  static async getCapacityStatus(eventId: string): Promise<CapacityStatus> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        venueMaxCapacity: true,
        venueCurrentOccupancy: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const maxCapacity = event.venueMaxCapacity;
    const currentOccupancy = event.venueCurrentOccupancy;
    const availableCapacity = maxCapacity !== null ? maxCapacity - currentOccupancy : null;
    const percentageFilled = maxCapacity ? (currentOccupancy / maxCapacity) * 100 : 0;
    const isAtCapacity = maxCapacity !== null && currentOccupancy >= maxCapacity;

    // Determine which threshold is breached
    let thresholdBreached: number | null = null;
    if (maxCapacity) {
      for (const threshold of CAPACITY_THRESHOLDS) {
        if (percentageFilled >= threshold) {
          thresholdBreached = threshold;
        }
      }
    }

    return {
      eventId,
      maxCapacity,
      currentOccupancy,
      availableCapacity,
      percentageFilled: Math.round(percentageFilled * 10) / 10,
      isAtCapacity,
      thresholdBreached,
    };
  }

  /**
   * Increment venue occupancy (on check-in)
   * Returns alerts if thresholds are crossed
   */
  static async incrementOccupancy(
    eventId: string,
    count: number = 1,
  ): Promise<CapacityAlert[]> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        venueMaxCapacity: true,
        venueCurrentOccupancy: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const previousOccupancy = event.venueCurrentOccupancy;
    const newOccupancy = previousOccupancy + count;

    await prisma.event.update({
      where: { id: eventId },
      data: { venueCurrentOccupancy: newOccupancy },
    });

    // Check for threshold alerts
    const alerts: CapacityAlert[] = [];
    if (event.venueMaxCapacity) {
      const previousPercentage = (previousOccupancy / event.venueMaxCapacity) * 100;
      const newPercentage = (newOccupancy / event.venueMaxCapacity) * 100;

      for (const threshold of CAPACITY_THRESHOLDS) {
        if (previousPercentage < threshold && newPercentage >= threshold) {
          alerts.push({
            eventId,
            type: 'venue',
            threshold,
            currentOccupancy: newOccupancy,
            maxCapacity: event.venueMaxCapacity,
            percentageFilled: Math.round(newPercentage * 10) / 10,
            timestamp: new Date(),
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Decrement venue occupancy (on check-out)
   */
  static async decrementOccupancy(
    eventId: string,
    count: number = 1,
  ): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { venueCurrentOccupancy: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const newOccupancy = Math.max(0, event.venueCurrentOccupancy - count);

    await prisma.event.update({
      where: { id: eventId },
      data: { venueCurrentOccupancy: newOccupancy },
    });
  }

  /**
   * Check if venue can accept more check-ins
   */
  static async canCheckIn(eventId: string, count: number = 1): Promise<boolean> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        venueMaxCapacity: true,
        venueCurrentOccupancy: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // No capacity limit
    if (event.venueMaxCapacity === null) {
      return true;
    }

    return event.venueCurrentOccupancy + count <= event.venueMaxCapacity;
  }

  /**
   * Check thresholds and return any alerts that should be triggered
   */
  static async checkThresholds(eventId: string): Promise<CapacityAlert[]> {
    const status = await this.getCapacityStatus(eventId);
    const alerts: CapacityAlert[] = [];

    if (status.maxCapacity && status.thresholdBreached) {
      alerts.push({
        eventId,
        type: 'venue',
        threshold: status.thresholdBreached,
        currentOccupancy: status.currentOccupancy,
        maxCapacity: status.maxCapacity,
        percentageFilled: status.percentageFilled,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Get capacity status for all zones in an event
   */
  static async getZoneCapacityOverview(
    eventId: string,
  ): Promise<ZoneCapacityStatus[]> {
    const zones = await prisma.facilityZone.findMany({
      where: {
        eventId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        maxCapacity: true,
        currentOccupancy: true,
      },
    });

    return zones.map((zone) => {
      const maxCapacity = zone.maxCapacity;
      const currentOccupancy = zone.currentOccupancy;
      const availableCapacity = maxCapacity !== null ? maxCapacity - currentOccupancy : null;
      const percentageFilled = maxCapacity ? (currentOccupancy / maxCapacity) * 100 : 0;
      const isAtCapacity = maxCapacity !== null && currentOccupancy >= maxCapacity;

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        zoneCode: zone.code,
        maxCapacity,
        currentOccupancy,
        availableCapacity,
        percentageFilled: Math.round(percentageFilled * 10) / 10,
        isAtCapacity,
      };
    });
  }

  /**
   * Increment zone occupancy
   */
  static async incrementZoneOccupancy(
    zoneId: string,
    count: number = 1,
  ): Promise<CapacityAlert[]> {
    const zone = await prisma.facilityZone.findUnique({
      where: { id: zoneId },
      select: {
        eventId: true,
        name: true,
        maxCapacity: true,
        currentOccupancy: true,
      },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    const previousOccupancy = zone.currentOccupancy;
    const newOccupancy = previousOccupancy + count;

    await prisma.facilityZone.update({
      where: { id: zoneId },
      data: { currentOccupancy: newOccupancy },
    });

    // Check for threshold alerts
    const alerts: CapacityAlert[] = [];
    if (zone.maxCapacity) {
      const previousPercentage = (previousOccupancy / zone.maxCapacity) * 100;
      const newPercentage = (newOccupancy / zone.maxCapacity) * 100;

      for (const threshold of CAPACITY_THRESHOLDS) {
        if (previousPercentage < threshold && newPercentage >= threshold) {
          alerts.push({
            eventId: zone.eventId,
            type: 'zone',
            zoneId,
            zoneName: zone.name,
            threshold,
            currentOccupancy: newOccupancy,
            maxCapacity: zone.maxCapacity,
            percentageFilled: Math.round(newPercentage * 10) / 10,
            timestamp: new Date(),
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Decrement zone occupancy
   */
  static async decrementZoneOccupancy(
    zoneId: string,
    count: number = 1,
  ): Promise<void> {
    const zone = await prisma.facilityZone.findUnique({
      where: { id: zoneId },
      select: { currentOccupancy: true },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    const newOccupancy = Math.max(0, zone.currentOccupancy - count);

    await prisma.facilityZone.update({
      where: { id: zoneId },
      data: { currentOccupancy: newOccupancy },
    });
  }

  /**
   * Check if zone can accept more entries
   */
  static async canEnterZone(zoneId: string, count: number = 1): Promise<boolean> {
    const zone = await prisma.facilityZone.findUnique({
      where: { id: zoneId },
      select: {
        maxCapacity: true,
        currentOccupancy: true,
      },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    // No capacity limit
    if (zone.maxCapacity === null) {
      return true;
    }

    return zone.currentOccupancy + count <= zone.maxCapacity;
  }

  /**
   * Reset occupancy counters (useful for end of day/event)
   */
  static async resetOccupancy(eventId: string): Promise<void> {
    await prisma.$transaction([
      prisma.event.update({
        where: { id: eventId },
        data: { venueCurrentOccupancy: 0 },
      }),
      prisma.facilityZone.updateMany({
        where: { eventId },
        data: { currentOccupancy: 0 },
      }),
    ]);

    logger.info('Occupancy counters reset', { eventId });
  }

  /**
   * Recalculate occupancy from check-in records
   * Useful for data consistency after issues
   */
  static async recalculateOccupancy(eventId: string): Promise<{
    venueOccupancy: number;
    zoneOccupancies: Record<string, number>;
  }> {
    // Count currently inside attendees
    const venueOccupancy = await prisma.eventRegistration.count({
      where: {
        eventId,
        isCurrentlyInside: true,
      },
    });

    // Update venue occupancy
    await prisma.event.update({
      where: { id: eventId },
      data: { venueCurrentOccupancy: venueOccupancy },
    });

    // Get zones and calculate occupancy from movements
    const zones = await prisma.facilityZone.findMany({
      where: { eventId },
      select: { id: true },
    });

    const zoneOccupancies: Record<string, number> = {};

    for (const zone of zones) {
      // Count attendees currently in zone (entered but not exited)
      // This is a simplified calculation - real implementation would track movements
      const occupancy = await prisma.attendeeZoneAccess.count({
        where: {
          zoneId: zone.id,
          isActive: true,
          lastAccessAt: { not: null },
        },
      });

      zoneOccupancies[zone.id] = occupancy;

      await prisma.facilityZone.update({
        where: { id: zone.id },
        data: { currentOccupancy: occupancy },
      });
    }

    logger.info('Occupancy recalculated', {
      eventId,
      venueOccupancy,
      zoneCount: Object.keys(zoneOccupancies).length,
    });

    return { venueOccupancy, zoneOccupancies };
  }

  /**
   * Get combined capacity overview for an event
   */
  static async getCapacityOverview(eventId: string): Promise<{
    venue: CapacityStatus;
    zones: ZoneCapacityStatus[];
    summary: {
      totalZones: number;
      zonesAtCapacity: number;
      totalZoneCapacity: number | null;
      totalZoneOccupancy: number;
    };
  }> {
    const venue = await this.getCapacityStatus(eventId);
    const zones = await this.getZoneCapacityOverview(eventId);

    const zonesAtCapacity = zones.filter((z) => z.isAtCapacity).length;
    const totalZoneCapacity = zones.reduce(
      (sum, z) => (z.maxCapacity !== null ? (sum ?? 0) + z.maxCapacity : sum),
      null as number | null,
    );
    const totalZoneOccupancy = zones.reduce((sum, z) => sum + z.currentOccupancy, 0);

    return {
      venue,
      zones,
      summary: {
        totalZones: zones.length,
        zonesAtCapacity,
        totalZoneCapacity,
        totalZoneOccupancy,
      },
    };
  }
}
