/**
 * Facility Zone Service
 * Handles zone-based access control for MICE events
 */

import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface CreateZoneInput {
  eventId: string;
  name: string;
  code: string;
  description?: string;
  maxCapacity?: number;
  accessStart?: Date;
  accessEnd?: Date;
}

export interface UpdateZoneInput {
  name?: string;
  description?: string;
  maxCapacity?: number;
  accessStart?: Date;
  accessEnd?: Date;
  isActive?: boolean;
}

export interface BulkAssignInput {
  zoneId: string;
  registrationIds: string[];
  grantedBy: string;
  expiresAt?: Date;
}

export class FacilityZoneService {
  /**
   * Create a new facility zone
   */
  static async createZone(data: CreateZoneInput, createdBy: string) {
    try {
      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Check if code is already used for this event
      const existing = await prisma.facilityZone.findUnique({
        where: {
          eventId_code: {
            eventId: data.eventId,
            code: data.code,
          },
        },
      });

      if (existing) {
        throw new ValidationError(`Zone code '${data.code}' already exists for this event`);
      }

      const zone = await prisma.facilityZone.create({
        data: {
          eventId: data.eventId,
          name: data.name,
          code: data.code,
          description: data.description,
          maxCapacity: data.maxCapacity,
          accessStart: data.accessStart,
          accessEnd: data.accessEnd,
        },
      });

      logger.info(`Zone created: ${zone.id} by ${createdBy}`);
      return zone;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Failed to create zone:', error);
      throw new ValidationError('Failed to create zone');
    }
  }

  /**
   * Get zone by ID
   */
  static async getZoneById(zoneId: string) {
    const zone = await prisma.facilityZone.findUnique({
      where: { id: zoneId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        facilities: {
          include: {
            facility: true,
          },
        },
        attendeeAccess: {
          where: { isActive: true },
          include: {
            registration: {
              include: {
                attendee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    return zone;
  }

  /**
   * Get all zones for an event
   */
  static async getEventZones(eventId: string, includeInactive = false) {
    const where: Prisma.FacilityZoneWhereInput = {
      eventId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.facilityZone.findMany({
      where,
      include: {
        facilities: {
          include: {
            facility: true,
          },
        },
        _count: {
          select: {
            attendeeAccess: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update a zone
   */
  static async updateZone(zoneId: string, data: UpdateZoneInput) {
    try {
      const zone = await prisma.facilityZone.update({
        where: { id: zoneId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return zone;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Zone not found');
      }
      logger.error('Failed to update zone:', error);
      throw new ValidationError('Failed to update zone');
    }
  }

  /**
   * Delete a zone
   */
  static async deleteZone(zoneId: string) {
    try {
      const zone = await prisma.facilityZone.findUnique({
        where: { id: zoneId },
      });

      if (!zone) {
        throw new NotFoundError('Zone not found');
      }

      await prisma.facilityZone.delete({
        where: { id: zoneId },
      });

      logger.info(`Zone deleted: ${zoneId}`);
      return { message: 'Zone deleted successfully' };
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      if (error.code === 'P2025') {
        throw new NotFoundError('Zone not found');
      }
      logger.error('Failed to delete zone:', error);
      throw new ValidationError('Failed to delete zone');
    }
  }

  /**
   * Assign a facility to a zone
   */
  static async assignFacilityToZone(facilityId: string, zoneId: string) {
    try {
      // Verify facility and zone exist
      const [facility, zone] = await Promise.all([
        prisma.eventFacility.findUnique({ where: { id: facilityId } }),
        prisma.facilityZone.findUnique({ where: { id: zoneId } }),
      ]);

      if (!facility) throw new NotFoundError('Facility not found');
      if (!zone) throw new NotFoundError('Zone not found');

      // Verify they belong to the same event
      if (facility.eventId !== zone.eventId) {
        throw new ValidationError('Facility and zone must belong to the same event');
      }

      // Check if mapping already exists
      const existing = await prisma.facilityZoneMapping.findUnique({
        where: {
          facilityId_zoneId: {
            facilityId,
            zoneId,
          },
        },
      });

      if (existing) {
        throw new ValidationError('Facility is already assigned to this zone');
      }

      const mapping = await prisma.facilityZoneMapping.create({
        data: {
          facilityId,
          zoneId,
        },
        include: {
          facility: true,
          zone: true,
        },
      });

      logger.info(`Facility ${facilityId} assigned to zone ${zoneId}`);
      return mapping;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Failed to assign facility to zone:', error);
      throw new ValidationError('Failed to assign facility to zone');
    }
  }

  /**
   * Remove a facility from a zone
   */
  static async removeFacilityFromZone(facilityId: string, zoneId: string) {
    try {
      await prisma.facilityZoneMapping.delete({
        where: {
          facilityId_zoneId: {
            facilityId,
            zoneId,
          },
        },
      });

      logger.info(`Facility ${facilityId} removed from zone ${zoneId}`);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Facility-zone mapping not found');
      }
      logger.error('Failed to remove facility from zone:', error);
      throw new ValidationError('Failed to remove facility from zone');
    }
  }

  /**
   * Bulk assign attendees to a zone
   */
  static async bulkAssignAttendees(data: BulkAssignInput) {
    try {
      // Verify zone exists
      const zone = await prisma.facilityZone.findUnique({
        where: { id: data.zoneId },
      });

      if (!zone) {
        throw new NotFoundError('Zone not found');
      }

      // Verify all registrations exist and belong to the same event
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          id: { in: data.registrationIds },
          eventId: zone.eventId,
        },
      });

      if (registrations.length !== data.registrationIds.length) {
        throw new ValidationError('Some registrations are invalid or do not belong to this event');
      }

      // Bulk create access records (skip existing ones)
      const results = await Promise.allSettled(
        data.registrationIds.map(registrationId =>
          prisma.attendeeZoneAccess.upsert({
            where: {
              registrationId_zoneId: {
                registrationId,
                zoneId: data.zoneId,
              },
            },
            update: {
              isActive: true,
              grantedAt: new Date(),
              grantedBy: data.grantedBy,
              expiresAt: data.expiresAt,
            },
            create: {
              registrationId,
              zoneId: data.zoneId,
              grantedBy: data.grantedBy,
              expiresAt: data.expiresAt,
            },
          }),
        ),
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      logger.info(`Bulk assigned ${successCount} attendees to zone ${data.zoneId}`);

      return {
        successCount,
        failureCount,
        total: data.registrationIds.length,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      logger.error('Failed to bulk assign attendees:', error);
      throw new ValidationError('Failed to bulk assign attendees');
    }
  }

  /**
   * Revoke attendee access to a zone
   */
  static async revokeAccess(registrationId: string, zoneId: string) {
    try {
      await prisma.attendeeZoneAccess.update({
        where: {
          registrationId_zoneId: {
            registrationId,
            zoneId,
          },
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      logger.info(`Access revoked for registration ${registrationId} to zone ${zoneId}`);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Access record not found');
      }
      logger.error('Failed to revoke access:', error);
      throw new ValidationError('Failed to revoke access');
    }
  }

  /**
   * Validate if attendee has access to a zone
   */
  static async validateZoneAccess(registrationId: string, zoneId: string) {
    const access = await prisma.attendeeZoneAccess.findUnique({
      where: {
        registrationId_zoneId: {
          registrationId,
          zoneId,
        },
        isActive: true,
      },
      include: {
        zone: true,
      },
    });

    if (!access) {
      return {
        allowed: false,
        reason: 'No access permission',
      };
    }

    // Check if expired
    if (access.expiresAt && access.expiresAt < new Date()) {
      return {
        allowed: false,
        reason: 'Access expired',
      };
    }

    // Check zone operating hours
    const now = new Date();
    if (access.zone.accessStart && now < access.zone.accessStart) {
      return {
        allowed: false,
        reason: 'Zone not yet open',
      };
    }

    if (access.zone.accessEnd && now > access.zone.accessEnd) {
      return {
        allowed: false,
        reason: 'Zone closed',
      };
    }

    return {
      allowed: true,
      access,
    };
  }

  /**
   * Check zone capacity
   */
  static async checkZoneCapacity(zoneId: string) {
    const zone = await prisma.facilityZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    const currentOccupancy = zone.currentOccupancy;
    const maxCapacity = zone.maxCapacity;

    return {
      currentOccupancy,
      maxCapacity,
      availableCapacity: maxCapacity ? maxCapacity - currentOccupancy : null,
      isFull: maxCapacity ? currentOccupancy >= maxCapacity : false,
      percentFull: maxCapacity ? Math.round((currentOccupancy / maxCapacity) * 100) : 0,
    };
  }

  /**
   * Record attendee movement between zones
   */
  static async recordMovement(
    registrationId: string,
    toZoneId: string,
    scannedBy: string,
    fromZoneId?: string,
    deviceInfo?: any,
  ) {
    try {
      // Get the next sequence number for this registration
      const lastMovement = await prisma.facilityMovement.findFirst({
        where: { registrationId },
        orderBy: { sequenceNumber: 'desc' },
      });

      const sequenceNumber = (lastMovement?.sequenceNumber || 0) + 1;

      // Determine movement type
      let movementType = 'entry';
      if (fromZoneId && fromZoneId !== toZoneId) {
        movementType = 'zone_change';
      } else if (!toZoneId) {
        movementType = 'exit';
      }

      // Get event ID from registration
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: { eventId: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      // Create movement record
      const movement = await prisma.facilityMovement.create({
        data: {
          registrationId,
          eventId: registration.eventId,
          fromZoneId,
          toZoneId,
          movementType,
          sequenceNumber,
          scannedBy,
          deviceInfo,
        },
        include: {
          fromZone: true,
          toZone: true,
        },
      });

      // Update zone occupancy
      await prisma.$transaction([
        // Decrement fromZone if exists
        ...(fromZoneId
          ? [
            prisma.facilityZone.update({
              where: { id: fromZoneId },
              data: { currentOccupancy: { decrement: 1 } },
            }),
          ]
          : []),
        // Increment toZone
        prisma.facilityZone.update({
          where: { id: toZoneId },
          data: { currentOccupancy: { increment: 1 } },
        }),
        // Update access count and last access time
        prisma.attendeeZoneAccess.update({
          where: {
            registrationId_zoneId: {
              registrationId,
              zoneId: toZoneId,
            },
          },
          data: {
            accessCount: { increment: 1 },
            lastAccessAt: new Date(),
          },
        }),
      ]);

      logger.info(`Movement recorded: ${movementType} for registration ${registrationId}`);
      return movement;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Failed to record movement:', error);
      throw new ValidationError('Failed to record movement');
    }
  }

  /**
   * Get attendees currently in a zone
   */
  static async getAttendeesInZone(zoneId: string) {
    const zone = await prisma.facilityZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    const attendees = await prisma.attendeeZoneAccess.findMany({
      where: {
        zoneId,
        isActive: true,
      },
      include: {
        registration: {
          include: {
            attendee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: { lastAccessAt: 'desc' },
    });

    return attendees;
  }

  /**
   * Get movement history for an attendee
   */
  static async getAttendeeMovementHistory(registrationId: string) {
    const movements = await prisma.facilityMovement.findMany({
      where: { registrationId },
      include: {
        fromZone: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        toZone: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    return movements;
  }

  /**
   * Get zone movement analytics
   */
  static async getZoneAnalytics(eventId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.FacilityMovementWhereInput = {
      eventId,
    };

    if (startDate || endDate) {
      where.scannedAt = {};
      if (startDate) where.scannedAt.gte = startDate;
      if (endDate) where.scannedAt.lte = endDate;
    }

    const [movements, zones] = await Promise.all([
      prisma.facilityMovement.findMany({
        where,
        include: {
          toZone: true,
        },
      }),
      prisma.facilityZone.findMany({
        where: { eventId, isActive: true },
      }),
    ]);

    // Calculate zone visit counts
    const zoneVisits = zones.map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      visitCount: movements.filter(m => m.toZoneId === zone.id).length,
      currentOccupancy: zone.currentOccupancy,
      maxCapacity: zone.maxCapacity,
    }));

    return {
      totalMovements: movements.length,
      zoneVisits,
    };
  }
}
