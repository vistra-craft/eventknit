import { AdminService } from '../../../src/services/admin.service.js';
import { prisma } from '../../../src/config/database.js';
import { NotFoundError } from '../../../src/utils/errors.js';
import { UserRole, UserStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
    },
    organizerProfile: {
      findUnique: jest.fn(),
    },
    kYCDocument: {
      groupBy: jest.fn(),
    },
    eventRegistration: {
      aggregate: jest.fn(),
    },
  },
}));
jest.mock('../../../src/utils/logger.js');
jest.mock('../../../src/utils/password.js');
jest.mock('../../../src/utils/audit.js', () => ({
  createAuditLog: jest.fn(),
  AuditActions: {},
}));
jest.mock('../../../src/utils/privileges.js', () => ({
  validateRoleCreation: jest.fn(),
  validateUserModification: jest.fn(),
  validateUserDeletion: jest.fn(),
}));

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getUsers ─────────────────────────────────────────────────────────

  describe('getUsers', () => {
    const baseUsers = [
      {
        id: 'user-1',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Org',
        phoneNumber: '+254700000001',
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        organizationName: 'Alice Events',
        businessEmail: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    ];

    it('should return paginated users with default options', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue(baseUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await AdminService.getUsers({});

      expect(result.users).toEqual(baseUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          skip: 0,
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should filter by role and status', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      await AdminService.getUsers({
        role: UserRole.ORGANIZER,
        status: UserStatus.ACTIVE,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            role: UserRole.ORGANIZER,
            status: UserStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should include organizationName in search when role is ORGANIZER', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      await AdminService.getUsers({
        role: UserRole.ORGANIZER,
        search: 'alice',
      });

      const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.OR).toHaveLength(4); // email, firstName, lastName, organizationName
      expect(call.where.OR[3]).toEqual({
        organizationName: { contains: 'alice', mode: 'insensitive' },
      });
    });

    it('should NOT include organizationName in search for non-organizer roles', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      await AdminService.getUsers({
        role: UserRole.ATTENDEE,
        search: 'test',
      });

      const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.OR).toHaveLength(3); // email, firstName, lastName only
    });

    it('should include enriched organizer fields when role is ORGANIZER', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      await AdminService.getUsers({ role: UserRole.ORGANIZER });

      const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      const select = call.select;

      // Base fields
      expect(select.id).toBe(true);
      expect(select.email).toBe(true);

      // Organizer-enriched fields
      expect(select.avatar).toBe(true);
      expect(select.verificationLevel).toBe(true);
      expect(select.kycStatus).toBe(true);
      expect(select.isIdentityVerified).toBe(true);
      expect(select.organizerEntityType).toBe(true);
      expect(select.organizerIndustry).toBe(true);
      expect(select.profileCompleted).toBe(true);
      expect(select.lastLoginAt).toBe(true);
      expect(select._count).toEqual({
        select: {
          eventsCreated: true,
          eventRegistrations: true,
        },
      });
    });

    it('should NOT include enriched organizer fields for non-organizer roles', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      await AdminService.getUsers({ role: UserRole.ATTENDEE });

      const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      const select = call.select;

      // Should have base fields
      expect(select.id).toBe(true);
      expect(select.email).toBe(true);

      // Should NOT have organizer-specific fields
      expect(select.avatar).toBeUndefined();
      expect(select.verificationLevel).toBeUndefined();
      expect(select.kycStatus).toBeUndefined();
      expect(select._count).toBeUndefined();
    });

    it('should calculate pagination correctly', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(75);

      const result = await AdminService.getUsers({ page: 3, limit: 25 });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 25,
        total: 75,
        totalPages: 3,
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50, // (3-1) * 25
          take: 25,
        }),
      );
    });

    it('should default to page 1 and limit 50 when not provided', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      await AdminService.getUsers({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        }),
      );
    });
  });

  // ─── getOrganizerDetails ──────────────────────────────────────────────

  describe('getOrganizerDetails', () => {
    const mockUserId = 'org-123';

    const mockUser = {
      id: mockUserId,
      email: 'organizer@example.com',
      firstName: 'Jane',
      lastName: 'Organizer',
      phoneNumber: '+254700000002',
      role: UserRole.ORGANIZER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      organizationName: 'Jane Events Co.',
      businessEmail: 'info@janeevents.com',
      avatar: 'https://cdn.example.com/avatar.jpg',
      verificationLevel: 3,
      kycStatus: 'APPROVED',
      kycSubmittedAt: new Date('2025-01-15'),
      kycApprovedAt: new Date('2025-01-20'),
      isIdentityVerified: true,
      organizerEntityType: 'LIMITED_LIABILITY_COMPANY',
      organizerIndustry: 'Events',
      organizerBusinessName: 'Jane Events Ltd',
      profileCompleted: true,
      lastLoginAt: new Date('2025-06-01'),
      payoutLimit: '500000',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-06-01'),
      _count: {
        eventsCreated: 12,
        eventRegistrations: 3,
        kycDocuments: 5,
      },
    };

    const mockRecentEvents = [
      {
        id: 'evt-1',
        title: 'Tech Conference 2025',
        startDate: new Date('2025-05-20'),
        status: 'APPROVED',
        _count: { registrations: 150 },
      },
      {
        id: 'evt-2',
        title: 'Startup Meetup',
        startDate: new Date('2025-04-10'),
        status: 'COMPLETED',
        _count: { registrations: 45 },
      },
    ];

    const mockOrganizerProfile = {
      website: 'https://janeevents.com',
      description: 'Event planning company',
      socialLinks: { twitter: 'https://twitter.com/janeevents' },
      bankAccountLast4: '4567',
      location: 'Nairobi, Kenya',
    };

    const mockKYCDocumentSummary = [
      { status: 'APPROVED', _count: { status: 4 } },
      { status: 'PENDING', _count: { status: 1 } },
    ];

    const mockRevenueResult = {
      _sum: { totalAmount: 1250000 },
    };

    function setupMocksForSuccess() {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockRecentEvents);
      (prisma.organizerProfile.findUnique as jest.Mock).mockResolvedValue(mockOrganizerProfile);
      (prisma.kYCDocument.groupBy as jest.Mock).mockResolvedValue(mockKYCDocumentSummary);
      (prisma.eventRegistration.aggregate as jest.Mock).mockResolvedValue(mockRevenueResult);
    }

    it('should return full organizer details', async () => {
      setupMocksForSuccess();

      const result = await AdminService.getOrganizerDetails(mockUserId);

      expect(result.user).toEqual(mockUser);
      expect(result.recentEvents).toEqual(mockRecentEvents);
      expect(result.organizerProfile).toEqual(mockOrganizerProfile);
      expect(result.kycDocumentSummary).toEqual(mockKYCDocumentSummary);
      expect(result.totalRevenue).toBe('1250000');
    });

    it('should throw NotFoundError when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.organizerProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.kYCDocument.groupBy as jest.Mock).mockResolvedValue([]);

      await expect(AdminService.getOrganizerDetails('nonexistent'))
        .rejects.toThrow(NotFoundError);

      // Revenue aggregate should NOT be called since user was not found
      expect(prisma.eventRegistration.aggregate).not.toHaveBeenCalled();
    });

    it('should query user with correct select fields', async () => {
      setupMocksForSuccess();

      await AdminService.getOrganizerDetails(mockUserId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          verificationLevel: true,
          kycStatus: true,
          kycSubmittedAt: true,
          kycApprovedAt: true,
          isIdentityVerified: true,
          organizerEntityType: true,
          organizerIndustry: true,
          organizerBusinessName: true,
          profileCompleted: true,
          lastLoginAt: true,
          payoutLimit: true,
          _count: {
            select: {
              eventsCreated: true,
              eventRegistrations: true,
              kycDocuments: true,
            },
          },
        }),
      });
    });

    it('should query recent events with correct filters', async () => {
      setupMocksForSuccess();

      await AdminService.getOrganizerDetails(mockUserId);

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: { organizerId: mockUserId, deletedAt: null },
        select: {
          id: true,
          title: true,
          startDate: true,
          status: true,
          _count: { select: { registrations: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });

    it('should query organizer profile by userId', async () => {
      setupMocksForSuccess();

      await AdminService.getOrganizerDetails(mockUserId);

      expect(prisma.organizerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: {
          website: true,
          description: true,
          socialLinks: true,
          bankAccountLast4: true,
          location: true,
        },
      });
    });

    it('should query KYC documents grouped by status', async () => {
      setupMocksForSuccess();

      await AdminService.getOrganizerDetails(mockUserId);

      expect(prisma.kYCDocument.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { userId: mockUserId },
        _count: { status: true },
      });
    });

    it('should compute revenue from CONFIRMED registrations only', async () => {
      setupMocksForSuccess();

      await AdminService.getOrganizerDetails(mockUserId);

      expect(prisma.eventRegistration.aggregate).toHaveBeenCalledWith({
        _sum: { totalAmount: true },
        where: {
          event: { organizerId: mockUserId, deletedAt: null },
          status: { in: ['CONFIRMED'] },
        },
      });
    });

    it('should return "0" revenue when no registrations exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.organizerProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.kYCDocument.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.eventRegistration.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalAmount: null },
      });

      const result = await AdminService.getOrganizerDetails(mockUserId);

      expect(result.totalRevenue).toBe('0');
    });

    it('should handle organizer with no profile gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.organizerProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.kYCDocument.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.eventRegistration.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalAmount: null },
      });

      const result = await AdminService.getOrganizerDetails(mockUserId);

      expect(result.organizerProfile).toBeNull();
      expect(result.recentEvents).toEqual([]);
      expect(result.kycDocumentSummary).toEqual([]);
    });

    it('should handle organizer with no KYC documents', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        kycStatus: null,
        kycSubmittedAt: null,
        kycApprovedAt: null,
        _count: { eventsCreated: 0, eventRegistrations: 0, kycDocuments: 0 },
      });
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.organizerProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.kYCDocument.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.eventRegistration.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalAmount: null },
      });

      const result = await AdminService.getOrganizerDetails(mockUserId);

      expect(result.user._count.kycDocuments).toBe(0);
      expect(result.kycDocumentSummary).toEqual([]);
      expect(result.totalRevenue).toBe('0');
    });

    it('should execute initial queries in parallel (Promise.all)', async () => {
      // Verify all 4 queries are called before aggregate (which depends on user check)
      const callOrder: string[] = [];

      (prisma.user.findUnique as jest.Mock).mockImplementation(async () => {
        callOrder.push('user.findUnique');
        return mockUser;
      });
      (prisma.event.findMany as jest.Mock).mockImplementation(async () => {
        callOrder.push('event.findMany');
        return mockRecentEvents;
      });
      (prisma.organizerProfile.findUnique as jest.Mock).mockImplementation(async () => {
        callOrder.push('organizerProfile.findUnique');
        return mockOrganizerProfile;
      });
      (prisma.kYCDocument.groupBy as jest.Mock).mockImplementation(async () => {
        callOrder.push('kYCDocument.groupBy');
        return mockKYCDocumentSummary;
      });
      (prisma.eventRegistration.aggregate as jest.Mock).mockImplementation(async () => {
        callOrder.push('eventRegistration.aggregate');
        return mockRevenueResult;
      });

      await AdminService.getOrganizerDetails(mockUserId);

      // All 4 parallel queries should be called before aggregate
      expect(callOrder.indexOf('eventRegistration.aggregate')).toBe(4);
      // All 4 parallel queries should have been invoked
      expect(callOrder).toContain('user.findUnique');
      expect(callOrder).toContain('event.findMany');
      expect(callOrder).toContain('organizerProfile.findUnique');
      expect(callOrder).toContain('kYCDocument.groupBy');
    });

    it('should convert numeric totalAmount to string', async () => {
      setupMocksForSuccess();
      (prisma.eventRegistration.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalAmount: 99999.99 },
      });

      const result = await AdminService.getOrganizerDetails(mockUserId);

      expect(result.totalRevenue).toBe('99999.99');
      expect(typeof result.totalRevenue).toBe('string');
    });
  });
});
