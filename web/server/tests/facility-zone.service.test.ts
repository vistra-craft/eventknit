import { FacilityZoneService } from '../src/services/facility-zone.service';
import { ValidationError, NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

// Mock database
jest.mock('../src/config/database', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    facilityZone: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eventFacility: {
      findUnique: jest.fn(),
    },
    facilityZoneMapping: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    attendeeZoneAccess: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    facilityMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    eventRegistration: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  event: {
    findUnique: jest.Mock;
  };
  facilityZone: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  eventFacility: {
    findUnique: jest.Mock;
  };
  facilityZoneMapping: {
    create: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
  attendeeZoneAccess: {
    createMany: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  facilityMovement: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  eventRegistration: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('FacilityZoneService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createZone', () => {
    it('should create a facility zone successfully', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
      };

      const mockZone = {
        id: 'zone-1',
        eventId: 'event-1',
        name: 'VIP Lounge',
        code: 'VIP',
        description: null,
        maxCapacity: 100,
        currentOccupancy: 0,
        accessStart: null,
        accessEnd: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.facilityZone.findUnique.mockResolvedValue(null);
      prismaMock.facilityZone.create.mockResolvedValue(mockZone);

      const result = await FacilityZoneService.createZone(
        {
          eventId: 'event-1',
          name: 'VIP Lounge',
          code: 'VIP',
          maxCapacity: 100,
        },
        'user-1',
      );

      expect(result).toEqual(mockZone);
      expect(result.name).toBe('VIP Lounge');
      expect(result.maxCapacity).toBe(100);
    });

    it('should throw NotFoundError if event does not exist', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(
        FacilityZoneService.createZone(
          {
            eventId: 'invalid-event',
            name: 'VIP Lounge',
            code: 'VIP',
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getEventZones', () => {
    it('should get all active zones for an event', async () => {
      const mockZones = [
        {
          id: 'zone-1',
          eventId: 'event-1',
          name: 'VIP Lounge',
          code: 'VIP',
          maxCapacity: 100,
          currentOccupancy: 25,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.facilityZone.findMany.mockResolvedValue(mockZones);

      const result = await FacilityZoneService.getEventZones('event-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('VIP Lounge');
    });
  });

  describe('updateZone', () => {
    it('should update a zone successfully', async () => {
      const mockZone = {
        id: 'zone-1',
        eventId: 'event-1',
        name: 'VIP Lounge Updated',
        code: 'VIP',
        maxCapacity: 150,
        currentOccupancy: 25,
        accessStart: null,
        accessEnd: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.facilityZone.update.mockResolvedValue(mockZone);

      const result = await FacilityZoneService.updateZone('zone-1', {
        name: 'VIP Lounge Updated',
        maxCapacity: 150,
      });

      expect(result.name).toBe('VIP Lounge Updated');
      expect(result.maxCapacity).toBe(150);
    });

    it('should throw NotFoundError if zone does not exist', async () => {
      const error: any = new Error('Record not found');
      error.code = 'P2025';
      prismaMock.facilityZone.update.mockRejectedValue(error);

      await expect(
        FacilityZoneService.updateZone('invalid-zone-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteZone', () => {
    it('should delete a zone successfully', async () => {
      const mockZone = {
        id: 'zone-1',
        eventId: 'event-1',
        name: 'VIP Lounge',
        code: 'VIP',
      };

      prismaMock.facilityZone.findUnique.mockResolvedValue(mockZone);
      prismaMock.facilityZone.delete.mockResolvedValue(mockZone);

      const result = await FacilityZoneService.deleteZone('zone-1');

      expect(result).toEqual({ message: 'Zone deleted successfully' });
    });

    it('should throw NotFoundError if zone does not exist', async () => {
      prismaMock.facilityZone.findUnique.mockResolvedValue(null);

      await expect(
        FacilityZoneService.deleteZone('invalid-zone-id'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('assignFacilityToZone', () => {
    it('should assign a facility to a zone successfully', async () => {
      const mockFacility = {
        id: 'facility-1',
        eventId: 'event-1',
        name: 'Main Hall',
      };

      const mockZone = {
        id: 'zone-1',
        eventId: 'event-1',
        name: 'VIP Lounge',
      };

      const mockMapping = {
        id: 'mapping-1',
        facilityId: 'facility-1',
        zoneId: 'zone-1',
        facility: mockFacility,
        zone: mockZone,
      };

      prismaMock.eventFacility.findUnique.mockResolvedValue(mockFacility);
      prismaMock.facilityZone.findUnique.mockResolvedValue(mockZone);
      prismaMock.facilityZoneMapping.findUnique.mockResolvedValue(null);
      prismaMock.facilityZoneMapping.create.mockResolvedValue(mockMapping);

      const result = await FacilityZoneService.assignFacilityToZone(
        'facility-1',
        'zone-1',
      );

      expect(result.facilityId).toBe('facility-1');
      expect(result.zoneId).toBe('zone-1');
    });

    it('should throw ValidationError if facility is already assigned', async () => {
      const mockFacility = {
        id: 'facility-1',
        eventId: 'event-1',
        name: 'Main Hall',
      };

      const mockZone = {
        id: 'zone-1',
        eventId: 'event-1',
        name: 'VIP Lounge',
      };

      const existingMapping = {
        id: 'mapping-1',
        facilityId: 'facility-1',
        zoneId: 'zone-1',
      };

      prismaMock.eventFacility.findUnique.mockResolvedValue(mockFacility);
      prismaMock.facilityZone.findUnique.mockResolvedValue(mockZone);
      prismaMock.facilityZoneMapping.findUnique.mockResolvedValue(
        existingMapping,
      );

      await expect(
        FacilityZoneService.assignFacilityToZone('facility-1', 'zone-1'),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateZoneAccess', () => {
    it('should validate access successfully for valid attendee', async () => {
      const mockAccess = {
        id: 'access-1',
        registrationId: 'reg-1',
        zoneId: 'zone-1',
        grantedAt: new Date(),
        grantedBy: 'admin-1',
        expiresAt: null,
        isActive: true,
        accessCount: 0,
        lastAccessAt: null,
        zone: {
          id: 'zone-1',
          name: 'VIP Lounge',
          code: 'VIP',
          accessStart: null,
          accessEnd: null,
          eventId: 'event-1',
          maxCapacity: 100,
          currentOccupancy: 25,
          isActive: true,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prismaMock.attendeeZoneAccess.findUnique.mockResolvedValue(mockAccess);

      const result = await FacilityZoneService.validateZoneAccess(
        'reg-1',
        'zone-1',
      );

      expect(result.allowed).toBe(true);
      expect(result.access).toBeTruthy();
    });

    it('should reject access if attendee does not have permission', async () => {
      prismaMock.attendeeZoneAccess.findUnique.mockResolvedValue(null);

      const result = await FacilityZoneService.validateZoneAccess(
        'reg-1',
        'zone-1',
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No access permission');
    });

    it('should reject access if access has expired', async () => {
      const expiredAccess = {
        id: 'access-1',
        registrationId: 'reg-1',
        zoneId: 'zone-1',
        grantedAt: new Date(),
        grantedBy: 'admin-1',
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
        isActive: true,
        accessCount: 0,
        lastAccessAt: null,
        zone: {
          id: 'zone-1',
          name: 'VIP Lounge',
          code: 'VIP',
          accessStart: null,
          accessEnd: null,
          eventId: 'event-1',
          maxCapacity: 100,
          currentOccupancy: 25,
          isActive: true,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      prismaMock.attendeeZoneAccess.findUnique.mockResolvedValue(expiredAccess);

      const result = await FacilityZoneService.validateZoneAccess(
        'reg-1',
        'zone-1',
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Access expired');
    });
  });

  describe('checkZoneCapacity', () => {
    it('should return capacity information', async () => {
      const mockZone = {
        id: 'zone-1',
        eventId: 'event-1',
        name: 'VIP Lounge',
        code: 'VIP',
        maxCapacity: 100,
        currentOccupancy: 75,
        accessStart: null,
        accessEnd: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.facilityZone.findUnique.mockResolvedValue(mockZone);

      const result = await FacilityZoneService.checkZoneCapacity('zone-1');

      expect(result.currentOccupancy).toBe(75);
      expect(result.maxCapacity).toBe(100);
      expect(result.percentFull).toBe(75);
      expect(result.availableCapacity).toBe(25);
      expect(result.isFull).toBe(false);
    });

    it('should indicate at capacity when full', async () => {
      const mockZone = {
        id: 'zone-1',
        eventId: 'event-1',
        name: 'VIP Lounge',
        code: 'VIP',
        maxCapacity: 100,
        currentOccupancy: 100,
        accessStart: null,
        accessEnd: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.facilityZone.findUnique.mockResolvedValue(mockZone);

      const result = await FacilityZoneService.checkZoneCapacity('zone-1');

      expect(result.isFull).toBe(true);
      expect(result.availableCapacity).toBe(0);
    });

    it('should handle unlimited capacity (null maxCapacity)', async () => {
      const mockZone = {
        id: 'zone-1',
        eventId: 'event-1',
        name: 'General Area',
        code: 'GEN',
        maxCapacity: null,
        currentOccupancy: 500,
        accessStart: null,
        accessEnd: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.facilityZone.findUnique.mockResolvedValue(mockZone);

      const result = await FacilityZoneService.checkZoneCapacity('zone-1');

      expect(result.maxCapacity).toBeNull();
      expect(result.percentFull).toBe(0);
      expect(result.isFull).toBe(false);
      expect(result.availableCapacity).toBeNull();
    });
  });
});
