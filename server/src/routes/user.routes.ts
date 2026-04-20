import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { UserPreferencesController } from '../controllers/user-preferences.controller.js';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/user/me/notification-preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/me/notification-preferences', NotificationController.getPreferences);

/**
 * @route   PUT /api/v1/user/me/notification-preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/me/notification-preferences', NotificationController.updatePreferences);

/**
 * @route   GET /api/v1/user/me/preferences
 * @desc    Get current user's preferences
 * @access  Private
 */
router.get('/me/preferences', UserPreferencesController.getPreferences);

/**
 * @route   PUT /api/v1/user/me/preferences
 * @desc    Update current user's preferences
 * @access  Private
 */
router.put('/me/preferences', UserPreferencesController.updatePreferences);

/**
 * @route   PATCH /api/v1/user/me/preferences/:key
 * @desc    Update a single preference
 * @access  Private
 */
router.patch('/me/preferences/:key', UserPreferencesController.updatePreference);

/**
 * @route   POST /api/v1/user/me/preferences/reset
 * @desc    Reset preferences to defaults
 * @access  Private
 */
router.post('/me/preferences/reset', UserPreferencesController.resetPreferences);

/**
 * @route   GET /api/v1/user/me/preferences/defaults
 * @desc    Get default preferences for current user's role
 * @access  Private
 */
router.get('/me/preferences/defaults', UserPreferencesController.getDefaults);

/**
 * @route   GET /api/v1/user/dashboard/stats
 * @desc    Get user dashboard statistics
 * @access  Private
 */
router.get('/dashboard/stats', UserController.getDashboardStats);

/**
 * @route   GET /api/v1/user/role-switch/options
 * @desc    Get available role switch options for current user
 * @access  Private
 */
router.get('/role-switch/options', UserController.getRoleSwitchOptions);

/**
 * @route   POST /api/v1/user/role-switch/become-organizer
 * @desc    Switch from ATTENDEE to ORGANIZER role
 * @access  Private (Attendees only)
 */
router.post('/role-switch/become-organizer', UserController.becomeOrganizer);

/**
 * @route   POST /api/v1/user/role-switch/become-attendee
 * @desc    Switch from ORGANIZER to ATTENDEE role
 * @access  Private (Organizers only, no active events)
 */
router.post('/role-switch/become-attendee', UserController.becomeAttendee);

/**
 * @route   POST /api/v1/user/role-switch/request-approval
 * @desc    Request organizer approval (sets status to PENDING_APPROVAL)
 * @access  Private (Organizers only)
 */
router.post('/role-switch/request-approval', UserController.requestOrganizerApproval);

export default router;
