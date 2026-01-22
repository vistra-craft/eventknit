import { Request, Response } from 'express';
import { SavedEventService } from '../services/saved-event.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';

export const savedEventController = {
  /**
   * Get all saved events for the current user
   */
  getSavedEvents: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { page, limit, search, category } = req.query;

    const result = await SavedEventService.getSavedEvents(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      search: search as string,
      category: category as string,
    });

    res.json({
      success: true,
      data: result.events,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      },
    });
  }),

  /**
   * Save an event
   */
  saveEvent: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const eventId = (req.params.eventId as string) as string;
    const { notes } = req.body;

    const savedEvent = await SavedEventService.saveEvent(userId, eventId, notes);

    res.status(201).json({
      success: true,
      data: savedEvent,
      message: 'Event saved successfully',
    });
  }),

  /**
   * Unsave an event
   */
  unsaveEvent: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const eventId = (req.params.eventId as string) as string;

    await SavedEventService.unsaveEvent(userId, eventId);

    res.json({
      success: true,
      message: 'Event removed from saved list',
    });
  }),

  /**
   * Check if an event is saved
   */
  isEventSaved: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const eventId = (req.params.eventId as string) as string;

    const isSaved = await SavedEventService.isEventSaved(userId, eventId);

    res.json({
      success: true,
      data: { isSaved },
    });
  }),

  /**
   * Check multiple events saved status
   */
  checkEventsSavedStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { eventIds } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      throw new ValidationError('eventIds must be a non-empty array');
    }

    if (eventIds.length > 100) {
      throw new ValidationError('Cannot check more than 100 events at once');
    }

    const status = await SavedEventService.getEventsSavedStatus(userId, eventIds);

    res.json({
      success: true,
      data: status,
    });
  }),

  /**
   * Update notes for a saved event
   */
  updateNotes: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const eventId = (req.params.eventId as string) as string;
    const { notes } = req.body;

    if (typeof notes !== 'string') {
      throw new ValidationError('Notes must be a string');
    }

    const savedEvent = await SavedEventService.updateNotes(userId, eventId, notes);

    res.json({
      success: true,
      data: savedEvent,
      message: 'Notes updated successfully',
    });
  }),

  /**
   * Get saved event count
   */
  getSavedCount: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const count = await SavedEventService.getSavedCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  }),
};
