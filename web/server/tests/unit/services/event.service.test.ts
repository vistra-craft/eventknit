import { PrismaClient, UserRole, EventType, EventStatus, UserStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { EventService, CreateEventData } from '../../../src/services/event.service.js';
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
    EVENT_CREATED: 'EVENT_CREATED',
    EVENT_UPDATED: 'EVENT_UPDATED',
    EVENT_DELETED: 'EVENT_DELETED',
  },
}));

jest.mock('../../../src/services/ticket.service.js', () => ({
  TicketService: {
    createTicketsForEvent: jest.fn(),
  },
}));

jest.mock('../../../src/services/notification.service.js', () => ({
  NotificationService: {
    sendNotification: jest.fn(),
  },
}));

describe('EventService - Event Creation', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  const mockOrganizer = {
    id: 'organizer-123',
    email: 'organizer@test.com',
    role: UserRole.ORGANIZER,
    status: UserStatus.ACTIVE,
    isIdentityVerified: true,
    verificationLevel: 2,
    payoutLimit: null,
    kycStatus: 'APPROVED',
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
    jest.clearAllMocks();
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
            isIdentityVerified: true,
            verificationLevel: true,
            payoutLimit: true,
            kycStatus: true,
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

      it('should allow ADMIN_STAFF to create event', async () => {
        // Arrange
        const staff = { ...mockOrganizer, role: UserRole.ADMIN_STAFF };
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
          UserRole.ADMIN_STAFF,
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
        expect(result).toEqual(createdEvent);
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
              fullDescription: completeEvent.fullDescription,
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
