/**
 * Seating Configuration Service
 *
 * Handles seating configuration for events:
 * - CUSTOMER_SELECTS
 * - ORGANIZER_ASSIGNS
 * - HYBRID
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import {
  NotFoundError,
  ValidationError,
  AppError,
} from '../utils/errors.js';
import { Prisma, SeatingType } from '@prisma/client';

export interface SeatingConfig {
  eventId: string;
  hasSeatingMap: boolean;
  seatingType: SeatingType;
  seatMapRequired: boolean;
}

export interface TicketTypeSeatingConfig {
  ticketTypeId: string;
  seatingType: SeatingType;
  allowedSections?: string[];
  allowedSeatTypes?: string[];
  reservedSeats?: string[];
}

export class SeatingConfigurationService {
  /**
   * Create or update seating configuration for event
   *
   * @param config - Seating configuration
   * @throws ValidationError - If configuration invalid
   * @throws NotFoundError - If event not found
   */
  static async configureSeating(config: SeatingConfig): Promise<void> {
    try {
      // Validate inputs
      if (!config.eventId) {
        throw new ValidationError(
          'Event ID is required',
          'MISSING_EVENT_ID',
        );
      }

      if (!config.seatingType) {
        throw new ValidationError(
          'Seating type is required',
          'MISSING_SEATING_TYPE',
        );
      }

      // Validate seating type enum
      const validTypes = Object.values(SeatingType);
      if (!validTypes.includes(config.seatingType)) {
        throw new ValidationError(
          `Invalid seating type. Must be one of: ${validTypes.join(', ')}`,
          'INVALID_SEATING_TYPE',
        );
      }

      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: config.eventId },
      });

      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      // Validate: CUSTOMER_SELECTS requires seat map
      if (
        config.hasSeatingMap &&
        config.seatingType === SeatingType.CUSTOMER_SELECTS &&
        config.seatMapRequired
      ) {
        // This will be validated during event publishing
        logger.info('Event requires seat map for customer selection', {
          eventId: config.eventId,
        });
      }

      // Update event with seating configuration
      await prisma.event.update({
        where: { id: config.eventId },
        data: {
          hasSeatingMap: config.hasSeatingMap,
          seatingType: config.hasSeatingMap ? config.seatingType : undefined,
          seatMapRequired: config.seatMapRequired,
        },
      });

      logger.info('Seating configuration updated', {
        eventId: config.eventId,
        config,
      });
    } catch (error) {
      logger.error('Failed to configure seating', {
        eventId: config.eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to configure seating',
        500,
        'CONFIG_FAILED',
      );
    }
  }

  /**
   * Configure seating for specific ticket type (HYBRID model)
   *
   * @param config - Ticket type seating configuration
   */
  static async configureTicketTypeSeating(
    config: TicketTypeSeatingConfig,
  ): Promise<void> {
    try {
      if (!config.ticketTypeId) {
        throw new ValidationError(
          'Ticket type ID is required',
          'MISSING_TICKET_TYPE_ID',
        );
      }

      // Ticket types are stored as JSON in Event.ticketTypes; store seating config in Event
      const event = await prisma.event.findFirst({
        where: {
          ticketTypes: {
            path: ['$[*].id'],
            array_contains: config.ticketTypeId,
          },
        },
        select: { id: true, ticketTypes: true },
      });

      if (!event) {
        throw new NotFoundError('Ticket type not found', 'TICKET_TYPE_NOT_FOUND');
      }

      // Update the matching ticket type entry within the Event.ticketTypes JSON
      const ticketTypes = Array.isArray(event.ticketTypes)
        ? (event.ticketTypes as Array<Record<string, unknown>>)
        : [];
      const updatedTicketTypes = ticketTypes.map((tt) => {
        if (tt['id'] === config.ticketTypeId) {
          return {
            ...tt,
            seatingConfig: {
              seatingType: config.seatingType,
              allowedSections: config.allowedSections,
              allowedSeatTypes: config.allowedSeatTypes,
              reservedSeats: config.reservedSeats,
            },
          };
        }
        return tt;
      });

      await prisma.event.update({
        where: { id: event.id },
        data: { ticketTypes: updatedTicketTypes as unknown as Prisma.InputJsonValue },
      });

      logger.info('Ticket type seating configured', {
        ticketTypeId: config.ticketTypeId,
        config,
      });
    } catch (error) {
      logger.error('Failed to configure ticket type seating', {
        ticketTypeId: config.ticketTypeId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to configure ticket type seating',
        500,
        'TICKET_CONFIG_FAILED',
      );
    }
  }

  /**
   * Validate seating configuration before event publication
   *
   * @param eventId - Event ID
   * @throws ValidationError - If configuration invalid
   */
  static async validateSeatingConfiguration(eventId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { seatMap: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      const errors: string[] = [];

      // Validate CUSTOMER_SELECTS requires seat map
      if (
        event.hasSeatingMap &&
        event.seatingType === SeatingType.CUSTOMER_SELECTS &&
        !event.seatMap
      ) {
        errors.push(
          'Events with customer seat selection require a seat map to be configured',
        );
      }

      // Validate ORGANIZER_ASSIGNS can be published without seat map
      // (seats will be assigned later)

      // Validate seat map if it exists
      if (event.seatMap) {
        const seatCount = await prisma.seat.count({
          where: { seatMapId: event.seatMap.id },
        });

        if (seatCount === 0) {
          errors.push('Seat map configured but contains no seats');
        }

        // Validate capacity matches event capacity
        if (event.capacity && seatCount > event.capacity) {
          errors.push(
            `Seat count (${seatCount}) exceeds event capacity (${event.capacity})`,
          );
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Failed to validate seating configuration', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to validate seating configuration',
        500,
        'VALIDATION_FAILED',
      );
    }
  }

  /**
   * Get seating configuration for event
   *
   * @param eventId - Event ID
   */
  static async getSeatingConfiguration(eventId: string): Promise<SeatingConfig> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          hasSeatingMap: true,
          seatingType: true,
          seatMapRequired: true,
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      return {
        eventId: event.id,
        hasSeatingMap: event.hasSeatingMap || false,
        seatingType: event.seatingType as SeatingType,
        seatMapRequired: event.seatMapRequired || false,
      };
    } catch (error) {
      logger.error('Failed to get seating configuration', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to retrieve seating configuration',
        500,
        'GET_CONFIG_FAILED',
      );
    }
  }

  /**
   * Check if event requires seating configuration
   *
   * @param eventId - Event ID
   */
  static async isSeatingRequired(eventId: string): Promise<boolean> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { hasSeatingMap: true, seatMapRequired: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
      }

      return event.hasSeatingMap === true && event.seatMapRequired === true;
    } catch (error) {
      logger.error('Failed to check seating requirement', {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new AppError(
        'Failed to check seating requirement',
        500,
        'CHECK_FAILED',
      );
    }
  }
}
