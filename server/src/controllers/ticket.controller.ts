import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/ticket.service.js';
import { RefundService } from '../services/refund.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Extract a route parameter as a guaranteed string.
 * Express v5 types params as `string | string[]`; at runtime they are always strings.
 */
function routeParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const raw = params[key];
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
}

export class TicketController {
  /**
   * Get ticket by registration ID (authenticated)
   * User can only view their own tickets
   */
  static async getTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const registrationId = routeParam(req.params as Record<string, string | string[]>, 'registrationId');

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: {
          id: true,
          attendeeId: true,
          event: {
            select: {
              organizerId: true,
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Ticket not found');
      }

      const isOwner = registration.attendeeId === req.user.id;
      const isOrganizer = registration.event.organizerId === req.user.id;
      const isAdmin = req.user.role === 'SUPERADMIN' || req.user.role === 'ADMIN';

      if (!isOwner && !isOrganizer && !isAdmin) {
        throw new AuthorizationError('You don\'t have access to this ticket.');
      }

      const ticket = await TicketService.getTicketByRegistrationId(registrationId);

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ticket by registration ID (public - with email verification)
   */
  static async getTicketPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registrationId = routeParam(req.params as Record<string, string | string[]>, 'registrationId');
      const { email, token } = req.query;

      if (!email || typeof email !== 'string') {
        throw new ValidationError('Email is required');
      }

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          attendee: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Ticket not found');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const registrationEmail = registration.attendee.email?.toLowerCase().trim();

      if (registrationEmail !== normalizedEmail) {
        throw new AuthorizationError(
          'The email address doesn\'t match this ticket. Please use the same email you registered with.',
        );
      }

      // Token verification reserved for future email-link flow
      void token;

      const ticket = await TicketService.getTicketByRegistrationId(registrationId);

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download ticket as PDF (public - with email verification)
   */
  static async downloadTicketPDFPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registrationId = routeParam(req.params as Record<string, string | string[]>, 'registrationId');
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        throw new ValidationError('Email is required');
      }

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          attendee: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Ticket not found');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const registrationEmail = registration.attendee.email?.toLowerCase().trim();

      if (registrationEmail !== normalizedEmail) {
        throw new AuthorizationError(
          'The email address doesn\'t match this ticket. Please use the same email you registered with.',
        );
      }

      const pdfBuffer = await TicketService.generateTicketPDF(registrationId);

      const isHTML = pdfBuffer.toString('utf-8').trim().startsWith('<!-- FALLBACK_HTML -->');

      if (isHTML) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="ticket-${registrationId}.html"`);
        res.status(200).send(pdfBuffer);
      } else {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${registrationId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.status(200).send(pdfBuffer);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download ticket as PDF
   */
  static async downloadTicketPDF(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const registrationId = routeParam(req.params as Record<string, string | string[]>, 'registrationId');

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        select: {
          id: true,
          attendeeId: true,
          event: {
            select: {
              organizerId: true,
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Ticket not found');
      }

      const isOwner = registration.attendeeId === req.user.id;
      const isOrganizer = registration.event.organizerId === req.user.id;
      const isAdmin = req.user.role === 'SUPERADMIN' || req.user.role === 'ADMIN';

      if (!isOwner && !isOrganizer && !isAdmin) {
        throw new AuthorizationError('You don\'t have access to download this ticket.');
      }

      const pdfBuffer = await TicketService.generateTicketPDF(registrationId);

      const isHTML = pdfBuffer.toString('utf-8').trim().startsWith('<!-- FALLBACK_HTML -->');

      if (isHTML) {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="ticket-${registrationId}.html"`);
        res.status(200).send(pdfBuffer);
      } else {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${registrationId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.status(200).send(pdfBuffer);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend ticket email
   * Rate limited to prevent abuse
   */
  static async resendTicketEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const registrationId = routeParam(req.params as Record<string, string | string[]>, 'registrationId');

      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
          ticketLineItems: true,
          event: {
            include: {
              organizer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  organizationName: true,
                  email: true,
                },
              },
            },
          },
          attendee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyAffiliation: true,
            },
          },
        },
      });

      if (!registration) {
        throw new NotFoundError('Ticket not found');
      }

      if (registration.attendeeId !== req.user.id) {
        throw new AuthorizationError('You can only resend tickets for your own registrations.');
      }

      if (registration.status !== 'CONFIRMED' && registration.paymentStatus !== 'COMPLETED') {
        throw new ValidationError(
          'Tickets can only be resent after your registration is confirmed and payment is complete.',
        );
      }

      await TicketService.sendTicketEmail({
        id: registration.id,
        ticketType: registration.ticketType,
        quantity: registration.quantity,
        totalAmount: registration.totalAmount,
        createdAt: registration.createdAt,
        backupCode: registration.backupCode,
        registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
        ticketLineItems: registration.ticketLineItems?.map(item => ({
          ticketType: item.ticketType,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        event: registration.event,
        attendee: registration.attendee,
      });

      logger.info(`Ticket email resent for registration: ${registrationId} by user: ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: 'Ticket email has been resent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check refund eligibility for a registration
   */
  static async checkRefundEligibility(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const registrationId = routeParam(req.params as Record<string, string | string[]>, 'registrationId');

      const eligibility = await RefundService.getRefundEligibility(registrationId, req.user.id);

      res.status(200).json({
        success: true,
        data: eligibility,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request a refund for a registration
   */
  static async requestRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const registrationId = routeParam(req.params as Record<string, string | string[]>, 'registrationId');
      const { refundReason } = req.body as { refundReason?: unknown };

      if (!refundReason || typeof refundReason !== 'string' || refundReason.trim().length < 10) {
        throw new ValidationError('Please provide a valid refund reason (at least 10 characters)');
      }

      const ipAddress =
        (typeof req.headers['x-forwarded-for'] === 'string'
          ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
          : req.ip) ?? undefined;
      const userAgent = req.headers['user-agent'];

      const refund = await RefundService.requestRefundAttendee(
        registrationId,
        req.user.id,
        { refundReason: refundReason.trim() },
        ipAddress,
        userAgent,
      );

      logger.info(`Refund requested for registration: ${registrationId} by user: ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Refund request submitted successfully',
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  }
}
