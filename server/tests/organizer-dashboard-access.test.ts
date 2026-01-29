/**
 * Tests for OrganizerService.getDashboardAccessTier
 * Tests the tiered dashboard access system
 */

import { OrganizerService } from '../src/services/organizer.service';
import { prisma } from '../src/config/database';

// Mock database
jest.mock('../src/config/database', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
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
    warn: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  event: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
};

describe('OrganizerService.getDashboardAccessTier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tier 0 - No events', () => {
    it('should return tier 0 when organizer has no events', async () => {
      prismaMock.event.findMany.mockResolvedValue([]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(0);
      expect(result.hasApprovedEvent).toBe(false);
      expect(result.hasPendingEvent).toBe(false);
      expect(result.pendingEvents).toHaveLength(0);
      expect(result.approvedEvents).toHaveLength(0);
    });

    it('should return tier 0 when organizer only has rejected events', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Rejected Event', status: 'REJECTED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(0);
      expect(result.hasApprovedEvent).toBe(false);
      expect(result.hasPendingEvent).toBe(false);
    });

    it('should return tier 0 when organizer only has cancelled events', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Cancelled Event', status: 'CANCELLED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(0);
    });
  });

  describe('Tier 1 - Pending events only', () => {
    it('should return tier 1 when organizer has only pending events', async () => {
      const pendingEvent = {
        id: 'event-1',
        title: 'Pending Event',
        status: 'PENDING',
        createdAt: new Date('2026-01-15'),
      };
      prismaMock.event.findMany.mockResolvedValue([pendingEvent]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(1);
      expect(result.hasApprovedEvent).toBe(false);
      expect(result.hasPendingEvent).toBe(true);
      expect(result.pendingEvents).toHaveLength(1);
      expect(result.pendingEvents[0].id).toBe('event-1');
      expect(result.pendingEvents[0].title).toBe('Pending Event');
    });

    it('should return tier 1 with multiple pending events', async () => {
      const events = [
        { id: 'event-1', title: 'Event 1', status: 'PENDING', createdAt: new Date() },
        { id: 'event-2', title: 'Event 2', status: 'PENDING', createdAt: new Date() },
        { id: 'event-3', title: 'Event 3', status: 'REJECTED', createdAt: new Date() },
      ];
      prismaMock.event.findMany.mockResolvedValue(events);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(1);
      expect(result.pendingEvents).toHaveLength(2);
    });

    it('should return tier 1 even with high verification level if no approved events', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Pending Event', status: 'PENDING', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 3 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(1);
      expect(result.verificationLevel).toBe(3);
    });
  });

  describe('Tier 2 - Approved events with basic verification', () => {
    it('should return tier 2 when organizer has approved event with level 1 verification', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Approved Event', status: 'APPROVED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(2);
      expect(result.hasApprovedEvent).toBe(true);
      expect(result.approvedEvents).toHaveLength(1);
    });

    it('should return tier 2 when organizer has completed event', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Completed Event', status: 'COMPLETED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(2);
      expect(result.hasApprovedEvent).toBe(true);
    });

    it('should include both approved and pending events in results', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Approved Event', status: 'APPROVED', createdAt: new Date() },
        { id: 'event-2', title: 'Pending Event', status: 'PENDING', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(2);
      expect(result.hasApprovedEvent).toBe(true);
      expect(result.hasPendingEvent).toBe(true);
      expect(result.approvedEvents).toHaveLength(1);
      expect(result.pendingEvents).toHaveLength(1);
    });
  });

  describe('Tier 3 - Approved events with KYC verification', () => {
    it('should return tier 3 when organizer has approved event and level 2 verification', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Approved Event', status: 'APPROVED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 2 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(3);
      expect(result.verificationLevel).toBe(2);
    });

    it('should return tier 3 when organizer has approved event and level 3 verification', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Approved Event', status: 'APPROVED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 3 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(3);
      expect(result.verificationLevel).toBe(3);
    });

    it('should return tier 3 with completed events and high verification', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Completed Event', status: 'COMPLETED', createdAt: new Date() },
        { id: 'event-2', title: 'Approved Event', status: 'APPROVED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 2 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(3);
      expect(result.approvedEvents).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle user not found (default verification level 1)', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Approved Event', status: 'APPROVED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(2); // Has approved event but defaults to level 1
      expect(result.verificationLevel).toBe(1);
    });

    it('should handle mixed event statuses correctly', async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { id: 'event-1', title: 'Approved', status: 'APPROVED', createdAt: new Date() },
        { id: 'event-2', title: 'Pending', status: 'PENDING', createdAt: new Date() },
        { id: 'event-3', title: 'Rejected', status: 'REJECTED', createdAt: new Date() },
        { id: 'event-4', title: 'Cancelled', status: 'CANCELLED', createdAt: new Date() },
        { id: 'event-5', title: 'Completed', status: 'COMPLETED', createdAt: new Date() },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ verificationLevel: 1 });

      const result = await OrganizerService.getDashboardAccessTier('organizer-123');

      expect(result.tier).toBe(2);
      expect(result.approvedEvents).toHaveLength(2); // APPROVED and COMPLETED
      expect(result.pendingEvents).toHaveLength(1); // Only PENDING
    });
  });
});

describe('OrganizerService.hasApprovedEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when organizer has an approved event', async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: 'event-1' });

    const result = await OrganizerService.hasApprovedEvent('organizer-123');

    expect(result).toBe(true);
    expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
      where: {
        organizerId: 'organizer-123',
        deletedAt: null,
        status: { in: ['APPROVED', 'COMPLETED'] },
      },
      select: { id: true },
    });
  });

  it('should return false when organizer has no approved events', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    const result = await OrganizerService.hasApprovedEvent('organizer-123');

    expect(result).toBe(false);
  });
});
