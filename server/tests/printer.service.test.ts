/**
 * Printer Service Integration Tests
 * Tests the complete printer integration flow from discovery to printing
 */

import { PrinterService } from '../src/services/printer.service';
import { NotFoundError } from '../src/utils/errors';
import { prisma } from '../src/config/database';
import { exec } from 'child_process';

// Mock database
vi.mock('../src/config/database', () => ({
  prisma: {
    printer: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    badgeTemplate: {
      findUnique: vi.fn(),
    },
    eventRegistration: {
      findUnique: vi.fn(),
    },
    printJob: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fs promises
vi.mock('fs/promises', () => ({
  unlink: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock pdf content')),
}));

// Mock cloudinary
vi.mock('../src/services/cloudinary.service', () => ({
  uploadImageToCloudinary: vi.fn().mockResolvedValue({ secureUrl: 'https://cloudinary.com/test.pdf' }),
}));

describe('PrinterService - Integration Tests', () => {
  const mockEventId = 'event-123';
  const mockUserId = 'user-admin';
  const mockTemplateId = 'template-123';
  const mockRegistrationId = 'reg-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Printer Discovery', () => {
    it('should discover CUPS printers on Mac/Linux', async () => {
      // Mock lpstat command output
      const mockOutput = `printer HP_LaserJet is idle. enabled since Mon Jan 29 10:00:00 2026
printer Canon_Pixma is idle. enabled since Mon Jan 29 09:30:00 2026
printer Brother_HL is idle. disabled since Mon Jan 29 08:00:00 2026`;

      (exec as unknown as vi.Mock).mockImplementation((command: string, callback: Function) => {
        if (command.includes('lpstat -p -d')) {
          callback(null, { stdout: mockOutput, stderr: '' });
        }
        return {} as any;
      });

      const printers = await PrinterService.discoverPrinters('cups');

      expect(printers).toHaveLength(3);
      expect(printers[0]).toMatchObject({
        name: 'HP_LaserJet',
        deviceId: 'HP_LaserJet',
        driver: 'cups',
        isAvailable: true,
      });
      expect(printers[1]).toMatchObject({
        name: 'Canon_Pixma',
        deviceId: 'Canon_Pixma',
        driver: 'cups',
        isAvailable: true,
      });
      expect(printers[2]).toMatchObject({
        name: 'Brother_HL',
        deviceId: 'Brother_HL',
        driver: 'cups',
        isAvailable: false,
      });
    });

    it('should discover Windows printers', async () => {
      const mockOutput = `Node,Name,Status
DESKTOP-ABC,Microsoft Print to PDF,Idle
DESKTOP-ABC,HP LaserJet Pro,Printing
DESKTOP-ABC,Canon Printer,Error`;

      (exec as unknown as vi.Mock).mockImplementation((command: string, callback: Function) => {
        if (command.includes('wmic printer')) {
          callback(null, { stdout: mockOutput, stderr: '' });
        }
        return {} as any;
      });

      const printers = await PrinterService.discoverPrinters('windows');

      expect(printers).toHaveLength(3);
      expect(printers[0]).toMatchObject({
        name: 'Microsoft Print to PDF',
        deviceId: 'Microsoft Print to PDF',
        driver: 'windows',
        isAvailable: true, // Status: Idle
      });
      expect(printers[1]).toMatchObject({
        name: 'HP LaserJet Pro',
        deviceId: 'HP LaserJet Pro',
        driver: 'windows',
        isAvailable: false, // Status: Printing (not available)
      });
      expect(printers[2]).toMatchObject({
        name: 'Canon Printer',
        deviceId: 'Canon Printer',
        driver: 'windows',
        isAvailable: false, // Status: Error
      });
    });

    it('should return empty array on discovery errors', async () => {
      (exec as unknown as vi.Mock).mockImplementation((command: string, callback: Function) => {
        callback(new Error('Command not found'), { stdout: '', stderr: 'lpstat: command not found' });
        return {} as any;
      });

      // Discovery methods catch errors and return empty array
      const printers = await PrinterService.discoverPrinters('cups');
      expect(printers).toEqual([]);
    });
  });

  describe('Printer Registration', () => {
    it('should register a CUPS printer successfully', async () => {
      const printerConfig = {
        name: 'Main Badge Printer',
        driver: 'cups' as const,
        deviceId: 'HP_LaserJet_Badge',
        eventId: mockEventId,
        supportedSizes: ['4x3', '4x6'],
        paperSize: '4x3',
        orientation: 'portrait' as const,
      };

      const mockPrinter = {
        id: 'printer-123',
        ...printerConfig,
        isOnline: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastChecked: null,
        host: null,
        port: null,
        apiKey: null,
        createdBy: mockUserId,
      };

      (prisma.printer.create as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.printer.update as vi.Mock).mockResolvedValue(mockPrinter);

      // Mock exec for status check
      (exec as unknown as vi.Mock).mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'printer HP_LaserJet_Badge is idle. enabled', stderr: '' });
        return {} as any;
      });

      const result = await PrinterService.registerPrinter(printerConfig, mockUserId);

      expect(result).toMatchObject({
        id: 'printer-123',
        name: 'Main Badge Printer',
        driver: 'cups',
        deviceId: 'HP_LaserJet_Badge',
      });
      expect(prisma.printer.create).toHaveBeenCalledWith({
        data: {
          name: printerConfig.name,
          driver: printerConfig.driver,
          deviceId: printerConfig.deviceId,
          host: undefined,
          port: undefined,
          apiKey: undefined,
          supportedSizes: printerConfig.supportedSizes,
          paperSize: printerConfig.paperSize,
          orientation: printerConfig.orientation,
          eventId: printerConfig.eventId,
          isOnline: false,
          isActive: true,
          createdBy: mockUserId,
        },
      });
    });

    it('should register a PrintNode cloud printer with API key', async () => {
      const printerConfig = {
        name: 'Cloud Badge Printer',
        driver: 'printnode' as const,
        deviceId: 'printnode-12345',
        eventId: mockEventId,
        apiKey: 'pn_test_api_key_abc123',
        supportedSizes: ['4x3', '4x6'],
        paperSize: '4x3',
        orientation: 'portrait' as const,
      };

      const mockPrinter = {
        id: 'printer-cloud',
        ...printerConfig,
        isOnline: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastChecked: null,
        host: null,
        port: null,
        createdBy: mockUserId,
      };

      (prisma.printer.create as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.printer.update as vi.Mock).mockResolvedValue(mockPrinter);

      const result = await PrinterService.registerPrinter(printerConfig, mockUserId);

      expect(result.driver).toBe('printnode');
      expect(result.apiKey).toBe('pn_test_api_key_abc123');
    });
  });

  describe('Printer Status Checking', () => {
    it('should check CUPS printer status successfully', async () => {
      const mockPrinter = {
        id: 'printer-123',
        name: 'HP LaserJet',
        driver: 'cups',
        deviceId: 'HP_LaserJet',
        eventId: mockEventId,
        isOnline: false,
        isActive: true,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastChecked: null,
        host: null,
        port: null,
        apiKey: null,
        supportedSizes: ['4x3'],
        paperSize: '4x3',
        orientation: 'portrait',
      };

      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.printer.update as vi.Mock).mockResolvedValue({
        ...mockPrinter,
        isOnline: true,
        lastChecked: new Date(),
      });

      (exec as unknown as vi.Mock).mockImplementation((command: string, callback: Function) => {
        if (command.includes('lpstat -p')) {
          callback(null, { stdout: 'printer HP_LaserJet is idle. enabled', stderr: '' });
        }
        return {} as any;
      });

      const status = await PrinterService.checkPrinterStatus('printer-123');

      expect(status.isOnline).toBe(true);
      expect(prisma.printer.update).toHaveBeenCalledWith({
        where: { id: 'printer-123' },
        data: {
          isOnline: true,
          lastChecked: expect.any(Date),
        },
      });
    });

    it('should detect offline printer', async () => {
      const mockPrinter = {
        id: 'printer-123',
        name: 'HP LaserJet',
        driver: 'cups',
        deviceId: 'HP_LaserJet',
        eventId: mockEventId,
        isOnline: true,
        isActive: true,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastChecked: new Date(),
        host: null,
        port: null,
        apiKey: null,
        supportedSizes: ['4x3'],
        paperSize: '4x3',
        orientation: 'portrait',
      };

      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.printer.update as vi.Mock).mockResolvedValue({
        ...mockPrinter,
        isOnline: false,
      });

      (exec as unknown as vi.Mock).mockImplementation((command: string, callback: Function) => {
        callback(new Error('Printer not found'), { stdout: '', stderr: 'lpstat: Unknown destination' });
        return {} as any;
      });

      const status = await PrinterService.checkPrinterStatus('printer-123');

      expect(status.isOnline).toBe(false);
    });
  });

  describe('Print Job Creation', () => {
    it('should create a single print job successfully', async () => {
      const mockTemplate = {
        id: mockTemplateId,
        eventId: mockEventId,
        name: 'VIP Badge',
        width: 100,
        height: 75,
        elements: [
          {
            type: 'text',
            content: '{{attendeeName}}',
            x: 10,
            y: 10,
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
          },
        ],
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        backgroundImage: null,
      };

      const mockRegistration = {
        id: mockRegistrationId,
        eventId: mockEventId,
        attendee: {
          id: 'attendee-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        event: {
          id: mockEventId,
          name: 'Test Event',
        },
        ticketType: 'VIP',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrinter = {
        id: 'printer-123',
        name: 'Main Printer',
        driver: 'cups',
        deviceId: 'HP_LaserJet',
        eventId: mockEventId,
        isOnline: true,
        isActive: true,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastChecked: new Date(),
        host: null,
        port: null,
        apiKey: null,
        supportedSizes: ['4x3'],
        paperSize: '4x3',
        orientation: 'portrait',
      };

      const mockPrintJob = {
        id: 'job-123',
        printerId: 'printer-123',
        templateId: mockTemplateId,
        registrationId: mockRegistrationId,
        status: 'queued',
        priority: 0,
        copies: 1,
        pdfUrl: null,
        sentToPrinter: null,
        printedAt: null,
        retryCount: 0,
        maxRetries: 3,
        errorMessage: null,
        jobMetadata: null,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.badgeTemplate.findUnique as vi.Mock).mockResolvedValue(mockTemplate);
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);
      (prisma.printJob.create as vi.Mock).mockResolvedValue(mockPrintJob);

      const result = await PrinterService.createPrintJob({
        printerId: 'printer-123',
        templateId: mockTemplateId,
        registrationId: mockRegistrationId,
        copies: 1,
        priority: 0,
        createdBy: mockUserId,
      });

      expect(result).toMatchObject({
        id: 'job-123',
        status: 'queued',
        printerId: 'printer-123',
      });
      expect(prisma.printJob.create).toHaveBeenCalled();
    });

    it('should create job even if printer is offline (validation happens during processing)', async () => {
      const mockPrinter = {
        id: 'printer-123',
        name: 'Main Printer',
        driver: 'cups',
        deviceId: 'HP_LaserJet',
        eventId: mockEventId,
        isOnline: false, // Printer is offline
        isActive: true,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastChecked: new Date(),
        host: null,
        port: null,
        apiKey: null,
        supportedSizes: ['4x3'],
        paperSize: '4x3',
        orientation: 'portrait',
      };

      const mockTemplate = {
        id: mockTemplateId,
        eventId: mockEventId,
      };

      const mockRegistration = {
        id: mockRegistrationId,
        eventId: mockEventId,
        attendee: { id: 'att-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        event: { id: mockEventId, name: 'Test Event' },
      };

      const mockPrintJob = {
        id: 'job-123',
        printerId: 'printer-123',
        status: 'queued',
      };

      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.badgeTemplate.findUnique as vi.Mock).mockResolvedValue(mockTemplate);
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(mockRegistration);
      (prisma.printJob.create as vi.Mock).mockResolvedValue(mockPrintJob);

      // Job creation should succeed - offline status is checked during processing
      const result = await PrinterService.createPrintJob({
        printerId: 'printer-123',
        templateId: mockTemplateId,
        registrationId: mockRegistrationId,
        copies: 1,
        priority: 0,
        createdBy: mockUserId,
      });

      expect(result.status).toBe('queued');
    });

    it('should reject job if printer is inactive (soft deleted)', async () => {
      const mockPrinter = {
        id: 'printer-123',
        name: 'Main Printer',
        driver: 'cups',
        deviceId: 'HP_LaserJet',
        eventId: mockEventId,
        isOnline: true,
        isActive: false, // Printer is soft deleted
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastChecked: new Date(),
        host: null,
        port: null,
        apiKey: null,
        supportedSizes: ['4x3'],
        paperSize: '4x3',
        orientation: 'portrait',
      };

      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);

      await expect(
        PrinterService.createPrintJob({
          printerId: 'printer-123',
          templateId: mockTemplateId,
          registrationId: mockRegistrationId,
          copies: 1,
          priority: 0,
          createdBy: mockUserId,
        }),
      ).rejects.toThrow('Printer is not active');
    });
  });

  describe('Print Job Management', () => {
    it('should get print jobs with filters', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          printerId: 'printer-123',
          status: 'queued',
          createdAt: new Date(),
        },
        {
          id: 'job-2',
          printerId: 'printer-123',
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      (prisma.printJob.findMany as vi.Mock).mockResolvedValue(mockJobs);
      (prisma.printJob.count as vi.Mock).mockResolvedValue(2);

      const result = await PrinterService.getPrintJobs({
        printerId: 'printer-123',
        status: 'queued',
        page: 1,
        limit: 10,
      });

      expect(result.jobs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should cancel a queued print job', async () => {
      const mockJob = {
        id: 'job-cancel',
        printerId: 'printer-123',
        templateId: mockTemplateId,
        registrationId: mockRegistrationId,
        status: 'queued',
        priority: 0,
        copies: 1,
        pdfUrl: null,
        sentToPrinter: null,
        printedAt: null,
        retryCount: 0,
        maxRetries: 3,
        errorMessage: null,
        jobMetadata: null,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.printJob.findUnique as vi.Mock).mockResolvedValue(mockJob);
      (prisma.printJob.update as vi.Mock).mockResolvedValue({
        ...mockJob,
        status: 'cancelled',
      });

      const result = await PrinterService.cancelPrintJob('job-cancel');

      expect(result.message).toBe('Print job cancelled successfully');
      expect(prisma.printJob.update).toHaveBeenCalledWith({
        where: { id: 'job-cancel' },
        data: { status: 'cancelled' },
      });
    });

    it('should not cancel a completed print job', async () => {
      const mockJob = {
        id: 'job-completed',
        printerId: 'printer-123',
        templateId: mockTemplateId,
        registrationId: mockRegistrationId,
        status: 'completed',
        priority: 0,
        copies: 1,
        pdfUrl: null,
        sentToPrinter: null,
        printedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        errorMessage: null,
        jobMetadata: null,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.printJob.findUnique as vi.Mock).mockResolvedValue(mockJob);

      await expect(PrinterService.cancelPrintJob('job-completed')).rejects.toThrow(
        'Cannot cancel completed job',
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle template not found error', async () => {
      (prisma.printer.findUnique as vi.Mock).mockResolvedValue({
        id: 'printer-123',
        isOnline: true,
        isActive: true,
      });

      (prisma.badgeTemplate.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(
        PrinterService.createPrintJob({
          printerId: 'printer-123',
          templateId: 'non-existent',
          registrationId: mockRegistrationId,
          copies: 1,
          priority: 0,
          createdBy: mockUserId,
        }),
      ).rejects.toThrow('Badge template not found');
    });

    it('should handle registration not found error', async () => {
      (prisma.printer.findUnique as vi.Mock).mockResolvedValue({
        id: 'printer-123',
        isOnline: true,
        isActive: true,
      });

      (prisma.badgeTemplate.findUnique as vi.Mock).mockResolvedValue({
        id: mockTemplateId,
        eventId: mockEventId,
      });

      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(
        PrinterService.createPrintJob({
          printerId: 'printer-123',
          templateId: mockTemplateId,
          registrationId: 'non-existent',
          copies: 1,
          priority: 0,
          createdBy: mockUserId,
        }),
      ).rejects.toThrow('Registration not found');
    });

    it('should handle printer not found error', async () => {
      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(null);

      await expect(
        PrinterService.createPrintJob({
          printerId: 'non-existent',
          templateId: mockTemplateId,
          registrationId: mockRegistrationId,
          copies: 1,
          priority: 0,
          createdBy: mockUserId,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Printer Management', () => {
    it('should get all printers', async () => {
      const mockPrinters = [
        {
          id: 'printer-1',
          name: 'Printer 1',
          driver: 'cups',
          isOnline: true,
          isActive: true,
        },
        {
          id: 'printer-2',
          name: 'Printer 2',
          driver: 'windows',
          isOnline: false,
          isActive: true,
        },
      ];

      (prisma.printer.findMany as vi.Mock).mockResolvedValue(mockPrinters);

      const result = await PrinterService.getPrinters(mockEventId, false);

      expect(result).toHaveLength(2);
      expect(prisma.printer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { eventId: mockEventId },
            { eventId: null },
          ],
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              printJobs: true,
            },
          },
        },
      });
    });

    it('should get printer by ID', async () => {
      const mockPrinter = {
        id: 'printer-123',
        name: 'Main Printer',
        driver: 'cups',
        deviceId: 'HP_LaserJet',
        eventId: mockEventId,
        isOnline: true,
        isActive: true,
      };

      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);

      const result = await PrinterService.getPrinterById('printer-123');

      expect(result).toMatchObject({
        id: 'printer-123',
        name: 'Main Printer',
      });
    });

    it('should update printer configuration', async () => {
      const mockPrinter = {
        id: 'printer-123',
        name: 'Main Printer',
        driver: 'cups',
        deviceId: 'HP_LaserJet',
        eventId: mockEventId,
        isOnline: true,
        isActive: true,
      };

      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.printer.update as vi.Mock).mockResolvedValue({
        ...mockPrinter,
        name: 'Updated Printer',
      });

      const result = await PrinterService.updatePrinter('printer-123', {
        name: 'Updated Printer',
      });

      expect(result.name).toBe('Updated Printer');
      expect(prisma.printer.update).toHaveBeenCalledWith({
        where: { id: 'printer-123' },
        data: {
          name: 'Updated Printer',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should soft delete printer to preserve print job history', async () => {
      const mockPrinter = {
        id: 'printer-123',
        name: 'Main Printer',
        isActive: true,
      };

      (prisma.printer.findUnique as vi.Mock).mockResolvedValue(mockPrinter);
      (prisma.printer.update as vi.Mock).mockResolvedValue({
        ...mockPrinter,
        isActive: false,
      });

      const result = await PrinterService.deletePrinter('printer-123');

      expect(result.message).toBe('Printer deleted successfully');
      expect(prisma.printer.update).toHaveBeenCalledWith({
        where: { id: 'printer-123' },
        data: { isActive: false },
      });
    });
  });
});
