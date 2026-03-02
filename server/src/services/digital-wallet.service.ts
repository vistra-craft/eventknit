import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { TicketService } from './ticket.service.js';
import { Prisma } from '@prisma/client';

export class DigitalWalletService {
  /**
   * Get or create user's digital wallet
   */
  static async getOrCreateWallet(userId: string) {
    try {
      let wallet = await prisma.digitalWallet.findUnique({
        where: { userId },
        include: {
          walletTickets: {
            include: {
              registration: {
                include: {
                  event: {
                    select: {
                      id: true,
                      title: true,
                      startDate: true,
                      endDate: true,
                      location: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!wallet) {
        wallet = await prisma.digitalWallet.create({
          data: {
            userId,
            autoAddTickets: true,
            backupEnabled: true,
          },
          include: {
            walletTickets: {
              include: {
                registration: {
                  include: {
                    event: {
                      select: {
                        id: true,
                        title: true,
                        startDate: true,
                        endDate: true,
                        location: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      }

      return wallet;
    } catch (error: unknown) {
      logger.error('Error getting wallet:', error);
      throw new ValidationError(`Failed to get wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add ticket to wallet
   */
  static async addTicketToWallet(userId: string, registrationId: string) {
    try {
      // Verify registration belongs to user
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: { event: true },
      });

      if (!registration) {
        throw new NotFoundError('Registration not found');
      }

      if (registration.attendeeId !== userId) {
        throw new ValidationError('You can only add your own tickets');
      }

      // Get or create wallet
      const wallet = await this.getOrCreateWallet(userId);

      // Check if already in wallet
      const existing = await prisma.walletTicket.findUnique({
        where: { registrationId },
      });

      if (existing) {
        throw new ValidationError('Ticket is already in your wallet');
      }

      // Generate backup code
      const backupCode = `WLT-${registrationId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const walletTicket = await prisma.walletTicket.create({
        data: {
          walletId: wallet.id,
          registrationId,
          backupCode,
          isActive: true,
        },
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  endDate: true,
                  location: true,
                },
              },
            },
          },
        },
      });

      logger.info(`Ticket added to wallet: ${registrationId}`);
      return walletTicket;
    } catch (error: unknown) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error adding ticket to wallet:', error);
      throw new ValidationError(`Failed to add ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove ticket from wallet
   */
  static async removeTicketFromWallet(userId: string, registrationId: string) {
    try {
      const wallet = await prisma.digitalWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      const walletTicket = await prisma.walletTicket.findUnique({
        where: { registrationId },
        include: { wallet: true },
      });

      if (!walletTicket) {
        throw new NotFoundError('Ticket not found in wallet');
      }

      if (walletTicket.wallet.userId !== userId) {
        throw new ValidationError('You can only remove your own tickets');
      }

      await prisma.walletTicket.delete({
        where: { registrationId },
      });

      logger.info(`Ticket removed from wallet: ${registrationId}`);
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error removing ticket from wallet:', error);
      throw new ValidationError(`Failed to remove ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update wallet preferences
   */
  static async updateWalletPreferences(
    userId: string,
    preferences: {
      autoAddTickets?: boolean;
      backupEnabled?: boolean;
    },
  ) {
    try {
      const wallet = await this.getOrCreateWallet(userId);

      const updated = await prisma.digitalWallet.update({
        where: { id: wallet.id },
        data: {
          autoAddTickets: preferences.autoAddTickets ?? wallet.autoAddTickets,
          backupEnabled: preferences.backupEnabled ?? wallet.backupEnabled,
          lastSyncedAt: new Date(),
        },
      });

      return updated;
    } catch (error: unknown) {
      logger.error('Error updating wallet preferences:', error);
      throw new ValidationError(`Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Apple Wallet pass
   */
  static async generateAppleWalletPass(userId: string, registrationId: string) {
    try {
      const walletTicket = await prisma.walletTicket.findUnique({
        where: { registrationId },
        include: {
          wallet: true,
          registration: {
            include: { event: true },
          },
        },
      });

      if (!walletTicket || walletTicket.wallet.userId !== userId) {
        throw new NotFoundError('Ticket not found in wallet');
      }

      // Generate pass data (simplified - in production, use Apple's PassKit)
      const passData = {
        formatVersion: 1,
        passTypeIdentifier: 'pass.com.eventknit.ticket',
        serialNumber: registrationId,
        organizationName: 'EventKnit',
        description: walletTicket.registration.event.title,
        logoText: 'EventKnit',
        foregroundColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
        eventTicket: {
          primaryFields: [
            {
              key: 'event',
              label: 'Event',
              value: walletTicket.registration.event.title,
            },
          ],
          secondaryFields: [
            {
              key: 'attendee',
              label: 'Attendee',
              value: `${(walletTicket.registration as Record<string, unknown>).attendee ? `${((walletTicket.registration as Record<string, unknown>).attendee as Record<string, unknown>).firstName || ''} ${((walletTicket.registration as Record<string, unknown>).attendee as Record<string, unknown>).lastName || ''}` : ''}`.trim(),
            },
            {
              key: 'date',
              label: 'Date',
              value: new Date(walletTicket.registration.event.startDate).toLocaleDateString(),
            },
          ],
          auxiliaryFields: [
            {
              key: 'ticketType',
              label: 'Ticket',
              value: walletTicket.registration.ticketType || 'General Admission',
            },
            {
              key: 'location',
              label: 'Location',
              value: walletTicket.registration.event.location,
            },
          ],
        },
        barcode: {
          message: TicketService.generateTicketData(
            registrationId,
            walletTicket.registration.eventId,
            ((walletTicket.registration as Record<string, unknown>).attendee as Record<string, unknown>)?.email as string || '',
          ),
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
        },
      };

      // Update wallet ticket with pass data
      await prisma.walletTicket.update({
        where: { registrationId },
        data: {
          passData: passData as Prisma.JsonValue,
          lastAccessedAt: new Date(),
        },
      });

      return { passData, downloadUrl: `/api/v1/user/wallet/${registrationId}/apple-pass` };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error generating Apple Wallet pass:', error);
      throw new ValidationError(`Failed to generate pass: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Google Pay pass
   */
  static async generateGooglePayPass(userId: string, registrationId: string) {
    try {
      const walletTicket = await prisma.walletTicket.findUnique({
        where: { registrationId },
        include: {
          wallet: true,
          registration: {
            include: { event: true },
          },
        },
      });

      if (!walletTicket || walletTicket.wallet.userId !== userId) {
        throw new NotFoundError('Ticket not found in wallet');
      }

      // Generate Google Pay pass data (simplified)
      const passData = {
        issuerId: 'eventknit',
        objectSuffix: registrationId,
        classId: 'eventknit.ticket',
        eventTicketObject: {
          eventName: {
            defaultValue: {
              language: 'en',
              value: walletTicket.registration.event.title,
            },
          },
          validTimeInterval: {
            start: {
              date: walletTicket.registration.event.startDate,
            },
            end: {
              date: walletTicket.registration.event.endDate || walletTicket.registration.event.startDate,
            },
          },
          locations: walletTicket.registration.event.location
            ? [
              {
                kind: 'walletobjects#latLongPoint',
                latitude: 0, // Would need actual coordinates
                longitude: 0,
              },
            ]
            : [],
          barcode: {
            type: 'QR_CODE',
            value: walletTicket.backupCode || registrationId,
          },
        },
      };

      await prisma.walletTicket.update({
        where: { registrationId },
        data: {
          passData: passData as Prisma.JsonValue,
          lastAccessedAt: new Date(),
        },
      });

      return { passData, saveUrl: `/api/v1/user/wallet/${registrationId}/google-pass` };
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error generating Google Pay pass:', error);
      throw new ValidationError(`Failed to generate pass: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
