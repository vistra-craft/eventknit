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
    INVITATION_DELETED: 'INVITATION_DELETED',
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
    const mockActiveInvitation = {
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

    it('should retrieve invitation by token', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(mockActiveInvitation as any);

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

    it('should throw error for revoked invitation', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        isActive: false,
      } as any);

      // Act & Assert
      await expect(
        InvitationService.getInvitationByToken('abc123'),
      ).rejects.toThrow(ValidationError);

      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        isActive: false,
      } as any);

      await expect(
        InvitationService.getInvitationByToken('abc123'),
      ).rejects.toThrow('This invitation link has been revoked');
    });

    it('should throw error for expired invitation', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        expiresAt: new Date('2020-01-01'), // Past date
      } as any);

      // Act & Assert
      await expect(
        InvitationService.getInvitationByToken('abc123'),
      ).rejects.toThrow(ValidationError);

      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        expiresAt: new Date('2020-01-01'),
      } as any);

      await expect(
        InvitationService.getInvitationByToken('abc123'),
      ).rejects.toThrow('This invitation link has expired');
    });

    it('should throw error when max uses reached', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        maxUses: 5,
        usedCount: 5,
      } as any);

      // Act & Assert
      await expect(
        InvitationService.getInvitationByToken('abc123'),
      ).rejects.toThrow(ValidationError);

      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        maxUses: 5,
        usedCount: 5,
      } as any);

      await expect(
        InvitationService.getInvitationByToken('abc123'),
      ).rejects.toThrow('maximum number of uses');
    });

    it('should throw error when event is not approved', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        event: {
          ...mockActiveInvitation.event,
          status: EventStatus.PENDING,
        },
      } as any);

      // Act & Assert
      await expect(
        InvitationService.getInvitationByToken('abc123'),
      ).rejects.toThrow(ValidationError);

      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        event: {
          ...mockActiveInvitation.event,
          status: EventStatus.PENDING,
        },
      } as any);

      await expect(
        InvitationService.getInvitationByToken('abc123'),
      ).rejects.toThrow('not yet available for registration');
    });

    it('should succeed when invitation has no expiration or usage limit', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockActiveInvitation,
        expiresAt: null,
        maxUses: null,
      } as any);

      // Act
      const result = await InvitationService.getInvitationByToken('abc123');

      // Assert
      expect(result).toBeDefined();
      expect(result.isActive).toBe(true);
    });
  });

  describe('getEventInvitations', () => {
    it('should return invitations for event with usage count', async () => {
      // Arrange
      prisma.event.findFirst.mockResolvedValue(mockEvent as any);
      prisma.eventInvitation.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          eventId: mockEvent.id,
          inviteType: InviteType.ATTENDEE,
          isActive: true,
          creator: { id: mockOrganizer.id, firstName: 'Organizer', lastName: 'Test', email: 'organizer@test.com' },
          _count: { registrations: 5 },
        },
        {
          id: 'inv-2',
          eventId: mockEvent.id,
          inviteType: InviteType.SPEAKER,
          isActive: true,
          creator: { id: mockOrganizer.id, firstName: 'Organizer', lastName: 'Test', email: 'organizer@test.com' },
          _count: { registrations: 2 },
        },
      ] as any);

      // Act
      const result = await InvitationService.getEventInvitations(
        mockEvent.id,
        mockOrganizer.id,
        UserRole.ORGANIZER,
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].usageCount).toBe(5);
      expect(result[1].usageCount).toBe(2);
    });

    it('should throw AuthorizationError for ATTENDEE role', async () => {
      await expect(
        InvitationService.getEventInvitations(
          mockEvent.id,
          'attendee-123',
          UserRole.ATTENDEE,
        ),
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw NotFoundError when event not found', async () => {
      // Arrange
      prisma.event.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        InvitationService.getEventInvitations(
          'non-existent',
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when organizer does not own event', async () => {
      // Arrange
      prisma.event.findFirst.mockResolvedValue({
        ...mockEvent,
        organizerId: 'different-organizer',
      } as any);

      // Act & Assert
      await expect(
        InvitationService.getEventInvitations(
          mockEvent.id,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(AuthorizationError);
    });

    it('should allow admin to view invitations for any event', async () => {
      // Arrange
      prisma.event.findFirst.mockResolvedValue({
        ...mockEvent,
        organizerId: 'different-organizer',
      } as any);
      prisma.eventInvitation.findMany.mockResolvedValue([] as any);

      // Act
      const result = await InvitationService.getEventInvitations(
        mockEvent.id,
        'admin-123',
        UserRole.SUPERADMIN,
      );

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('updateInvitation', () => {
    const mockExistingInvitation = {
      id: 'invitation-123',
      eventId: mockEvent.id,
      inviteType: InviteType.ATTENDEE,
      isActive: true,
      usedCount: 3,
      event: {
        id: mockEvent.id,
        organizerId: mockOrganizer.id,
      },
    };

    it('should update invitation title and description', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(mockExistingInvitation as any);
      prisma.eventInvitation.update.mockResolvedValue({
        ...mockExistingInvitation,
        title: 'Updated Title',
        description: 'Updated Desc',
      } as any);

      // Act
      const result = await InvitationService.updateInvitation(
        'invitation-123',
        { title: 'Updated Title', description: 'Updated Desc' },
        mockOrganizer.id,
        UserRole.ORGANIZER,
      );

      // Assert
      expect(result.title).toBe('Updated Title');
      expect(prisma.eventInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'invitation-123' },
          data: expect.objectContaining({
            title: 'Updated Title',
            description: 'Updated Desc',
          }),
        }),
      );
    });

    it('should throw NotFoundError when invitation does not exist', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        InvitationService.updateInvitation(
          'non-existent',
          { title: 'Test' },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when organizer does not own event', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockExistingInvitation,
        event: { id: mockEvent.id, organizerId: 'different-organizer' },
      } as any);

      // Act & Assert
      await expect(
        InvitationService.updateInvitation(
          'invitation-123',
          { title: 'Test' },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError when expiresAt is in the past', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(mockExistingInvitation as any);

      // Act & Assert
      await expect(
        InvitationService.updateInvitation(
          'invitation-123',
          { expiresAt: new Date('2020-01-01') },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when maxUses less than 1', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(mockExistingInvitation as any);

      // Act & Assert
      await expect(
        InvitationService.updateInvitation(
          'invitation-123',
          { maxUses: 0 },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when maxUses less than current usage', async () => {
      // Arrange - invitation has 3 uses
      prisma.eventInvitation.findUnique.mockResolvedValue(mockExistingInvitation as any);

      // Act & Assert
      await expect(
        InvitationService.updateInvitation(
          'invitation-123',
          { maxUses: 2 }, // Less than current usedCount of 3
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(ValidationError);

      prisma.eventInvitation.findUnique.mockResolvedValue(mockExistingInvitation as any);

      await expect(
        InvitationService.updateInvitation(
          'invitation-123',
          { maxUses: 2 },
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow('cannot be less than current usage');
    });

    it('should set revokedAt and revokedBy when deactivating', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(mockExistingInvitation as any);
      prisma.eventInvitation.update.mockResolvedValue({
        ...mockExistingInvitation,
        isActive: false,
      } as any);

      // Act
      await InvitationService.updateInvitation(
        'invitation-123',
        { isActive: false },
        mockOrganizer.id,
        UserRole.ORGANIZER,
      );

      // Assert
      expect(prisma.eventInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
            revokedAt: expect.any(Date),
            revokedBy: mockOrganizer.id,
          }),
        }),
      );
    });

    it('should allow admin to update invitation for any event', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockExistingInvitation,
        event: { id: mockEvent.id, organizerId: 'different-organizer' },
      } as any);
      prisma.eventInvitation.update.mockResolvedValue({
        ...mockExistingInvitation,
        title: 'Admin Update',
      } as any);

      // Act
      const result = await InvitationService.updateInvitation(
        'invitation-123',
        { title: 'Admin Update' },
        'admin-123',
        UserRole.SUPERADMIN,
      );

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('revokeInvitation', () => {
    it('should deactivate invitation via updateInvitation', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        id: 'invitation-123',
        eventId: mockEvent.id,
        isActive: true,
        usedCount: 0,
        event: { id: mockEvent.id, organizerId: mockOrganizer.id },
      } as any);
      prisma.eventInvitation.update.mockResolvedValue({
        id: 'invitation-123',
        isActive: false,
      } as any);

      // Act
      const result = await InvitationService.revokeInvitation(
        'invitation-123',
        mockOrganizer.id,
        UserRole.ORGANIZER,
      );

      // Assert
      expect(result.isActive).toBe(false);
      expect(prisma.eventInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
          }),
        }),
      );
    });

    it('should throw NotFoundError for non-existent invitation', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        InvitationService.revokeInvitation(
          'non-existent',
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteInvitation', () => {
    const mockInvitationWithEvent = {
      id: 'invitation-123',
      eventId: mockEvent.id,
      inviteType: InviteType.ATTENDEE,
      event: {
        id: mockEvent.id,
        organizerId: mockOrganizer.id,
      },
    };

    it('should delete invitation successfully', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(mockInvitationWithEvent as any);
      prisma.eventInvitation.delete.mockResolvedValue(mockInvitationWithEvent as any);

      // Act
      await InvitationService.deleteInvitation(
        'invitation-123',
        mockOrganizer.id,
        UserRole.ORGANIZER,
      );

      // Assert
      expect(prisma.eventInvitation.delete).toHaveBeenCalledWith({
        where: { id: 'invitation-123' },
      });
    });

    it('should throw NotFoundError when invitation does not exist', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        InvitationService.deleteInvitation(
          'non-existent',
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when organizer does not own event', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockInvitationWithEvent,
        event: { id: mockEvent.id, organizerId: 'different-organizer' },
      } as any);

      // Act & Assert
      await expect(
        InvitationService.deleteInvitation(
          'invitation-123',
          mockOrganizer.id,
          UserRole.ORGANIZER,
        ),
      ).rejects.toThrow(AuthorizationError);
    });

    it('should allow admin to delete invitation for any event', async () => {
      // Arrange
      prisma.eventInvitation.findUnique.mockResolvedValue({
        ...mockInvitationWithEvent,
        event: { id: mockEvent.id, organizerId: 'different-organizer' },
      } as any);
      prisma.eventInvitation.delete.mockResolvedValue(mockInvitationWithEvent as any);

      // Act - should not throw
      await InvitationService.deleteInvitation(
        'invitation-123',
        'admin-123',
        UserRole.SUPERADMIN,
      );

      // Assert
      expect(prisma.eventInvitation.delete).toHaveBeenCalled();
    });
  });
});
