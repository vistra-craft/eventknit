import { AttendeeImportService, ImportStatus } from '../../../src/services/attendee-import.service.js';
import { prisma } from '../../../src/config/database.js';
import { logger } from '../../../src/utils/logger.js';
import { TicketService } from '../../../src/services/ticket.service.js';
import { NotFoundError } from '../../../src/utils/errors.js';
import { UserRole, UserStatus, RegistrationStatus } from '@prisma/client';
import * as XLSX from 'xlsx';

// Mock dependencies
vi.mock('../../../src/config/database.js', () => ({
  prisma: {
    event: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    eventRegistration: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    attendeeImport: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));
vi.mock('../../../src/utils/logger.js');
vi.mock('../../../src/services/ticket.service.js');
vi.mock('xlsx');

describe('AttendeeImportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTemplate', () => {
    it('should generate CSV template with headers and example rows', () => {
      // Act
      const result = AttendeeImportService.generateTemplate();

      // Assert
      expect(result).toContain('firstName,lastName,email,phone,company,jobTitle,ticketType,checkpoints');
      expect(result).toContain('John,Doe,john@example.com');
      expect(result).toContain('Jane,Smith,jane@example.com');
      const lines = result.split('\n');
      expect(lines.length).toBe(3); // Header + 2 example rows
    });
  });

  describe('parseFile', () => {
    it('should parse CSV file', () => {
      // Arrange
      const buffer = Buffer.from('firstName,lastName,email\nJohn,Doe,john@example.com');
      const fileName = 'test.csv';

      // Act
      const result = AttendeeImportService.parseFile(buffer, fileName);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: undefined,
        company: undefined,
        jobTitle: undefined,
        ticketType: undefined,
        checkpoints: undefined,
      });
    });

    it('should parse Excel .xlsx file', () => {
      // Arrange
      const buffer = Buffer.from('test');
      const fileName = 'test.xlsx';
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      };

      (XLSX.read as vi.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as vi.Mock).mockReturnValue([
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      ]);

      // Act
      const result = AttendeeImportService.parseFile(buffer, fileName);

      // Assert
      expect(XLSX.read).toHaveBeenCalledWith(buffer, { type: 'buffer' });
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('john@example.com');
    });

    it('should parse Excel .xls file', () => {
      // Arrange
      const buffer = Buffer.from('test');
      const fileName = 'test.xls';
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };

      (XLSX.read as vi.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as vi.Mock).mockReturnValue([
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ]);

      // Act
      const result = AttendeeImportService.parseFile(buffer, fileName);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Jane');
    });

    it('should throw ValidationError for unsupported file format', () => {
      // Arrange
      const buffer = Buffer.from('test');
      const fileName = 'test.pdf';

      // Act & Assert
      expect(() => AttendeeImportService.parseFile(buffer, fileName)).toThrow(
        'Unsupported file format. Please use CSV or Excel (.xlsx, .xls)',
      );
    });
  });

  describe('parseCSV', () => {
    it('should throw ValidationError if file has no data rows', () => {
      // Arrange
      const buffer = Buffer.from('firstName,lastName,email\n');

      // Act & Assert
      expect(() => AttendeeImportService.parseFile(buffer, 'test.csv')).toThrow(
        'File must contain headers and at least one data row',
      );
    });

    it('should handle flexible header names', () => {
      // Arrange
      const buffer = Buffer.from('First_Name,Last_Name,Email,Phone_Number,Job_Title\nJohn,Doe,john@example.com,+254700000001,Engineer');

      // Act
      const result = AttendeeImportService.parseFile(buffer, 'test.csv');

      // Assert
      expect(result[0]).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+254700000001',
        company: undefined,
        jobTitle: 'Engineer',
        ticketType: undefined,
        checkpoints: undefined,
      });
    });

    it('should handle quoted values with commas', () => {
      // Arrange
      const buffer = Buffer.from('firstName,lastName,email,company\nJohn,Doe,john@example.com,"Acme Corp, Inc."');

      // Act
      const result = AttendeeImportService.parseFile(buffer, 'test.csv');

      // Assert
      expect(result[0].company).toBe('Acme Corp, Inc.');
    });

    it('should skip empty rows', () => {
      // Arrange
      const buffer = Buffer.from('firstName,lastName,email\nJohn,Doe,john@example.com\n\n   \nJane,Smith,jane@example.com');

      // Act
      const result = AttendeeImportService.parseFile(buffer, 'test.csv');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
      expect(result[1].firstName).toBe('Jane');
    });

    it('should handle case-insensitive headers', () => {
      // Arrange
      const buffer = Buffer.from('FIRSTNAME,LASTNAME,EMAIL\nJohn,Doe,john@example.com');

      // Act
      const result = AttendeeImportService.parseFile(buffer, 'test.csv');

      // Assert
      expect(result[0]).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });
  });

  describe('parseExcel', () => {
    it('should throw ValidationError if Excel has no data', () => {
      // Arrange
      const buffer = Buffer.from('test');
      const fileName = 'test.xlsx';
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };

      (XLSX.read as vi.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as vi.Mock).mockReturnValue([]);

      // Act & Assert
      expect(() => AttendeeImportService.parseFile(buffer, fileName)).toThrow(
        'Excel file has no data rows',
      );
    });

    it('should normalize Excel column names', () => {
      // Arrange
      const buffer = Buffer.from('test');
      const fileName = 'test.xlsx';
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };

      (XLSX.read as vi.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as vi.Mock).mockReturnValue([
        {
          'First Name': 'John',
          'Last Name': 'Doe',
          'Email': 'john@example.com',
          'Phone Number': '+254700000001',
          'Organization': 'Acme Corp',
        },
      ]);

      // Act
      const result = AttendeeImportService.parseFile(buffer, fileName);

      // Assert
      expect(result[0]).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+254700000001',
        company: 'Acme Corp',
      });
    });
  });

  describe('validateRows', () => {
    const mockEvent = {
      id: 'event-1',
      ticketTypes: [{ name: 'VIP' }, { name: 'Standard' }],
      isFree: false,
      checkpoints: [{ stationCode: 'LUNCH1', name: 'Lunch Session 1' }],
      facilities: [{ code: 'WORKSHOP-A', name: 'Workshop A' }],
    };

    it('should throw NotFoundError if event not found', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AttendeeImportService.validateRows('event-1', []),
      ).rejects.toThrow(NotFoundError);
    });

    it('should validate successfully with valid rows', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          ticketType: 'VIP',
        },
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
      expect(result.errorRows).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.preview).toEqual(rows);
    });

    it('should detect missing required fields', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = [
        { firstName: '', lastName: 'Doe', email: 'john@example.com' },
        { firstName: 'Jane', lastName: '', email: 'jane@example.com' },
        { firstName: 'Bob', lastName: 'Smith', email: '' },
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: 'firstName',
        message: 'First name is required',
      });
      expect(result.errors[1]).toMatchObject({
        row: 3,
        field: 'lastName',
        message: 'Last name is required',
      });
      expect(result.errors[2]).toMatchObject({
        row: 4,
        field: 'email',
        message: 'Email is required',
      });
    });

    it('should detect invalid email format', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = [
        { firstName: 'John', lastName: 'Doe', email: 'invalid-email' },
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'email',
        value: 'invalid-email',
        message: 'Invalid email format',
      });
    });

    it('should detect duplicate emails in file', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { firstName: 'Jane', lastName: 'Doe', email: 'JOHN@EXAMPLE.COM' }, // Same email, different case
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        row: 3,
        field: 'email',
        message: 'Duplicate email in file',
      });
    });

    it('should detect already registered attendees', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([
        { attendee: { email: 'john@example.com' } },
      ]);

      const rows = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'email',
        value: 'john@example.com',
        message: 'Already registered for this event',
      });
    });

    it('should detect invalid ticket type', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com', ticketType: 'Premium' },
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'ticketType',
        value: 'Premium',
        message: expect.stringContaining('Invalid ticket type'),
      });
    });

    it('should not validate ticket type for free events', async () => {
      // Arrange
      const freeEvent = { ...mockEvent, isFree: true };
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(freeEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com', ticketType: 'NonExistent' },
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid checkpoint codes', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com', checkpoints: 'INVALID-CODE' },
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'checkpoints',
        value: 'invalid-code',
        message: expect.stringContaining('Invalid checkpoint/facility code'),
      });
    });

    it('should validate multiple checkpoint codes', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com', checkpoints: 'LUNCH1,WORKSHOP-A' },
      ];

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return preview of first 10 rows', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      const rows = Array.from({ length: 15 }, (_, i) => ({
        firstName: `User${i}`,
        lastName: 'Test',
        email: `user${i}@example.com`,
      }));

      // Act
      const result = await AttendeeImportService.validateRows('event-1', rows);

      // Assert
      expect(result.totalRows).toBe(15);
      expect(result.preview).toHaveLength(10);
      expect(result.preview[0].firstName).toBe('User0');
      expect(result.preview[9].firstName).toBe('User9');
    });
  });

  describe('importAttendees', () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Test Event',
      isFree: false,
      ticketTypes: [{ name: 'VIP' }],
      checkpoints: [{ stationCode: 'LUNCH1' }],
      facilities: [{ code: 'WORKSHOP-A' }],
    };

    it('should throw NotFoundError if event not found', async () => {
      // Arrange
      (prisma.attendeeImport.create as vi.Mock).mockResolvedValue({ id: 'import-1' });
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(null);
      (prisma.attendeeImport.update as vi.Mock).mockResolvedValue({});

      const rows = [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }];

      // Act & Assert
      await expect(
        AttendeeImportService.importAttendees('event-1', rows, 'user-1', 'test.csv'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should create import record with PROCESSING status', async () => {
      // Arrange
      (prisma.attendeeImport.create as vi.Mock).mockResolvedValue({ id: 'import-1' });
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockResolvedValue({ id: 'user-1', email: 'john@example.com' });
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.eventRegistration.create as vi.Mock).mockResolvedValue({ id: 'reg-1' });
      (prisma.eventRegistration.update as vi.Mock).mockResolvedValue({ id: 'reg-1' });
      (prisma.attendeeImport.update as vi.Mock).mockResolvedValue({});
      (TicketService.generateBackupTicketCode as vi.Mock).mockReturnValue('BACKUP123');
      (TicketService.generateTicketData as vi.Mock).mockReturnValue('ticket-data');
      (TicketService.generateQRCode as vi.Mock).mockResolvedValue('qr-code-url');

      const rows = [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }];

      // Act
      await AttendeeImportService.importAttendees('event-1', rows, 'user-1', 'test.csv');

      // Assert
      expect(prisma.attendeeImport.create).toHaveBeenCalledWith({
        data: {
          eventId: 'event-1',
          importedBy: 'user-1',
          fileName: 'test.csv',
          totalRows: 1,
          status: ImportStatus.PROCESSING,
          sendWelcomeEmails: false,
        },
      });
    });

    it('should import attendees successfully', async () => {
      // Arrange
      (prisma.attendeeImport.create as vi.Mock).mockResolvedValue({ id: 'import-1' });
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockResolvedValue({ id: 'user-1', email: 'john@example.com' });
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.eventRegistration.create as vi.Mock).mockResolvedValue({ id: 'reg-1' });
      (prisma.eventRegistration.update as vi.Mock).mockResolvedValue({ id: 'reg-1' });
      (prisma.attendeeImport.update as vi.Mock).mockResolvedValue({});
      (TicketService.generateBackupTicketCode as vi.Mock).mockReturnValue('BACKUP123');
      (TicketService.generateTicketData as vi.Mock).mockReturnValue('ticket-data');
      (TicketService.generateQRCode as vi.Mock).mockResolvedValue('qr-code-url');

      const rows = [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }];

      // Act
      const result = await AttendeeImportService.importAttendees('event-1', rows, 'user-1', 'test.csv');

      // Assert
      expect(result).toEqual({
        importId: 'import-1',
        totalRows: 1,
        successCount: 1,
        errorCount: 0,
        errors: [],
      });
      expect(prisma.attendeeImport.update).toHaveBeenCalledWith({
        where: { id: 'import-1' },
        data: expect.objectContaining({
          status: ImportStatus.COMPLETED,
          successCount: 1,
          errorCount: 0,
        }),
      });
    });

    it('should handle partial import failures', async () => {
      // Arrange
      (prisma.attendeeImport.create as vi.Mock).mockResolvedValue({ id: 'import-1' });
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock)
        .mockResolvedValueOnce({ id: 'user-1', email: 'john@example.com' })
        .mockRejectedValueOnce(new Error('Database error'));
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.eventRegistration.create as vi.Mock).mockResolvedValue({ id: 'reg-1' });
      (prisma.eventRegistration.update as vi.Mock).mockResolvedValue({ id: 'reg-1' });
      (prisma.attendeeImport.update as vi.Mock).mockResolvedValue({});
      (TicketService.generateBackupTicketCode as vi.Mock).mockReturnValue('BACKUP123');
      (TicketService.generateTicketData as vi.Mock).mockReturnValue('ticket-data');
      (TicketService.generateQRCode as vi.Mock).mockResolvedValue('qr-code-url');

      const rows = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ];

      // Act
      const result = await AttendeeImportService.importAttendees('event-1', rows, 'user-1', 'test.csv');

      // Assert
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(prisma.attendeeImport.update).toHaveBeenCalledWith({
        where: { id: 'import-1' },
        data: expect.objectContaining({
          status: ImportStatus.COMPLETED,
        }),
      });
    });

    it('should set status to FAILED if all rows fail', async () => {
      // Arrange
      (prisma.attendeeImport.create as vi.Mock).mockResolvedValue({ id: 'import-1' });
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockRejectedValue(new Error('Database error'));
      (prisma.attendeeImport.update as vi.Mock).mockResolvedValue({});

      const rows = [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }];

      // Act
      const result = await AttendeeImportService.importAttendees('event-1', rows, 'user-1', 'test.csv');

      // Assert
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(prisma.attendeeImport.update).toHaveBeenCalledWith({
        where: { id: 'import-1' },
        data: expect.objectContaining({
          status: ImportStatus.FAILED,
        }),
      });
    });

    it('should respect sendWelcomeEmails option', async () => {
      // Arrange
      (prisma.attendeeImport.create as vi.Mock).mockResolvedValue({ id: 'import-1' });
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockResolvedValue({ id: 'user-1', email: 'john@example.com' });
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.eventRegistration.create as vi.Mock).mockResolvedValue({ id: 'reg-1' });
      (prisma.eventRegistration.update as vi.Mock).mockResolvedValue({ id: 'reg-1' });
      (prisma.attendeeImport.update as vi.Mock).mockResolvedValue({});
      (TicketService.generateBackupTicketCode as vi.Mock).mockReturnValue('BACKUP123');
      (TicketService.generateTicketData as vi.Mock).mockReturnValue('ticket-data');
      (TicketService.generateQRCode as vi.Mock).mockResolvedValue('qr-code-url');

      const rows = [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }];

      // Act
      await AttendeeImportService.importAttendees('event-1', rows, 'user-1', 'test.csv', {
        sendWelcomeEmails: true,
      });

      // Assert
      expect(prisma.attendeeImport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sendWelcomeEmails: true,
        }),
      });
    });
  });

  describe('getImportHistory', () => {
    it('should return paginated import history', async () => {
      // Arrange
      const mockImports = [
        { id: 'import-1', fileName: 'test1.csv', successCount: 10, errorCount: 0 },
        { id: 'import-2', fileName: 'test2.csv', successCount: 8, errorCount: 2 },
      ];
      (prisma.attendeeImport.findMany as vi.Mock).mockResolvedValue(mockImports);
      (prisma.attendeeImport.count as vi.Mock).mockResolvedValue(15);

      // Act
      const result = await AttendeeImportService.getImportHistory('event-1', 20, 0);

      // Assert
      expect(prisma.attendeeImport.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
        select: expect.any(Object),
      });
      expect(result).toEqual({
        imports: mockImports,
        total: 15,
      });
    });

    it('should use default limit of 20', async () => {
      // Arrange
      (prisma.attendeeImport.findMany as vi.Mock).mockResolvedValue([]);
      (prisma.attendeeImport.count as vi.Mock).mockResolvedValue(0);

      // Act
      await AttendeeImportService.getImportHistory('event-1');

      // Assert
      expect(prisma.attendeeImport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        }),
      );
    });
  });

  describe('getImportById', () => {
    it('should return import record by ID', async () => {
      // Arrange
      const mockImport = {
        id: 'import-1',
        eventId: 'event-1',
        fileName: 'test.csv',
        totalRows: 10,
        successCount: 8,
        errorCount: 2,
        status: ImportStatus.COMPLETED,
      };
      (prisma.attendeeImport.findUnique as vi.Mock).mockResolvedValue(mockImport);

      // Act
      const result = await AttendeeImportService.getImportById('import-1');

      // Assert
      expect(prisma.attendeeImport.findUnique).toHaveBeenCalledWith({
        where: { id: 'import-1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockImport);
    });

    it('should throw NotFoundError if import not found', async () => {
      // Arrange
      (prisma.attendeeImport.findUnique as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(AttendeeImportService.getImportById('nonexistent')).rejects.toThrow(
        'Import record not found',
      );
    });
  });

  describe('quickRegister', () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Test Event',
      isFree: false,
      ticketTypes: [{ name: 'VIP' }, { name: 'Standard' }],
    };

    it('should throw ValidationError if required fields missing', async () => {
      // Act & Assert
      await expect(
        AttendeeImportService.quickRegister('event-1', 'staff-1', {
          firstName: '',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
      ).rejects.toThrow('First name, last name, and email are required');

      await expect(
        AttendeeImportService.quickRegister('event-1', 'staff-1', {
          firstName: 'John',
          lastName: '',
          email: 'john@example.com',
        }),
      ).rejects.toThrow('First name, last name, and email are required');

      await expect(
        AttendeeImportService.quickRegister('event-1', 'staff-1', {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
        }),
      ).rejects.toThrow('First name, last name, and email are required');
    });

    it('should throw ValidationError for invalid email format', async () => {
      // Act & Assert
      await expect(
        AttendeeImportService.quickRegister('event-1', 'staff-1', {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
        }),
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw NotFoundError if event not found', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        AttendeeImportService.quickRegister('event-1', 'staff-1', {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid ticket type', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);

      // Act & Assert
      await expect(
        AttendeeImportService.quickRegister('event-1', 'staff-1', {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          ticketType: 'Premium',
        }),
      ).rejects.toThrow('Invalid ticket type: Premium');
    });

    it('should throw ValidationError if already registered', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue({
        id: 'reg-1',
        status: RegistrationStatus.CONFIRMED,
      });

      // Act & Assert
      await expect(
        AttendeeImportService.quickRegister('event-1', 'staff-1', {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
      ).rejects.toThrow('Attendee is already registered for this event');
    });

    it('should register new user successfully', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
      });
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.eventRegistration.create as vi.Mock).mockResolvedValue({
        id: 'reg-1',
      });
      (prisma.eventRegistration.update as vi.Mock).mockResolvedValue({
        id: 'reg-1',
      });
      (TicketService.generateBackupTicketCode as vi.Mock).mockReturnValue('BACKUP123');
      (TicketService.generateTicketData as vi.Mock).mockReturnValue('ticket-data');
      (TicketService.generateQRCode as vi.Mock).mockResolvedValue('qr-code-url');

      // Act
      const result = await AttendeeImportService.quickRegister('event-1', 'staff-1', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        ticketType: 'VIP',
      });

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: null,
          role: UserRole.ATTENDEE,
          status: UserStatus.ACTIVE,
        },
      });
      expect(result).toMatchObject({
        registrationId: 'reg-1',
        attendeeName: 'John Doe',
        email: 'john@example.com',
        ticketType: 'VIP',
        backupCode: 'BACKUP123',
        qrCodeDataUrl: 'qr-code-url',
      });
    });

    it('should register existing user successfully', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
      });
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.eventRegistration.create as vi.Mock).mockResolvedValue({
        id: 'reg-1',
      });
      (prisma.eventRegistration.update as vi.Mock).mockResolvedValue({
        id: 'reg-1',
      });
      (TicketService.generateBackupTicketCode as vi.Mock).mockReturnValue('BACKUP123');
      (TicketService.generateTicketData as vi.Mock).mockReturnValue('ticket-data');
      (TicketService.generateQRCode as vi.Mock).mockResolvedValue('qr-code-url');

      // Act
      const result = await AttendeeImportService.quickRegister('event-1', 'staff-1', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        ticketType: 'Standard',
      });

      // Assert
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result.ticketType).toBe('Standard');
    });

    it('should default to first ticket type if not provided', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.eventRegistration.create as vi.Mock).mockResolvedValue({
        id: 'reg-1',
      });
      (prisma.eventRegistration.update as vi.Mock).mockResolvedValue({
        id: 'reg-1',
      });
      (TicketService.generateBackupTicketCode as vi.Mock).mockReturnValue('BACKUP123');
      (TicketService.generateTicketData as vi.Mock).mockReturnValue('ticket-data');
      (TicketService.generateQRCode as vi.Mock).mockResolvedValue('qr-code-url');

      // Act
      const result = await AttendeeImportService.quickRegister('event-1', 'staff-1', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      // Assert
      expect(result.ticketType).toBe('VIP'); // First ticket type
    });

    it('should handle QR code generation errors gracefully', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.eventRegistration.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.eventRegistration.create as vi.Mock).mockResolvedValue({
        id: 'reg-1',
      });
      (prisma.eventRegistration.update as vi.Mock).mockResolvedValue({
        id: 'reg-1',
      });
      (TicketService.generateBackupTicketCode as vi.Mock).mockReturnValue('BACKUP123');
      (TicketService.generateTicketData as vi.Mock).mockReturnValue('ticket-data');
      (TicketService.generateQRCode as vi.Mock).mockRejectedValue(new Error('QR generation failed'));

      // Act
      const result = await AttendeeImportService.quickRegister('event-1', 'staff-1', {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      // Assert
      expect(result.qrCodeDataUrl).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('exportAttendees', () => {
    it('should throw NotFoundError if event not found', async () => {
      // Arrange
      (prisma.event.findFirst as vi.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(AttendeeImportService.exportAttendees('event-1')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should export attendees to CSV', async () => {
      // Arrange
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        registrationFields: [
          { id: 'company', label: 'Company' },
          { id: 'jobTitle', label: 'Job Title' },
        ],
      };
      const mockRegistrations = [
        {
          attendee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phoneNumber: '+254700000001',
          },
          ticketType: 'VIP',
          ticketStatus: 'ACTIVE',
          createdAt: new Date('2026-01-15T10:00:00Z'),
          checkedInAt: new Date('2026-01-20T09:00:00Z'),
          backupCode: 'BACKUP123',
          registrationData: {
            company: 'Acme Corp',
            jobTitle: 'Engineer',
          },
        },
      ];

      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue(mockRegistrations);

      // Act
      const result = await AttendeeImportService.exportAttendees('event-1');

      // Assert
      expect(result.count).toBe(1);
      expect(result.filename).toContain('Test_Event_attendees_');
      expect(result.csv).toContain('First Name,Last Name,Email');
      expect(result.csv).toContain('John,Doe,john@example.com');
      expect(result.csv).toContain('Company');
      expect(result.csv).toContain('Acme Corp');
    });

    it('should escape CSV values with commas and quotes', async () => {
      // Arrange
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        registrationFields: [],
      };
      const mockRegistrations = [
        {
          attendee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phoneNumber: null,
          },
          ticketType: 'VIP, Premium',
          ticketStatus: 'ACTIVE',
          createdAt: new Date('2026-01-15T10:00:00Z'),
          checkedInAt: null,
          backupCode: 'BACKUP123',
          registrationData: {
            company: 'Acme "Corp", Inc.',
          },
        },
      ];

      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue(mockRegistrations);

      // Act
      const result = await AttendeeImportService.exportAttendees('event-1');

      // Assert
      expect(result.csv).toContain('"VIP, Premium"');
      expect(result.csv).toContain('"Acme ""Corp"", Inc."');
    });

    it('should handle empty registration data', async () => {
      // Arrange
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        registrationFields: [],
      };
      const mockRegistrations = [
        {
          attendee: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phoneNumber: null,
          },
          ticketType: null,
          ticketStatus: null,
          createdAt: new Date('2026-01-15T10:00:00Z'),
          checkedInAt: null,
          backupCode: 'BACKUP123',
          registrationData: null,
        },
      ];

      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue(mockRegistrations);

      // Act
      const result = await AttendeeImportService.exportAttendees('event-1');

      // Assert
      expect(result.count).toBe(1);
      expect(result.csv).toContain('John,Doe,john@example.com');
    });

    it('should exclude cancelled registrations', async () => {
      // Arrange
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        registrationFields: [],
      };

      (prisma.event.findFirst as vi.Mock).mockResolvedValue(mockEvent);
      (prisma.eventRegistration.findMany as vi.Mock).mockResolvedValue([]);

      // Act
      await AttendeeImportService.exportAttendees('event-1');

      // Assert
      expect(prisma.eventRegistration.findMany).toHaveBeenCalledWith({
        where: {
          eventId: 'event-1',
          status: { not: RegistrationStatus.CANCELLED },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});
