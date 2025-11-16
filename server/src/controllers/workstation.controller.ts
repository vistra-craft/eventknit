import { Response, NextFunction } from 'express';
import { WorkstationService } from '../services/workstation.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { prisma } from '../config/database.js';
import { Prisma, TicketStatus, ScanType } from '@prisma/client';
import { websocketService } from '../services/websocket.service.js';

export class WorkstationController {
  /**
   * Scan ticket (check-in)
   * POST /api/v1/workstation/scan
   * Requires: TELLER or higher
   */
  static async scanTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { code, eventId, facility, deviceId, deviceType } = req.body;

      // Validate required fields
      if (!code || typeof code !== 'string') {
        throw new ValidationError('Code is required and must be a string');
      }

      if (!eventId || typeof eventId !== 'string') {
        throw new ValidationError('Event ID is required and must be a string');
      }

      // Extract IP address and user agent
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.headers['user-agent'] || undefined;

      // Call workstation service
      const result = await WorkstationService.scanTicket(
        code,
        eventId,
        req.user.id,
        facility,
        deviceId,
        deviceType,
        ipAddress,
        userAgent,
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: result.errorCode || 'SCAN_ERROR',
            message: result.errorMessage || 'Scan failed',
            details: {
              registrationId: result.registrationId,
              eventId: result.eventId,
            },
          },
        });
        return;
      }

      // Get scan record for additional details
      const scanRecord = await prisma.ticketScan.findFirst({
        where: {
          registrationId: result.registrationId,
          eventId: result.eventId,
        },
        orderBy: {
          scannedAt: 'desc',
        },
        select: {
          id: true,
          scanType: true,
          isReEntry: true,
          isValid: true,
        },
      });

      // Determine code type and signature verification status
      const validation = await WorkstationService.validateTicket(code, eventId);
      const codeType = validation.codeType || 'UNKNOWN';
      const signatureValid = validation.signatureVerified ?? false;

      const responseData = {
        scanId: scanRecord?.id,
        registrationId: result.registrationId,
        eventId: result.eventId,
        attendeeName: result.attendeeName,
        ticketType: result.ticketType,
        scanType: scanRecord?.scanType,
        facility: facility || null,
        scannedAt: result.checkedInAt,
        isReEntry: scanRecord?.isReEntry || false,
        signatureValid,
        codeType,
      };

      // Emit WebSocket event for real-time updates
      if (scanRecord?.id) {
        websocketService.emitScanEvent(eventId, {
          scanId: scanRecord.id,
          registrationId: result.registrationId,
          eventId: result.eventId,
          scanType: scanRecord.scanType || 'CHECK_IN',
          facility: facility || null,
          scannedAt: result.checkedInAt,
          attendeeName: result.attendeeName,
          ticketType: result.ticketType || null,
          isReEntry: scanRecord.isReEntry || false,
          signatureValid,
          codeType,
        });

        // Send statistics update
        await websocketService.sendStatisticsUpdate(eventId);
      }

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scan out (check-out)
   * POST /api/v1/workstation/scan-out
   * Requires: TELLER or higher
   */
  static async scanOut(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { code, eventId, facility } = req.body;

      // Validate required fields
      if (!code || typeof code !== 'string') {
        throw new ValidationError('Code is required and must be a string');
      }

      if (!eventId || typeof eventId !== 'string') {
        throw new ValidationError('Event ID is required and must be a string');
      }

      // Extract IP address and user agent
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.headers['user-agent'] || undefined;

      // Validate code first to get registrationId
      const checkoutValidation = await WorkstationService.validateTicket(code, eventId);
      if (!checkoutValidation.isValid || !checkoutValidation.registrationId) {
        res.status(400).json({
          success: false,
          error: {
            code: checkoutValidation.errorCode || 'VALIDATION_ERROR',
            message: checkoutValidation.errorMessage || 'Ticket validation failed',
          },
        });
        return;
      }

      // Call workstation service with registrationId
      const result = await WorkstationService.checkOut(
        checkoutValidation.registrationId,
        req.user.id,
        facility,
        undefined, // deviceId
        undefined, // deviceType
        ipAddress,
        userAgent,
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: result.errorCode || 'CHECKOUT_ERROR',
            message: result.errorMessage || 'Check-out failed',
            details: {
              registrationId: result.registrationId,
            },
          },
        });
        return;
      }

      // Get scan record for additional details
      const scanRecord = await prisma.ticketScan.findFirst({
        where: {
          registrationId: result.registrationId,
        },
        orderBy: {
          scannedAt: 'desc',
        },
        select: {
          id: true,
          scanType: true,
          isValid: true,
        },
      });

      // Use validation from earlier
      const codeType = checkoutValidation.codeType || 'UNKNOWN';
      const signatureValid = checkoutValidation.signatureVerified ?? false;

      const responseData = {
        scanId: scanRecord?.id,
        registrationId: result.registrationId,
        scanType: scanRecord?.scanType,
        facility: facility || null,
        checkedOutAt: result.checkedOutAt,
        signatureValid,
        codeType,
      };

      // Emit WebSocket event for real-time updates
      if (scanRecord?.id) {
        // Get event ID from registration
        const registration = await prisma.eventRegistration.findUnique({
          where: { id: result.registrationId },
          select: { eventId: true },
        });

        if (registration) {
          websocketService.emitScanEvent(registration.eventId, {
            scanId: scanRecord.id,
            registrationId: result.registrationId,
            eventId: registration.eventId,
            scanType: scanRecord.scanType || 'CHECK_OUT',
            facility: facility || null,
            scannedAt: result.checkedOutAt,
            isReEntry: false,
            signatureValid,
            codeType,
          });

          // Send statistics update
          await websocketService.sendStatisticsUpdate(registration.eventId);
        }
      }

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ticket details
   * GET /api/v1/workstation/tickets/:ticketId
   * Requires: TELLER or higher
   */
  static async getTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { ticketId } = req.params;

      if (!ticketId) {
        throw new ValidationError('Ticket ID is required');
      }

      // Get registration
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: ticketId },
        include: {
          attendee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
            },
          },
          ticketScans: {
            orderBy: {
              scannedAt: 'desc',
            },
            take: 10, // Last 10 scans
            select: {
              id: true,
              scanType: true,
              scannedAt: true,
              scannedBy: true,
              facility: true,
              isValid: true,
              isReEntry: true,
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Ticket not found');
      }

      res.status(200).json({
        success: true,
        data: {
          registrationId: registration.id,
          eventId: registration.eventId,
          attendee: {
            id: registration.attendee.id,
            name: `${registration.attendee.firstName || ''} ${registration.attendee.lastName || ''}`.trim(),
            email: registration.attendee.email,
            phone: registration.attendee.phoneNumber,
          },
          event: {
            id: registration.event.id,
            title: registration.event.title,
            startDate: registration.event.startDate,
            endDate: registration.event.endDate,
          },
          ticketType: registration.ticketType,
          ticketStatus: registration.ticketStatus,
          isCurrentlyInside: registration.isCurrentlyInside,
          checkedInAt: registration.checkedInAt,
          checkedOutAt: registration.checkedOutAt,
          reEntryCount: registration.reEntryCount,
          lastScanFacility: registration.lastScanFacility,
          scanHistory: registration.ticketScans,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual check-in
   * POST /api/v1/workstation/manual-check-in
   * Requires: ADMIN_STAFF or higher
   */
  static async manualCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { searchTerm, eventId, facility, code } = req.body;

      // Validate required fields
      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new ValidationError('Search term is required and must be a string');
      }

      if (!eventId || typeof eventId !== 'string') {
        throw new ValidationError('Event ID is required and must be a string');
      }

      // Call workstation service
      const result = await WorkstationService.manualCheckIn(
        searchTerm,
        eventId,
        req.user.id,
        facility,
        code,
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: result.errorCode || 'MANUAL_CHECKIN_ERROR',
            message: result.errorMessage || 'Manual check-in failed',
            details: {
              registrationId: result.registrationId,
              eventId: result.eventId,
            },
          },
        });
        return;
      }

      // Get scan record
      const scanRecord = await prisma.ticketScan.findFirst({
        where: {
          registrationId: result.registrationId,
          eventId: result.eventId,
        },
        orderBy: {
          scannedAt: 'desc',
        },
        select: {
          id: true,
          scanType: true,
          isReEntry: true,
        },
      });

      // Determine signature verification status if code was provided
      let signatureValid: boolean | undefined;
      if (code) {
        const validation = await WorkstationService.validateTicket(code, eventId);
        signatureValid = validation.signatureVerified ?? false;
      }

      const responseData = {
        scanId: scanRecord?.id,
        registrationId: result.registrationId,
        eventId: result.eventId,
        attendeeName: result.attendeeName,
        ticketType: result.ticketType,
        scanType: scanRecord?.scanType,
        facility: facility || null,
        checkedInAt: result.checkedInAt,
        isReEntry: scanRecord?.isReEntry || false,
        signatureValid,
        isManual: true,
      };

      // Emit WebSocket event for real-time updates
      if (scanRecord?.id) {
        websocketService.emitScanEvent(eventId, {
          scanId: scanRecord.id,
          registrationId: result.registrationId,
          eventId: result.eventId,
          scanType: scanRecord.scanType || 'MANUAL_CHECK_IN',
          facility: facility || null,
          scannedAt: result.checkedInAt,
          attendeeName: result.attendeeName,
          ticketType: result.ticketType || null,
          isReEntry: scanRecord.isReEntry || false,
          signatureValid,
          codeType: code ? 'QR_CODE' : undefined,
        });

        // Send statistics update
        await websocketService.sendStatisticsUpdate(eventId);
      }

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual check-out
   * POST /api/v1/workstation/manual-check-out
   * Requires: ADMIN_STAFF or higher
   */
  static async manualCheckOut(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { searchTerm, eventId, facility, code } = req.body;

      // Validate required fields
      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new ValidationError('Search term is required and must be a string');
      }

      if (!eventId || typeof eventId !== 'string') {
        throw new ValidationError('Event ID is required and must be a string');
      }

      // Call workstation service
      const result = await WorkstationService.manualCheckOut(
        searchTerm,
        eventId,
        req.user.id,
        facility,
        code,
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: result.errorCode || 'MANUAL_CHECKOUT_ERROR',
            message: result.errorMessage || 'Manual check-out failed',
            details: {
              registrationId: result.registrationId,
            },
          },
        });
        return;
      }

      // Get scan record
      const scanRecord = await prisma.ticketScan.findFirst({
        where: {
          registrationId: result.registrationId,
        },
        orderBy: {
          scannedAt: 'desc',
        },
        select: {
          id: true,
          scanType: true,
        },
      });

      // Determine signature verification status if code was provided
      let signatureValid: boolean | undefined;
      if (code) {
        const validation = await WorkstationService.validateTicket(code, eventId);
        signatureValid = validation.signatureVerified ?? false;
      }

      const responseData = {
        scanId: scanRecord?.id,
        registrationId: result.registrationId,
        scanType: scanRecord?.scanType,
        facility: facility || null,
        checkedOutAt: result.checkedOutAt,
        signatureValid,
        isManual: true,
      };

      // Emit WebSocket event for real-time updates
      if (scanRecord?.id) {
        websocketService.emitScanEvent(eventId, {
          scanId: scanRecord.id,
          registrationId: result.registrationId,
          eventId: eventId,
          scanType: scanRecord.scanType || 'MANUAL_CHECK_OUT',
          facility: facility || null,
          scannedAt: result.checkedOutAt,
          isReEntry: false,
          signatureValid,
          codeType: code ? 'QR_CODE' : undefined,
        });

        // Send statistics update
        await websocketService.sendStatisticsUpdate(eventId);
      }

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search attendees
   * GET /api/v1/workstation/search
   * Requires: TELLER or higher
   */
  static async searchAttendees(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { q: searchTerm, eventId, code } = req.query;

      if (!searchTerm || typeof searchTerm !== 'string') {
        throw new ValidationError('Search term (q) is required and must be a string');
      }

      if (!eventId || typeof eventId !== 'string') {
        throw new ValidationError('Event ID is required for search');
      }

      // Call workstation service
      const results = await WorkstationService.searchAttendees(
        searchTerm,
        String(eventId),
      );

      // If code provided, verify signature for each result
      let signatureValid: boolean | undefined;
      if (code && typeof code === 'string' && eventId) {
        const validation = await WorkstationService.validateTicket(code, String(eventId));
        signatureValid = validation.signatureVerified ?? false;
      }

      res.status(200).json({
        success: true,
        data: {
          results,
          count: results.length,
          signatureValid,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event with scan configuration
   * GET /api/v1/workstation/events/:eventId
   * Requires: TELLER or higher
   */
  static async getEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { eventId } = req.params;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      // Get event with scan configuration
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          location: true,
          status: true,
          allowReEntry: true,
          requireCheckOut: true,
          maxReEntries: true,
          scanSettings: true,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Get scan statistics
      const scanStats = await prisma.ticketScan.groupBy({
        by: ['scanType'],
        where: {
          eventId,
        },
        _count: {
          id: true,
        },
      });

      const checkedInCount = await prisma.eventRegistration.count({
        where: {
          eventId,
          isCurrentlyInside: true,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          event: {
            id: event.id,
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            status: event.status,
          },
          scanConfig: {
            allowReEntry: event.allowReEntry,
            requireCheckOut: event.requireCheckOut,
            maxReEntries: event.maxReEntries,
            scanSettings: event.scanSettings,
          },
          statistics: {
            checkedInCount,
            scanCounts: scanStats.reduce(
              (acc, stat) => {
                acc[stat.scanType] = stat._count.id;
                return acc;
              },
              {} as Record<string, number>,
            ),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event attendees with scan status
   * GET /api/v1/workstation/events/:eventId/attendees
   * Requires: TELLER or higher
   */
  static async getEventAttendees(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { eventId } = req.params;
      const { status, facility, search, page = '1', limit = '50' } = req.query;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      const pageNum = parseInt(String(page), 10) || 1;
      const limitNum = parseInt(String(limit), 10) || 50;
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: Prisma.EventRegistrationWhereInput = {
        eventId,
      };

      if (status && typeof status === 'string') {
        where.ticketStatus = status as TicketStatus;
      }

      if (facility && typeof facility === 'string') {
        where.lastScanFacility = facility;
      }

      if (search) {
        const searchTerm = String(search);
        where.OR = [
          { attendee: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
          { attendee: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
          { attendee: { email: { contains: searchTerm, mode: 'insensitive' } } },
          { attendee: { phoneNumber: { contains: searchTerm, mode: 'insensitive' } } },
          { backupCode: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      // Get attendees
      const [attendees, total] = await Promise.all([
        prisma.eventRegistration.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            attendee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: {
            checkedInAt: 'desc',
          },
        }),
        prisma.eventRegistration.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          attendees: attendees.map((reg) => ({
            registrationId: reg.id,
            eventId: reg.eventId,
            attendee: {
              id: reg.attendee.id,
              name: `${reg.attendee.firstName || ''} ${reg.attendee.lastName || ''}`.trim(),
              email: reg.attendee.email,
              phone: reg.attendee.phoneNumber,
            },
            ticketType: reg.ticketType,
            ticketStatus: reg.ticketStatus,
            isCurrentlyInside: reg.isCurrentlyInside,
            checkedInAt: reg.checkedInAt,
            checkedOutAt: reg.checkedOutAt,
            reEntryCount: reg.reEntryCount,
            lastScanFacility: reg.lastScanFacility,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get scan history for event
   * GET /api/v1/workstation/events/:eventId/scans
   * Requires: TELLER or higher
   */
  static async getEventScans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { eventId } = req.params;
      const { facility, scanType, scannedBy, startDate, endDate, page = '1', limit = '50' } = req.query;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      const pageNum = parseInt(String(page), 10) || 1;
      const limitNum = parseInt(String(limit), 10) || 50;
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: Prisma.TicketScanWhereInput = {
        eventId,
      };

      if (facility && typeof facility === 'string') {
        where.facility = facility;
      }

      if (scanType && typeof scanType === 'string') {
        where.scanType = scanType as ScanType;
      }

      if (scannedBy && typeof scannedBy === 'string') {
        where.scannedBy = scannedBy;
      }

      if (startDate || endDate) {
        where.scannedAt = {};
        if (startDate) {
          where.scannedAt.gte = new Date(String(startDate));
        }
        if (endDate) {
          where.scannedAt.lte = new Date(String(endDate));
        }
      }

      // Get scans
      const [scans, total] = await Promise.all([
        prisma.ticketScan.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            registration: {
              include: {
                attendee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            scannedAt: 'desc',
          },
        }),
        prisma.ticketScan.count({ where }),
      ]);

      // Get unique scanner IDs and fetch users
      const scannerIds = [...new Set(scans.map((s) => s.scannedBy))];
      const scanners = await prisma.user.findMany({
        where: {
          id: { in: scannerIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      const scannerMap = new Map(scanners.map((s) => [s.id, s]));

      res.status(200).json({
        success: true,
        data: {
          scans: scans.map((scan) => {
            const scanner = scannerMap.get(scan.scannedBy);
            return {
              id: scan.id,
              registrationId: scan.registrationId,
              eventId: scan.eventId,
              scanType: scan.scanType,
              scannedAt: scan.scannedAt,
              scannedBy: scan.scannedBy,
              scanner: scanner
                ? {
                  id: scanner.id,
                  name: `${scanner.firstName || ''} ${scanner.lastName || ''}`.trim(),
                  email: scanner.email,
                }
                : null,
              attendee: {
                id: scan.registration.attendee.id,
                name: `${scan.registration.attendee.firstName || ''} ${scan.registration.attendee.lastName || ''}`.trim(),
                email: scan.registration.attendee.email,
              },
              facility: scan.facility,
              deviceId: scan.deviceId,
              deviceType: scan.deviceType,
              isValid: scan.isValid,
              isReEntry: scan.isReEntry,
            };
          }),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event scan configuration
   * GET /api/v1/workstation/events/:eventId/config
   * Requires: TELLER or higher
   */
  static async getEventConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { eventId } = req.params;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      const config = await WorkstationService.getEventScanConfig(eventId);

      if (!config) {
        throw new NotFoundError('Event not found');
      }

      // Get event for additional info
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          allowReEntry: true,
          requireCheckOut: true,
          maxReEntries: true,
          scanSettings: true,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      res.status(200).json({
        success: true,
        data: {
          eventId: event.id,
          eventTitle: event.title,
          allowReEntry: config.allowReEntry,
          requireCheckOut: config.requireCheckOut,
          maxReEntries: config.maxReEntries,
          scanSettings: event.scanSettings,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event scan configuration
   * PUT /api/v1/workstation/events/:eventId/config
   * Requires: ADMIN_STAFF or higher
   */
  static async updateEventConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { eventId } = req.params;
      const { allowReEntry, requireCheckOut, maxReEntries, scanSettings } = req.body;

      if (!eventId) {
        throw new ValidationError('Event ID is required');
      }

      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Build update data
      const updateData: Prisma.EventUpdateInput = {};

      if (typeof allowReEntry === 'boolean') {
        updateData.allowReEntry = allowReEntry;
      }

      if (typeof requireCheckOut === 'boolean') {
        updateData.requireCheckOut = requireCheckOut;
      }

      if (maxReEntries !== undefined) {
        if (maxReEntries === null || (typeof maxReEntries === 'number' && maxReEntries >= 0)) {
          updateData.maxReEntries = maxReEntries;
        } else {
          throw new ValidationError('maxReEntries must be a non-negative number or null');
        }
      }

      if (scanSettings !== undefined) {
        updateData.scanSettings = scanSettings;
      }

      // Update event
      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: updateData,
        select: {
          id: true,
          title: true,
          allowReEntry: true,
          requireCheckOut: true,
          maxReEntries: true,
          scanSettings: true,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          eventId: updatedEvent.id,
          eventTitle: updatedEvent.title,
          allowReEntry: updatedEvent.allowReEntry,
          requireCheckOut: updatedEvent.requireCheckOut,
          maxReEntries: updatedEvent.maxReEntries,
          scanSettings: updatedEvent.scanSettings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

