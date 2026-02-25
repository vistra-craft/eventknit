import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { EventStaffController } from '../controllers/event-staff.controller.js';
import { StaffPerformanceController } from '../controllers/staff-performance.controller.js';
import { AdminNotificationSettingsController } from '../controllers/admin-notification-settings.controller.js';
import { SystemSettingsController } from '../controllers/system-settings.controller.js';
import { AdminFinancialController } from '../controllers/admin-financial.controller.js';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { ExtendedProfileController } from '../controllers/extended-profile.controller.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  createIncomeSchema,
  updateIncomeSchema,
  getMonthlySummarySchema,
  getFinancialOverviewSchema,
} from '../validations/admin-financial.validations.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
} from '../validations/invoice.validations.js';
import { TaxController } from '../controllers/tax.controller.js';
import { WebhookController } from '../controllers/webhook.controller.js';
import { ApiKeyController } from '../controllers/api-key.controller.js';
import {
  calculateTaxSchema,
  upsertTaxRateSchema,
} from '../validations/tax.validations.js';
import {
  createEndpointSchema,
  updateEndpointSchema,
} from '../validations/webhook.validations.js';
import {
  createApiKeySchema,
  updateApiKeySchema,
} from '../validations/api-key.validations.js';
import { PaymentPlanController } from '../controllers/payment-plan.controller.js';
import { createPaymentPlanSchema } from '../validations/payment-plan.validations.js';
import { WhiteLabelController } from '../controllers/white-label.controller.js';
import {
  createBrandingSchema,
  createCustomDomainSchema,
  updateBrandingStatusSchema,
  verifyCustomDomainSchema,
} from '../validations/white-label.validations.js';
import { extendedProfileValidations } from '../validations/extended-profile.validations.js';
import { AdminSecurityController } from '../controllers/admin-security.controller.js';
import { AdminPlatformAnalyticsController } from '../controllers/admin-platform-analytics.controller.js';
import { AdminKYCController } from '../controllers/admin-kyc.controller.js';
import { adminKYCValidations } from '../validations/admin-kyc.validations.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireMinRole } from '../middleware/auth.middleware.js';
import { adminSecurityCheck } from '../middleware/admin-security.middleware.js';
import { UserRole } from '@prisma/client';
import Joi from 'joi';

const router = Router();

// Admin security middleware - check domain/IP whitelisting FIRST
router.use(adminSecurityCheck);

// All admin routes require authentication
router.use(authenticate);

// All admin routes require ADMIN_STAFF or higher (SUPERADMIN, ADMIN_STAFF)
router.use(requireMinRole(UserRole.ADMIN_STAFF));

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create a new user (admin function)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/users', AdminController.createUser);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filters
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/users', AdminController.getUsers);

/**
 * @route   GET /api/v1/admin/users/stats
 * @desc    Get user statistics (staff, organizers, attendees, active users)
 * @access  Private (ADMIN_STAFF+)
 * @note    Must be defined before /users/:id to avoid route conflict
 */
router.get('/users/stats', AdminController.getUsersStats);

/**
 * @route   GET /api/v1/admin/users/attendees
 * @desc    Get attendees with event filtering and registration history
 * @access  Private (ADMIN_STAFF+)
 * @note    Must be defined before /users/:id to avoid route conflict
 */
router.get('/users/attendees', AdminController.getAttendees);

/**
 * @route   GET /api/v1/admin/users/:id/organizer-details
 * @desc    Get enriched organizer details for admin slide-over panel
 * @access  Private (ADMIN_STAFF+)
 * @note    Must be defined before /users/:id to avoid route conflict
 */
router.get('/users/:id/organizer-details', AdminController.getOrganizerDetails);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/users/:id', AdminController.getUserById);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user
 * @access  Private (ADMIN_STAFF+)
 */
router.put('/users/:id', AdminController.updateUser);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/users/:id', AdminController.deleteUser);

/**
 * @route   POST /api/v1/admin/seed-test-users
 * @desc    Seed test users (development only)
 * @access  Private (ADMIN_STAFF+)
 */
if (process.env.NODE_ENV !== 'production') {
  router.post('/seed-test-users', AdminController.seedTestUsers);
}

/**
 * @route   POST /api/v1/admin/users/:id/password
 * @desc    Force password reset
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/users/:id/password', AdminController.forcePasswordReset);

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get admin dashboard stats
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/stats', AdminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/dashboard/growth
 * @desc    Get admin dashboard growth series for charts
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/growth', AdminController.getDashboardGrowth);

/**
 * @route   GET /api/v1/admin/dashboard/events
 * @desc    Get recent events for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/events', AdminController.getRecentEvents);

/**
 * @route   GET /api/v1/admin/dashboard/activity
 * @desc    Get recent activity for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/activity', AdminController.getRecentActivity);

/**
 * @route   GET /api/v1/admin/dashboard/alerts
 * @desc    Get system alerts for admin dashboard
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/dashboard/alerts', AdminController.getSystemAlerts);

/**
 * @route   POST /api/v1/admin/users/:id/suspend
 * @desc    Suspend user (punitive action)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/users/:id/suspend', AdminController.suspendUser);

/**
 * @route   POST /api/v1/admin/users/:id/deactivate
 * @desc    Deactivate user (non-punitive action)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/users/:id/deactivate', AdminController.deactivateUser);

/**
 * @route   POST /api/v1/admin/users/:id/activate
 * @desc    Activate user (reactivate suspended/deactivated user)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/users/:id/activate', AdminController.activateUser);

/**
 * @route   POST /api/v1/admin/users/:id/approve
 * @desc    Approve a pending organizer (PENDING_APPROVAL → ACTIVE)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/users/:id/approve', AdminController.approveOrganizer);

/**
 * @route   POST /api/v1/admin/events/:id/recall
 * @desc    Recall event (pull down approved event)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/events/:id/recall', AdminController.recallEvent);

/**
 * @route   GET /api/v1/admin/roles
 * @desc    Get all roles with permissions information
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/roles', AdminController.getRoles);

/**
 * @route   POST /api/v1/admin/events/:eventId/staff
 * @desc    Assign admin staff to event
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/events/:eventId/staff', EventStaffController.assignStaffToEvent);

/**
 * @route   GET /api/v1/admin/events/:eventId/staff
 * @desc    Get staff assigned to event
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/events/:eventId/staff', EventStaffController.getEventStaff);

/**
 * @route   GET /api/v1/admin/staff/:staffId/events
 * @desc    Get events assigned to staff member
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/staff/:staffId/events', EventStaffController.getStaffEvents);

/**
 * @route   PUT /api/v1/admin/events/:eventId/staff/:staffId
 * @desc    Update staff assignment
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/events/:eventId/staff/:staffId',
  EventStaffController.updateStaffAssignment,
);

/**
 * @route   DELETE /api/v1/admin/events/:eventId/staff/:staffId
 * @desc    Remove staff from event
 * @access  Private (ADMIN_STAFF+)
 */
router.delete(
  '/events/:eventId/staff/:staffId',
  EventStaffController.removeStaffFromEvent,
);

/**
 * @route   POST /api/v1/admin/events/:eventId/staff/bulk
 * @desc    Bulk assign staff to event
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/events/:eventId/staff/bulk',
  EventStaffController.bulkAssignStaff,
);

/**
 * @route   GET /api/v1/admin/staff-performance/team
 * @desc    Get team performance metrics
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/staff-performance/team',
  StaffPerformanceController.getTeamPerformance,
);

/**
 * @route   GET /api/v1/admin/staff-performance/:staffId
 * @desc    Get performance metrics for a specific staff member
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/staff-performance/:staffId',
  StaffPerformanceController.getStaffPerformance,
);

/**
 * @route   GET /api/v1/admin/staff-performance/team/summary
 * @desc    Get team performance summary
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/staff-performance/team/summary',
  StaffPerformanceController.getTeamSummary,
);

/**
 * @route   GET /api/v1/admin/staff-performance/:staffId/trends
 * @desc    Get performance trends for a staff member
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/staff-performance/:staffId/trends',
  StaffPerformanceController.getPerformanceTrends,
);

/**
 * @route   GET /api/v1/admin/notification-settings/defaults
 * @desc    Get default notification preferences
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/notification-settings/defaults',
  AdminNotificationSettingsController.getDefaultPreferences,
);

/**
 * @route   PUT /api/v1/admin/notification-settings/defaults
 * @desc    Update default notification preferences
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/notification-settings/defaults',
  AdminNotificationSettingsController.updateDefaultPreferences,
);

/**
 * @route   GET /api/v1/admin/notification-settings/system
 * @desc    Get system-wide notification configuration
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/notification-settings/system',
  AdminNotificationSettingsController.getSystemConfig,
);

/**
 * @route   PUT /api/v1/admin/notification-settings/system
 * @desc    Update system-wide notification configuration
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/notification-settings/system',
  AdminNotificationSettingsController.updateSystemConfig,
);

/**
 * @route   GET /api/v1/admin/notification-settings/templates
 * @desc    Get all notification templates
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/notification-settings/templates',
  AdminNotificationSettingsController.getTemplates,
);

/**
 * @route   GET /api/v1/admin/notification-settings/templates/:type
 * @desc    Get a specific notification template
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/notification-settings/templates/:type',
  AdminNotificationSettingsController.getTemplate,
);

/**
 * @route   PUT /api/v1/admin/notification-settings/templates/:type
 * @desc    Create or update a notification template
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/notification-settings/templates/:type',
  AdminNotificationSettingsController.saveTemplate,
);

/**
 * @route   DELETE /api/v1/admin/notification-settings/templates/:type
 * @desc    Delete a notification template
 * @access  Private (ADMIN_STAFF+)
 */
router.delete(
  '/notification-settings/templates/:type',
  AdminNotificationSettingsController.deleteTemplate,
);

/**
 * @route   GET /api/v1/admin/notification-settings/analytics
 * @desc    Get notification analytics summary
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/notification-settings/analytics',
  AdminNotificationSettingsController.getAnalytics,
);

/**
 * @route   GET /api/v1/admin/settings
 * @desc    Get all system settings (with optional category filter)
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/settings', SystemSettingsController.getSettings);

/**
 * @route   GET /api/v1/admin/settings/:key
 * @desc    Get a single system setting by key
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/settings/:key', SystemSettingsController.getSetting);

/**
 * @route   PUT /api/v1/admin/settings/:key
 * @desc    Create or update a system setting
 * @access  Private (ADMIN_STAFF+)
 */
router.put('/settings/:key', SystemSettingsController.setSetting);

/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Bulk update system settings
 * @access  Private (ADMIN_STAFF+)
 */
router.put('/settings', SystemSettingsController.setSettings);

/**
 * @route   DELETE /api/v1/admin/settings/:key
 * @desc    Delete a system setting
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/settings/:key', SystemSettingsController.deleteSetting);

/**
 * @route   GET /api/v1/admin/settings/:key/history
 * @desc    Get setting change history
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/settings/:key/history',
  SystemSettingsController.getSettingsHistory,
);

// ========== Admin Financial Management Routes ==========

/**
 * @route   POST /api/v1/admin/financial/expenses
 * @desc    Create a platform expense
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/financial/expenses',
  validate(createExpenseSchema),
  AdminFinancialController.createExpense,
);

/**
 * @route   GET /api/v1/admin/financial/expenses
 * @desc    Get all platform expenses with filters
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/financial/expenses', AdminFinancialController.getExpenses);

/**
 * @route   GET /api/v1/admin/financial/expenses/:id
 * @desc    Get expense by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/financial/expenses/:id', AdminFinancialController.getExpenseById);

/**
 * @route   PUT /api/v1/admin/financial/expenses/:id
 * @desc    Update expense
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/financial/expenses/:id',
  validate(updateExpenseSchema),
  AdminFinancialController.updateExpense,
);

/**
 * @route   DELETE /api/v1/admin/financial/expenses/:id
 * @desc    Delete expense
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/financial/expenses/:id', AdminFinancialController.deleteExpense);

/**
 * @route   POST /api/v1/admin/financial/incomes
 * @desc    Create a platform income
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/financial/incomes',
  validate(createIncomeSchema),
  AdminFinancialController.createIncome,
);

/**
 * @route   GET /api/v1/admin/financial/incomes
 * @desc    Get all platform incomes with filters
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/financial/incomes', AdminFinancialController.getIncomes);

/**
 * @route   GET /api/v1/admin/financial/incomes/:id
 * @desc    Get income by ID
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/financial/incomes/:id', AdminFinancialController.getIncomeById);

/**
 * @route   PUT /api/v1/admin/financial/incomes/:id
 * @desc    Update income
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/financial/incomes/:id',
  validate(updateIncomeSchema),
  AdminFinancialController.updateIncome,
);

/**
 * @route   DELETE /api/v1/admin/financial/incomes/:id
 * @desc    Delete income
 * @access  Private (ADMIN_STAFF+)
 */
router.delete('/financial/incomes/:id', AdminFinancialController.deleteIncome);

/**
 * @route   GET /api/v1/admin/financial/monthly-summary
 * @desc    Get monthly financial summary
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/financial/monthly-summary',
  validateQuery(getMonthlySummarySchema),
  AdminFinancialController.getMonthlySummary,
);

/**
 * @route   GET /api/v1/admin/financial/overview
 * @desc    Get financial overview
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/financial/overview',
  validateQuery(getFinancialOverviewSchema),
  AdminFinancialController.getFinancialOverview,
);

// ========== Invoice Templates ==========
router.post(
  '/invoices/templates',
  validate(createTemplateSchema),
  InvoiceController.createTemplate,
);
router.get(
  '/invoices/templates',
  validateQuery(Joi.object({
    type: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    includeInactive: Joi.boolean().optional(),
  })),
  InvoiceController.getTemplates,
);
router.get(
  '/invoices/templates/default',
  InvoiceController.getDefaultTemplate,
);
router.get(
  '/invoices/templates/:templateId',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  InvoiceController.getTemplateById,
);
router.put(
  '/invoices/templates/:templateId',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  validate(updateTemplateSchema),
  InvoiceController.updateTemplate,
);
router.delete(
  '/invoices/templates/:templateId',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  InvoiceController.deleteTemplate,
);

// ========== Tax Management ==========
router.post(
  '/tax/calculate',
  validate(calculateTaxSchema),
  TaxController.calculateTax,
);
router.get(
  '/tax/rates',
  validateQuery(Joi.object({
    country: Joi.string().optional(),
    state: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
  })),
  TaxController.getTaxRates,
);
router.get(
  '/tax/rate',
  validateQuery(Joi.object({
    country: Joi.string().required(),
    state: Joi.string().optional(),
    city: Joi.string().optional(),
  })),
  TaxController.getTaxRate,
);
router.post(
  '/tax/rates',
  validate(upsertTaxRateSchema),
  TaxController.upsertTaxRate,
);
router.get(
  '/tax/rates/:taxRateId',
  validateParams(Joi.object({ taxRateId: Joi.string().uuid().required() })),
  TaxController.getTaxRateById,
);
router.delete(
  '/tax/rates/:taxRateId',
  validateParams(Joi.object({ taxRateId: Joi.string().uuid().required() })),
  TaxController.deleteTaxRate,
);
router.get(
  '/tax/report',
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    country: Joi.string().optional(),
    eventId: Joi.string().uuid().optional(),
  })),
  TaxController.getTaxReport,
);

// ========== Webhook Management ==========
router.post(
  '/webhooks/endpoints',
  validate(createEndpointSchema),
  WebhookController.createEndpoint,
);
router.get(
  '/webhooks/endpoints',
  validateQuery(Joi.object({
    isActive: Joi.boolean().optional(),
    eventType: Joi.string().optional(),
  })),
  WebhookController.getEndpoints,
);
router.get(
  '/webhooks/endpoints/:endpointId',
  validateParams(Joi.object({ endpointId: Joi.string().uuid().required() })),
  WebhookController.getEndpointById,
);
router.put(
  '/webhooks/endpoints/:endpointId',
  validateParams(Joi.object({ endpointId: Joi.string().uuid().required() })),
  validate(updateEndpointSchema),
  WebhookController.updateEndpoint,
);
router.delete(
  '/webhooks/endpoints/:endpointId',
  validateParams(Joi.object({ endpointId: Joi.string().uuid().required() })),
  WebhookController.deleteEndpoint,
);
router.post(
  '/webhooks/endpoints/:endpointId/test',
  validateParams(Joi.object({ endpointId: Joi.string().uuid().required() })),
  WebhookController.testEndpoint,
);
router.get(
  '/webhooks/deliveries',
  validateQuery(Joi.object({
    endpointId: Joi.string().uuid().optional(),
    eventType: Joi.string().optional(),
    status: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  })),
  WebhookController.getDeliveryHistory,
);
router.post(
  '/webhooks/retry',
  WebhookController.retryFailedDeliveries,
);

// ========== API Key Management ==========
router.post(
  '/api-keys',
  validate(createApiKeySchema),
  ApiKeyController.createApiKey,
);
router.get(
  '/api-keys',
  validateQuery(Joi.object({
    isActive: Joi.boolean().optional(),
  })),
  ApiKeyController.getApiKeys,
);
router.get(
  '/api-keys/:apiKeyId',
  validateParams(Joi.object({ apiKeyId: Joi.string().uuid().required() })),
  ApiKeyController.getApiKeyById,
);
router.put(
  '/api-keys/:apiKeyId',
  validateParams(Joi.object({ apiKeyId: Joi.string().uuid().required() })),
  validate(updateApiKeySchema),
  ApiKeyController.updateApiKey,
);
router.delete(
  '/api-keys/:apiKeyId',
  validateParams(Joi.object({ apiKeyId: Joi.string().uuid().required() })),
  ApiKeyController.deleteApiKey,
);
router.get(
  '/api-keys/:apiKeyId/stats',
  validateParams(Joi.object({ apiKeyId: Joi.string().uuid().required() })),
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
  })),
  ApiKeyController.getApiUsageStats,
);

// ========== Payment Plans (Admin) ==========
router.post(
  '/payment-plans',
  validate(createPaymentPlanSchema),
  PaymentPlanController.createPaymentPlan,
);

// ========== White-Label Management (Admin) ==========
/**
 * @route   GET /api/v1/admin/white-label/brandings
 * @desc    Get all brandings (with filters)
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/white-label/brandings',
  validateQuery(Joi.object({
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL').optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().optional(),
  })),
  WhiteLabelController.getAllBrandings,
);

/**
 * @route   PUT /api/v1/admin/white-label/brandings/:brandingId/status
 * @desc    Update branding status (approve/reject)
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/white-label/brandings/:brandingId/status',
  validateParams(Joi.object({ brandingId: Joi.string().uuid().required() })),
  validate(updateBrandingStatusSchema),
  WhiteLabelController.updateBrandingStatus,
);

/**
 * @route   PUT /api/v1/admin/white-label/custom-domains/:domainId/verify
 * @desc    Verify custom domain
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/white-label/custom-domains/:domainId/verify',
  validateParams(Joi.object({ domainId: Joi.string().uuid().required() })),
  validate(verifyCustomDomainSchema),
  WhiteLabelController.verifyCustomDomain,
);

/**
 * @route   GET /api/v1/admin/white-label/brandings/:organizerId
 * @desc    Get branding for a specific organizer
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/white-label/brandings/:organizerId',
  validateParams(Joi.object({ organizerId: Joi.string().uuid().required() })),
  WhiteLabelController.adminGetBrandingByOrganizer,
);

/**
 * @route   PUT /api/v1/admin/white-label/brandings/:organizerId
 * @desc    Admin create/update branding for organizer (auto-approved)
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/white-label/brandings/:organizerId',
  validateParams(Joi.object({ organizerId: Joi.string().uuid().required() })),
  validate(createBrandingSchema),
  WhiteLabelController.adminUpsertBranding,
);

/**
 * @route   GET /api/v1/admin/white-label/custom-domains
 * @desc    Get all custom domains across all organizers
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/white-label/custom-domains',
  validateQuery(Joi.object({
    status: Joi.string().valid('PENDING', 'VERIFIED', 'FAILED', 'SUSPENDED').optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().optional(),
    organizerId: Joi.string().uuid().optional(),
  })),
  WhiteLabelController.adminGetAllCustomDomains,
);

/**
 * @route   POST /api/v1/admin/white-label/custom-domains/:organizerId
 * @desc    Admin add custom domain for organizer
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/white-label/custom-domains/:organizerId',
  validateParams(Joi.object({ organizerId: Joi.string().uuid().required() })),
  validate(createCustomDomainSchema),
  WhiteLabelController.adminAddCustomDomain,
);

/**
 * @route   DELETE /api/v1/admin/white-label/custom-domains/:domainId
 * @desc    Admin delete any custom domain
 * @access  Private (ADMIN_STAFF+)
 */
router.delete(
  '/white-label/custom-domains/:domainId',
  validateParams(Joi.object({ domainId: Joi.string().uuid().required() })),
  WhiteLabelController.adminDeleteCustomDomain,
);

// ========== Extended Profile Management ==========

/**
 * @route   GET /api/v1/admin/users/:userId/profile/full
 * @desc    Get full user profile with all extended data
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/users/:userId/profile/full',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  ExtendedProfileController.getFullProfile,
);

/**
 * @route   GET /api/v1/admin/users/:userId/staff-profile
 * @desc    Get staff profile for user
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/users/:userId/staff-profile',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  ExtendedProfileController.getStaffProfile,
);

/**
 * @route   PUT /api/v1/admin/users/:userId/staff-profile
 * @desc    Update staff profile for user
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/users/:userId/staff-profile',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  validate(extendedProfileValidations.upsertStaffProfile),
  ExtendedProfileController.updateStaffProfile,
);

/**
 * @route   GET /api/v1/admin/users/:userId/organizer-profile
 * @desc    Get organizer profile for user
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/users/:userId/organizer-profile',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  ExtendedProfileController.getOrganizerProfile,
);

/**
 * @route   PUT /api/v1/admin/users/:userId/organizer-profile
 * @desc    Update organizer profile for user
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/users/:userId/organizer-profile',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  validate(extendedProfileValidations.upsertOrganizerProfile),
  ExtendedProfileController.updateOrganizerProfile,
);

/**
 * @route   GET /api/v1/admin/users/:userId/emergency-contact
 * @desc    Get emergency contact for user
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/users/:userId/emergency-contact',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  ExtendedProfileController.getEmergencyContact,
);

/**
 * @route   PUT /api/v1/admin/users/:userId/emergency-contact
 * @desc    Update emergency contact for user
 * @access  Private (ADMIN_STAFF+)
 */
router.put(
  '/users/:userId/emergency-contact',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  validate(extendedProfileValidations.upsertEmergencyContact),
  ExtendedProfileController.updateEmergencyContact,
);

/**
 * @route   DELETE /api/v1/admin/users/:userId/emergency-contact
 * @desc    Delete emergency contact for user
 * @access  Private (ADMIN_STAFF+)
 */
router.delete(
  '/users/:userId/emergency-contact',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  ExtendedProfileController.deleteEmergencyContact,
);

// ========== Admin Security Settings (SUPERADMIN only) ==========

/**
 * @route   GET /api/v1/admin/security/settings
 * @desc    Get all admin security settings (origins & IPs)
 * @access  Private (SUPERADMIN only)
 */
router.get(
  '/security/settings',
  requireMinRole(UserRole.SUPERADMIN),
  AdminSecurityController.getSecuritySettings,
);

/**
 * @route   GET /api/v1/admin/security/allowed-origins
 * @desc    Get admin allowed origins
 * @access  Private (SUPERADMIN only)
 */
router.get(
  '/security/allowed-origins',
  requireMinRole(UserRole.SUPERADMIN),
  AdminSecurityController.getAllowedOrigins,
);

/**
 * @route   PUT /api/v1/admin/security/allowed-origins
 * @desc    Update admin allowed origins
 * @access  Private (SUPERADMIN only)
 */
router.put(
  '/security/allowed-origins',
  requireMinRole(UserRole.SUPERADMIN),
  validate(Joi.object({
    origins: Joi.array().items(Joi.string().uri().allow('*.', Joi.string().regex(/^\*\..+$/))).min(0).required(),
  })),
  AdminSecurityController.updateAllowedOrigins,
);

/**
 * @route   POST /api/v1/admin/security/allowed-origins
 * @desc    Add an origin to the allowed list
 * @access  Private (SUPERADMIN only)
 */
router.post(
  '/security/allowed-origins',
  requireMinRole(UserRole.SUPERADMIN),
  validate(Joi.object({
    origin: Joi.string().required(),
  })),
  AdminSecurityController.addAllowedOrigin,
);

/**
 * @route   DELETE /api/v1/admin/security/allowed-origins/:origin
 * @desc    Remove an origin from the allowed list
 * @access  Private (SUPERADMIN only)
 */
router.delete(
  '/security/allowed-origins/:origin',
  requireMinRole(UserRole.SUPERADMIN),
  AdminSecurityController.removeAllowedOrigin,
);

/**
 * @route   GET /api/v1/admin/security/allowed-ips
 * @desc    Get admin allowed IPs
 * @access  Private (SUPERADMIN only)
 */
router.get(
  '/security/allowed-ips',
  requireMinRole(UserRole.SUPERADMIN),
  AdminSecurityController.getAllowedIPs,
);

/**
 * @route   PUT /api/v1/admin/security/allowed-ips
 * @desc    Update admin allowed IPs
 * @access  Private (SUPERADMIN only)
 */
router.put(
  '/security/allowed-ips',
  requireMinRole(UserRole.SUPERADMIN),
  validate(Joi.object({
    ips: Joi.array().items(Joi.string()).min(0).required(),
  })),
  AdminSecurityController.updateAllowedIPs,
);

/**
 * @route   POST /api/v1/admin/security/allowed-ips
 * @desc    Add an IP to the allowed list
 * @access  Private (SUPERADMIN only)
 */
router.post(
  '/security/allowed-ips',
  requireMinRole(UserRole.SUPERADMIN),
  validate(Joi.object({
    ip: Joi.string().required(),
  })),
  AdminSecurityController.addAllowedIP,
);

/**
 * @route   DELETE /api/v1/admin/security/allowed-ips/:ip
 * @desc    Remove an IP from the allowed list
 * @access  Private (SUPERADMIN only)
 */
router.delete(
  '/security/allowed-ips/:ip',
  requireMinRole(UserRole.SUPERADMIN),
  AdminSecurityController.removeAllowedIP,
);

// ========== Platform Analytics (Admin) ==========

/**
 * @route   GET /api/v1/admin/platform-analytics/gmv
 * @desc    Get platform GMV (Gross Merchandise Value) analytics
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/platform-analytics/gmv',
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    currency: Joi.string().optional(),
  })),
  AdminPlatformAnalyticsController.getGMVAnalytics,
);

/**
 * @route   GET /api/v1/admin/platform-analytics/fees
 * @desc    Get platform fees collected analytics
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/platform-analytics/fees',
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    currency: Joi.string().optional(),
  })),
  AdminPlatformAnalyticsController.getPlatformFeesAnalytics,
);

/**
 * @route   GET /api/v1/admin/platform-analytics/gateway-health
 * @desc    Get payment gateway health metrics
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/platform-analytics/gateway-health',
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    currency: Joi.string().optional(),
  })),
  AdminPlatformAnalyticsController.getPaymentGatewayHealth,
);

/**
 * @route   GET /api/v1/admin/platform-analytics/refund-trends
 * @desc    Get refund trends analytics
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/platform-analytics/refund-trends',
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    currency: Joi.string().optional(),
  })),
  AdminPlatformAnalyticsController.getRefundTrends,
);

/**
 * @route   GET /api/v1/admin/platform-analytics/dashboard
 * @desc    Get complete platform dashboard analytics
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/platform-analytics/dashboard',
  validateQuery(Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    currency: Joi.string().optional(),
  })),
  AdminPlatformAnalyticsController.getDashboardAnalytics,
);

// ─── KYC Review & Approval ──────────────────────────────────────────────

/**
 * @route   GET /api/v1/admin/kyc/stats
 * @desc    Get KYC stats (pending, approved, rejected counts)
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/kyc/stats', AdminKYCController.getKYCStats);

/**
 * @route   GET /api/v1/admin/kyc/submissions
 * @desc    List KYC submissions with pagination and filters
 * @access  Private (ADMIN_STAFF+)
 */
router.get(
  '/kyc/submissions',
  validateQuery(adminKYCValidations.listFilters),
  AdminKYCController.listKYCSubmissions,
);

/**
 * @route   GET /api/v1/admin/kyc/users/:userId
 * @desc    Get full KYC details for a specific organizer
 * @access  Private (ADMIN_STAFF+)
 */
router.get('/kyc/users/:userId', AdminKYCController.getOrganizerKYCDetails);

/**
 * @route   POST /api/v1/admin/kyc/documents/:documentId/approve
 * @desc    Approve a single KYC document
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/kyc/documents/:documentId/approve', AdminKYCController.approveDocument);

/**
 * @route   POST /api/v1/admin/kyc/documents/:documentId/reject
 * @desc    Reject a single KYC document with reason
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/kyc/documents/:documentId/reject',
  validate(adminKYCValidations.rejectDocument),
  AdminKYCController.rejectDocument,
);

/**
 * @route   POST /api/v1/admin/kyc/users/:userId/approve
 * @desc    Approve an organizer's entire KYC (all required docs must be approved)
 * @access  Private (ADMIN_STAFF+)
 */
router.post('/kyc/users/:userId/approve', AdminKYCController.approveOrganizerKYC);

/**
 * @route   POST /api/v1/admin/kyc/users/:userId/reject
 * @desc    Reject an organizer's entire KYC with reason
 * @access  Private (ADMIN_STAFF+)
 */
router.post(
  '/kyc/users/:userId/reject',
  validate(adminKYCValidations.rejectOrganizer),
  AdminKYCController.rejectOrganizerKYC,
);

export default router;
