import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller.js';
import { EventController } from '../controllers/event.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { authenticate, requireMinRole } from '../middleware/auth.middleware.js';
import { invitationValidations } from '../validations/invitation.validations.js';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/invitations/:token
 * @desc    Get invitation by token (public - for registration form)
 * @access  Public
 */
router.get('/:token', InvitationController.getInvitationByToken);

/**
 * @route   POST /api/v1/invitations/:token/register
 * @desc    Register for event via invitation link (public - no auth required)
 * @access  Public
 */
router.post(
  '/:token/register',
  validate(invitationValidations.registerViaInvitation),
  EventController.registerViaInvitation,
);

// Protected routes (require authentication)
router.use(authenticate);

/**
 * @route   POST /api/v1/invitations/events/:eventId
 * @desc    Create a new invitation link for an event
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/events/:eventId',
  requireMinRole(UserRole.ORGANIZER),
  validate(invitationValidations.createInvitation),
  InvitationController.createInvitation,
);

/**
 * @route   GET /api/v1/invitations/events/:eventId
 * @desc    Get all invitations for an event
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/events/:eventId',
  requireMinRole(UserRole.ORGANIZER),
  InvitationController.getEventInvitations,
);

/**
 * @route   PUT /api/v1/invitations/:id
 * @desc    Update an invitation
 * @access  Private (ORGANIZER+)
 */
router.put(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  validate(invitationValidations.updateInvitation),
  InvitationController.updateInvitation,
);

/**
 * @route   POST /api/v1/invitations/:id/revoke
 * @desc    Revoke an invitation (deactivate)
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/:id/revoke',
  requireMinRole(UserRole.ORGANIZER),
  InvitationController.revokeInvitation,
);

/**
 * @route   DELETE /api/v1/invitations/:id
 * @desc    Delete an invitation
 * @access  Private (ORGANIZER+)
 */
router.delete(
  '/:id',
  requireMinRole(UserRole.ORGANIZER),
  InvitationController.deleteInvitation,
);

export default router;

