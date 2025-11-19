import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { EventStaffController } from "../controllers/event-staff.controller.js";
import { StaffPerformanceController } from "../controllers/staff-performance.controller.js";
import { AdminNotificationSettingsController } from "../controllers/admin-notification-settings.controller.js";
import { SystemSettingsController } from "../controllers/system-settings.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireMinRole } from "../middleware/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// All admin routes require ADMIN_STAFF or higher (SUPERADMIN, ADMIN_STAFF)
router.use(requireMinRole(UserRole.ADMIN_STAFF));

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create a new user (admin function)
 * @access  Private (ADMIN_STAFF+)
 */
router.post("/users", AdminController.createUser);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filters
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/users", AdminController.getUsers);

/**
 * @route   GET /api/v1/admin/users/attendees
 * @desc    Get attendees with event filtering and registration history
 * @access  Private (ADMIN_STAFF+)
 * @note    Must be defined before /users/:id to avoid route conflict
 */
router.get("/users/attendees", AdminController.getAttendees);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/users/:id", AdminController.getUserById);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user
 * @access  Private (ADMIN_STAFF+)
 */
router.put("/users/:id", AdminController.updateUser);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (ADMIN_STAFF+)
 */
router.delete("/users/:id", AdminController.deleteUser);

/**
 * @route   POST /api/v1/admin/seed-test-users
 * @desc    Seed test users (temporary endpoint for production setup)
 * @access  Private (ADMIN_STAFF+)
 */
router.post("/seed-test-users", AdminController.seedTestUsers);

/**
 * @route   POST /api/v1/admin/users/:id/password
 * @desc    Force password reset
 * @access  Private (ADMIN_STAFF+)
 */
router.post("/users/:id/password", AdminController.forcePasswordReset);

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get admin dashboard stats
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/dashboard/stats", AdminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/dashboard/events
 * @desc    Get recent events for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/dashboard/events", AdminController.getRecentEvents);

/**
 * @route   GET /api/v1/admin/dashboard/activity
 * @desc    Get recent activity for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/dashboard/activity", AdminController.getRecentActivity);

/**
 * @route   GET /api/v1/admin/dashboard/alerts
 * @desc    Get system alerts for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/dashboard/alerts", AdminController.getSystemAlerts);

/**
 * @route   POST /api/v1/admin/users/:id/suspend
 * @desc    Suspend user (punitive action)
 * @access  Private (ADMIN_STAFF+)
 */
router.post("/users/:id/suspend", AdminController.suspendUser);

/**
 * @route   POST /api/v1/admin/users/:id/deactivate
 * @desc    Deactivate user (non-punitive action)
 * @access  Private (ADMIN_STAFF+)
 */
router.post("/users/:id/deactivate", AdminController.deactivateUser);

/**
 * @route   POST /api/v1/admin/users/:id/activate
 * @desc    Activate user (reactivate suspended/deactivated user)
 * @access  Private (ADMIN_STAFF+)
 */
router.post("/users/:id/activate", AdminController.activateUser);

/**
 * @route   POST /api/v1/admin/events/:id/recall
 * @desc    Recall event (pull down approved event)
 * @access  Private (ADMIN_STAFF+)
 */
router.post("/events/:id/recall", AdminController.recallEvent);

/**
 * @route   GET /api/v1/admin/roles
 * @desc    Get all roles with permissions information
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/roles", AdminController.getRoles);

/**
 * @route   POST /api/v1/admin/events/:eventId/staff
 * @desc    Assign admin staff to event
 * @access  Private (ADMIN_STAFF+)
 */
router.post("/events/:eventId/staff", EventStaffController.assignStaffToEvent);

/**
 * @route   GET /api/v1/admin/events/:eventId/staff
 * @desc    Get staff assigned to event
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/events/:eventId/staff", EventStaffController.getEventStaff);

/**
 * @route   GET /api/v1/admin/staff/:staffId/events
 * @desc    Get events assigned to staff member
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/staff/:staffId/events", EventStaffController.getStaffEvents);

/**
 * @route   PUT /api/v1/admin/events/:eventId/staff/:staffId
 * @desc    Update staff assignment
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  "/events/:eventId/staff/:staffId",
  EventStaffController.updateStaffAssignment,
);

/**
 * @route   DELETE /api/v1/admin/events/:eventId/staff/:staffId
 * @desc    Remove staff from event
 * @access  Private (ADMIN_STAFF+)
 */
router.delete(
  "/events/:eventId/staff/:staffId",
  EventStaffController.removeStaffFromEvent,
);

/**
 * @route   POST /api/v1/admin/events/:eventId/staff/bulk
 * @desc    Bulk assign staff to event
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  "/events/:eventId/staff/bulk",
  EventStaffController.bulkAssignStaff,
);

/**
 * @route   GET /api/v1/admin/staff-performance/:staffId
 * @desc    Get performance metrics for a specific staff member
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/staff-performance/:staffId",
  StaffPerformanceController.getStaffPerformance,
);

/**
 * @route   GET /api/v1/admin/staff-performance/team
 * @desc    Get team performance metrics
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/staff-performance/team",
  StaffPerformanceController.getTeamPerformance,
);

/**
 * @route   GET /api/v1/admin/staff-performance/team/summary
 * @desc    Get team performance summary
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/staff-performance/team/summary",
  StaffPerformanceController.getTeamSummary,
);

/**
 * @route   GET /api/v1/admin/staff-performance/:staffId/trends
 * @desc    Get performance trends for a staff member
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/staff-performance/:staffId/trends",
  StaffPerformanceController.getPerformanceTrends,
);

/**
 * @route   GET /api/v1/admin/notification-settings/defaults
 * @desc    Get default notification preferences
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/notification-settings/defaults",
  AdminNotificationSettingsController.getDefaultPreferences,
);

/**
 * @route   PUT /api/v1/admin/notification-settings/defaults
 * @desc    Update default notification preferences
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  "/notification-settings/defaults",
  AdminNotificationSettingsController.updateDefaultPreferences,
);

/**
 * @route   GET /api/v1/admin/notification-settings/system
 * @desc    Get system-wide notification configuration
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/notification-settings/system",
  AdminNotificationSettingsController.getSystemConfig,
);

/**
 * @route   PUT /api/v1/admin/notification-settings/system
 * @desc    Update system-wide notification configuration
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  "/notification-settings/system",
  AdminNotificationSettingsController.updateSystemConfig,
);

/**
 * @route   GET /api/v1/admin/notification-settings/templates
 * @desc    Get all notification templates
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/notification-settings/templates",
  AdminNotificationSettingsController.getTemplates,
);

/**
 * @route   GET /api/v1/admin/notification-settings/templates/:type
 * @desc    Get a specific notification template
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/notification-settings/templates/:type",
  AdminNotificationSettingsController.getTemplate,
);

/**
 * @route   PUT /api/v1/admin/notification-settings/templates/:type
 * @desc    Create or update a notification template
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  "/notification-settings/templates/:type",
  AdminNotificationSettingsController.saveTemplate,
);

/**
 * @route   DELETE /api/v1/admin/notification-settings/templates/:type
 * @desc    Delete a notification template
 * @access  Private (ADMIN_STAFF+)
 */
router.delete(
  "/notification-settings/templates/:type",
  AdminNotificationSettingsController.deleteTemplate,
);

/**
 * @route   GET /api/v1/admin/notification-settings/analytics
 * @desc    Get notification analytics summary
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/notification-settings/analytics",
  AdminNotificationSettingsController.getAnalytics,
);

/**
 * @route   GET /api/v1/admin/settings
 * @desc    Get all system settings (with optional category filter)
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/settings", SystemSettingsController.getSettings);

/**
 * @route   GET /api/v1/admin/settings/:key
 * @desc    Get a single system setting by key
 * @access  Private (ADMIN_STAFF+)
 */
router.get("/settings/:key", SystemSettingsController.getSetting);

/**
 * @route   PUT /api/v1/admin/settings/:key
 * @desc    Create or update a system setting
 * @access  Private (ADMIN_STAFF+)
 */
router.put("/settings/:key", SystemSettingsController.setSetting);

/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Bulk update system settings
 * @access  Private (ADMIN_STAFF+)
 */
router.put("/settings", SystemSettingsController.setSettings);

/**
 * @route   DELETE /api/v1/admin/settings/:key
 * @desc    Delete a system setting
 * @access  Private (ADMIN_STAFF+)
 */
router.delete("/settings/:key", SystemSettingsController.deleteSetting);

/**
 * @route   GET /api/v1/admin/settings/:key/history
 * @desc    Get setting change history
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  "/settings/:key/history",
  SystemSettingsController.getSettingsHistory,
);

export default router;
