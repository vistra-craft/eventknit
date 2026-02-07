import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { TicketService } from '../../../src/services/ticket.service.js';
import { emailService } from '../../../src/services/email.service.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../../../src/services/email.service.js', () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue({ success: true, attempts: 1 }),
  },
}));

jest.mock('../../../src/services/ticket-security.service.js', () => ({
  TicketSecurityService: {
    generateSignature: jest.fn((payload: string) => `SIGNATURE-${payload.substring(0, 10).replace(/\|/g, '-')}`),
    validateTicketData: jest.fn().mockReturnValue(true),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,MOCK_QR_CODE'),
}));

import QRCode from 'qrcode';
import { prisma } from '../../../src/config/database.js';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('TicketService', () => {
  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    description: 'Test Description',
    startDate: new Date('2026-12-31T18:00:00Z'),
    endDate: new Date('2026-12-31T22:00:00Z'),
    startTime: '18:00',
    endTime: '22:00',
    venue: 'Test Venue',
    location: 'New York, NY',
    address: '123 Main St',
    isOnline: false,
    onlineLink: null,
    image: 'https://example.com/event.jpg',
    organizer: {
      id: 'organizer-123',
      firstName: 'John',
      lastName: 'Organizer',
      organizationName: 'Test Events Inc',
      email: 'organizer@test.com',
    },
  };

  const mockAttendee = {
    id: 'attendee-123',
    email: 'attendee@test.com',
    firstName: 'Jane',
    lastName: 'Doe',
    companyAffiliation: 'Test Corp',
  };

  const mockRegistration = {
    id: 'registration-123',
    ticketType: 'General Admission',
    quantity: 2,
    totalAmount: new Decimal(100),
    createdAt: new Date('2026-01-01'),
    backupCode: 'ABCD123456',
    registrationData: { dietary: 'vegetarian' },
    ticketLineItems: [
      {
        ticketType: 'General Admission',
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
      },
    ],
    accountInvitationToken: null,
    event: mockEvent,
    attendee: mockAttendee,
  };

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
  });

  describe('generateQRCode', () => {
    it('should generate QR code data URL', async () => {
      // Arrange
      const data = 'test-ticket-data';

      // Act
      const result = await TicketService.generateQRCode(data);

      // Assert
      expect(result).toBe('data:image/png;base64,MOCK_QR_CODE');
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should throw error if QR generation fails', async () => {
      // Arrange
      (QRCode.toDataURL as jest.Mock).mockRejectedValueOnce(new Error('QR generation failed'));

      // Act & Assert
      await expect(
        TicketService.generateQRCode('test-data'),
      ).rejects.toThrow('Failed to generate QR code');
    });
  });

  describe('generateTicketData', () => {
    it('should generate signed ticket data', () => {
      // Arrange
      const registrationId = 'reg-123';
      const eventId = 'event-123';
      const email = 'test@example.com';

      // Act
      const result = TicketService.generateTicketData(registrationId, eventId, email);

      // Assert
      expect(result).toContain(registrationId);
      expect(result).toContain(eventId);
      expect(result).toContain(email);
      expect(result).toMatch(/\|SIGNATURE-/); // Contains signature
    });

    it('should include timestamp in ticket data', () => {
      // Arrange
      const now = Date.now();

      // Act
      const result = TicketService.generateTicketData('reg-123', 'event-123', 'test@example.com');

      // Assert
      const parts = result.split('|');
      expect(parts).toHaveLength(5); // registrationId|eventId|email|timestamp|signature
      const timestamp = parseInt(parts[3], 10);
      expect(timestamp).toBeGreaterThanOrEqual(now - 1000); // Within 1 second
      expect(timestamp).toBeLessThanOrEqual(now + 1000);
    });

    it('should generate unique data for different inputs', () => {
      // Act
      const result1 = TicketService.generateTicketData('reg-1', 'event-1', 'user1@test.com');
      const result2 = TicketService.generateTicketData('reg-2', 'event-2', 'user2@test.com');

      // Assert
      expect(result1).not.toBe(result2);
    });
  });

  describe('generateBackupTicketCode', () => {
    it('should generate 10-character code', () => {
      // Act
      const result = TicketService.generateBackupTicketCode();

      // Assert
      expect(result).toHaveLength(10);
    });

    it('should only contain allowed characters', () => {
      // Act
      const result = TicketService.generateBackupTicketCode();

      // Assert
      expect(result).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    });

    it('should not contain ambiguous characters', () => {
      // Act
      const result = TicketService.generateBackupTicketCode();

      // Assert
      // Should not contain: 0, O, I, 1, L
      expect(result).not.toMatch(/[0OI1L]/);
    });

    it('should generate different codes each time', () => {
      // Act
      const code1 = TicketService.generateBackupTicketCode();
      const code2 = TicketService.generateBackupTicketCode();
      const code3 = TicketService.generateBackupTicketCode();

      // Assert
      expect(code1).not.toBe(code2);
      expect(code2).not.toBe(code3);
      expect(code1).not.toBe(code3);
    });
  });

  describe('formatEventDate', () => {
    it('should format single day event with time', () => {
      // Arrange
      const startDate = new Date('2026-12-31T18:00:00Z');
      const startTime = '18:00';

      // Act
      const result = TicketService.formatEventDate(startDate, null, startTime, null);

      // Assert
      expect(result).toContain('December');
      expect(result).toContain('2026');
      expect(result).toContain('31');
      expect(result).toContain('PM'); // Should include time
    });

    it('should format event with start and end times', () => {
      // Arrange
      const startDate = new Date('2026-12-31');
      const startTime = '18:00';
      const endTime = '22:00';

      // Act
      const result = TicketService.formatEventDate(startDate, null, startTime, endTime);

      // Assert
      expect(result).toContain('6:00 PM'); // Start time
      expect(result).toContain('10:00 PM'); // End time
    });

    it('should format multi-day event', () => {
      // Arrange
      const startDate = new Date('2026-12-31');
      const endDate = new Date('2027-01-02');

      // Act
      const result = TicketService.formatEventDate(startDate, endDate, null, null);

      // Assert
      expect(result).toContain('December 31');
      expect(result).toContain('January 2');
    });

    it('should handle event without times', () => {
      // Arrange
      const startDate = new Date('2026-12-31');

      // Act
      const result = TicketService.formatEventDate(startDate, null, null, null);

      // Assert
      expect(result).toContain('December');
      expect(result).toContain('2026');
      expect(result).not.toContain(':'); // No time
    });
  });

  describe('generateCalendarInvite', () => {
    it('should generate valid ICS format', () => {
      // Act
      const result = TicketService.generateCalendarInvite({ registration: mockRegistration as any });

      // Assert
      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('VERSION:2.0');
      expect(result).toContain('BEGIN:VEVENT');
      expect(result).toContain('END:VEVENT');
      expect(result).toContain('END:VCALENDAR');
    });

    it('should include event details', () => {
      // Act
      const result = TicketService.generateCalendarInvite({ registration: mockRegistration as any });

      // Assert
      expect(result).toContain(`SUMMARY:${mockEvent.title}`);
      expect(result).toContain(`DESCRIPTION:${mockEvent.description}`);
      expect(result).toContain(`LOCATION:${mockEvent.venue}, ${mockEvent.location}`);
    });

    it('should include organizer information', () => {
      // Act
      const result = TicketService.generateCalendarInvite({ registration: mockRegistration as any });

      // Assert
      expect(result).toContain('ORGANIZER');
      expect(result).toContain(mockEvent.organizer.email);
      expect(result).toContain(mockEvent.organizer.organizationName);
    });

    it('should include attendee information', () => {
      // Act
      const result = TicketService.generateCalendarInvite({ registration: mockRegistration as any });

      // Assert
      expect(result).toContain('ATTENDEE');
      expect(result).toContain(mockAttendee.email);
      expect(result).toContain(mockAttendee.firstName);
    });

    it('should format dates in ICS format', () => {
      // Act
      const result = TicketService.generateCalendarInvite({ registration: mockRegistration as any });

      // Assert
      expect(result).toMatch(/DTSTART:\d{8}T\d{6}Z/); // YYYYMMDDTHHMMSSZ
      expect(result).toMatch(/DTEND:\d{8}T\d{6}Z/);
    });

    it('should use 2-hour default duration if no end date', () => {
      // Arrange
      const registrationNoEndDate = {
        ...mockRegistration,
        event: { ...mockEvent, endDate: null },
      };

      // Act
      const result = TicketService.generateCalendarInvite({ registration: registrationNoEndDate as any });

      // Assert
      expect(result).toContain('DTSTART:');
      expect(result).toContain('DTEND:');
    });
  });

  describe('sendTicketEmail', () => {
    it('should send email with stored QR code', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: mockRegistration.id,
        qrCodeDataUrl: 'data:image/png;base64,STORED_QR',
        qrCodeGeneratedAt: new Date(),
      } as any);

      // Act
      await TicketService.sendTicketEmail(mockRegistration as any);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(prismaMock.eventRegistration.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRegistration.id },
        }),
      );
    });

    it('should generate QR code if not stored', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: mockRegistration.id,
        qrCodeDataUrl: null,
        qrCodeGeneratedAt: null,
      } as any);
      prismaMock.eventRegistration.update.mockResolvedValue({} as any);

      // Act
      await TicketService.sendTicketEmail(mockRegistration as any);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(prismaMock.eventRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRegistration.id },
          data: expect.objectContaining({
            qrCodeDataUrl: expect.any(String),
            qrCodeGeneratedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should include event and attendee information in email', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: mockRegistration.id,
        qrCodeDataUrl: 'data:image/png;base64,QR',
      } as any);

      // Act
      await TicketService.sendTicketEmail(mockRegistration as any);

      // Assert
      const emailCall = (emailService.sendEmail as jest.Mock).mock.calls[0][0];
      expect(emailCall).toMatchObject({
        to: mockAttendee.email,
        subject: expect.stringContaining(mockEvent.title),
      });
    });

    it('should handle QR code storage failure gracefully', async () => {
      // Arrange
      prismaMock.eventRegistration.findUnique
        .mockResolvedValueOnce({
          id: mockRegistration.id,
          qrCodeDataUrl: null,
        } as any)
        .mockResolvedValueOnce({
          ...mockRegistration,
          id: mockRegistration.id,
          event: mockEvent,
          attendee: mockAttendee,
        } as any);

      // First update fails (QR storage failure)
      // Second update succeeds (email status update)
      prismaMock.eventRegistration.update
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({} as any);

      // Mock PDF generation to avoid puppeteer issues
      jest.spyOn(TicketService, 'generateTicketPDF').mockResolvedValue(Buffer.from('<!-- FALLBACK_HTML -->'));

      // Act
      await TicketService.sendTicketEmail(mockRegistration as any);

      // Assert - Should complete successfully despite QR storage failure
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });
});
