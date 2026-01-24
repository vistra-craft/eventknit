import { PrismaClient, RegistrationStatus, TicketStatus } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { TicketTransferService } from '../../../src/services/ticket-transfer.service.js';
import { ValidationError } from '../../../src/utils/errors.js';
import { emailService } from '../../../src/services/email.service.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../../../src/services/ticket.service.js', () => ({
  TicketService: {
    generateBackupTicketCode: jest.fn().mockReturnValue('BACKUP-123456'),
  },
}));

jest.mock('../../../src/services/digital-wallet.service.js', () => ({
  DigitalWalletService: {
    addTicketToWallet: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../src/services/email.service.js', () => ({
  emailService: {
    sendTicketTransferOfferEmail: jest.fn().mockResolvedValue({ success: true }),
    sendTicketTransferAcceptedEmail: jest.fn().mockResolvedValue({ success: true }),
    sendTicketTransferCancelledEmail: jest.fn().mockResolvedValue({ success: true }),
  },
}));

import { prisma } from '../../../src/config/database.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('TicketTransferService', () => {
  const futureDate = new Date('2026-12-31');
  const pastDate = new Date('2024-01-01');

  const mockUser = {
    id: 'user-123',
    email: 'sender@example.com',
    firstName: 'John',
    lastName: 'Doe',
    status: 'ACTIVE',
    role: 'ATTENDEE',
  };

  const mockRecipient = {
    id: 'recipient-123',
    email: 'recipient@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    status: 'ACTIVE',
    role: 'ATTENDEE',
  };

  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    startDate: futureDate,
    allowTransfers: true,
    venue: 'Test Venue',
    location: 'Test Location',
    organizerId: 'organizer-123',
  };

  const mockRegistration = {
    id: 'registration-123',
    eventId: mockEvent.id,
    attendeeId: mockUser.id,
    quantity: 1,
    totalAmount: 100,
    status: RegistrationStatus.CONFIRMED,
    paymentStatus: 'COMPLETED',
    ticketType: 'General Admission',
    ticketStatus: TicketStatus.ACTIVE,
    registrationData: {},
    backupCode: 'BACKUP-123',
    qrSecret: 'qr-secret-123',
    event: mockEvent,
    ticketLineItems: [],
  };

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
  });

  describe('initiateTransfer', () => {
    const transferData = {
      toUserId: mockRecipient.id,
      message: 'Here is your ticket!',
    };

    it('should initiate transfer with toUserId', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketTransfer.findFirst.mockResolvedValue(null);
      prismaMock.ticketTransfer.create.mockResolvedValue({
        id: 'transfer-123',
        registrationId: mockRegistration.id,
        fromUserId: mockUser.id,
        toUserId: mockRecipient.id,
        toEmail: null,
        transferToken: 'token-123',
        message: transferData.message,
        status: 'PENDING',
        expiresAt: new Date(),
        registration: mockRegistration,
        fromUser: mockUser,
        toUser: mockRecipient,
      } as any);

      // Act
      const result = await TicketTransferService.initiateTransfer(
        mockUser.id,
        mockRegistration.id,
        transferData,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.fromUserId).toBe(mockUser.id);
      expect(result.toUserId).toBe(mockRecipient.id);
      expect(prismaMock.ticketTransfer.create).toHaveBeenCalled();
    });

    it('should initiate transfer with toEmail when user exists', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.user.findUnique.mockResolvedValue(mockRecipient as any);
      prismaMock.ticketTransfer.findFirst.mockResolvedValue(null);
      prismaMock.ticketTransfer.create.mockResolvedValue({
        id: 'transfer-123',
        fromUserId: mockUser.id,
        toUserId: mockRecipient.id,
        toEmail: null,
        transferToken: 'token-123',
        registration: mockRegistration,
        fromUser: mockUser,
        toUser: mockRecipient,
      } as any);

      // Act
      const result = await TicketTransferService.initiateTransfer(
        mockUser.id,
        mockRegistration.id,
        { toEmail: mockRecipient.email, message: 'Test' },
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.toUserId).toBe(mockRecipient.id);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRecipient.email },
      });
    });

    it('should initiate transfer with toEmail when user does not exist', async () => {
      // Arrange
      const guestEmail = 'guest@example.com';
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.user.findUnique.mockResolvedValue(null); // User not found
      prismaMock.ticketTransfer.findFirst.mockResolvedValue(null);
      prismaMock.ticketTransfer.create.mockResolvedValue({
        id: 'transfer-123',
        fromUserId: mockUser.id,
        toUserId: null,
        toEmail: guestEmail,
        transferToken: 'token-123',
        registration: mockRegistration,
        fromUser: mockUser,
        toUser: null,
      } as any);

      // Act
      const result = await TicketTransferService.initiateTransfer(
        mockUser.id,
        mockRegistration.id,
        { toEmail: guestEmail, message: 'Test' },
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.toUserId).toBeNull();
      expect(result.toEmail).toBe(guestEmail);
    });

    it('should throw error if registration not found', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, 'invalid-id', transferData),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, 'invalid-id', transferData),
      ).rejects.toThrow('Registration not found');
    });

    it('should throw error if user does not own the ticket', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);

      // Act & Assert
      await expect(
        TicketTransferService.initiateTransfer('wrong-user-id', mockRegistration.id, transferData),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.initiateTransfer('wrong-user-id', mockRegistration.id, transferData),
      ).rejects.toThrow('You can only transfer your own tickets');
    });

    it('should throw error if registration is not confirmed', async () => {
      // Arrange
      const pendingRegistration = {
        ...mockRegistration,
        status: RegistrationStatus.PENDING,
      };
      prismaMock.eventRegistration.findUnique.mockResolvedValue(pendingRegistration as any);

      // Act & Assert
      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, transferData),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, transferData),
      ).rejects.toThrow('Only confirmed registrations can be transferred');
    });

    it('should throw error if event does not allow transfers', async () => {
      // Arrange
      const noTransferRegistration = {
        ...mockRegistration,
        event: { ...mockEvent, allowTransfers: false },
      };
      prismaMock.eventRegistration.findUnique.mockResolvedValue(noTransferRegistration as any);

      // Act & Assert
      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, transferData),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, transferData),
      ).rejects.toThrow('Transfers are disabled for this event');
    });

    it('should throw error if event has already started', async () => {
      // Arrange
      const pastEventRegistration = {
        ...mockRegistration,
        event: { ...mockEvent, startDate: pastDate },
      };
      prismaMock.eventRegistration.findUnique.mockResolvedValue(pastEventRegistration as any);

      // Act & Assert
      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, transferData),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, transferData),
      ).rejects.toThrow('Cannot transfer tickets for events that have already started');
    });

    it('should throw error if neither toUserId nor toEmail provided', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);

      // Act & Assert
      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, {}),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, {}),
      ).rejects.toThrow('Either toUserId or toEmail must be provided');
    });

    it('should throw error if pending transfer already exists', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketTransfer.findFirst.mockResolvedValue({
        id: 'existing-transfer-123',
        status: 'PENDING',
      } as any);

      // Act & Assert
      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, transferData),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.initiateTransfer(mockUser.id, mockRegistration.id, transferData),
      ).rejects.toThrow('A transfer for this ticket is already pending');
    });

    it('should send email notification to recipient', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketTransfer.findFirst.mockResolvedValue(null);
      prismaMock.ticketTransfer.create.mockResolvedValue({
        id: 'transfer-123',
        fromUserId: mockUser.id,
        toUserId: mockRecipient.id,
        transferToken: 'token-123',
        registration: mockRegistration,
        fromUser: mockUser,
        toUser: mockRecipient,
      } as any);

      // Act
      await TicketTransferService.initiateTransfer(
        mockUser.id,
        mockRegistration.id,
        transferData,
      );

      // Assert
      expect(emailService.sendTicketTransferOfferEmail).toHaveBeenCalledWith(
        mockRecipient.email,
        expect.objectContaining({
          senderName: expect.any(String),
          eventTitle: mockEvent.title,
        }),
      );
    });
  });

  describe('acceptTransfer', () => {
    const mockTransfer = {
      id: 'transfer-123',
      registrationId: mockRegistration.id,
      fromUserId: mockUser.id,
      toUserId: mockRecipient.id,
      toEmail: null,
      transferToken: 'token-123',
      status: 'PENDING',
      expiresAt: futureDate,
      registration: {
        ...mockRegistration,
        ticketLineItems: [
          {
            id: 'line-1',
            ticketType: 'General',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
      },
      fromUser: mockUser,
    };

    it('should accept transfer successfully', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(mockTransfer as any);
      prismaMock.$transaction.mockImplementation((callback: any) => callback(prismaMock));
      prismaMock.eventRegistration.create.mockResolvedValue({
        id: 'new-registration-123',
        attendeeId: mockRecipient.id,
      } as any);
      prismaMock.ticketLineItem.createMany.mockResolvedValue({ count: 1 });
      prismaMock.eventRegistration.update.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketTransfer.update.mockResolvedValue({
        ...mockTransfer,
        status: 'ACCEPTED',
      } as any);
      prismaMock.digitalWallet.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(mockRecipient as any);

      // Act
      const result = await TicketTransferService.acceptTransfer('token-123', mockRecipient.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.registrationId).toBe('new-registration-123');
      expect(prismaMock.eventRegistration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attendeeId: mockRecipient.id,
            status: RegistrationStatus.CONFIRMED,
          }),
        }),
      );
    });

    it('should throw error if transfer not found', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TicketTransferService.acceptTransfer('invalid-token', mockRecipient.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.acceptTransfer('invalid-token', mockRecipient.id),
      ).rejects.toThrow('Transfer not found');
    });

    it('should throw error if transfer is not pending', async () => {
      // Arrange
      const acceptedTransfer = {
        ...mockTransfer,
        status: 'ACCEPTED',
      };
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(acceptedTransfer as any);

      // Act & Assert
      await expect(
        TicketTransferService.acceptTransfer('token-123', mockRecipient.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.acceptTransfer('token-123', mockRecipient.id),
      ).rejects.toThrow('Transfer is already accepted');
    });

    it('should throw error if transfer has expired', async () => {
      // Arrange
      const expiredTransfer = {
        ...mockTransfer,
        expiresAt: pastDate,
      };
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(expiredTransfer as any);

      // Act & Assert
      await expect(
        TicketTransferService.acceptTransfer('token-123', mockRecipient.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.acceptTransfer('token-123', mockRecipient.id),
      ).rejects.toThrow('Transfer has expired');
    });

    it('should throw error if user is not the recipient', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(mockTransfer as any);

      // Act & Assert
      await expect(
        TicketTransferService.acceptTransfer('token-123', 'wrong-user-id'),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.acceptTransfer('token-123', 'wrong-user-id'),
      ).rejects.toThrow('You are not the recipient of this transfer');
    });

    it('should void old registration when accepting transfer', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(mockTransfer as any);
      prismaMock.$transaction.mockImplementation((callback: any) => callback(prismaMock));
      prismaMock.eventRegistration.create.mockResolvedValue({
        id: 'new-registration-123',
      } as any);
      prismaMock.ticketLineItem.createMany.mockResolvedValue({ count: 1 });
      prismaMock.eventRegistration.update.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketTransfer.update.mockResolvedValue(mockTransfer as any);
      prismaMock.digitalWallet.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(mockRecipient as any);

      // Act
      await TicketTransferService.acceptTransfer('token-123', mockRecipient.id);

      // Assert
      expect(prismaMock.eventRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRegistration.id },
          data: expect.objectContaining({
            status: RegistrationStatus.CANCELLED,
            ticketStatus: TicketStatus.CANCELLED,
            qrCodeDataUrl: null,
          }),
        }),
      );
    });

    it('should send email notification to original sender', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(mockTransfer as any);
      prismaMock.$transaction.mockImplementation((callback: any) => callback(prismaMock));
      prismaMock.eventRegistration.create.mockResolvedValue({
        id: 'new-registration-123',
      } as any);
      prismaMock.ticketLineItem.createMany.mockResolvedValue({ count: 1 });
      prismaMock.eventRegistration.update.mockResolvedValue(mockRegistration as any);
      prismaMock.ticketTransfer.update.mockResolvedValue(mockTransfer as any);
      prismaMock.digitalWallet.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(mockRecipient as any);

      // Act
      await TicketTransferService.acceptTransfer('token-123', mockRecipient.id);

      // Assert
      expect(emailService.sendTicketTransferAcceptedEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.objectContaining({
          eventTitle: mockEvent.title,
        }),
      );
    });
  });

  describe('cancelTransfer', () => {
    const mockTransfer = {
      id: 'transfer-123',
      registrationId: mockRegistration.id,
      fromUserId: mockUser.id,
      toUserId: mockRecipient.id,
      toEmail: null,
      status: 'PENDING',
      registration: mockRegistration,
      fromUser: mockUser,
      toUser: mockRecipient,
    };

    it('should cancel transfer by sender', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(mockTransfer as any);
      prismaMock.ticketTransfer.update.mockResolvedValue({
        ...mockTransfer,
        status: 'CANCELLED',
      } as any);

      // Act
      const result = await TicketTransferService.cancelTransfer('transfer-123', mockUser.id);

      // Assert
      expect(result).toBeDefined();
      expect(prismaMock.ticketTransfer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'transfer-123' },
          data: expect.objectContaining({
            status: 'CANCELLED',
          }),
        }),
      );
    });

    it('should cancel transfer by recipient', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(mockTransfer as any);
      prismaMock.ticketTransfer.update.mockResolvedValue({
        ...mockTransfer,
        status: 'CANCELLED',
      } as any);

      // Act
      const result = await TicketTransferService.cancelTransfer('transfer-123', mockRecipient.id);

      // Assert
      expect(result).toBeDefined();
      expect(prismaMock.ticketTransfer.update).toHaveBeenCalled();
    });

    it('should throw error if transfer not found', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        TicketTransferService.cancelTransfer('invalid-id', mockUser.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.cancelTransfer('invalid-id', mockUser.id),
      ).rejects.toThrow('Transfer not found');
    });

    it('should throw error if user is not authorized', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(mockTransfer as any);

      // Act & Assert
      await expect(
        TicketTransferService.cancelTransfer('transfer-123', 'unauthorized-user'),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.cancelTransfer('transfer-123', 'unauthorized-user'),
      ).rejects.toThrow('You are not authorized to cancel this transfer');
    });

    it('should throw error if transfer is not pending', async () => {
      // Arrange
      const acceptedTransfer = {
        ...mockTransfer,
        status: 'ACCEPTED',
      };
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(acceptedTransfer as any);

      // Act & Assert
      await expect(
        TicketTransferService.cancelTransfer('transfer-123', mockUser.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        TicketTransferService.cancelTransfer('transfer-123', mockUser.id),
      ).rejects.toThrow('Only pending transfers can be cancelled');
    });

    it('should send email notification when cancelled', async () => {
      // Arrange
      prismaMock.ticketTransfer.findUnique.mockResolvedValue(mockTransfer as any);
      prismaMock.ticketTransfer.update.mockResolvedValue({
        ...mockTransfer,
        status: 'CANCELLED',
      } as any);

      // Act
      await TicketTransferService.cancelTransfer('transfer-123', mockUser.id);

      // Assert
      expect(emailService.sendTicketTransferCancelledEmail).toHaveBeenCalled();
    });
  });

  describe('getTransferHistory', () => {
    const mockTransfers = [
      {
        id: 'transfer-1',
        fromUserId: mockUser.id,
        toUserId: mockRecipient.id,
        registration: mockRegistration,
        fromUser: mockUser,
        toUser: mockRecipient,
      },
      {
        id: 'transfer-2',
        fromUserId: mockRecipient.id,
        toUserId: mockUser.id,
        registration: mockRegistration,
        fromUser: mockRecipient,
        toUser: mockUser,
      },
    ];

    it('should get all transfers for user', async () => {
      // Arrange
      prismaMock.ticketTransfer.findMany.mockResolvedValue(mockTransfers as any);
      prismaMock.ticketTransfer.count.mockResolvedValue(2);

      // Act
      const result = await TicketTransferService.getTransferHistory(mockUser.id);

      // Assert
      expect(result.transfers).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter transfers by sent', async () => {
      // Arrange
      prismaMock.ticketTransfer.findMany.mockResolvedValue([mockTransfers[0]] as any);
      prismaMock.ticketTransfer.count.mockResolvedValue(1);

      // Act
      const result = await TicketTransferService.getTransferHistory(mockUser.id, {
        type: 'sent',
      });

      // Assert
      expect(result.transfers).toHaveLength(1);
      expect(prismaMock.ticketTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { fromUserId: mockUser.id },
        }),
      );
    });

    it('should filter transfers by received', async () => {
      // Arrange
      prismaMock.ticketTransfer.findMany.mockResolvedValue([mockTransfers[1]] as any);
      prismaMock.ticketTransfer.count.mockResolvedValue(1);

      // Act
      const result = await TicketTransferService.getTransferHistory(mockUser.id, {
        type: 'received',
      });

      // Assert
      expect(result.transfers).toHaveLength(1);
      expect(prismaMock.ticketTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { toUserId: mockUser.id },
        }),
      );
    });

    it('should support pagination', async () => {
      // Arrange
      prismaMock.ticketTransfer.findMany.mockResolvedValue([mockTransfers[0]] as any);
      prismaMock.ticketTransfer.count.mockResolvedValue(20);

      // Act
      const result = await TicketTransferService.getTransferHistory(mockUser.id, {
        page: 2,
        limit: 10,
      });

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(prismaMock.ticketTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });
});
