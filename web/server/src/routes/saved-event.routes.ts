import { Router } from 'express';
import { savedEventController } from '../controllers/saved-event.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all saved events
router.get('/', savedEventController.getSavedEvents);

// Get saved event count
router.get('/count', savedEventController.getSavedCount);

// Check multiple events saved status
router.post('/check-status', savedEventController.checkEventsSavedStatus);

// Save an event
router.post('/:eventId', savedEventController.saveEvent);

// Check if an event is saved
router.get('/:eventId/status', savedEventController.isEventSaved);

// Update notes for a saved event
router.patch('/:eventId/notes', savedEventController.updateNotes);

// Unsave an event
router.delete('/:eventId', savedEventController.unsaveEvent);

export default router;
