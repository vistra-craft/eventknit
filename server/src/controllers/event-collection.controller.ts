import { Request, Response } from 'express';
import { EventCollectionService } from '../services/event-collection.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ValidationError } from '../utils/errors.js';

export const eventCollectionController = {
  /**
   * Create a new collection
   */
  createCollection: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { name, description, isPublic, coverImage } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Collection name is required');
    }

    const collection = await EventCollectionService.createCollection(userId, {
      name: name.trim(),
      description,
      isPublic,
      coverImage,
    });

    res.status(201).json({
      success: true,
      data: collection,
      message: 'Collection created successfully',
    });
  }),

  /**
   * Get current user's collections
   */
  getMyCollections: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { page, limit, isPublic } = req.query;

    const result = await EventCollectionService.getUserCollections(userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      data: result.collections,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  /**
   * Get public collections (discover)
   */
  getPublicCollections: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query;

    const result = await EventCollectionService.getPublicCollections({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.collections,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
      },
    });
  }),

  /**
   * Get collection by ID
   */
  getCollectionById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const collection = await EventCollectionService.getCollectionById(id, userId);

    // Check access for private collections
    if (!collection.isPublic && collection.userId !== userId) {
      throw new ValidationError('Collection not found or access denied');
    }

    res.json({
      success: true,
      data: collection,
    });
  }),

  /**
   * Update collection
   */
  updateCollection: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { name, description, isPublic, coverImage } = req.body;

    const collection = await EventCollectionService.updateCollection(id, userId, {
      name,
      description,
      isPublic,
      coverImage,
    });

    res.json({
      success: true,
      data: collection,
      message: 'Collection updated successfully',
    });
  }),

  /**
   * Delete collection
   */
  deleteCollection: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    await EventCollectionService.deleteCollection(id, userId);

    res.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  }),

  /**
   * Add event to collection
   */
  addEventToCollection: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { eventId, notes } = req.body;

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    const item = await EventCollectionService.addEventToCollection(id, eventId, userId, notes);

    res.status(201).json({
      success: true,
      data: item,
      message: 'Event added to collection',
    });
  }),

  /**
   * Remove event from collection
   */
  removeEventFromCollection: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { id, eventId } = req.params;

    await EventCollectionService.removeEventFromCollection(id, eventId, userId);

    res.json({
      success: true,
      message: 'Event removed from collection',
    });
  }),

  /**
   * Toggle follow collection
   */
  toggleFollowCollection: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    const result = await EventCollectionService.toggleFollowCollection(id, userId);

    res.json({
      success: true,
      data: result,
      message: result.isFollowing ? 'Now following collection' : 'Unfollowed collection',
    });
  }),
};
