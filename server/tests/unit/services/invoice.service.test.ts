import { InvoiceService } from '../../../src/services/invoice.service.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { NotFoundError } from '../../../src/utils/errors.js';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: {
    invoice: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    eventPaymentTransaction: {
      findUnique: vi.fn(),
    },
    invoiceTemplate: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('../../../src/utils/logger.js');

describe('InvoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInvoice', () => {
    it('should create invoice from transaction successfully', async () => {
      // Arrange
      const transactionId = 'txn-1';
      const mockTransaction = {
        id: transactionId,
        amount: new Decimal(1000),
        currency: 'NGN',
        gateway: 'paystack',
        gatewayReference: 'ref-123',
        status: 'SUCCESS',
        userId: 'user-1',
        eventId: 'event-1',
        registrationId: 'reg-1',
        attendeeName: 'John Doe',
        user: {
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        event: {
          title: 'Test Event',
          organizer: {
            email: 'organizer@example.com',
            organizerBusinessName: 'EventKnit',
          },
        },
        registration: {
          attendee: {
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            country: null,
          },
          ticketLineItems: [
            {
              id: 'item-1',
              ticketType: 'VIP Ticket',
              quantity: 1,
              unitPrice: new Decimal(1000),
              totalPrice: new Decimal(1000),
            },
          ],
        },
      };

      const mockInvoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-0001',
        transactionId,
        userId: 'user-1',
        eventId: 'event-1',
        amount: new Decimal(1000),
        subtotal: new Decimal(1000),
        taxAmount: new Decimal(0),
        currency: 'NGN',
        status: 'PAID',
      };

      (prisma.eventPaymentTransaction.findUnique as vi.Mock).mockResolvedValue(mockTransaction);
      (prisma.invoice.create as vi.Mock).mockResolvedValue(mockInvoice);

      // Act
      const result = await InvoiceService.createInvoice(transactionId);

      // Assert
      expect(prisma.eventPaymentTransaction.findUnique).toHaveBeenCalledWith({
        where: { id: transactionId },
        include: expect.any(Object),
      });
      expect(prisma.invoice.create).toHaveBeenCalled();
      expect(result.invoiceNumber).toMatch(/INV-\d{4}-\d{4}/);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Invoice created'));
    });

    it('should throw NotFoundError if transaction not found', async () => {
      // Arrange
      (prisma.eventPaymentTransaction.findUnique as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceService.createInvoice('nonexistent')).rejects.toThrow(
        'Payment transaction not found',
      );
    });

    it('should calculate tax when taxRate is provided', async () => {
      // Arrange
      const mockTransaction = {
        id: 'txn-1',
        amount: new Decimal(1000),
        currency: 'NGN',
        userId: 'user-1',
        eventId: 'event-1',
        attendeeName: 'Test User',
        user: { email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        event: { title: 'Event', organizer: { email: 'org@test.com', organizerBusinessName: 'EventKnit' } },
        registration: {
          attendee: { email: 'test@test.com', firstName: 'Test', lastName: 'User', country: null },
          ticketLineItems: [
            {
              id: 'item-1',
              ticketType: 'Ticket',
              quantity: 1,
              unitPrice: new Decimal(1000),
              totalPrice: new Decimal(1000),
            },
          ],
        },
      };

      (prisma.eventPaymentTransaction.findUnique as vi.Mock).mockResolvedValue(mockTransaction);
      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(null); // No existing invoice
      (prisma.invoice.create as vi.Mock).mockImplementation((args) => Promise.resolve({
        id: 'invoice-1',
        ...args.data,
      }));

      // Act
      await InvoiceService.createInvoice('txn-1', undefined, { includeTax: true, taxRate: 7.5 });

      // Assert
      const createCall = (prisma.invoice.create as vi.Mock).mock.calls[0][0];
      expect(createCall.data.taxAmount).toBeDefined();
      // Tax amount should be 7.5% of 1000 = 75
      expect(Number(createCall.data.taxAmount)).toBe(75);
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.eventPaymentTransaction.findUnique as vi.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceService.createInvoice('txn-1')).rejects.toThrow(
        'Failed to create invoice: Database error',
      );
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice by ID', async () => {
      // Arrange
      const mockInvoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-0001',
        user: { email: 'user@test.com' },
        event: { title: 'Test Event' },
      };

      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(mockInvoice);

      // Act
      const result = await InvoiceService.getInvoiceById('invoice-1');

      // Assert
      expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundError if invoice not found', async () => {
      // Arrange
      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceService.getInvoiceById('nonexistent')).rejects.toThrow(
        'Invoice not found',
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoice.findUnique as vi.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceService.getInvoiceById('invoice-1')).rejects.toThrow(
        'Failed to fetch invoice: Database error',
      );
    });
  });

  describe('getInvoiceByNumber', () => {
    it('should return invoice by invoice number', async () => {
      // Arrange
      const mockInvoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-0001',
      };

      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(mockInvoice);

      // Act
      const result = await InvoiceService.getInvoiceByNumber('INV-2026-0001');

      // Assert
      expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { invoiceNumber: 'INV-2026-0001' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundError if invoice not found', async () => {
      // Arrange
      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceService.getInvoiceByNumber('INV-2026-9999')).rejects.toThrow(
        'Invoice not found',
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoice.findUnique as vi.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceService.getInvoiceByNumber('INV-2026-0001')).rejects.toThrow(
        'Failed to fetch invoice: Database error',
      );
    });
  });

  describe('getUserInvoices', () => {
    it('should return paginated user invoices', async () => {
      // Arrange
      const mockInvoices = [
        { id: 'invoice-1', invoiceNumber: 'INV-2026-0001' },
        { id: 'invoice-2', invoiceNumber: 'INV-2026-0002' },
      ];

      (prisma.invoice.findMany as vi.Mock).mockResolvedValue(mockInvoices);
      (prisma.invoice.count as vi.Mock).mockResolvedValue(2);

      // Act
      const result = await InvoiceService.getUserInvoices('user-1');

      // Assert
      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: { registration: { attendeeId: 'user-1' } },
        include: expect.any(Object),
        orderBy: { issueDate: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result.invoices).toEqual(mockInvoices);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by status', async () => {
      // Arrange
      (prisma.invoice.findMany as vi.Mock).mockResolvedValue([]);
      (prisma.invoice.count as vi.Mock).mockResolvedValue(0);

      // Act
      await InvoiceService.getUserInvoices('user-1', { status: 'PAID' });

      // Assert
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { registration: { attendeeId: 'user-1' }, status: 'PAID' },
        }),
      );
    });

    it('should filter by event ID', async () => {
      // Arrange
      (prisma.invoice.findMany as vi.Mock).mockResolvedValue([]);
      (prisma.invoice.count as vi.Mock).mockResolvedValue(0);

      // Act
      await InvoiceService.getUserInvoices('user-1', { eventId: 'event-1' });

      // Assert
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { registration: { attendeeId: 'user-1' }, eventId: 'event-1' },
        }),
      );
    });

    it('should handle pagination', async () => {
      // Arrange
      (prisma.invoice.findMany as vi.Mock).mockResolvedValue([]);
      (prisma.invoice.count as vi.Mock).mockResolvedValue(50);

      // Act
      await InvoiceService.getUserInvoices('user-1', { page: 2, limit: 10 });

      // Assert
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10,
        }),
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoice.findMany as vi.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceService.getUserInvoices('user-1')).rejects.toThrow(
        'Failed to fetch invoices: Database error',
      );
    });
  });

  describe('getEventInvoices', () => {
    it('should return paginated event invoices', async () => {
      // Arrange
      const mockInvoices = [
        { id: 'invoice-1', eventId: 'event-1' },
        { id: 'invoice-2', eventId: 'event-1' },
      ];

      (prisma.invoice.findMany as vi.Mock).mockResolvedValue(mockInvoices);
      (prisma.invoice.count as vi.Mock).mockResolvedValue(2);

      // Act
      const result = await InvoiceService.getEventInvoices('event-1');

      // Assert
      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        include: expect.any(Object),
        orderBy: { issueDate: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result.invoices).toHaveLength(2);
    });

    it('should filter by status', async () => {
      // Arrange
      (prisma.invoice.findMany as vi.Mock).mockResolvedValue([]);
      (prisma.invoice.count as vi.Mock).mockResolvedValue(0);

      // Act
      await InvoiceService.getEventInvoices('event-1', { status: 'PENDING' });

      // Assert
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: 'event-1', status: 'PENDING' },
        }),
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoice.findMany as vi.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceService.getEventInvoices('event-1')).rejects.toThrow(
        'Failed to fetch invoices: Database error',
      );
    });
  });

  describe('generateInvoiceHTML', () => {
    it('should generate HTML with invoice data', async () => {
      // Arrange
      const mockInvoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-0001',
        totalAmount: new Decimal(1000),
        subtotal: new Decimal(1000),
        taxAmount: new Decimal(0),
        currency: 'NGN',
        issueDate: new Date('2026-01-29'),
        dueDate: new Date('2026-02-28'),
        billToName: 'John Doe',
        billToEmail: 'user@test.com',
        items: [],
        transaction: {
          event: {
            organizer: {
              organizationName: 'EventKnit',
              email: 'org@test.com',
            },
          },
        },
        registration: {
          event: {
            title: 'Test Event',
          },
        },
        event: {
          title: 'Test Event',
        },
      };

      const mockTemplate = {
        id: 'template-1',
        htmlContent: '<html><body>Invoice {{invoiceNumber}}</body></html>',
        cssContent: 'body { margin: 0; }',
      };

      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(mockInvoice);
      (prisma.invoiceTemplate.findFirst as vi.Mock).mockResolvedValue(mockTemplate);

      // Act
      const result = await InvoiceService.generateInvoiceHTML('invoice-1');

      // Assert
      expect(result).toContain('INV-2026-0001');
      expect(result).toContain('<html>');
    });

    it('should use default template when no template ID provided', async () => {
      // Arrange
      const mockInvoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-0001',
        totalAmount: new Decimal(1000),
        subtotal: new Decimal(1000),
        taxAmount: new Decimal(0),
        currency: 'NGN',
        issueDate: new Date('2026-01-29'),
        dueDate: new Date('2026-02-28'),
        billToName: 'John Doe',
        billToEmail: 'user@test.com',
        items: [],
        transaction: {
          event: {
            organizer: {
              organizationName: 'EventKnit',
              email: 'org@test.com',
            },
          },
        },
        registration: {
          event: {
            title: 'Test Event',
          },
        },
        event: {
          title: 'Test Event',
        },
      };

      const mockTemplate = {
        id: 'default-template',
        htmlContent: '<html><body>Default Invoice</body></html>',
        cssContent: '',
      };

      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(mockInvoice);
      (prisma.invoiceTemplate.findFirst as vi.Mock).mockResolvedValue(mockTemplate);

      // Act
      const result = await InvoiceService.generateInvoiceHTML('invoice-1');

      // Assert
      expect(prisma.invoiceTemplate.findFirst).toHaveBeenCalledWith({
        where: { isDefault: true, isActive: true },
      });
      expect(result).toContain('Default Invoice');
    });

    it('should handle missing template', async () => {
      // Arrange
      const mockInvoice = {
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-0001',
        totalAmount: new Decimal(1000),
        subtotal: new Decimal(1000),
        taxAmount: new Decimal(0),
        currency: 'NGN',
        issueDate: new Date('2026-01-29'),
        dueDate: new Date('2026-02-28'),
        billToName: 'John Doe',
        billToEmail: 'user@test.com',
        items: [],
        transaction: {
          event: {
            organizer: {
              organizationName: 'EventKnit',
              email: 'org@test.com',
            },
          },
        },
        registration: {
          event: {
            title: 'Test Event',
          },
        },
        event: {
          title: 'Test Event',
        },
      };

      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(mockInvoice);
      (prisma.invoiceTemplate.findFirst as vi.Mock).mockResolvedValue(null);

      // Act
      const result = await InvoiceService.generateInvoiceHTML('invoice-1');

      // Assert
      // Should use fallback default template
      expect(result).toContain('INV-2026-0001');
      expect(result).toContain('<html>');
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoice.findUnique as vi.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceService.generateInvoiceHTML('invoice-1')).rejects.toThrow(
        /Failed to generate invoice HTML/,
      );
    });
  });

  describe('markInvoiceAsSent', () => {
    it('should mark invoice as sent', async () => {
      // Arrange
      const mockInvoice = {
        id: 'invoice-1',
        status: 'PAID',
      };

      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(mockInvoice);
      (prisma.invoice.update as vi.Mock).mockResolvedValue({
        ...mockInvoice,
        status: 'SENT',
        sentAt: new Date(),
        sentTo: 'user@test.com',
      });

      // Act
      await InvoiceService.markInvoiceAsSent('invoice-1', 'user@test.com');

      // Assert
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        data: {
          status: 'SENT',
          sentAt: expect.any(Date),
          sentTo: 'user@test.com',
        },
      });
      expect(logger.info).toHaveBeenCalledWith('Invoice marked as sent: invoice-1');
    });

    it('should throw NotFoundError if invoice not found', async () => {
      // Arrange
      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceService.markInvoiceAsSent('nonexistent', 'user@test.com')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue({ id: 'invoice-1' });
      (prisma.invoice.update as vi.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceService.markInvoiceAsSent('invoice-1', 'user@test.com')).rejects.toThrow(
        'Failed to mark invoice as sent: Database error',
      );
    });
  });

  describe('updateInvoiceStatus', () => {
    it('should update invoice status', async () => {
      // Arrange
      const mockInvoice = {
        id: 'invoice-1',
        status: 'PENDING',
      };

      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(mockInvoice);
      (prisma.invoice.update as vi.Mock).mockResolvedValue({
        ...mockInvoice,
        status: 'PAID',
      });

      // Act
      await InvoiceService.updateInvoiceStatus('invoice-1', 'PAID');

      // Assert
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        data: { status: 'PAID', sentAt: expect.any(Date) },
      });
      expect(logger.info).toHaveBeenCalledWith('Invoice status updated: invoice-1 to PAID');
    });

    it('should throw NotFoundError if invoice not found', async () => {
      // Arrange
      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(InvoiceService.updateInvoiceStatus('nonexistent', 'PAID')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      (prisma.invoice.findUnique as vi.Mock).mockResolvedValue({ id: 'invoice-1' });
      (prisma.invoice.update as vi.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(InvoiceService.updateInvoiceStatus('invoice-1', 'PAID')).rejects.toThrow(
        'Failed to update invoice status: Database error',
      );
    });
  });
});
