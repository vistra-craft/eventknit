import { Response, NextFunction } from 'express';
import { TicketService } from '../services/ticket.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuthorizationError, NotFoundError } from '../utils/errors.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class TicketController {
  /**
   * Get ticket by registration ID
   * User can only view their own tickets
   */
  static async getTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { registrationId } = req.params;

      // Get registration to verify ownership
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

      // Verify user owns the ticket, is the organizer, or is an admin
      const isOwner = registration.attendeeId === req.user.id;
      const isOrganizer = registration.event.organizerId === req.user.id;
      const isAdmin = req.user.role === 'SUPERADMIN' || req.user.role === 'ADMIN_STAFF';

      if (!isOwner && !isOrganizer && !isAdmin) {
        throw new AuthorizationError('You do not have permission to view this ticket');
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
   * Download ticket as PDF
   * User can only download their own tickets
   */
  static async downloadTicketPDF(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { registrationId } = req.params;

      // Get registration to verify ownership
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

      // Verify user owns the ticket, is the organizer, or is an admin
      const isOwner = registration.attendeeId === req.user.id;
      const isOrganizer = registration.event.organizerId === req.user.id;
      const isAdmin = req.user.role === 'SUPERADMIN' || req.user.role === 'ADMIN_STAFF';

      if (!isOwner && !isOrganizer && !isAdmin) {
        throw new AuthorizationError('You do not have permission to download this ticket');
      }

      const pdfBuffer = await TicketService.generateTicketPDF(registrationId);

      // Check if it's HTML (fallback when puppeteer not available) or PDF
      const isHTML = pdfBuffer.toString('utf-8').trim().startsWith('<!DOCTYPE html>');
      
      if (isHTML) {
        // Return HTML with instructions for frontend to convert to PDF
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="ticket-${registrationId}.html"`);
        res.status(200).send(pdfBuffer);
      } else {
        // Return actual PDF
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
   * User can only resend their own tickets
   * Rate limited to prevent abuse
   */
  static async resendTicketEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { registrationId } = req.params;

      // Get registration to verify ownership and get full data
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: {
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

      // Verify user owns the ticket
      if (registration.attendeeId !== req.user.id) {
        throw new AuthorizationError('You can only resend your own tickets');
      }

      // Check if registration is confirmed (only send tickets for confirmed registrations)
      if (registration.status !== 'CONFIRMED' && registration.paymentStatus !== 'COMPLETED') {
        res.status(400).json({
          success: false,
          message: 'Ticket email can only be resent for confirmed registrations with completed payment',
        });
        return;
      }

      // Resend ticket email
      await TicketService.sendTicketEmail({
        id: registration.id,
        ticketType: registration.ticketType,
        quantity: registration.quantity,
        totalAmount: registration.totalAmount,
        createdAt: registration.createdAt,
        backupCode: registration.backupCode,
        registrationData: registration.registrationData as Record<string, unknown> | null | undefined,
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
}

