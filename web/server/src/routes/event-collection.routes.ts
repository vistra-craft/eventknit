import { Router } from 'express';
import { eventCollectionController } from '../controllers/event-collection.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/public', eventCollectionController.getPublicCollections);

// Routes that benefit from optional auth (for personalization like isFollowing)
router.get('/:id', optionalAuth, eventCollectionController.getCollectionById);

// Authenticated routes
router.use(authenticate);

// Collection CRUD
router.post('/', eventCollectionController.createCollection);
router.get('/', eventCollectionController.getMyCollections);
router.put('/:id', eventCollectionController.updateCollection);
router.delete('/:id', eventCollectionController.deleteCollection);

// Collection events
router.post('/:id/events', eventCollectionController.addEventToCollection);
router.delete('/:id/events/:eventId', eventCollectionController.removeEventFromCollection);

// Follow/unfollow
router.post('/:id/follow', eventCollectionController.toggleFollowCollection);

export default router;
