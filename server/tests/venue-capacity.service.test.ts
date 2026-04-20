import { VenueCapacityService } from '../src/services/venue-capacity.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

// Mock database
vi.mock('../src/config/database', () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    facilityZone: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    eventRegistration: {
      count: vi.fn(),
    },
    attendeeZoneAccess: {
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  event: {
    findUnique: vi.Mock;
    update: vi.Mock;
  };
  facilityZone: {
    findUnique: vi.Mock;
    findMany: vi.Mock;
    update: vi.Mock;
    updateMany: vi.Mock;
  };
  eventRegistration: {
    count: vi.Mock;
  };
  attendeeZoneAccess: {
    count: vi.Mock;
  };
  $transaction: vi.Mock;
};

describe('VenueCapacityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setVenueCapacity', () => {
    it('should set venue capacity successfully', async () => {
      prismaMock.event.findUnique.mockResolvedValue({ id: 'event-123' });
      prismaMock.event.update.mockResolvedValue({});

      await VenueCapacityService.setVenueCapacity('event-123', 500);

      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { venueMaxCapacity: 500 },
      });
    });

    it('should set capacity to null (unlimited)', async () => {
      prismaMock.event.findUnique.mockResolvedValue({ id: 'event-123' });
      prismaMock.event.update.mockResolvedValue({});

      await VenueCapacityService.setVenueCapacity('event-123', null);

      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { venueMaxCapacity: null },
      });
    });

    it('should throw ValidationError for negative capacity', async () => {
      await expect(
        VenueCapacityService.setVenueCapacity('event-123', -10),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when event not found', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(
        VenueCapacityService.setVenueCapacity('nonexistent', 100),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCurrentOccupancy', () => {
    it('should return current occupancy', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueCurrentOccupancy: 150,
      });

      const occupancy = await VenueCapacityService.getCurrentOccupancy('event-123');

      expect(occupancy).toBe(150);
    });

    it('should throw NotFoundError when event not found', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(
        VenueCapacityService.getCurrentOccupancy('nonexistent'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCapacityStatus', () => {
    it('should return full capacity status', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: 'event-123',
        venueMaxCapacity: 100,
        venueCurrentOccupancy: 80,
      });

      const status = await VenueCapacityService.getCapacityStatus('event-123');

      expect(status.eventId).toBe('event-123');
      expect(status.maxCapacity).toBe(100);
      expect(status.currentOccupancy).toBe(80);
      expect(status.availableCapacity).toBe(20);
      expect(status.percentageFilled).toBe(80);
      expect(status.isAtCapacity).toBe(false);
      expect(status.thresholdBreached).toBe(80);
    });

    it('should return status at full capacity', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: 'event-123',
        venueMaxCapacity: 100,
        venueCurrentOccupancy: 100,
      });

      const status = await VenueCapacityService.getCapacityStatus('event-123');

      expect(status.isAtCapacity).toBe(true);
      expect(status.availableCapacity).toBe(0);
      expect(status.thresholdBreached).toBe(100);
    });

    it('should handle unlimited capacity', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: 'event-123',
        venueMaxCapacity: null,
        venueCurrentOccupancy: 500,
      });

      const status = await VenueCapacityService.getCapacityStatus('event-123');

      expect(status.maxCapacity).toBe(null);
      expect(status.availableCapacity).toBe(null);
      expect(status.isAtCapacity).toBe(false);
      expect(status.thresholdBreached).toBe(null);
    });
  });

  describe('incrementOccupancy', () => {
    it('should increment occupancy and return no alerts when below threshold', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueMaxCapacity: 100,
        venueCurrentOccupancy: 50,
      });
      prismaMock.event.update.mockResolvedValue({});

      const alerts = await VenueCapacityService.incrementOccupancy('event-123');

      expect(alerts).toHaveLength(0);
      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { venueCurrentOccupancy: 51 },
      });
    });

    it('should return alert when crossing 80% threshold', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueMaxCapacity: 100,
        venueCurrentOccupancy: 79,
      });
      prismaMock.event.update.mockResolvedValue({});

      const alerts = await VenueCapacityService.incrementOccupancy('event-123');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].threshold).toBe(80);
      expect(alerts[0].currentOccupancy).toBe(80);
    });

    it('should return multiple alerts when crossing multiple thresholds', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueMaxCapacity: 100,
        venueCurrentOccupancy: 69, // Below 70
      });
      prismaMock.event.update.mockResolvedValue({});

      // Increment by 12 to go from 69 to 81 (crossing 70 and 80)
      const alerts = await VenueCapacityService.incrementOccupancy('event-123', 12);

      expect(alerts).toHaveLength(2);
      expect(alerts[0].threshold).toBe(70);
      expect(alerts[1].threshold).toBe(80);
    });

    it('should handle increment when no max capacity set', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueMaxCapacity: null,
        venueCurrentOccupancy: 500,
      });
      prismaMock.event.update.mockResolvedValue({});

      const alerts = await VenueCapacityService.incrementOccupancy('event-123');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('decrementOccupancy', () => {
    it('should decrement occupancy', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueCurrentOccupancy: 50,
      });
      prismaMock.event.update.mockResolvedValue({});

      await VenueCapacityService.decrementOccupancy('event-123');

      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { venueCurrentOccupancy: 49 },
      });
    });

    it('should not go below zero', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueCurrentOccupancy: 0,
      });
      prismaMock.event.update.mockResolvedValue({});

      await VenueCapacityService.decrementOccupancy('event-123');

      expect(prismaMock.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { venueCurrentOccupancy: 0 },
      });
    });
  });

  describe('canCheckIn', () => {
    it('should return true when under capacity', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueMaxCapacity: 100,
        venueCurrentOccupancy: 80,
      });

      const canCheckIn = await VenueCapacityService.canCheckIn('event-123');

      expect(canCheckIn).toBe(true);
    });

    it('should return false when at capacity', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueMaxCapacity: 100,
        venueCurrentOccupancy: 100,
      });

      const canCheckIn = await VenueCapacityService.canCheckIn('event-123');

      expect(canCheckIn).toBe(false);
    });

    it('should return false when checking in multiple would exceed', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueMaxCapacity: 100,
        venueCurrentOccupancy: 98,
      });

      const canCheckIn = await VenueCapacityService.canCheckIn('event-123', 5);

      expect(canCheckIn).toBe(false);
    });

    it('should return true when no capacity limit', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        venueMaxCapacity: null,
        venueCurrentOccupancy: 1000,
      });

      const canCheckIn = await VenueCapacityService.canCheckIn('event-123');

      expect(canCheckIn).toBe(true);
    });
  });

  describe('getZoneCapacityOverview', () => {
    it('should return capacity for all zones', async () => {
      const mockZones = [
        {
          id: 'zone-1',
          name: 'VIP Lounge',
          code: 'VIP',
          maxCapacity: 50,
          currentOccupancy: 30,
        },
        {
          id: 'zone-2',
          name: 'General Area',
          code: 'GEN',
          maxCapacity: null,
          currentOccupancy: 200,
        },
      ];
      prismaMock.facilityZone.findMany.mockResolvedValue(mockZones);

      const zones = await VenueCapacityService.getZoneCapacityOverview('event-123');

      expect(zones).toHaveLength(2);
      expect(zones[0].zoneId).toBe('zone-1');
      expect(zones[0].percentageFilled).toBe(60);
      expect(zones[0].isAtCapacity).toBe(false);
      expect(zones[1].maxCapacity).toBe(null);
      expect(zones[1].isAtCapacity).toBe(false);
    });
  });

  describe('incrementZoneOccupancy', () => {
    it('should increment zone occupancy and return alert when crossing threshold', async () => {
      prismaMock.facilityZone.findUnique.mockResolvedValue({
        eventId: 'event-123',
        name: 'VIP Lounge',
        maxCapacity: 100,
        currentOccupancy: 79,
      });
      prismaMock.facilityZone.update.mockResolvedValue({});

      const alerts = await VenueCapacityService.incrementZoneOccupancy('zone-1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('zone');
      expect(alerts[0].zoneId).toBe('zone-1');
      expect(alerts[0].zoneName).toBe('VIP Lounge');
      expect(alerts[0].threshold).toBe(80);
    });
  });

  describe('canEnterZone', () => {
    it('should return true when under zone capacity', async () => {
      prismaMock.facilityZone.findUnique.mockResolvedValue({
        maxCapacity: 50,
        currentOccupancy: 30,
      });

      const canEnter = await VenueCapacityService.canEnterZone('zone-1');

      expect(canEnter).toBe(true);
    });

    it('should return false when zone at capacity', async () => {
      prismaMock.facilityZone.findUnique.mockResolvedValue({
        maxCapacity: 50,
        currentOccupancy: 50,
      });

      const canEnter = await VenueCapacityService.canEnterZone('zone-1');

      expect(canEnter).toBe(false);
    });
  });

  describe('resetOccupancy', () => {
    it('should reset all occupancy counters', async () => {
      prismaMock.$transaction.mockImplementation(async (operations: unknown[]) => {
        return Promise.all(operations);
      });
      prismaMock.event.update.mockResolvedValue({});
      prismaMock.facilityZone.updateMany.mockResolvedValue({ count: 5 });

      await VenueCapacityService.resetOccupancy('event-123');

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getCapacityOverview', () => {
    it('should return combined venue and zone overview', async () => {
      prismaMock.event.findUnique.mockResolvedValue({
        id: 'event-123',
        venueMaxCapacity: 500,
        venueCurrentOccupancy: 250,
      });
      prismaMock.facilityZone.findMany.mockResolvedValue([
        {
          id: 'zone-1',
          name: 'VIP',
          code: 'VIP',
          maxCapacity: 50,
          currentOccupancy: 50,
        },
        {
          id: 'zone-2',
          name: 'General',
          code: 'GEN',
          maxCapacity: 200,
          currentOccupancy: 100,
        },
      ]);

      const overview = await VenueCapacityService.getCapacityOverview('event-123');

      expect(overview.venue.percentageFilled).toBe(50);
      expect(overview.zones).toHaveLength(2);
      expect(overview.summary.totalZones).toBe(2);
      expect(overview.summary.zonesAtCapacity).toBe(1);
      expect(overview.summary.totalZoneCapacity).toBe(250);
      expect(overview.summary.totalZoneOccupancy).toBe(150);
    });
  });
});
