/**
 * Attendee Import Service
 * Handles bulk import of attendees for MICE events from CSV/Excel files
 */

import * as XLSX from 'xlsx';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { TicketService } from './ticket.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { UserRole, UserStatus, RegistrationStatus, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Import status enum
export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// CSV/Excel row structure
export interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  ticketType?: string;
  checkpoints?: string; // Comma-separated checkpoint codes
}

// Validation error structure
export interface ImportRowError {
  row: number;
  field: string;
  value?: string;
  message: string;
}

// Import result structure
export interface ImportResult {
  importId: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportRowError[];
}

// Validation result structure
export interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: ImportRowError[];
  preview: ImportRow[];
}

// Import options
export interface ImportOptions {
  sendWelcomeEmails?: boolean;
  skipDuplicates?: boolean;
  defaultTicketType?: string;
}

export class AttendeeImportService {
  /**
   * Generate CSV template with headers
   */
  static generateTemplate(): string {
    const headers = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'company',
      'jobTitle',
      'ticketType',
      'checkpoints',
    ];

    const exampleRows = [
      ['John', 'Doe', 'john@example.com', '+254700000001', 'Acme Corp', 'Engineer', 'VIP', 'LUNCH1,WORKSHOP-A'],
      ['Jane', 'Smith', 'jane@example.com', '+254700000002', 'Tech Inc', 'Manager', 'Standard', 'LUNCH1'],
    ];

    return [headers.join(','), ...exampleRows.map(row => row.join(','))].join('\n');
  }

  /**
   * Parse file buffer (CSV or Excel) into rows
   */
  static parseFile(buffer: Buffer, fileName: string): ImportRow[] {
    const extension = fileName.toLowerCase().split('.').pop();

    if (extension === 'csv') {
      return this.parseCSV(buffer);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.parseExcel(buffer);
    } else {
      throw new ValidationError('Unsupported file format. Please use CSV or Excel (.xlsx, .xls)');
    }
  }

  /**
   * Parse CSV buffer into rows
   */
  private static parseCSV(buffer: Buffer): ImportRow[] {
    const content = buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      throw new ValidationError('File must contain headers and at least one data row');
    }

    // Parse headers (case-insensitive)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Map headers to expected fields
    const headerMap: Record<string, string> = {
      'firstname': 'firstName',
      'first_name': 'firstName',
      'first name': 'firstName',
      'lastname': 'lastName',
      'last_name': 'lastName',
      'last name': 'lastName',
      'email': 'email',
      'phone': 'phone',
      'phonenumber': 'phone',
      'phone_number': 'phone',
      'company': 'company',
      'organization': 'company',
      'jobtitle': 'jobTitle',
      'job_title': 'jobTitle',
      'job title': 'jobTitle',
      'title': 'jobTitle',
      'tickettype': 'ticketType',
      'ticket_type': 'ticketType',
      'ticket type': 'ticketType',
      'ticket': 'ticketType',
      'checkpoints': 'checkpoints',
      'facilities': 'checkpoints',
      'tags': 'checkpoints',
    };

    const mappedHeaders = headers.map(h => headerMap[h] || h);

    // Parse data rows
    const rows: ImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;

      const row: Record<string, string> = {};
      for (let j = 0; j < mappedHeaders.length; j++) {
        row[mappedHeaders[j]] = values[j]?.trim() || '';
      }

      rows.push({
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        email: row.email || '',
        phone: row.phone,
        company: row.company,
        jobTitle: row.jobTitle,
        ticketType: row.ticketType,
        checkpoints: row.checkpoints,
      });
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  }

  /**
   * Parse Excel buffer into rows
   */
  private static parseExcel(buffer: Buffer): ImportRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (rawData.length === 0) {
      throw new ValidationError('Excel file has no data rows');
    }

    // Map column names (case-insensitive)
    return rawData.map(row => {
      const normalizedRow: Record<string, string> = {};

      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
        normalizedRow[normalizedKey] = String(value || '').trim();
      }

      return {
        firstName: normalizedRow.firstname || normalizedRow.first || '',
        lastName: normalizedRow.lastname || normalizedRow.last || '',
        email: normalizedRow.email || '',
        phone: normalizedRow.phone || normalizedRow.phonenumber || undefined,
        company: normalizedRow.company || normalizedRow.organization || undefined,
        jobTitle: normalizedRow.jobtitle || normalizedRow.title || undefined,
        ticketType: normalizedRow.tickettype || normalizedRow.ticket || undefined,
        checkpoints: normalizedRow.checkpoints || normalizedRow.facilities || normalizedRow.tags || undefined,
      };
    });
  }

  /**
   * Validate rows without importing
   */
  static async validateRows(
    eventId: string,
    rows: ImportRow[],
  ): Promise<ValidationResult> {
    // Get event with ticket types and checkpoints
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        ticketTypes: true,
        isFree: true,
        checkpoints: {
          where: { isActive: true },
          select: { stationCode: true, name: true },
        },
        facilities: {
          where: { isActive: true },
          select: { code: true, name: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const ticketTypes = (event.ticketTypes as Array<{ name: string }>) || [];
    const validTicketTypes = new Set(ticketTypes.map((t: { name: string }) => t.name.toLowerCase()));
    const validCheckpoints = new Set([
      ...event.checkpoints.filter(c => c.stationCode).map(c => c.stationCode!.toLowerCase()),
      ...event.facilities.map(f => f.code.toLowerCase()),
    ]);

    const errors: ImportRowError[] = [];
    const emailSet = new Set<string>();
    const existingEmails = new Set<string>();

    // Check for existing registrations
    const emails = rows.map(r => r.email.toLowerCase()).filter(e => e);
    if (emails.length > 0) {
      const existingRegs = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          attendee: {
            email: { in: emails },
          },
          status: { not: RegistrationStatus.CANCELLED },
        },
        select: {
          attendee: { select: { email: true } },
        },
      });
      existingRegs.forEach((r: { attendee: { email: string } }) => existingEmails.add(r.attendee.email.toLowerCase()));
    }

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header row and 0-index

      // Required fields
      if (!row.firstName?.trim()) {
        errors.push({ row: rowNum, field: 'firstName', message: 'First name is required' });
      }
      if (!row.lastName?.trim()) {
        errors.push({ row: rowNum, field: 'lastName', message: 'Last name is required' });
      }
      if (!row.email?.trim()) {
        errors.push({ row: rowNum, field: 'email', message: 'Email is required' });
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({ row: rowNum, field: 'email', value: row.email, message: 'Invalid email format' });
        } else {
          // Check for duplicates in file
          const lowerEmail = row.email.toLowerCase();
          if (emailSet.has(lowerEmail)) {
            errors.push({ row: rowNum, field: 'email', value: row.email, message: 'Duplicate email in file' });
          } else {
            emailSet.add(lowerEmail);
          }
          // Check for existing registration
          if (existingEmails.has(lowerEmail)) {
            errors.push({ row: rowNum, field: 'email', value: row.email, message: 'Already registered for this event' });
          }
        }
      }

      // Validate ticket type if provided
      if (row.ticketType && !event.isFree) {
        if (!validTicketTypes.has(row.ticketType.toLowerCase())) {
          errors.push({
            row: rowNum,
            field: 'ticketType',
            value: row.ticketType,
            message: `Invalid ticket type. Valid options: ${[...validTicketTypes].join(', ')}`,
          });
        }
      }

      // Validate checkpoints if provided
      if (row.checkpoints) {
        const codes = row.checkpoints.split(',').map(c => c.trim().toLowerCase());
        for (const code of codes) {
          if (code && !validCheckpoints.has(code)) {
            errors.push({
              row: rowNum,
              field: 'checkpoints',
              value: code,
              message: `Invalid checkpoint/facility code. Valid options: ${[...validCheckpoints].join(', ')}`,
            });
          }
        }
      }
    }

    const errorRows = new Set(errors.map(e => e.row)).size;

    return {
      isValid: errors.length === 0,
      totalRows: rows.length,
      validRows: rows.length - errorRows,
      errorRows,
      errors,
      preview: rows.slice(0, 10), // First 10 rows for preview
    };
  }

  /**
   * Import attendees from parsed rows
   */
  static async importAttendees(
    eventId: string,
    rows: ImportRow[],
    importedBy: string,
    fileName: string,
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const { sendWelcomeEmails = false, skipDuplicates = true, defaultTicketType } = options;

    // Create import record
    const importRecord = await prisma.attendeeImport.create({
      data: {
        eventId,
        importedBy,
        fileName,
        totalRows: rows.length,
        status: ImportStatus.PROCESSING,
        sendWelcomeEmails,
      },
    });

    const errors: ImportRowError[] = [];
    let successCount = 0;

    // Get event details
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        title: true,
        isFree: true,
        ticketTypes: true,
        checkpoints: {
          where: { isActive: true },
          select: { stationCode: true },
        },
        facilities: {
          where: { isActive: true },
          select: { code: true },
        },
      },
    });

    if (!event) {
      await prisma.attendeeImport.update({
        where: { id: importRecord.id },
        data: { status: ImportStatus.FAILED, errors: [{ row: 0, field: '', message: 'Event not found' }] },
      });
      throw new NotFoundError('Event not found');
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        await this.processImportRow(event, row, rowNum, skipDuplicates, defaultTicketType);
        successCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ row: rowNum, field: 'general', message });
        logger.warn(`Import row ${rowNum} failed:`, { error: message, row });
      }
    }

    // Update import record
    await prisma.attendeeImport.update({
      where: { id: importRecord.id },
      data: {
        status: errors.length === rows.length ? ImportStatus.FAILED : ImportStatus.COMPLETED,
        successCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? (errors as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        completedAt: new Date(),
      },
    });

    logger.info(`Attendee import completed for event ${eventId}:`, {
      importId: importRecord.id,
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
    });

    return {
      importId: importRecord.id,
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors,
    };
  }

  /**
   * Process a single import row
   */
  private static async processImportRow(
    event: {
      id: string;
      title: string;
      isFree: boolean;
      ticketTypes: unknown;
      checkpoints: Array<{ stationCode: string | null }>;
      facilities: Array<{ code: string }>;
    },
    row: ImportRow,
    rowNum: number,
    skipDuplicates: boolean,
    defaultTicketType?: string,
  ): Promise<void> {
    const email = row.email.toLowerCase().trim();
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();

    // Validate required fields
    if (!email || !firstName || !lastName) {
      throw new ValidationError(`Row ${rowNum}: Missing required fields`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    let userCreated = false;

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email,
            password: null, // Passwordless account
            firstName,
            lastName,
            phoneNumber: row.phone?.trim() || null,
            companyAffiliation: row.company?.trim() || null,
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
        userCreated = true;
        logger.debug(`Created user for import: ${user.id}`);
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
          // Race condition - user was created by another process
          user = await prisma.user.findUnique({ where: { email } });
          if (!user) throw new Error('User creation failed');
        } else {
          throw error;
        }
      }
    }

    // Check for existing registration
    const existingReg = await prisma.eventRegistration.findUnique({
      where: {
        eventId_attendeeId: {
          eventId: event.id,
          attendeeId: user.id,
        },
      },
    });

    if (existingReg && existingReg.status !== RegistrationStatus.CANCELLED) {
      if (skipDuplicates) {
        logger.debug(`Skipping duplicate registration for ${email}`);
        return;
      }
      throw new Error('Already registered for this event');
    }

    // Determine ticket type
    const ticketType = row.ticketType?.trim() || defaultTicketType || null;

    // Build registration data with checkpoint tags
    const registrationData: Record<string, unknown> = {};
    if (row.company) registrationData.company = row.company.trim();
    if (row.jobTitle) registrationData.jobTitle = row.jobTitle.trim();

    // Add checkpoint/facility tags for eligibility
    if (row.checkpoints) {
      const checkpointCodes = row.checkpoints
        .split(',')
        .map(c => c.trim().toUpperCase())
        .filter(c => c);
      if (checkpointCodes.length > 0) {
        registrationData.tags = checkpointCodes;
      }
    }
    registrationData.importedAt = new Date().toISOString();

    // Generate backup code
    const backupCode = TicketService.generateBackupTicketCode();

    // Create or update registration
    const registration = existingReg
      ? await prisma.eventRegistration.update({
        where: { id: existingReg.id },
        data: {
          ticketType,
          quantity: 1,
          totalAmount: 0,
          registrationData: registrationData as Prisma.InputJsonValue,
          backupCode,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
          cancelledAt: null,
          cancelledBy: null,
        },
      })
      : await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          attendeeId: user.id,
          ticketType,
          quantity: 1,
          totalAmount: 0,
          registrationData: registrationData as Prisma.InputJsonValue,
          backupCode,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
        },
      });

    // Generate QR code
    try {
      const ticketData = TicketService.generateTicketData(registration.id, event.id, email);
      const qrCodeDataUrl = await TicketService.generateQRCode(ticketData);

      await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          qrCodeDataUrl,
          qrCodeGeneratedAt: new Date(),
        },
      });
    } catch (qrError) {
      logger.warn(`Failed to generate QR code for imported attendee ${email}:`, qrError);
      // Don't fail the import for QR code errors
    }

    logger.debug(`Imported attendee: ${email} for event ${event.id}`, {
      registrationId: registration.id,
      userCreated,
      ticketType,
      checkpoints: registrationData.tags,
    });
  }

  /**
   * Get import history for an event
   */
  static async getImportHistory(eventId: string, limit = 20, offset = 0) {
    const imports = await prisma.attendeeImport.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        fileName: true,
        totalRows: true,
        successCount: true,
        errorCount: true,
        status: true,
        sendWelcomeEmails: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const total = await prisma.attendeeImport.count({ where: { eventId } });

    return { imports, total };
  }

  /**
   * Get import details by ID
   */
  static async getImportById(importId: string) {
    const importRecord = await prisma.attendeeImport.findUnique({
      where: { id: importId },
      select: {
        id: true,
        eventId: true,
        fileName: true,
        totalRows: true,
        successCount: true,
        errorCount: true,
        status: true,
        sendWelcomeEmails: true,
        errors: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!importRecord) {
      throw new NotFoundError('Import record not found');
    }

    return importRecord;
  }

  /**
   * Quick register a single attendee (for walk-in registration)
   * Staff can register attendees on-site using the event's registration form
   */
  static async quickRegister(
    eventId: string,
    registeredBy: string,
    attendeeData: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
      ticketType?: string;
      registrationData?: Record<string, unknown>;
    },
  ): Promise<{
    registrationId: string;
    attendeeName: string;
    email: string;
    ticketType: string | null;
    backupCode: string;
    qrCodeDataUrl: string | null;
  }> {
    const { firstName, lastName, email, phoneNumber, ticketType, registrationData } = attendeeData;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      throw new ValidationError('First name, last name, and email are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new ValidationError('Invalid email format');
    }

    // Get event with ticket types
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        title: true,
        isFree: true,
        ticketTypes: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Validate ticket type if provided
    const ticketTypes = (event.ticketTypes as Array<{ name: string }>) || [];
    let selectedTicketType = ticketType;
    if (ticketType) {
      const validType = ticketTypes.find(
        (t: { name: string }) => t.name.toLowerCase() === ticketType.toLowerCase(),
      );
      if (!validType) {
        throw new ValidationError(`Invalid ticket type: ${ticketType}`);
      }
      selectedTicketType = validType.name;
    } else if (ticketTypes.length > 0) {
      // Default to first ticket type
      selectedTicketType = ticketTypes[0].name;
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phoneNumber?.trim() || null,
            role: UserRole.ATTENDEE,
            status: UserStatus.ACTIVE,
          },
        });
        logger.info(`Created new user for quick registration: ${normalizedEmail}`);
      } catch (err) {
        if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
          // Race condition - user was created between check and create
          user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          if (!user) throw new ValidationError('Failed to create user');
        } else {
          throw err;
        }
      }
    }

    // Check for existing registration
    const existingReg = await prisma.eventRegistration.findUnique({
      where: {
        eventId_attendeeId: {
          eventId,
          attendeeId: user.id,
        },
      },
    });

    if (existingReg && existingReg.status !== RegistrationStatus.CANCELLED) {
      throw new ValidationError('Attendee is already registered for this event');
    }

    // Build registration data
    const regData: Record<string, unknown> = {
      ...registrationData,
      registeredBy,
      walkIn: true,
      registeredAt: new Date().toISOString(),
    };

    // Generate backup code
    const backupCode = TicketService.generateBackupTicketCode();

    // Create or update registration
    const registration = existingReg
      ? await prisma.eventRegistration.update({
        where: { id: existingReg.id },
        data: {
          ticketType: selectedTicketType,
          quantity: 1,
          totalAmount: 0,
          registrationData: regData as Prisma.InputJsonValue,
          backupCode,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
          cancelledAt: null,
          cancelledBy: null,
        },
      })
      : await prisma.eventRegistration.create({
        data: {
          eventId,
          attendeeId: user.id,
          ticketType: selectedTicketType,
          quantity: 1,
          totalAmount: 0,
          registrationData: regData as Prisma.InputJsonValue,
          backupCode,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: 'COMPLETED',
        },
      });

    // Generate QR code
    let qrCodeDataUrl: string | null = null;
    try {
      const ticketData = TicketService.generateTicketData(registration.id, eventId, normalizedEmail);
      qrCodeDataUrl = await TicketService.generateQRCode(ticketData);

      await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: {
          qrCodeDataUrl,
          qrCodeGeneratedAt: new Date(),
        },
      });
    } catch (qrError) {
      logger.warn(`Failed to generate QR code for quick registration ${registration.id}:`, qrError);
    }

    logger.info(`Quick registered attendee: ${normalizedEmail} for event ${eventId}`, {
      registrationId: registration.id,
      registeredBy,
      ticketType: selectedTicketType,
    });

    return {
      registrationId: registration.id,
      attendeeName: `${firstName.trim()} ${lastName.trim()}`,
      email: normalizedEmail,
      ticketType: selectedTicketType || null,
      backupCode,
      qrCodeDataUrl,
    };
  }

  /**
   * Export attendees to CSV
   */
  static async exportAttendees(
    eventId: string,
  ): Promise<{ csv: string; filename: string; count: number }> {
    // Get event with registration fields
    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        title: true,
        registrationFields: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Get all registrations
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: { not: RegistrationStatus.CANCELLED },
      },
      include: {
        attendee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Define standard columns
    const standardColumns = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'ticketType',
      'ticketStatus',
      'registeredAt',
      'checkedInAt',
      'backupCode',
    ];

    // Get custom field columns from registration form definition
    const registrationFields = (event.registrationFields as Array<{ id: string; label: string }>) || [];
    const customColumns = registrationFields.map((f: { id: string; label: string }) => f.id);

    // Also collect any additional keys from registrationData that aren't in form definition
    const additionalKeys = new Set<string>();
    registrations.forEach(reg => {
      const data = reg.registrationData as Record<string, unknown> | null;
      if (data) {
        Object.keys(data).forEach(key => {
          if (!customColumns.includes(key) && !['registeredBy', 'walkIn', 'registeredAt', 'importedAt', 'tags', 'importBatchId'].includes(key)) {
            additionalKeys.add(key);
          }
        });
      }
    });

    const allColumns = [...standardColumns, ...customColumns, ...Array.from(additionalKeys)];

    // Build header row with labels
    const headerLabels: Record<string, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phoneNumber: 'Phone',
      ticketType: 'Ticket Type',
      ticketStatus: 'Ticket Status',
      registeredAt: 'Registered At',
      checkedInAt: 'Checked In At',
      backupCode: 'Backup Code',
    };
    registrationFields.forEach((f: { id: string; label: string }) => {
      headerLabels[f.id] = f.label;
    });

    const headers = allColumns.map(col => headerLabels[col] || col);

    // Build rows
    const rows = registrations.map(reg => {
      const data = reg.registrationData as Record<string, unknown> | null;
      return allColumns.map(col => {
        let value: unknown;
        switch (col) {
        case 'firstName':
          value = reg.attendee.firstName;
          break;
        case 'lastName':
          value = reg.attendee.lastName;
          break;
        case 'email':
          value = reg.attendee.email;
          break;
        case 'phoneNumber':
          value = reg.attendee.phoneNumber;
          break;
        case 'ticketType':
          value = reg.ticketType;
          break;
        case 'ticketStatus':
          value = reg.ticketStatus;
          break;
        case 'registeredAt':
          value = reg.createdAt?.toISOString();
          break;
        case 'checkedInAt':
          value = reg.checkedInAt?.toISOString();
          break;
        case 'backupCode':
          value = reg.backupCode;
          break;
        default:
          value = data?.[col];
        }
        // Escape CSV value
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
    });

    // Build CSV
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_attendees_${new Date().toISOString().split('T')[0]}.csv`;

    return { csv, filename, count: registrations.length };
  }
}
