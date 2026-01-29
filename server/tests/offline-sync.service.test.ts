import { OfflineSyncService } from '../src/services/offline-sync.service';
import { NotFoundError, ValidationError } from '../src/utils/errors';
import { prisma } from '../src/config/database';

// Mock database
jest.mock('../src/config/database', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    eventRegistration: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    facilityZone: {
      findMany: jest.fn(),
    },
    checkpointScan: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    checkpoint: {
      findUnique: jest.fn(),
    },
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
  eventRegistration: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  facilityZone: {
    findMany: jest.Mock;
  };
  checkpointScan: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
  };
  checkpoint: {
    findUnique: jest.Mock;
  };
};

describe('OfflineSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventDataForOffline', () => {
    const mockEvent = {
      id: 'event-123',
      title: 'Test Event',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-01-16'),
    };

    const mockRegistrations = [
      {
        id: 'reg-1',
        attendee: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        ticketLineItems: [{ ticketType: 'VIP' }],
        qrCode: 'QR123',
        backupCode: 'BACKUP123',
        isCurrentlyInside: false,
        checkedInAt: null,
        zoneAccess: [{ zoneId: 'zone-1' }, { zoneId: 'zone-2' }],
      },
      {
        id: 'reg-2',
        attendee: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
        ticketLineItems: [{ ticketType: 'General' }],
        qrCode: 'QR456',
        backupCode: null,
        isCurrentlyInside: true,
        checkedInAt: new Date('2026-01-15T10:00:00Z'),
        zoneAccess: [],
      },
    ];

    const mockZones = [
      {
        id: 'zone-1',
        name: 'VIP Lounge',
        code: 'VIP',
        maxCapacity: 50,
        currentOccupancy: 10,
        accessStart: null,
        accessEnd: null,
        isActive: true,
      },
      {
        id: 'zone-2',
        name: 'General Area',
        code: 'GEN',
        maxCapacity: null,
        currentOccupancy: 100,
        accessStart: new Date('2026-01-15T08:00:00Z'),
        accessEnd: new Date('2026-01-15T22:00:00Z'),
        isActive: true,
      },
    ];

    it('should return event data for offline caching', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findMany.mockResolvedValue(mockRegistrations);
      prismaMock.facilityZone.findMany.mockResolvedValue(mockZones);

      const result = await OfflineSyncService.getEventDataForOffline(
        'event-123',
        'user-123',
      );

      expect(result.event).toEqual(mockEvent);
      expect(result.attendees).toHaveLength(2);
      expect(result.attendees[0].registrationId).toBe('reg-1');
      expect(result.attendees[0].fullName).toBe('John Doe');
      expect(result.attendees[0].authorizedZones).toEqual(['zone-1', 'zone-2']);
      expect(result.attendees[1].authorizedZones).toEqual([]);
      expect(result.zones).toHaveLength(2);
      expect(result.zones[0].zoneId).toBe('zone-1');
    });

    it('should throw NotFoundError when event does not exist', async () => {
      prismaMock.event.findUnique.mockResolvedValue(null);

      await expect(
        OfflineSyncService.getEventDataForOffline('nonexistent', 'user-123'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle attendees without ticket line items', async () => {
      const regWithoutTicket = {
        ...mockRegistrations[0],
        ticketLineItems: [],
      };
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findMany.mockResolvedValue([regWithoutTicket]);
      prismaMock.facilityZone.findMany.mockResolvedValue([]);

      const result = await OfflineSyncService.getEventDataForOffline(
        'event-123',
        'user-123',
      );

      expect(result.attendees[0].ticketType).toBeUndefined();
    });

    it('should handle empty names gracefully', async () => {
      const regWithEmptyName = {
        ...mockRegistrations[0],
        attendee: {
          firstName: null,
          lastName: null,
          email: 'empty@example.com',
        },
      };
      prismaMock.event.findUnique.mockResolvedValue(mockEvent);
      prismaMock.eventRegistration.findMany.mockResolvedValue([regWithEmptyName]);
      prismaMock.facilityZone.findMany.mockResolvedValue([]);

      const result = await OfflineSyncService.getEventDataForOffline(
        'event-123',
        'user-123',
      );

      expect(result.attendees[0].fullName).toBe('');
    });
  });

  describe('processBatchScans', () => {
    const mockScan = {
      id: 'mobile-scan-1',
      registrationId: 'reg-1',
      checkpointId: 'checkpoint-1',
      qrCode: 'QR123',
      codeType: 'QR',
      signatureValid: true,
      scannedAt: new Date('2026-01-15T10:00:00Z'),
      scannedBy: 'user-123',
      deviceInfo: { deviceId: 'device-1', deviceType: 'mobile' },
    };

    it('should process batch scans successfully', async () => {
      prismaMock.checkpointScan.findFirst.mockResolvedValue(null); // No duplicate
      prismaMock.checkpointScan.count.mockResolvedValue(0); // First scan
      prismaMock.checkpoint.findUnique.mockResolvedValue({ eventId: 'event-123' });
      prismaMock.checkpointScan.create.mockResolvedValue({ id: 'server-scan-1' });

      const result = await OfflineSyncService.processBatchScans([mockScan]);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(0);
      expect(result.conflicts).toHaveLength(0);
      expect(prismaMock.checkpointScan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          checkpointId: 'checkpoint-1',
          registrationId: 'reg-1',
          eventId: 'event-123',
          scannedBy: 'user-123',
          scanNumber: 1,
          isValid: true,
        }),
      });
    });

    it('should detect duplicate scans within time window', async () => {
      const existingScan = {
        id: 'existing-scan-1',
        scannedAt: new Date('2026-01-15T10:02:00Z'), // 2 minutes difference
      };
      prismaMock.checkpointScan.findFirst.mockResolvedValue(existingScan);

      const result = await OfflineSyncService.processBatchScans([mockScan]);

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].reason).toBe('duplicate_scan');
      expect(result.conflicts[0].mobileId).toBe('mobile-scan-1');
      expect(result.conflicts[0].serverId).toBe('existing-scan-1');
    });

    it('should handle multiple scans in batch', async () => {
      const scan2 = { ...mockScan, id: 'mobile-scan-2', registrationId: 'reg-2' };
      const scan3 = { ...mockScan, id: 'mobile-scan-3', registrationId: 'reg-3' };

      prismaMock.checkpointScan.findFirst
        .mockResolvedValueOnce(null) // scan 1: no duplicate
        .mockResolvedValueOnce({ id: 'dup', scannedAt: new Date() }) // scan 2: duplicate
        .mockResolvedValueOnce(null); // scan 3: no duplicate

      prismaMock.checkpointScan.count.mockResolvedValue(0);
      prismaMock.checkpoint.findUnique.mockResolvedValue({ eventId: 'event-123' });
      prismaMock.checkpointScan.create.mockResolvedValue({ id: 'new-scan' });

      const result = await OfflineSyncService.processBatchScans([
        mockScan,
        scan2,
        scan3,
      ]);

      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.conflicts).toHaveLength(1);
    });

    it('should handle checkpoint not found error', async () => {
      prismaMock.checkpointScan.findFirst.mockResolvedValue(null);
      prismaMock.checkpointScan.count.mockResolvedValue(0);
      prismaMock.checkpoint.findUnique.mockResolvedValue(null);

      const result = await OfflineSyncService.processBatchScans([mockScan]);

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.conflicts[0].reason).toBe('processing_error');
      expect(result.conflicts[0].details.error).toContain('Checkpoint not found');
    });

    it('should increment scan number correctly', async () => {
      prismaMock.checkpointScan.findFirst.mockResolvedValue(null);
      prismaMock.checkpointScan.count.mockResolvedValue(5); // 5 existing scans
      prismaMock.checkpoint.findUnique.mockResolvedValue({ eventId: 'event-123' });
      prismaMock.checkpointScan.create.mockResolvedValue({ id: 'new-scan' });

      await OfflineSyncService.processBatchScans([mockScan]);

      expect(prismaMock.checkpointScan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scanNumber: 6, // Should be count + 1
        }),
      });
    });

    it('should handle empty batch', async () => {
      const result = await OfflineSyncService.processBatchScans([]);

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('detectConflicts', () => {
    it('should detect scans within time window as conflicts', async () => {
      const baseTime = new Date('2026-01-15T10:00:00Z');
      const mockScans = [
        {
          id: 'scan-1',
          registrationId: 'reg-1',
          checkpointId: 'cp-1',
          scannedAt: baseTime,
        },
        {
          id: 'scan-2',
          registrationId: 'reg-1',
          checkpointId: 'cp-1',
          scannedAt: new Date(baseTime.getTime() + 2 * 60 * 1000), // 2 min later
        },
      ];

      prismaMock.checkpointScan.findMany.mockResolvedValue(mockScans);

      const conflicts = await OfflineSyncService.detectConflicts('event-123', 5);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].registrationId).toBe('reg-1');
      expect(conflicts[0].checkpointId).toBe('cp-1');
      expect(conflicts[0].status).toBe('pending');
    });

    it('should not detect scans outside time window', async () => {
      const baseTime = new Date('2026-01-15T10:00:00Z');
      const mockScans = [
        {
          id: 'scan-1',
          registrationId: 'reg-1',
          checkpointId: 'cp-1',
          scannedAt: baseTime,
        },
        {
          id: 'scan-2',
          registrationId: 'reg-1',
          checkpointId: 'cp-1',
          scannedAt: new Date(baseTime.getTime() + 10 * 60 * 1000), // 10 min later
        },
      ];

      prismaMock.checkpointScan.findMany.mockResolvedValue(mockScans);

      const conflicts = await OfflineSyncService.detectConflicts('event-123', 5);

      expect(conflicts).toHaveLength(0);
    });

    it('should not detect scans at different checkpoints as conflicts', async () => {
      const baseTime = new Date('2026-01-15T10:00:00Z');
      const mockScans = [
        {
          id: 'scan-1',
          registrationId: 'reg-1',
          checkpointId: 'cp-1',
          scannedAt: baseTime,
        },
        {
          id: 'scan-2',
          registrationId: 'reg-1',
          checkpointId: 'cp-2', // Different checkpoint
          scannedAt: new Date(baseTime.getTime() + 1 * 60 * 1000),
        },
      ];

      prismaMock.checkpointScan.findMany.mockResolvedValue(mockScans);

      const conflicts = await OfflineSyncService.detectConflicts('event-123', 5);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle custom time window', async () => {
      const baseTime = new Date('2026-01-15T10:00:00Z');
      const mockScans = [
        {
          id: 'scan-1',
          registrationId: 'reg-1',
          checkpointId: 'cp-1',
          scannedAt: baseTime,
        },
        {
          id: 'scan-2',
          registrationId: 'reg-1',
          checkpointId: 'cp-1',
          scannedAt: new Date(baseTime.getTime() + 8 * 60 * 1000), // 8 min later
        },
      ];

      prismaMock.checkpointScan.findMany.mockResolvedValue(mockScans);

      // With 5 min window - no conflict
      let conflicts = await OfflineSyncService.detectConflicts('event-123', 5);
      expect(conflicts).toHaveLength(0);

      // With 10 min window - conflict detected
      conflicts = await OfflineSyncService.detectConflicts('event-123', 10);
      expect(conflicts).toHaveLength(1);
    });
  });

  describe('resolveConflict', () => {
    // Use IDs without hyphens since the service uses simple split('-')
    const serverScan = {
      id: 'srv001',
      scannedAt: new Date('2026-01-15T10:00:00Z'),
    };
    const mobileScan = {
      id: 'mob001',
      scannedAt: new Date('2026-01-15T10:02:00Z'),
    };

    it('should keep first scan when resolution is keep_first', async () => {
      prismaMock.checkpointScan.findUnique
        .mockResolvedValueOnce(serverScan)
        .mockResolvedValueOnce(mobileScan);
      prismaMock.checkpointScan.delete.mockResolvedValue({});

      await OfflineSyncService.resolveConflict(
        'conflict-srv001-mob001',
        'keep_first',
      );

      // Should delete the later scan (mobile)
      expect(prismaMock.checkpointScan.delete).toHaveBeenCalledWith({
        where: { id: 'mob001' },
      });
    });

    it('should keep latest scan when resolution is keep_latest', async () => {
      prismaMock.checkpointScan.findUnique
        .mockResolvedValueOnce(serverScan)
        .mockResolvedValueOnce(mobileScan);
      prismaMock.checkpointScan.delete.mockResolvedValue({});

      await OfflineSyncService.resolveConflict(
        'conflict-srv001-mob001',
        'keep_latest',
      );

      // Should delete the earlier scan (server)
      expect(prismaMock.checkpointScan.delete).toHaveBeenCalledWith({
        where: { id: 'srv001' },
      });
    });

    it('should keep both scans when resolution is keep_both', async () => {
      prismaMock.checkpointScan.findUnique
        .mockResolvedValueOnce(serverScan)
        .mockResolvedValueOnce(mobileScan);

      await OfflineSyncService.resolveConflict(
        'conflict-srv001-mob001',
        'keep_both',
      );

      expect(prismaMock.checkpointScan.delete).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid conflict ID', async () => {
      await expect(
        OfflineSyncService.resolveConflict('invalid', 'keep_first'),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when scan not found', async () => {
      prismaMock.checkpointScan.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mobileScan);

      await expect(
        OfflineSyncService.resolveConflict('conflict-srv001-mob001', 'keep_first'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid resolution strategy', async () => {
      prismaMock.checkpointScan.findUnique
        .mockResolvedValueOnce(serverScan)
        .mockResolvedValueOnce(mobileScan);

      await expect(
        OfflineSyncService.resolveConflict(
          'conflict-srv001-mob001',
          'invalid' as any,
        ),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status with all counts', async () => {
      prismaMock.eventRegistration.count.mockResolvedValue(100);
      prismaMock.checkpointScan.count
        .mockResolvedValueOnce(250) // total scans
        .mockResolvedValueOnce(15); // user scans today

      const result = await OfflineSyncService.getSyncStatus('event-123', 'user-123');

      expect(result.totalAttendees).toBe(100);
      expect(result.totalScans).toBe(250);
      expect(result.userScansToday).toBe(15);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should query with correct filters', async () => {
      prismaMock.eventRegistration.count.mockResolvedValue(0);
      prismaMock.checkpointScan.count.mockResolvedValue(0);

      await OfflineSyncService.getSyncStatus('event-123', 'user-123');

      // Check eventRegistration query
      expect(prismaMock.eventRegistration.count).toHaveBeenCalledWith({
        where: {
          eventId: 'event-123',
          status: 'CONFIRMED',
        },
      });

      // Check checkpointScan query for total
      expect(prismaMock.checkpointScan.count).toHaveBeenCalledWith({
        where: {
          checkpoint: {
            eventId: 'event-123',
          },
        },
      });

      // Check checkpointScan query for user today
      expect(prismaMock.checkpointScan.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scannedBy: 'user-123',
          }),
        }),
      );
    });

    it('should handle zero counts', async () => {
      prismaMock.eventRegistration.count.mockResolvedValue(0);
      prismaMock.checkpointScan.count.mockResolvedValue(0);

      const result = await OfflineSyncService.getSyncStatus('event-123', 'user-123');

      expect(result.totalAttendees).toBe(0);
      expect(result.totalScans).toBe(0);
      expect(result.userScansToday).toBe(0);
    });
  });
});
