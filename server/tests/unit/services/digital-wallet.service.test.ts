import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { DigitalWalletService } from '../../../src/services/digital-wallet.service.js';
import { NotFoundError, ValidationError } from '../../../src/utils/errors.js';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

vi.mock('../../../src/services/ticket.service.js', () => ({
  TicketService: {
    generateTicketData: vi.fn().mockReturnValue('TICKET-DATA-QR'),
  },
}));

import { prisma } from '../../../src/config/database.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('DigitalWalletService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    startDate: new Date('2026-12-31'),
    endDate: new Date('2026-12-31'),
    location: 'Test Location',
    image: 'event.jpg',
  };

  const mockRegistration = {
    id: 'registration-123',
    eventId: mockEvent.id,
    attendeeId: mockUser.id,
    ticketType: 'General Admission',
    event: mockEvent,
  };

  const mockWallet = {
    id: 'wallet-123',
    userId: mockUser.id,
    autoAddTickets: true,
    backupEnabled: true,
    walletTickets: [],
  };

  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet if found', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);

      // Act
      const result = await DigitalWalletService.getOrCreateWallet(mockUser.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockWallet.id);
      expect(result.userId).toBe(mockUser.id);
      expect(prismaMock.digitalWallet.create).not.toHaveBeenCalled();
    });

    it('should create new wallet if not found', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(null);
      prismaMock.digitalWallet.create.mockResolvedValue(mockWallet as any);

      // Act
      const result = await DigitalWalletService.getOrCreateWallet(mockUser.id);

      // Assert
      expect(result).toBeDefined();
      expect(prismaMock.digitalWallet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            autoAddTickets: true,
            backupEnabled: true,
          }),
        }),
      );
    });

    it('should set default preferences for new wallet', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(null);
      prismaMock.digitalWallet.create.mockResolvedValue({
        ...mockWallet,
        autoAddTickets: true,
        backupEnabled: true,
      } as any);

      // Act
      const result = await DigitalWalletService.getOrCreateWallet(mockUser.id);

      // Assert
      expect(result.autoAddTickets).toBe(true);
      expect(result.backupEnabled).toBe(true);
    });
  });

  describe('addTicketToWallet', () => {
    it('should add ticket to wallet successfully', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.walletTicket.findUnique.mockResolvedValue(null);
      prismaMock.walletTicket.create.mockResolvedValue({
        id: 'wallet-ticket-123',
        walletId: mockWallet.id,
        registrationId: mockRegistration.id,
        backupCode: 'WLT-12345678-ABC123',
        isActive: true,
        registration: mockRegistration,
      } as any);

      // Act
      const result = await DigitalWalletService.addTicketToWallet(
        mockUser.id,
        mockRegistration.id,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.registrationId).toBe(mockRegistration.id);
      expect(result.walletId).toBe(mockWallet.id);
      expect(result.isActive).toBe(true);
      expect(prismaMock.walletTicket.create).toHaveBeenCalled();
    });

    it('should generate backup code', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.walletTicket.findUnique.mockResolvedValue(null);
      prismaMock.walletTicket.create.mockResolvedValue({
        id: 'wallet-ticket-123',
        backupCode: expect.stringMatching(/^WLT-/),
      } as any);

      // Act
      await DigitalWalletService.addTicketToWallet(mockUser.id, mockRegistration.id);

      // Assert
      expect(prismaMock.walletTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            backupCode: expect.stringMatching(/^WLT-/),
          }),
        }),
      );
    });

    it('should throw error if registration not found', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        DigitalWalletService.addTicketToWallet(mockUser.id, 'invalid-id'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        DigitalWalletService.addTicketToWallet(mockUser.id, 'invalid-id'),
      ).rejects.toThrow('Registration not found');
    });

    it('should throw error if user does not own the ticket', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);

      // Act & Assert
      await expect(
        DigitalWalletService.addTicketToWallet('wrong-user-id', mockRegistration.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        DigitalWalletService.addTicketToWallet('wrong-user-id', mockRegistration.id),
      ).rejects.toThrow('You can only add your own tickets');
    });

    it('should throw error if ticket already in wallet', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue(mockRegistration as any);
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.walletTicket.findUnique.mockResolvedValue({
        id: 'existing-wallet-ticket',
        registrationId: mockRegistration.id,
      } as any);

      // Act & Assert
      await expect(
        DigitalWalletService.addTicketToWallet(mockUser.id, mockRegistration.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        DigitalWalletService.addTicketToWallet(mockUser.id, mockRegistration.id),
      ).rejects.toThrow('Ticket is already in your wallet');
    });
  });

  describe('removeTicketFromWallet', () => {
    const mockWalletTicket = {
      id: 'wallet-ticket-123',
      registrationId: mockRegistration.id,
      walletId: mockWallet.id,
      wallet: mockWallet,
    };

    it('should remove ticket from wallet successfully', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);
      prismaMock.walletTicket.delete.mockResolvedValue(mockWalletTicket as any);

      // Act
      const result = await DigitalWalletService.removeTicketFromWallet(
        mockUser.id,
        mockRegistration.id,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(prismaMock.walletTicket.delete).toHaveBeenCalledWith({
        where: { registrationId: mockRegistration.id },
      });
    });

    it('should throw error if wallet not found', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        DigitalWalletService.removeTicketFromWallet(mockUser.id, mockRegistration.id),
      ).rejects.toThrow(NotFoundError);

      await expect(
        DigitalWalletService.removeTicketFromWallet(mockUser.id, mockRegistration.id),
      ).rejects.toThrow('Wallet not found');
    });

    it('should throw error if ticket not in wallet', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.walletTicket.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        DigitalWalletService.removeTicketFromWallet(mockUser.id, mockRegistration.id),
      ).rejects.toThrow(NotFoundError);

      await expect(
        DigitalWalletService.removeTicketFromWallet(mockUser.id, mockRegistration.id),
      ).rejects.toThrow('Ticket not found in wallet');
    });

    it('should throw error if user does not own the wallet', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);

      // Act & Assert
      await expect(
        DigitalWalletService.removeTicketFromWallet('wrong-user-id', mockRegistration.id),
      ).rejects.toThrow(ValidationError);

      await expect(
        DigitalWalletService.removeTicketFromWallet('wrong-user-id', mockRegistration.id),
      ).rejects.toThrow('You can only remove your own tickets');
    });
  });

  describe('updateWalletPreferences', () => {
    it('should update autoAddTickets preference', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.digitalWallet.update.mockResolvedValue({
        ...mockWallet,
        autoAddTickets: false,
      } as any);

      // Act
      const result = await DigitalWalletService.updateWalletPreferences(mockUser.id, {
        autoAddTickets: false,
      });

      // Assert
      expect(result.autoAddTickets).toBe(false);
      expect(prismaMock.digitalWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            autoAddTickets: false,
            lastSyncedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should update backupEnabled preference', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.digitalWallet.update.mockResolvedValue({
        ...mockWallet,
        backupEnabled: false,
      } as any);

      // Act
      const result = await DigitalWalletService.updateWalletPreferences(mockUser.id, {
        backupEnabled: false,
      });

      // Assert
      expect(result.backupEnabled).toBe(false);
    });

    it('should update multiple preferences at once', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.digitalWallet.update.mockResolvedValue({
        ...mockWallet,
        autoAddTickets: false,
        backupEnabled: false,
      } as any);

      // Act
      const result = await DigitalWalletService.updateWalletPreferences(mockUser.id, {
        autoAddTickets: false,
        backupEnabled: false,
      });

      // Assert
      expect(result.autoAddTickets).toBe(false);
      expect(result.backupEnabled).toBe(false);
    });

    it('should update lastSyncedAt when updating preferences', async () => {
      // Arrange
      prismaMock.digitalWallet.findUnique.mockResolvedValue(mockWallet as any);
      prismaMock.digitalWallet.update.mockResolvedValue(mockWallet as any);

      // Act
      await DigitalWalletService.updateWalletPreferences(mockUser.id, {
        autoAddTickets: true,
      });

      // Assert
      expect(prismaMock.digitalWallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastSyncedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('generateAppleWalletPass', () => {
    const mockWalletTicket = {
      id: 'wallet-ticket-123',
      registrationId: mockRegistration.id,
      walletId: mockWallet.id,
      backupCode: 'WLT-12345678-ABC123',
      wallet: mockWallet,
      registration: {
        ...mockRegistration,
        attendee: mockUser,
      },
    };

    it('should generate Apple Wallet pass successfully', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);
      prismaMock.walletTicket.update.mockResolvedValue(mockWalletTicket as any);

      // Act
      const result = await DigitalWalletService.generateAppleWalletPass(
        mockUser.id,
        mockRegistration.id,
      );

      // Assert
      expect(result.passData).toBeDefined();
      expect(result.passData.passTypeIdentifier).toBe('pass.com.eventknit.ticket');
      expect(result.passData.serialNumber).toBe(mockRegistration.id);
      expect(result.downloadUrl).toBe(`/api/v1/user/wallet/${mockRegistration.id}/apple-pass`);
    });

    it('should include event details in pass', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);
      prismaMock.walletTicket.update.mockResolvedValue(mockWalletTicket as any);

      // Act
      const result = await DigitalWalletService.generateAppleWalletPass(
        mockUser.id,
        mockRegistration.id,
      );

      // Assert
      expect(result.passData.description).toBe(mockEvent.title);
      expect(result.passData.eventTicket.primaryFields[0].value).toBe(mockEvent.title);
    });

    it('should update lastAccessedAt when generating pass', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);
      prismaMock.walletTicket.update.mockResolvedValue(mockWalletTicket as any);

      // Act
      await DigitalWalletService.generateAppleWalletPass(
        mockUser.id,
        mockRegistration.id,
      );

      // Assert
      expect(prismaMock.walletTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastAccessedAt: expect.any(Date),
            passData: expect.any(Object),
          }),
        }),
      );
    });

    it('should throw error if ticket not in wallet', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        DigitalWalletService.generateAppleWalletPass(mockUser.id, 'invalid-id'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        DigitalWalletService.generateAppleWalletPass(mockUser.id, 'invalid-id'),
      ).rejects.toThrow('Ticket not found in wallet');
    });

    it('should throw error if user does not own the wallet', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);

      // Act & Assert
      await expect(
        DigitalWalletService.generateAppleWalletPass('wrong-user-id', mockRegistration.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('generateGooglePayPass', () => {
    const mockWalletTicket = {
      id: 'wallet-ticket-123',
      registrationId: mockRegistration.id,
      walletId: mockWallet.id,
      backupCode: 'WLT-12345678-ABC123',
      wallet: mockWallet,
      registration: {
        ...mockRegistration,
        attendee: mockUser,
      },
    };

    it('should generate Google Pay pass successfully', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);
      prismaMock.walletTicket.update.mockResolvedValue(mockWalletTicket as any);

      // Act
      const result = await DigitalWalletService.generateGooglePayPass(
        mockUser.id,
        mockRegistration.id,
      );

      // Assert
      expect(result.passData).toBeDefined();
      expect(result.passData.issuerId).toBe('eventknit');
      expect(result.passData.objectSuffix).toBe(mockRegistration.id);
      expect(result.saveUrl).toBe(`/api/v1/user/wallet/${mockRegistration.id}/google-pass`);
    });

    it('should include event details in pass', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);
      prismaMock.walletTicket.update.mockResolvedValue(mockWalletTicket as any);

      // Act
      const result = await DigitalWalletService.generateGooglePayPass(
        mockUser.id,
        mockRegistration.id,
      );

      // Assert
      expect(result.passData.eventTicketObject.eventName.defaultValue.value).toBe(mockEvent.title);
      expect(result.passData.eventTicketObject.barcode.value).toBe(mockWalletTicket.backupCode);
    });

    it('should update lastAccessedAt when generating pass', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);
      prismaMock.walletTicket.update.mockResolvedValue(mockWalletTicket as any);

      // Act
      await DigitalWalletService.generateGooglePayPass(
        mockUser.id,
        mockRegistration.id,
      );

      // Assert
      expect(prismaMock.walletTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastAccessedAt: expect.any(Date),
            passData: expect.any(Object),
          }),
        }),
      );
    });

    it('should throw error if ticket not in wallet', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        DigitalWalletService.generateGooglePayPass(mockUser.id, 'invalid-id'),
      ).rejects.toThrow(NotFoundError);

      await expect(
        DigitalWalletService.generateGooglePayPass(mockUser.id, 'invalid-id'),
      ).rejects.toThrow('Ticket not found in wallet');
    });

    it('should throw error if user does not own the wallet', async () => {
      // Arrange
      prismaMock.walletTicket.findUnique.mockResolvedValue(mockWalletTicket as any);

      // Act & Assert
      await expect(
        DigitalWalletService.generateGooglePayPass('wrong-user-id', mockRegistration.id),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
