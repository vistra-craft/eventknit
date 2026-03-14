/**
 * Unit tests for OrganizerService.getOrganizerEvents authorization
 * Tests the authorization logic allowing ATTENDEE users to view their created events
 */

import { OrganizerService } from '../../../src/services/organizer.service.js';
import { prisma } from '../../../src/config/database.js';
import { AuthorizationError } from '../../../src/utils/errors.js';
import { UserRole, EventStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));
jest.mock('../../../src/utils/logger.js');

// Cast prisma to any to allow jest methods
const prismaMock = prisma as any;

describe('OrganizerService.getOrganizerEvents - Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEvents = [
    {
      id: 'event-1',
      title: 'Test Conference',
      description: 'A test event',
      fullDescription: 'A test event full description',
      location: 'Nairobi',
      venue: 'Convention Center',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-02'),
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      status: EventStatus.PENDING,
      organizerId: 'user-123',
      category: 'Technology',
      capacity: 100,
      price: 5000,
      isFree: false,
      image: 'https://example.com/image.jpg',
      duration: '1 day',
      ageRestriction: '18+',
      speakers: [{ name: 'John Speaker', title: 'CEO', bio: 'Bio' }],
      sponsors: [{ name: 'Sponsor Co', level: 'Gold', logo: 'url' }],
      organizer: {
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      },
      registrations: [],
      _count: {
        registrations: 0,
      },
      deletedAt: null,
      createdAt: new Date('2026-02-01'),
    },
  ];

  // ─── ATTENDEE Role (New Authorization) ───────────────────────────────

  describe('ATTENDEE role authorization', () => {
    it('should allow ATTENDEE users to fetch their created events', async () => {
      prismaMock.event.findMany.mockResolvedValue(mockEvents);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        { limit: 10 },
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        id: 'event-1',
        title: 'Test Conference',
        status: 'pending',
      });
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(false);
      
      // Verify query was made with correct organizer ID
      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizerId: 'user-123',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should return empty array for ATTENDEE with no created events', async () => {
      prismaMock.event.findMany.mockResolvedValue([]);
      prismaMock.event.count.mockResolvedValue(0);

      const result = await OrganizerService.getOrganizerEvents(
        'user-456',
        UserRole.ATTENDEE,
        {},
      );

      expect(result.events).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should filter PENDING events for ATTENDEE users', async () => {
      const pendingEvents = [
        { ...mockEvents[0], status: EventStatus.PENDING },
      ];
      prismaMock.event.findMany.mockResolvedValue(pendingEvents);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        { status: 'PENDING' },
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0].status).toBe('pending');
      
      // Verify status filter was applied
      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });

    it('should allow ATTENDEE to search their created events', async () => {
      prismaMock.event.findMany.mockResolvedValue(mockEvents);
      prismaMock.event.count.mockResolvedValue(1);

      await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        { search: 'Conference' },
      );

      // Verify search was applied
      const call = prismaMock.event.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: { contains: 'Conference', mode: 'insensitive' },
          }),
          expect.objectContaining({
            description: { contains: 'Conference', mode: 'insensitive' },
          }),
          expect.objectContaining({
            location: { contains: 'Conference', mode: 'insensitive' },
          }),
        ]),
      );
    });
  });

  // ─── ORGANIZER Role (Existing Authorization) ──────────────────────────

  describe('ORGANIZER role authorization', () => {
    it('should allow ORGANIZER users to fetch their events', async () => {
      prismaMock.event.findMany.mockResolvedValue(mockEvents);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ORGANIZER,
        {},
      );

      expect(result.events).toHaveLength(1);
      expect(prismaMock.event.findMany).toHaveBeenCalled();
    });
  });

  // ─── ORGANIZER_ADMIN Role ─────────────────────────────────────────────

  describe('ORGANIZER_ADMIN role authorization', () => {
    it('should allow ORGANIZER_ADMIN users to fetch organizer events', async () => {
      prismaMock.event.findMany.mockResolvedValue(mockEvents);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ORGANIZER_ADMIN,
        {},
      );

      expect(result.events).toHaveLength(1);
      expect(prismaMock.event.findMany).toHaveBeenCalled();
    });
  });

  // ─── ORGANIZER_TELLER Role ────────────────────────────────────────────

  describe('ORGANIZER_TELLER role authorization', () => {
    it('should allow ORGANIZER_TELLER users to fetch events', async () => {
      prismaMock.event.findMany.mockResolvedValue(mockEvents);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ORGANIZER_TELLER,
        {},
      );

      expect(result.events).toHaveLength(1);
      expect(prismaMock.event.findMany).toHaveBeenCalled();
    });
  });

  // ─── ADMIN Roles ──────────────────────────────────────────────────────

  describe('Admin role authorization', () => {
    it('should allow SUPERADMIN users to fetch organizer events', async () => {
      prismaMock.event.findMany.mockResolvedValue(mockEvents);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.SUPERADMIN,
        {},
      );

      expect(result.events).toHaveLength(1);
      expect(prismaMock.event.findMany).toHaveBeenCalled();
    });

    it('should allow ADMIN users to fetch organizer events', async () => {
      prismaMock.event.findMany.mockResolvedValue(mockEvents);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ADMIN,
        {},
      );

      expect(result.events).toHaveLength(1);
      expect(prismaMock.event.findMany).toHaveBeenCalled();
    });
  });

  // ─── Unauthorized Roles ───────────────────────────────────────────────

  describe('Unauthorized role rejection', () => {
    it('should reject SUPPORT role', async () => {
      await expect(
        OrganizerService.getOrganizerEvents(
          'user-123',
          UserRole.SUPPORT,
          {},
        ),
      ).rejects.toThrow(AuthorizationError);

      expect(prismaMock.event.findMany).not.toHaveBeenCalled();
    });

    it('should reject TELLER role', async () => {
      await expect(
        OrganizerService.getOrganizerEvents(
          'user-123',
          UserRole.TELLER,
          {},
        ),
      ).rejects.toThrow(AuthorizationError);

      expect(prismaMock.event.findMany).not.toHaveBeenCalled();
    });

  });

  // ─── Filters and Pagination ───────────────────────────────────────────

  describe('Query filters for ATTENDEE users', () => {
    beforeEach(() => {
      prismaMock.event.findMany.mockResolvedValue([]);
      prismaMock.event.count.mockResolvedValue(0);
    });

    it('should apply status filter', async () => {
      await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        { status: 'APPROVED' },
      );

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
          }),
        }),
      );
    });

    it('should apply category filter', async () => {
      await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        { category: 'Technology' },
      );

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Technology',
          }),
        }),
      );
    });

    it('should apply upcoming filter', async () => {
      await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        { upcoming: true },
      );

      const call = prismaMock.event.findMany.mock.calls[0][0];
      expect(call.where.startDate).toBeDefined();
      expect(call.where.startDate.gte).toBeInstanceOf(Date);
    });

    it('should handle pagination correctly', async () => {
      await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        { page: 2, limit: 20 },
      );

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page - 1) * limit = (2 - 1) * 20
          take: 20,
        }),
      );
    });

    it('should default to page 1 and limit 50', async () => {
      await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        {},
      );

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        }),
      );
    });
  });

  // ─── Data Transformation ──────────────────────────────────────────────

  describe('Event data transformation for ATTENDEE users', () => {
    it('should transform event status to pending for PENDING status', async () => {
      const eventsWithStatus = [
        { ...mockEvents[0], status: EventStatus.PENDING },
      ];
      prismaMock.event.findMany.mockResolvedValue(eventsWithStatus);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        {},
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0].status).toBe('pending');
    });

    it('should calculate attendees count from confirmed registrations', async () => {
      const eventWithRegistrations = {
        ...mockEvents[0],
        registrations: [
          { id: 'reg-1', status: 'CONFIRMED', quantity: 2, totalAmount: 1000 },
          { id: 'reg-2', status: 'CONFIRMED', quantity: 3, totalAmount: 1500 },
          { id: 'reg-3', status: 'PENDING', quantity: 1, totalAmount: 500 },
        ],
      };
      prismaMock.event.findMany.mockResolvedValue([eventWithRegistrations]);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        {},
      );

      // Should count confirmed registrations: 2 + 3 = 5
      expect(result.events[0].attendees).toBe(5);
    });

    it('should calculate revenue from confirmed registrations only', async () => {
      const eventWithRevenue = {
        ...mockEvents[0],
        registrations: [
          { id: 'reg-1', status: 'CONFIRMED', quantity: 1, totalAmount: 1000 },
          { id: 'reg-2', status: 'CONFIRMED', quantity: 1, totalAmount: 1500 },
          { id: 'reg-3', status: 'CANCELLED', quantity: 1, totalAmount: 500 },
        ],
      };
      prismaMock.event.findMany.mockResolvedValue([eventWithRevenue]);
      prismaMock.event.count.mockResolvedValue(1);

      const result = await OrganizerService.getOrganizerEvents(
        'user-123',
        UserRole.ATTENDEE,
        {},
      );

      // Should sum confirmed registrations: 1000 + 1500 = 2500
      expect(result.events[0].revenue).toBe(2500);
    });
  });
});
