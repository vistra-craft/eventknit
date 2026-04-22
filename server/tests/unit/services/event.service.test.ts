import { PrismaClient, UserRole, EventType, EventStatus, UserStatus, RegistrationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { EventService, CreateEventData } from '../../../src/services/event.service.js';
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '../../../src/utils/errors.js';
import * as databaseModule from '../../../src/config/database.js';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/audit.js', () => ({
  createAuditLog: vi.fn(),
  AuditActions: {
    EVENT_CREATED: 'EVENT_CREATED',
    EVENT_UPDATED: 'EVENT_UPDATED',
    EVENT_DELETED: 'EVENT_DELETED',
    EVENT_APPROVED: 'EVENT_APPROVED',
  },
}));

vi.mock('../../../src/services/ticket.service.js', () => ({
  TicketService: {
    createTicketsForEvent: vi.fn(),
    generateBackupTicketCode: vi.fn(() => 'BACKUP-CODE-123'),
    generateTicketData: vi.fn(() => 'ticket-data-json'),
    generateQRCode: vi.fn().mockResolvedValue('data:image/png;base64,qrcode'),
    sendTicketEmail: vi.fn(),
    sendPaymentPendingEmail: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service.js', () => ({
  NotificationService: {
    sendNotification: vi.fn(),
  },
}));

vi.mock('../../../src/services/websocket.service.js', () => ({
  websocketService: {
    emitToRoom: vi.fn(),
    emitToUser: vi.fn(),
  },
}));

vi.mock('../../../src/utils/ticket-helpers.js', () => ({
  isTicketTypeAvailable: vi.fn(() => ({ available: true })),
}));

vi.mock('../../../src/services/event-collaboration.service.js', () => ({
  EventCollaborationService: {
    logActivity: vi.fn(),
  },
}));

vi.mock('../../../src/services/attendee-communication.service.js', () => ({
  AttendeeCommunicationService: {
    sendEventPostponementEmails: vi.fn(),
    sendEventUpdateEmails: vi.fn(),
  },
}));

vi.mock('../../../src/services/refund.service.js', () => ({
  RefundService: {},
}));

const mockSeatSelectionService = {
  reserveSeats: vi.fn(),
};

vi.mock('../../../src/services/seat-selection.service.js', () => ({
  SeatSelectionService: mockSeatSelectionService,
}));

describe('EventService - Event Creation', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  const mockOrganizer = {
    id: 'organizer-123',
    email: 'organizer@test.com',
    firstName: 'Test',
    role: UserRole.ORGANIZER,
    status: UserStatus.ACTIVE,
    profileCompleted: true,
    isIdentityVerified: true,
    verificationLevel: 2,
    payoutLimit: null,
    kycStatus: 'APPROVED',
    organizerEntityType: 'INDIVIDUAL',
  };

  const baseEventData: CreateEventData = {
    title: 'Test Event',
    description: 'Test event description',
    startDate: new Date('2026-12-31'),
    location: 'Test Location',
    isFree: true,
    type: EventType.PUBLIC,
  };

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    describe('Authorization', () => {
      it('should allow ORGANIZER to create event', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...baseEventData,
          organizerId: mockOrganizer.id,
          status: EventStatus.PENDING,
        } as any);

        // Act
        const result = await EventService.createEvent(
          baseEventData,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: mockOrganizer.id },
          select: {
            id: true,
            role: true,
            status: true,
            isIdentityVerified: true,
            verificationLevel: true,
            payoutLimit: true,
            kycStatus: true,
            organizerEntityType: true,
            email: true,
            firstName: true,
          },
        });
        expect(prisma.event.create).toHaveBeenCalled();
      });

      it('should allow SUPERADMIN to create event', async () => {
        // Arrange
        const admin = { ...mockOrganizer, role: UserRole.SUPERADMIN };
        prisma.user.findUnique.mockResolvedValue(admin as any);
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...baseEventData,
          organizerId: admin.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          baseEventData,
          admin.id,
          UserRole.SUPERADMIN,
        );

        // Assert
        expect(result).toBeDefined();
      });

      it('should allow ADMIN to create event', async () => {
        // Arrange
        const staff = { ...mockOrganizer, role: UserRole.ADMIN };
        prisma.user.findUnique.mockResolvedValue(staff as any);
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...baseEventData,
          organizerId: staff.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          baseEventData,
          staff.id,
          UserRole.ADMIN,
        );

        // Assert
        expect(result).toBeDefined();
      });

      it('should throw error if organizer not found', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          EventService.createEvent(baseEventData, 'non-existent-id', UserRole.ORGANIZER),
        ).rejects.toThrow(NotFoundError);

        await expect(
          EventService.createEvent(baseEventData, 'non-existent-id', UserRole.ORGANIZER),
        ).rejects.toThrow('Organizer not found');
      });

      it('should throw error if user is ATTENDEE', async () => {
        // Arrange
        const attendee = { ...mockOrganizer, role: UserRole.ATTENDEE };
        prisma.user.findUnique.mockResolvedValue(attendee as any);

        // Act & Assert
        await expect(
          EventService.createEvent(baseEventData, attendee.id, UserRole.ORGANIZER),
        ).rejects.toThrow(AuthorizationError);

        await expect(
          EventService.createEvent(baseEventData, attendee.id, UserRole.ORGANIZER),
        ).rejects.toThrow('Only organizers and admins can create events');
      });

      it('should allow PENDING_APPROVAL organizer to create events', async () => {
        const pendingOrganizer = { ...mockOrganizer, status: UserStatus.PENDING_APPROVAL };
        prisma.user.findUnique.mockResolvedValue(pendingOrganizer as any);
        prisma.event.create.mockResolvedValue({ id: 'event-1', title: baseEventData.title, type: 'PUBLIC', isFree: baseEventData.isFree } as any);

        const result = await EventService.createEvent(baseEventData, pendingOrganizer.id, UserRole.ORGANIZER);
        expect(result).toBeDefined();
      });

      it('should throw error if organizer status is DEACTIVATED', async () => {
        const deactivated = { ...mockOrganizer, status: UserStatus.DEACTIVATED };
        prisma.user.findUnique.mockResolvedValue(deactivated as any);

        await expect(
          EventService.createEvent(baseEventData, deactivated.id, UserRole.ORGANIZER),
        ).rejects.toThrow(AuthorizationError);

        await expect(
          EventService.createEvent(baseEventData, deactivated.id, UserRole.ORGANIZER),
        ).rejects.toThrow('deactivated');
      });

      it('should throw error if organizer status is SUSPENDED', async () => {
        const suspended = { ...mockOrganizer, status: UserStatus.SUSPENDED };
        prisma.user.findUnique.mockResolvedValue(suspended as any);

        await expect(
          EventService.createEvent(baseEventData, suspended.id, UserRole.ORGANIZER),
        ).rejects.toThrow(AuthorizationError);

        await expect(
          EventService.createEvent(baseEventData, suspended.id, UserRole.ORGANIZER),
        ).rejects.toThrow('suspended');
      });

      it('should allow organizer with incomplete profile to create events', async () => {
        const incompleteProfile = { ...mockOrganizer, profileCompleted: false };
        prisma.user.findUnique.mockResolvedValue(incompleteProfile as any);
        prisma.event.create.mockResolvedValue({ id: 'event-1', title: baseEventData.title, type: 'PUBLIC', isFree: baseEventData.isFree } as any);

        const result = await EventService.createEvent(baseEventData, incompleteProfile.id, UserRole.ORGANIZER);
        expect(result).toBeDefined();
      });

      it('should allow SUPERADMIN to create event without completed profile', async () => {
        const admin = { ...mockOrganizer, role: UserRole.SUPERADMIN, profileCompleted: false };
        prisma.user.findUnique.mockResolvedValue(admin as any);
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...baseEventData,
          organizerId: admin.id,
        } as any);

        const result = await EventService.createEvent(
          baseEventData,
          admin.id,
          UserRole.SUPERADMIN,
        );

        expect(result).toBeDefined();
      });
    });

    describe('Free Events', () => {
      it('should create free event without tickets', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const createdEvent = {
          id: 'event-123',
          title: baseEventData.title,
          description: baseEventData.description,
          organizerId: mockOrganizer.id,
          isFree: true,
          price: null,
          status: EventStatus.PENDING,
          startDate: baseEventData.startDate,
          location: baseEventData.location,
        };
        prisma.event.create.mockResolvedValue(createdEvent as any);

        // Act
        const result = await EventService.createEvent(
          baseEventData,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result.event).toEqual(createdEvent);
        expect(prisma.event.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              title: baseEventData.title,
              description: baseEventData.description,
              organizerId: mockOrganizer.id,
              isFree: true,
            }),
          }),
        );
      });

      it('should create free event with capacity', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const eventWithCapacity = {
          ...baseEventData,
          capacity: 100,
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...eventWithCapacity,
          organizerId: mockOrganizer.id,
          availableSlots: 100,
        } as any);

        // Act
        const result = await EventService.createEvent(
          eventWithCapacity,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.event.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              capacity: 100,
              availableSlots: 100,
            }),
          }),
        );
      });
    });

    describe('Paid Events', () => {
      it('should create paid event with single price', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const paidEvent = {
          ...baseEventData,
          isFree: false,
          price: 50,
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...paidEvent,
          organizerId: mockOrganizer.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          paidEvent,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.event.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              isFree: false,
              price: expect.any(Decimal),
            }),
          }),
        );
      });

      it('should throw error if paid event has no price or ticket types', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const invalidPaidEvent = {
          ...baseEventData,
          isFree: false,
          // No price and no ticket types
        };

        // Act & Assert
        await expect(
          EventService.createEvent(invalidPaidEvent, mockOrganizer.id, UserRole.ORGANIZER),
        ).rejects.toThrow(ValidationError);

        await expect(
          EventService.createEvent(invalidPaidEvent, mockOrganizer.id, UserRole.ORGANIZER),
        ).rejects.toThrow('Price or ticket types are required for paid events');
      });
    });

    describe('Ticket Types', () => {
      it('should create event with multiple ticket types', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const eventWithTickets = {
          ...baseEventData,
          isFree: false,
          ticketTypes: [
            {
              name: 'General Admission',
              price: 50,
              quantity: 100,
              features: ['Access to all sessions'],
            },
            {
              name: 'VIP',
              price: 150,
              quantity: 20,
              features: ['Access to all sessions', 'Meet & Greet'],
            },
          ],
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...eventWithTickets,
          organizerId: mockOrganizer.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          eventWithTickets,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.event.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              ticketTypes: expect.arrayContaining([
                expect.objectContaining({
                  name: 'General Admission',
                  price: 50,
                  quantity: 100,
                }),
                expect.objectContaining({
                  name: 'VIP',
                  price: 150,
                  quantity: 20,
                }),
              ]),
            }),
          }),
        );
      });

      it('should create complementary tickets with zero price', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const eventWithComplementary = {
          ...baseEventData,
          isFree: false,
          price: 50,
          ticketTypes: [
            {
              name: 'Paid Ticket',
              price: 50,
              quantity: 100,
            },
            {
              name: 'Comp Ticket',
              price: 0,
              quantity: 10,
              isComplementary: true,
              requiresInvitation: true,
            },
          ],
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...eventWithComplementary,
          organizerId: mockOrganizer.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          eventWithComplementary,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
      });

      it('should throw error if complementary ticket has non-zero price', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const invalidEvent = {
          ...baseEventData,
          ticketTypes: [
            {
              name: 'Invalid Comp',
              price: 50, // Non-zero price for complementary ticket
              isComplementary: true,
            },
          ],
        };

        // Act & Assert
        await expect(
          EventService.createEvent(invalidEvent, mockOrganizer.id, UserRole.ORGANIZER),
        ).rejects.toThrow(ValidationError);

        await expect(
          EventService.createEvent(invalidEvent, mockOrganizer.id, UserRole.ORGANIZER),
        ).rejects.toThrow('Complementary tickets must have price of 0');
      });

      it('should validate discount pricing (originalPrice > currentPrice)', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const eventWithDiscount = {
          ...baseEventData,
          isFree: false,
          ticketTypes: [
            {
              name: 'Early Bird',
              price: 40,
              originalPrice: 50,
              discountLabel: '20% OFF',
            },
          ],
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...eventWithDiscount,
          organizerId: mockOrganizer.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          eventWithDiscount,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
      });

      it('should throw error if originalPrice <= currentPrice', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const invalidDiscount = {
          ...baseEventData,
          ticketTypes: [
            {
              name: 'Invalid Discount',
              price: 50,
              originalPrice: 40, // Original less than current
            },
          ],
        };

        // Act & Assert
        await expect(
          EventService.createEvent(invalidDiscount, mockOrganizer.id, UserRole.ORGANIZER),
        ).rejects.toThrow(ValidationError);

        await expect(
          EventService.createEvent(invalidDiscount, mockOrganizer.id, UserRole.ORGANIZER),
        ).rejects.toThrow('Original price must be greater than current price for discounts');
      });

      it('should validate early bird date ranges', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const eventWithEarlyBird = {
          ...baseEventData,
          isFree: false,
          ticketTypes: [
            {
              name: 'Early Bird',
              price: 40,
              quantity: 50,
              availableFrom: '2026-01-01',
              availableUntil: '2026-06-01',
            },
          ],
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...eventWithEarlyBird,
          organizerId: mockOrganizer.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          eventWithEarlyBird,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
      });

      it('should throw error if early bird "from" date >= "until" date', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const invalidDateRange = {
          ...baseEventData,
          ticketTypes: [
            {
              name: 'Invalid Early Bird',
              price: 40,
              availableFrom: '2026-06-01',
              availableUntil: '2026-01-01', // Until before From
            },
          ],
        };

        // Act & Assert
        await expect(
          EventService.createEvent(invalidDateRange, mockOrganizer.id, UserRole.ORGANIZER),
        ).rejects.toThrow(ValidationError);

        await expect(
          EventService.createEvent(invalidDateRange, mockOrganizer.id, UserRole.ORGANIZER),
        ).rejects.toThrow('Early bird "available from" date must be before "available until" date');
      });
    });

    describe('Event Metadata', () => {
      it('should create event with full metadata', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const completeEvent = {
          ...baseEventData,
          fullDescription: 'Full event description',
          category: 'Technology',
          tags: ['tech', 'conference', 'networking'],
          endDate: new Date('2027-01-01'),
          venue: 'Convention Center',
          address: '123 Main St',
          isOnline: false,
          capacity: 500,
          image: 'https://example.com/image.jpg',
          images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          requirements: ['Valid ID', 'Proof of vaccination'],
          ageRestriction: '18+',
          duration: '3 days',
          speakers: [
            {
              name: 'John Doe',
              title: 'CEO',
              bio: 'Industry leader',
              image: 'https://example.com/speaker.jpg',
            },
          ],
          sponsors: [
            {
              name: 'Company XYZ',
              level: 'Gold',
              logo: 'https://example.com/logo.jpg',
            },
          ],
          agenda: [
            {
              title: 'Opening Keynote',
              description: 'Welcome speech',
              startTime: '09:00',
              endTime: '10:00',
            },
          ],
          socialLinks: {
            twitter: 'https://twitter.com/event',
            facebook: 'https://facebook.com/event',
          },
          faqs: [
            {
              question: 'What should I bring?',
              answer: 'Bring your ID and ticket confirmation',
            },
          ],
          timezone: 'America/New_York',
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...completeEvent,
          organizerId: mockOrganizer.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          completeEvent,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.event.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              category: completeEvent.category,
              tags: completeEvent.tags,
              venue: completeEvent.venue,
              speakers: completeEvent.speakers,
              sponsors: completeEvent.sponsors,
              agenda: completeEvent.agenda,
            }),
          }),
        );
      });

      it('should create online event with link', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const onlineEvent = {
          ...baseEventData,
          isOnline: true,
          onlineLink: 'https://zoom.us/meeting/123',
          location: 'Online',
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...onlineEvent,
          organizerId: mockOrganizer.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          onlineEvent,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
        expect(prisma.event.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              isOnline: true,
              onlineLink: 'https://zoom.us/meeting/123',
            }),
          }),
        );
      });

      it('should create event with custom registration fields', async () => {
        // Arrange
        prisma.user.findUnique.mockResolvedValue(mockOrganizer as any);
        const eventWithFields = {
          ...baseEventData,
          registrationFields: [
            {
              id: 'field-1',
              name: 'dietary_restrictions',
              label: 'Dietary Restrictions',
              type: 'text',
              required: false,
            },
            {
              id: 'field-2',
              name: 'company',
              label: 'Company Name',
              type: 'text',
              required: true,
            },
          ],
        };
        prisma.event.create.mockResolvedValue({
          id: 'event-123',
          ...eventWithFields,
          organizerId: mockOrganizer.id,
        } as any);

        // Act
        const result = await EventService.createEvent(
          eventWithFields,
          mockOrganizer.id,
          UserRole.ORGANIZER,
        );

        // Assert
        expect(result).toBeDefined();
      });
    });
  });
});

describe('EventService - approveEvent', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = databaseModule.prisma as unknown as DeepMockProxy<PrismaClient>;
    mockReset(prisma);
    vi.clearAllMocks();
  });

  const adminId = 'admin-123';

  const mockPendingEvent = {
    id: 'event-456',
    title: 'Test Event',
    status: EventStatus.PENDING,
    isFree: true,
  };

  it('should approve event and auto-activate pending organizer', async () => {
    prisma.event.findFirst.mockResolvedValue(mockPendingEvent as any);
    prisma.event.updateMany.mockResolvedValue({ count: 1 } as any);
    prisma.event.findUniqueOrThrow.mockResolvedValue({
      ...mockPendingEvent,
      status: EventStatus.APPROVED,
      approvedBy: adminId,
      approvedAt: new Date(),
      organizerId: 'organizer-123',
      organizer: {
        id: 'organizer-123',
        firstName: 'Cecil',
        lastName: 'Spencer',
        email: 'cecil@test.com',
        organizationName: 'Test Org',
        status: UserStatus.PENDING_APPROVAL,
        role: UserRole.ORGANIZER,
      },
    } as any);
    prisma.user.update.mockResolvedValue({} as any);

    const result = await EventService.approveEvent(
      'event-456',
      adminId,
      UserRole.SUPERADMIN,
    );

    expect(result).toBeDefined();
    expect(result.status).toBe(EventStatus.APPROVED);

    // Organizer should be auto-activated
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'organizer-123' },
      data: { status: UserStatus.ACTIVE },
    });
  });

  it('should not update organizer if already active', async () => {
    prisma.event.findFirst.mockResolvedValue(mockPendingEvent as any);
    prisma.event.updateMany.mockResolvedValue({ count: 1 } as any);
    prisma.event.findUniqueOrThrow.mockResolvedValue({
      ...mockPendingEvent,
      status: EventStatus.APPROVED,
      approvedBy: adminId,
      approvedAt: new Date(),
      organizerId: 'organizer-123',
      organizer: {
        id: 'organizer-123',
        firstName: 'Cecil',
        lastName: 'Spencer',
        email: 'cecil@test.com',
        organizationName: 'Test Org',
        status: UserStatus.ACTIVE,
        role: UserRole.ORGANIZER,
      },
    } as any);

    await EventService.approveEvent('event-456', adminId, UserRole.SUPERADMIN);

    // Should NOT call user.update since organizer is already active
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should reject if caller is not admin', async () => {
    await expect(
      EventService.approveEvent('event-456', 'user-123', UserRole.ORGANIZER),
    ).rejects.toThrow(AuthorizationError);
  });

  it('should reject if event not found', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(
      EventService.approveEvent('nonexistent', adminId, UserRole.SUPERADMIN),
    ).rejects.toThrow(NotFoundError);
  });

  it('should reject if event already approved', async () => {
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-456',
      title: 'Test Event',
      status: EventStatus.APPROVED,
    } as any);

    await expect(
      EventService.approveEvent('event-456', adminId, UserRole.SUPERADMIN),
    ).rejects.toThrow(ValidationError);
  });
});

describe('EventService - registerForEvent (seatIds)', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  const mockFreeEvent = {
    id: 'event-free-123',
    title: 'Free Event',
    status: EventStatus.APPROVED,
    isFree: true,
    price: null,
    ticketTypes: null,
    capacity: 100,
    availableSlots: 50,
    registrationDeadline: null,
    startDate: new Date('2027-06-01'),
    maxTicketsPerUser: 10,
  };

  const mockRegistration = {
    id: 'reg-123',
    eventId: 'event-free-123',
    attendeeId: 'attendee-123',
    status: RegistrationStatus.CONFIRMED,
    paymentStatus: 'COMPLETED',
    ticketLineItems: [],
    event: {
      id: 'event-free-123',
      title: 'Free Event',
      description: 'A free event',
      startDate: new Date('2027-06-01'),
      endDate: null,
      startTime: null,
      endTime: null,
      venue: 'Test Venue',
      location: 'Test Location',
      address: null,
      isOnline: false,
      onlineLink: null,
      image: null,
      currency: 'USD',
      organizer: {
        id: 'organizer-123',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
        email: 'organizer@test.com',
      },
    },
    attendee: {
      id: 'attendee-123',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      companyAffiliation: null,
    },
  };

  beforeEach(() => {
    prisma = databaseModule.prisma as unknown as DeepMockProxy<PrismaClient>;
    mockReset(prisma);
    vi.clearAllMocks();

    // Common mocks for registerForEvent
    prisma.event.findFirst.mockResolvedValue(mockFreeEvent as any);
    prisma.eventRegistration.findUnique.mockResolvedValue(null); // No existing registration
    prisma.ticketLineItem.aggregate.mockResolvedValue({ _sum: { quantity: 0 }, _count: 0, _avg: { quantity: null }, _min: { quantity: null }, _max: { quantity: null } } as any);
    prisma.eventRegistration.findMany.mockResolvedValue([]); // No legacy registrations
    prisma.$transaction.mockImplementation((callback: any) => callback(prisma));
    // Inside transaction: lock query + registration create + slot update
    prisma.$queryRaw.mockResolvedValue([{
      id: mockFreeEvent.id,
      capacity: mockFreeEvent.capacity,
      availableSlots: mockFreeEvent.availableSlots,
    }]);
    prisma.ticketLineItem.aggregate.mockResolvedValue({ _sum: { quantity: 0 }, _count: 0, _avg: { quantity: null }, _min: { quantity: null }, _max: { quantity: null } } as any);
    prisma.eventRegistration.count.mockResolvedValue(0);
    prisma.eventRegistration.create.mockResolvedValue(mockRegistration as any);
    prisma.event.update.mockResolvedValue({} as any);
    // QR code storage update
    prisma.eventRegistration.update.mockResolvedValue({} as any);
  });

  it('should reserve seats when seatIds are provided', async () => {
    const seatIds = ['seat-1', 'seat-2', 'seat-3'];

    await EventService.registerForEvent(
      'event-free-123',
      'attendee-123',
      { seatIds },
    );

    expect(mockSeatSelectionService.reserveSeats).toHaveBeenCalledWith(
      'event-free-123',
      seatIds,
      'reg-123',
      15, // 15-minute timeout
    );
  });

  it('should not call reserveSeats when no seatIds provided', async () => {
    await EventService.registerForEvent(
      'event-free-123',
      'attendee-123',
      {},
    );

    expect(mockSeatSelectionService.reserveSeats).not.toHaveBeenCalled();
  });

  it('should not fail registration when seat reservation fails', async () => {
    mockSeatSelectionService.reserveSeats.mockRejectedValue(
      new Error('Seats already reserved by another user'),
    );

    // Registration should still succeed
    const result = await EventService.registerForEvent(
      'event-free-123',
      'attendee-123',
      { seatIds: ['seat-1'] },
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('reg-123');
    expect(mockSeatSelectionService.reserveSeats).toHaveBeenCalled();
  });

  it('should not call reserveSeats when seatIds is empty array', async () => {
    await EventService.registerForEvent(
      'event-free-123',
      'attendee-123',
      { seatIds: [] },
    );

    expect(mockSeatSelectionService.reserveSeats).not.toHaveBeenCalled();
  });
});

describe('EventService - getEventById', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    prisma = databaseModule.prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    mockReset(prisma);
    vi.clearAllMocks();
    // Default: no attendee avatars, no promo codes
    prisma.eventRegistration.findMany.mockResolvedValue([]);
    prisma.promoCode.count.mockResolvedValue(0);
  });

  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    status: EventStatus.APPROVED,
    organizerId: 'organizer-123',
    deletedAt: null,
    organizer: {
      id: 'organizer-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'organizer@example.com',
      organizationName: 'Test Org',
      businessEmail: 'biz@example.com',
    },
    _count: { registrations: 5 },
    seatMap: null,
  };

  it('should throw NotFoundError if event not found', async () => {
    // Arrange
    prisma.event.findFirst.mockResolvedValue(null);

    // Act & Assert
    await expect(
      EventService.getEventById('non-existent'),
    ).rejects.toThrow(NotFoundError);
  });

  it('should return approved event for unauthenticated users', async () => {
    // Arrange - deep copy to avoid mutation across tests
    prisma.event.findFirst.mockResolvedValue(JSON.parse(JSON.stringify(mockEvent)) as any);

    // Act
    const result = await EventService.getEventById('event-123');

    // Assert
    expect(result).toBeDefined();
    expect(result.title).toBe('Test Event');
  });

  it('should hide organizer email for non-organizer users', async () => {
    // Arrange - deep copy to avoid mutation across tests
    prisma.event.findFirst.mockResolvedValue(JSON.parse(JSON.stringify(mockEvent)) as any);

    // Act
    const result = await EventService.getEventById('event-123', 'some-other-user');

    // Assert
    expect(result.organizer?.email).toBe('');
    expect(result.organizer?.businessEmail).toBeNull();
  });

  it('should show organizer email to the event organizer', async () => {
    // Arrange - deep copy to avoid mutation across tests
    prisma.event.findFirst.mockResolvedValue(JSON.parse(JSON.stringify(mockEvent)) as any);

    // Act
    const result = await EventService.getEventById('event-123', 'organizer-123');

    // Assert
    expect(result.organizer?.email).toBe('organizer@example.com');
    expect(result.organizer?.businessEmail).toBe('biz@example.com');
  });

  it('should hide non-approved events from non-organizer users', async () => {
    // Arrange
    const pendingEvent = {
      ...mockEvent,
      status: EventStatus.PENDING,
    };
    prisma.event.findFirst.mockResolvedValue(pendingEvent as any);

    // Act & Assert - non-organizer should see NotFoundError
    await expect(
      EventService.getEventById('event-123', 'some-other-user'),
    ).rejects.toThrow(NotFoundError);
  });

  it('should show non-approved events to the event organizer', async () => {
    // Arrange
    const pendingEvent = {
      ...mockEvent,
      status: EventStatus.PENDING,
    };
    prisma.event.findFirst.mockResolvedValue(pendingEvent as any);

    // Act
    const result = await EventService.getEventById('event-123', 'organizer-123');

    // Assert
    expect(result).toBeDefined();
    expect(result.status).toBe(EventStatus.PENDING);
  });

  it('should hide non-approved events from unauthenticated users', async () => {
    // Arrange - REJECTED status is non-approved
    const rejectedEvent = {
      ...mockEvent,
      status: EventStatus.REJECTED,
    };
    prisma.event.findFirst.mockResolvedValue(rejectedEvent as any);

    // Act & Assert
    await expect(
      EventService.getEventById('event-123'),
    ).rejects.toThrow(NotFoundError);
  });

  it('should set hasPromoCodes to true when active promo codes exist', async () => {
    // Arrange
    prisma.event.findFirst.mockResolvedValue(JSON.parse(JSON.stringify(mockEvent)) as any);
    prisma.promoCode.count.mockResolvedValue(2);

    // Act
    const result = await EventService.getEventById('event-123');

    // Assert
    expect((result as any).hasPromoCodes).toBe(true);
    expect(prisma.promoCode.count).toHaveBeenCalledWith({
      where: { eventId: 'event-123', isActive: true },
    });
  });

  it('should set hasPromoCodes to false when no active promo codes exist', async () => {
    // Arrange
    prisma.event.findFirst.mockResolvedValue(JSON.parse(JSON.stringify(mockEvent)) as any);
    prisma.promoCode.count.mockResolvedValue(0);

    // Act
    const result = await EventService.getEventById('event-123');

    // Assert
    expect((result as any).hasPromoCodes).toBe(false);
  });
});

describe('EventService - updateEvent capacity recalculation', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  const mockEvent = {
    id: 'event-123',
    organizerId: 'organizer-123',
    status: EventStatus.APPROVED,
    startDate: new Date('2027-06-01'),
    endDate: null,
    venue: 'Test Venue',
    location: 'Test Location',
    capacity: 100,
    availableSlots: 50,
    ticketTypes: null,
  };

  beforeEach(() => {
    prisma = databaseModule.prisma as unknown as DeepMockProxy<PrismaClient>;
    mockReset(prisma);
    vi.clearAllMocks();
  });

  it('should recalculate availableSlots using SUM of ticket quantities, not registration count', async () => {
    // Arrange: event with 100 capacity, 3 registrations but 15 total tickets
    prisma.event.findFirst.mockResolvedValue(mockEvent as any);
    prisma.eventCollaborator.findFirst.mockResolvedValue(null);
    // 3 registrations bought 15 total tickets (5+5+5)
    prisma.ticketLineItem.aggregate.mockResolvedValue({
      _sum: { quantity: 15 },
      _count: 3,
      _avg: { quantity: null },
      _min: { quantity: null },
      _max: { quantity: null },
    } as any);
    prisma.event.update.mockResolvedValue({
      ...mockEvent,
      capacity: 100,
      availableSlots: 85, // 100 - 15 = 85
    } as any);

    // Act
    await EventService.updateEvent(
      'event-123',
      { capacity: 100 },
      'organizer-123',
      UserRole.ORGANIZER,
    );

    // Assert - should use ticketLineItem.aggregate, not eventRegistration.count
    expect(prisma.ticketLineItem.aggregate).toHaveBeenCalledWith({
      _sum: { quantity: true },
      where: {
        registration: {
          eventId: 'event-123',
          status: { in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] },
        },
      },
    });
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          capacity: 100,
          availableSlots: 85,
        }),
      }),
    );
  });

  it('should cap availableSlots at 0 when tickets exceed new capacity', async () => {
    prisma.event.findFirst.mockResolvedValue(mockEvent as any);
    prisma.eventCollaborator.findFirst.mockResolvedValue(null);
    // 80 tickets sold, reducing capacity to 50
    prisma.ticketLineItem.aggregate.mockResolvedValue({
      _sum: { quantity: 80 },
      _count: 10,
      _avg: { quantity: null },
      _min: { quantity: null },
      _max: { quantity: null },
    } as any);
    prisma.event.update.mockResolvedValue({
      ...mockEvent,
      capacity: 50,
      availableSlots: 0,
    } as any);

    await EventService.updateEvent(
      'event-123',
      { capacity: 50 },
      'organizer-123',
      UserRole.ORGANIZER,
    );

    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          capacity: 50,
          availableSlots: 0, // max(0, 50-80) = 0
        }),
      }),
    );
  });
});

describe('EventService - updateEvent sold-count floor validation', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  const existingEvent = {
    id: 'event-123',
    organizerId: 'organizer-123',
    status: EventStatus.PENDING,
    startDate: new Date('2027-06-01'),
    endDate: null,
    venue: 'Test Venue',
    location: 'Lagos',
    isFree: false,
  };

  const paidTicket = (overrides = {}) => ({
    name: 'General Admission',
    price: 5000,
    quantity: 100,
    features: [],
    ...overrides,
  });

  beforeEach(() => {
    prisma = databaseModule.prisma as unknown as DeepMockProxy<PrismaClient>;
    mockReset(prisma);
    vi.clearAllMocks();

    prisma.event.findFirst.mockResolvedValue(existingEvent as any);
    prisma.eventCollaborator.findFirst.mockResolvedValue(null);
    prisma.event.update.mockResolvedValue({ ...existingEvent } as any);
  });

  it('should throw ValidationError when new quantity is below sold count via ticketLineItems', async () => {
    // Arrange: 5 tickets sold via line items
    prisma.eventRegistration.findMany.mockResolvedValue([
      { ticketType: null, ticketLineItems: [{ ticketType: 'General Admission', quantity: 3 }] } as any,
      { ticketType: null, ticketLineItems: [{ ticketType: 'General Admission', quantity: 2 }] } as any,
    ]);

    // Act & Assert: trying to set quantity to 4 when 5 were sold
    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ quantity: 4 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).rejects.toThrow(ValidationError);

    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ quantity: 4 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).rejects.toThrow('Cannot set quantity of "General Admission" below 5');
  });

  it('should throw ValidationError when new quantity is below sold count via legacy ticketType field', async () => {
    // Arrange: 2 tickets sold via legacy field
    prisma.eventRegistration.findMany.mockResolvedValue([
      { ticketType: 'VIP', ticketLineItems: null } as any,
      { ticketType: 'VIP', ticketLineItems: null } as any,
    ]);

    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ name: 'VIP', price: 10000, quantity: 1 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).rejects.toThrow('Cannot set quantity of "VIP" below 2');
  });

  it('should allow quantity equal to sold count', async () => {
    // Arrange: 5 tickets sold
    prisma.eventRegistration.findMany.mockResolvedValue([
      { ticketType: null, ticketLineItems: [{ ticketType: 'General Admission', quantity: 5 }] } as any,
    ]);

    // Act: setting quantity exactly to 5 — should succeed
    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ quantity: 5 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).resolves.toBeDefined();
  });

  it('should allow quantity above sold count', async () => {
    // Arrange: 5 tickets sold
    prisma.eventRegistration.findMany.mockResolvedValue([
      { ticketType: null, ticketLineItems: [{ ticketType: 'General Admission', quantity: 5 }] } as any,
    ]);

    // Act: increasing quantity to 200 — should succeed
    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ quantity: 200 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).resolves.toBeDefined();
  });

  it('should allow null (unlimited) quantity even when tickets are sold', async () => {
    // Arrange: 50 tickets sold
    prisma.eventRegistration.findMany.mockResolvedValue([
      { ticketType: null, ticketLineItems: [{ ticketType: 'General Admission', quantity: 50 }] } as any,
    ]);

    // Act: removing quantity cap — should succeed
    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ quantity: null })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).resolves.toBeDefined();
  });

  it('should not enforce floor when no tickets of that type have been sold', async () => {
    // Arrange: sales only for a different ticket type
    prisma.eventRegistration.findMany.mockResolvedValue([
      { ticketType: null, ticketLineItems: [{ ticketType: 'VIP', quantity: 10 }] } as any,
    ]);

    // Act: reducing General Admission (zero sales) to 1 — should succeed
    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ name: 'General Admission', quantity: 1 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).resolves.toBeDefined();
  });

  it('should aggregate quantities across multiple line-item registrations', async () => {
    // Arrange: 3 registrations, each with 2 tickets = 6 total
    prisma.eventRegistration.findMany.mockResolvedValue([
      { ticketType: null, ticketLineItems: [{ ticketType: 'Early Bird', quantity: 2 }] } as any,
      { ticketType: null, ticketLineItems: [{ ticketType: 'Early Bird', quantity: 2 }] } as any,
      { ticketType: null, ticketLineItems: [{ ticketType: 'Early Bird', quantity: 2 }] } as any,
    ]);

    // quantity of 5 should fail (6 sold)
    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ name: 'Early Bird', quantity: 5 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).rejects.toThrow('Cannot set quantity of "Early Bird" below 6');

    // quantity of 6 should succeed
    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ name: 'Early Bird', quantity: 6 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).resolves.toBeDefined();
  });

  it('should default missing quantity in line items to 1', async () => {
    // Arrange: line item with no quantity field → counts as 1
    prisma.eventRegistration.findMany.mockResolvedValue([
      { ticketType: null, ticketLineItems: [{ ticketType: 'General Admission' }] } as any,
    ]);

    // 1 sold — quantity of 0 should fail
    await expect(
      EventService.updateEvent(
        'event-123',
        { ticketTypes: [paidTicket({ quantity: 0 })] } as any,
        'organizer-123',
        UserRole.ORGANIZER,
      ),
    ).rejects.toThrow('Cannot set quantity of "General Admission" below 1');
  });

  it('should not query registrations when ticketTypes is not in the update payload', async () => {
    // Act: updating only title — no ticketTypes in payload
    await EventService.updateEvent(
      'event-123',
      { title: 'New Title' } as any,
      'organizer-123',
      UserRole.ORGANIZER,
    );

    // Assert: sold-count query should not run
    expect(prisma.eventRegistration.findMany).not.toHaveBeenCalled();
  });

  it('should query registrations filtering out CANCELLED and FAILED', async () => {
    // Arrange: no sold tickets
    prisma.eventRegistration.findMany.mockResolvedValue([]);

    await EventService.updateEvent(
      'event-123',
      { ticketTypes: [paidTicket()] } as any,
      'organizer-123',
      UserRole.ORGANIZER,
    );

    // Assert: query excludes cancelled/failed registrations
    expect(prisma.eventRegistration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eventId: 'event-123',
          status: { not: 'CANCELLED' },
          paymentStatus: { not: 'FAILED' },
        }),
      }),
    );
  });
});
