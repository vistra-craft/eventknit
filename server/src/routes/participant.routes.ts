import { Router } from 'express';
import { ParticipantController } from '../controllers/participant.controller.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireMinRole(UserRole.ORGANIZER));

/**
 * @route   GET /api/v1/events/:eventId/participants
 * @desc    List participants for an event
 */
router.get('/', ParticipantController.list);

/**
 * @route   GET /api/v1/events/:eventId/participants/:participantId
 * @desc    Get a single participant
 */
router.get('/:participantId', ParticipantController.getById);

/**
 * @route   POST /api/v1/events/:eventId/participants
 * @desc    Manually add a participant
 */
router.post('/', ParticipantController.create);

/**
 * @route   PATCH /api/v1/events/:eventId/participants/:participantId
 * @desc    Update participant profile data
 */
router.patch('/:participantId', ParticipantController.update);

/**
 * @route   PATCH /api/v1/events/:eventId/participants/:participantId/review
 * @desc    Change participant status (approve/reject/waitlist)
 */
router.patch('/:participantId/review', ParticipantController.review);

/**
 * @route   DELETE /api/v1/events/:eventId/participants/:participantId
 * @desc    Remove a participant
 */
router.delete('/:participantId', ParticipantController.delete);

export default router;
