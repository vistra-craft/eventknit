/**
 * Seat Transfer Helper Service
 * 
 * Handles the transfer of seat allocations during ticket transfers and resales
 * Ensures seats properly transition between attendees while maintaining data integrity
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

type PrismaTransactionClient = Prisma.TransactionClient;

interface TransferSeatParams {
  fromRegistrationId: string;
  toRegistrationId: string;
  toUserEmail: string;
  toUserPhone?: string;
  toUserName: string;
  eventId: string;
}

interface ResaleSeatParams {
  fromRegistrationId: string;
  toRegistrationId: string;
  toUserEmail: string;
  toUserPhone?: string;
  toUserName: string;
  eventId: string;
  seatingType: 'CUSTOMER_SELECTS' | 'ORGANIZER_ASSIGNS' | 'HYBRID';
}

export class SeatTransferHelperService {
  /**
   * Transfer seats from one registration to another
   * Used when transferring tickets between users
   */
  static async transferSeats(
    txOrClient: PrismaTransactionClient,
    params: TransferSeatParams,
  ): Promise<{ transferred: number; errors: string[] }> {
    try {
      logger.info(
        `[SeatTransfer] Starting seat transfer from registration ${params.fromRegistrationId} to ${params.toRegistrationId}`,
      );

      // Find seats allocated to old registration
      const seats = await txOrClient.seatReservation.findMany({
        where: {
          registrationId: params.fromRegistrationId,
        },
      });

      if (seats.length === 0) {
        logger.info(
          `[SeatTransfer] No seats found for registration ${params.fromRegistrationId}`,
        );
        return { transferred: 0, errors: [] };
      }

      logger.info(`[SeatTransfer] Found ${seats.length} seats to transfer`);

      const errors: string[] = [];
      let transferred = 0;

      // Transfer each seat to new registration
      for (const seat of seats) {
        try {
          // Verify seat is still in valid state for transfer
          if (seat.status !== 'CONFIRMED' && seat.status !== 'RESERVED') {
            errors.push(
              `Seat ${seat.seatId} cannot be transferred - status is ${seat.status}`,
            );
            continue;
          }

          // Update seat allocation to new registration
          await txOrClient.seatReservation.update({
            where: { id: seat.id },
            data: {
              registrationId: params.toRegistrationId,
              attendeeName: params.toUserName,
              attendeeEmail: params.toUserEmail,
              attendeePhone: params.toUserPhone || null,
              // Keep status as is (CONFIRMED/RESERVED)
              // Updated at timestamp will be updated by DB
            },
          });

          transferred++;
          logger.info(
            `[SeatTransfer] ✓ Seat ${seat.seatId} transferred to new registration`,
          );
        } catch (seatError) {
          const errorMsg = `Failed to transfer seat ${seat.seatId}: ${
            seatError instanceof Error ? seatError.message : String(seatError)
          }`;
          errors.push(errorMsg);
          logger.error(`[SeatTransfer] ${errorMsg}`);
        }
      }

      logger.info(
        `[SeatTransfer] Completed: ${transferred}/${seats.length} seats transferred${
          errors.length > 0 ? `, ${errors.length} errors` : ''
        }`,
      );

      return { transferred, errors };
    } catch (error) {
      logger.error('[SeatTransfer] Error in transferSeats:', error);
      throw new ValidationError(
        `Failed to transfer seats: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Handle seats during ticket resale
   * Behavior varies based on seating model:
   * - CUSTOMER_SELECTS: Release seats so buyer can select new ones
   * - ORGANIZER_ASSIGNS: Transfer seats to new buyer
   * - HYBRID: Check ticket type and apply appropriate behavior
   */
  static async handleResaleSeats(
    txOrClient: PrismaTransactionClient,
    params: ResaleSeatParams,
  ): Promise<{ action: string; transferred: number; released: number; errors: string[] }> {
    try {
      logger.info(
        `[ResaleSeat] Starting seat handling for resale, seating type: ${params.seatingType}`,
      );

      const seats = await txOrClient.seatReservation.findMany({
        where: {
          registrationId: params.fromRegistrationId,
        },
      });

      if (seats.length === 0) {
        logger.info(
          `[ResaleSeat] No seats found for registration ${params.fromRegistrationId}`,
        );
        return { action: 'none', transferred: 0, released: 0, errors: [] };
      }

      logger.info(`[ResaleSeat] Found ${seats.length} seats to handle`);

      const errors: string[] = [];
      let transferred = 0;
      let released = 0;

      if (
        params.seatingType === 'CUSTOMER_SELECTS' ||
        params.seatingType === 'HYBRID' // In HYBRID, customer-select tickets are released
      ) {
        // CUSTOMER_SELECTS: Release seats so buyer can choose new ones
        logger.info('[ResaleSeat] Model is CUSTOMER_SELECTS - releasing seats');

        for (const seat of seats) {
          try {
            // Release the seat - delete the reservation so the buyer can select a new one
            await txOrClient.seatReservation.delete({
              where: { id: seat.id },
            });

            released++;
            logger.info(`[ResaleSeat] ✓ Seat ${seat.seatId} released for buyer selection`);
          } catch (seatError) {
            const errorMsg = `Failed to release seat ${seat.seatId}: ${
              seatError instanceof Error ? seatError.message : String(seatError)
            }`;
            errors.push(errorMsg);
            logger.error(`[ResaleSeat] ${errorMsg}`);
          }
        }

        return { action: 'RELEASED', transferred: 0, released, errors };
      } else if (params.seatingType === 'ORGANIZER_ASSIGNS') {
        // ORGANIZER_ASSIGNS: Transfer seats to new buyer
        logger.info('[ResaleSeat] Model is ORGANIZER_ASSIGNS - transferring seats');

        for (const seat of seats) {
          try {
            if (seat.status !== 'CONFIRMED' && seat.status !== 'RESERVED') {
              errors.push(
                `Seat ${seat.seatId} cannot be transferred - status is ${seat.status}`,
              );
              continue;
            }

            await txOrClient.seatReservation.update({
              where: { id: seat.id },
              data: {
                registrationId: params.toRegistrationId,
                attendeeName: params.toUserName,
                attendeeEmail: params.toUserEmail,
                attendeePhone: params.toUserPhone || null,
              },
            });

            transferred++;
            logger.info(
              `[ResaleSeat] ✓ Seat ${seat.seatId} transferred to resale buyer`,
            );
          } catch (seatError) {
            const errorMsg = `Failed to transfer seat ${seat.seatId}: ${
              seatError instanceof Error ? seatError.message : String(seatError)
            }`;
            errors.push(errorMsg);
            logger.error(`[ResaleSeat] ${errorMsg}`);
          }
        }

        return { action: 'TRANSFERRED', transferred, released: 0, errors };
      }

      return { action: 'unknown', transferred: 0, released: 0, errors };
    } catch (error) {
      logger.error('[ResaleSeat] Error in handleResaleSeats:', error);
      throw new ValidationError(
        `Failed to handle resale seats: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Validate that seats can be transferred
   * Checks for orphaned seats, invalid states, etc.
   */
  static async validateSeatTransferability(registrationId: string): Promise<{
    isValid: boolean;
    seatCount: number;
    issues: string[];
  }> {
    try {
      const seats = await prisma.seatReservation.findMany({
        where: { registrationId },
      });

      const issues: string[] = [];

      for (const seat of seats) {
        // Check for invalid states
        if (!['RESERVED', 'CONFIRMED', 'PENDING'].includes(seat.status)) {
          issues.push(
            `Seat ${seat.seatId} has invalid status: ${seat.status}`,
          );
        }

        // Check for orphaned seats (allocated but missing attendee info)
        if (seat.status === 'CONFIRMED' && !seat.attendeeName) {
          issues.push(
            `Seat ${seat.seatId} is missing attendee information`,
          );
        }
      }

      return {
        isValid: issues.length === 0,
        seatCount: seats.length,
        issues,
      };
    } catch (error) {
      logger.error('[SeatTransfer] Validation error:', error);
      throw new ValidationError(
        `Failed to validate seat transferability: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get seat details for a registration
   * Useful for displaying seat info in UI
   */
  static async getRegistrationSeats(registrationId: string) {
    try {
      return await prisma.seatReservation.findMany({
        where: { registrationId },
        select: {
          id: true,
          seatId: true,
          status: true,
          attendeeName: true,
          attendeeEmail: true,
          seat: {
            select: {
              sectionId: true,
              rowLabel: true,
              seatLabel: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('[SeatTransfer] Error fetching registration seats:', error);
      return [];
    }
  }
}

export default SeatTransferHelperService;
