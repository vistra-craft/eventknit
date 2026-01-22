import { PrismaClient, UserRole, InviteType, EventStatus } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { InvitationService, CreateInvitationData } from '../../../src/services/invitation.service.js';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../src/utils/audit.js', () => ({
  createAuditLog: jest.fn(),
  AuditActions: {
    INVITATION_CREATED: 'INVITATION_CREATED',
    INVITATION_UPDATED: 'INVITATION_UPDATED',
    INVITATION_REVOKED: 'INVITATION_REVOKED',
  },
}));

describe('InvitationService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  const mockOrganizer = {
    id: 'organizer-123',
    email: 'organizer@test.com',
    role: UserRole.ORGANIZER,
  };

  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    organizerId: mockOrganizer.id,
    status: EventStatus.APPROVED,
    deletedAt: null,
  };

  const baseInvitationData: CreateInvitationData = {
    inviteType: InviteType.ATTENDEE,
    title: 'General Invitation',
    description: 'Open invitation for all attendees',
  };

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    describe('Authorization', () => {
      it('should allow ORGANIZER to create invitation', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null); // No existing token
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          token: 'abc123',
          inviteType: InviteType.ATTENDEE,
          event: {
            id: mockEvent.id,
            title: mockEvent.title,
          },
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          baseInvitationData,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.event.findFirst).toHaveBeenCalled();
        expect(prisma.eventInvitation.create).toHaveBeenCalled();
      });

      it('should allow SUPERADMIN to create invitation', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null);
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          token: 'abc123',
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          baseInvitationData,
          'admin-123',
          UserRole.SUPERADMIN,
        );

        // Assert
        expect(result).toBeDefined();
      });

      it('should allow ADMIN_STAFF to create invitation', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null);
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          token: 'abc123',
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          baseInvitationData,
          'admin-staff-123',
          UserRole.ADMIN_STAFF,
        );

        // Assert
        expect(result).toBeDefined();
      });

      it('should throw error if user is ATTENDEE', async () => {
        // Arrange & Act & Assert
        await expect(
          InvitationService.createInvitation(
            mockEvent.id,
            baseInvitationData,
            'attendee-123',
            UserRole.ATTENDEE,
          ),
        ).rejects.toThrow(AuthorizationError);

        await expect(
          InvitationService.createInvitation(
            mockEvent.id,
            baseInvitationData,
            'attendee-123',
            UserRole.ATTENDEE,
          ),
        ).rejects.toThrow('Only organizers can create invitation links');
      });

      it('should throw error if event not found', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(null);

        // Act & Assert
        await expect(
          InvitationService.createInvitation(
            'non-existent-event',
            baseInvitationData,
            mockOrganizer.id,
            UserRole.ORGANIZER,
          ),
        ).rejects.toThrow(NotFoundError);

        await expect(
          InvitationService.createInvitation(
            'non-existent-event',
            baseInvitationData,
            mockOrganizer.id,
            UserRole.ORGANIZER,
          ),
        ).rejects.toThrow('Event not found');
      });

      it('should throw error if organizer does not own the event', async () => {
        // Arrange
        const differentOrganizerEvent = {
          ...mockEvent,
          organizerId: 'different-organizer-123',
        };
        prisma.event.findFirst.mockResolvedValue(differentOrganizerEvent as any);

        // Act & Assert
        await expect(
          InvitationService.createInvitation(
            mockEvent.id,
            baseInvitationData,
            mockOrganizer.id,
            UserRole.ORGANIZER,
          ),
        ).rejects.toThrow(AuthorizationError);

        await expect(
          InvitationService.createInvitation(
            mockEvent.id,
            baseInvitationData,
            mockOrganizer.id,
            UserRole.ORGANIZER,
          ),
        ).rejects.toThrow('You do not have permission to create invitations for this event');
      });

      it('should allow admin to create invitation for any event', async () => {
        // Arrange
        const differentOrganizerEvent = {
          ...mockEvent,
          organizerId: 'different-organizer-123',
        };
        prisma.event.findFirst.mockResolvedValue(differentOrganizerEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null);
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          token: 'abc123',
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          baseInvitationData,
          'admin-123',
          UserRole.SUPERADMIN,
        );

        // Assert - should succeed even though admin doesn't own the event
        expect(result).toBeDefined();
      });
    });

    describe('Validation', () => {
      it('should throw error if expiration date is in the past', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        const pastDate = new Date('2020-01-01');

        // Act & Assert
        await expect(
          InvitationService.createInvitation(
            mockEvent.id,
            {
              ...baseInvitationData,
              expiresAt: pastDate,
            },
            mockOrganizer.id,
            UserRole.ORGANIZER,
          ),
        ).rejects.toThrow(ValidationError);

        await expect(
          InvitationService.createInvitation(
            mockEvent.id,
            {
              ...baseInvitationData,
              expiresAt: pastDate,
            },
            mockOrganizer.id,
            UserRole.ORGANIZER,
          ),
        ).rejects.toThrow('Expiration date cannot be in the past');
      });

      it('should throw error if maxUses is less than 1', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);

        // Act & Assert
        await expect(
          InvitationService.createInvitation(
            mockEvent.id,
            {
              ...baseInvitationData,
              maxUses: 0,
            },
            mockOrganizer.id,
            UserRole.ORGANIZER,
          ),
        ).rejects.toThrow(ValidationError);

        await expect(
          InvitationService.createInvitation(
            mockEvent.id,
            {
              ...baseInvitationData,
              maxUses: -1,
            },
            mockOrganizer.id,
            UserRole.ORGANIZER,
          ),
        ).rejects.toThrow('Max uses must be at least 1');
      });

      it('should create invitation with future expiration date', async () => {
        // Arrange
        const futureDate = new Date('2030-12-31');
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null);
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          token: 'abc123',
          expiresAt: futureDate,
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          {
            ...baseInvitationData,
            expiresAt: futureDate,
          },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.eventInvitation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              expiresAt: futureDate,
            }),
          }),
        );
      });

      it('should create invitation with maxUses', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null);
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          token: 'abc123',
          maxUses: 100,
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          {
            ...baseInvitationData,
            maxUses: 100,
          },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.eventInvitation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              maxUses: 100,
            }),
          }),
        );
      });
    });

    describe('Invite Types', () => {
      it('should create GENERAL_ATTENDEE invitation', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null);
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          inviteType: InviteType.ATTENDEE,
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          {
            ...baseInvitationData,
            inviteType: InviteType.ATTENDEE,
          },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.inviteType).toBe(InviteType.ATTENDEE);
      });

      it('should create SPEAKER invitation', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null);
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          inviteType: InviteType.SPEAKER,
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          {
            ...baseInvitationData,
            inviteType: InviteType.SPEAKER,
          },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.inviteType).toBe(InviteType.SPEAKER);
      });

      it('should create VIP invitation', async () => {
        // Arrange
        prisma.event.findFirst.mockResolvedValue(mockEvent as any);
        prisma.eventInvitation.findUnique.mockResolvedValue(null);
        prisma.eventInvitation.create.mockResolvedValue({
          id: 'invitation-123',
          eventId: mockEvent.id,
          inviteType: InviteType.GUEST,
        } as any);

        // Act
        const result = await InvitationService.createInvitation(
          mockEvent.id,
          {
            ...baseInvitationData,
            inviteType: InviteType.GUEST,
          },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.inviteType).toBe(InviteType.GUEST);
      });
    });
  });

  describe('getInvitationByToken', () => {
    it('should retrieve invitation by token', async () => {
      // Arrange
      const mockInvitation = {
        id: 'invitation-123',
        eventId: mockEvent.id,
        token: 'abc123',
        inviteType: InviteType.ATTENDEE,
        isActive: true,
        expiresAt: new Date('2030-12-31'),
        maxUses: null,
        usedCount: 0,
        event: {
          ...mockEvent,
          status: EventStatus.APPROVED,
          organizer: {
            id: mockOrganizer.id,
            firstName: 'John',
            lastName: 'Doe',
            organizationName: null,
          },
        },
      };
      prisma.eventInvitation.findUnique.mockResolvedValue(mockInvitation as any);

      // Act
      const result = await InvitationService.getInvitationByToken('abc123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.token).toBe('abc123');
      expect(prisma.eventInvitation.findUnique).toHaveBeenCalledWith({
        where: { token: 'abc123' },
        include: expect.any(Object),
      });
    });

    it('should throw error for non-existent token', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        InvitationService.getInvitationByToken('invalid-token'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        InvitationService.getInvitationByToken('invalid-token'),
      ).rejects.toThrow('Invalid invitation link');
    });
  });
});
