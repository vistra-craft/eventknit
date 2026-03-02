/**
 * Attendee Import Controller
 * Handles HTTP endpoints for bulk attendee import
 */

import { Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AttendeeImportService } from '../services/attendee-import.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

// Extend AuthenticatedRequest to include multer file
interface ImportRequest extends AuthenticatedRequest {
  file?: multer.File;
}

/**
 * Download CSV template
 * GET /api/v1/events/:id/import/template
 */
export const downloadTemplate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const template = AttendeeImportService.generateTemplate();

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendee-import-template.csv"');
  res.send(template);
});

/**
 * Validate import file (dry run)
 * POST /api/v1/events/:id/import/validate
 */
export const validateImportFile = asyncHandler(async (req: ImportRequest, res: Response) => {
  const eventId = (req.params.id as string);
  const file = req.file;

  if (!file) {
    throw new ValidationError('No file uploaded');
  }

  logger.info(`Validating import file for event ${eventId}:`, {
    fileName: file.originalname,
    size: file.size,
  });

  // Parse file
  const rows = AttendeeImportService.parseFile(file.buffer, file.originalname);

  // Validate rows
  const validationResult = await AttendeeImportService.validateRows(eventId, rows);

  res.json({
    success: true,
    data: validationResult,
  });
});

/**
 * Execute import
 * POST /api/v1/events/:id/import
 */
export const executeImport = asyncHandler(async (req: ImportRequest, res: Response) => {
  const eventId = (req.params.id as string);
  const userId = req.user?.id;
  const file = req.file;

  if (!userId) {
    throw new ValidationError('User not authenticated');
  }

  if (!file) {
    throw new ValidationError('No file uploaded');
  }

  const { sendWelcomeEmails, skipDuplicates, defaultTicketType } = req.body;

  logger.info(`Executing import for event ${eventId}:`, {
    fileName: file.originalname,
    size: file.size,
    sendWelcomeEmails,
    skipDuplicates,
    userId,
  });

  // Parse file
  const rows = AttendeeImportService.parseFile(file.buffer, file.originalname);

  // Execute import
  const result = await AttendeeImportService.importAttendees(
    eventId,
    rows,
    userId,
    file.originalname,
    {
      sendWelcomeEmails: sendWelcomeEmails === 'true' || sendWelcomeEmails === true,
      skipDuplicates: skipDuplicates !== 'false' && skipDuplicates !== false, // Default true
      defaultTicketType,
    },
  );

  res.json({
    success: true,
    message: `Import completed: ${result.successCount} of ${result.totalRows} attendees imported`,
    data: result,
  });
});

/**
 * Get import history for an event
 * GET /api/v1/events/:id/imports
 */
export const getImportHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const eventId = (req.params.id as string);
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const offset = parseInt(req.query.offset as string, 10) || 0;

  const result = await AttendeeImportService.getImportHistory(eventId, limit, offset);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get import details by ID
 * GET /api/v1/events/:id/imports/:importId
 */
export const getImportDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const importId = (req.params.importId as string);

  const importRecord = await AttendeeImportService.getImportById(importId);

  res.json({
    success: true,
    data: importRecord,
  });
});

/**
 * Quick register a single attendee (walk-in registration)
 * POST /api/v1/events/:id/attendees/register
 */
export const quickRegister = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const eventId = (req.params.id as string);
  const userId = req.user?.id;

  if (!userId) {
    throw new ValidationError('User not authenticated');
  }

  const { firstName, lastName, email, phoneNumber, ticketType, registrationData } = req.body;

  logger.info(`Quick registering attendee for event ${eventId}:`, {
    email,
    registeredBy: userId,
  });

  const result = await AttendeeImportService.quickRegister(eventId, userId, {
    firstName,
    lastName,
    email,
    phoneNumber,
    ticketType,
    registrationData,
  });

  res.status(201).json({
    success: true,
    message: `Successfully registered ${result.attendeeName}`,
    data: result,
  });
});

/**
 * Export attendees to CSV
 * GET /api/v1/events/:id/attendees/export
 */
export const exportAttendees = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const eventId = (req.params.id as string);

  logger.info(`Exporting attendees for event ${eventId}`);

  const result = await AttendeeImportService.exportAttendees(eventId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.csv);
});
