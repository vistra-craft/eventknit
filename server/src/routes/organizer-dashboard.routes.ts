import { Router } from 'express';
import Joi from 'joi';
import { OrganizerDashboardController } from '../controllers/organizer-dashboard.controller.js';
import { SocialOAuthController } from '../controllers/social-oauth.controller.js';
import { VenueController } from '../controllers/venue.controller.js';
import { SeatMapController } from '../controllers/seat-map.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { organizerDashboardValidations } from '../validations/organizer-dashboard.validations.js';
import {
  createVenueSchema,
  updateVenueSchema,
  createSeatMapSchema,
} from '../validations/venue.validations.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Event Templates
router.post(
  '/templates',
  validate(organizerDashboardValidations.createTemplate),
  OrganizerDashboardController.createTemplate,
);
router.get(
  '/templates',
  validateQuery(organizerDashboardValidations.templatesQuery),
  OrganizerDashboardController.getTemplates,
);
router.get(
  '/templates/public',
  validateQuery(organizerDashboardValidations.templatesQuery),
  OrganizerDashboardController.getPublicTemplates,
);
router.get(
  '/templates/:templateId',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getTemplateById,
);
router.put(
  '/templates/:templateId',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.updateTemplate),
  OrganizerDashboardController.updateTemplate,
);
router.post(
  '/templates/:templateId/versions',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.createTemplateVersion),
  OrganizerDashboardController.createTemplateVersion,
);
router.post(
  '/templates/:templateId/share',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  OrganizerDashboardController.shareTemplate,
);
router.post(
  '/templates/:templateId/use',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  OrganizerDashboardController.useTemplate,
);
router.delete(
  '/templates/:templateId',
  validateParams(Joi.object({ templateId: Joi.string().uuid().required() })),
  OrganizerDashboardController.deleteTemplate,
);
router.post(
  '/events/:eventId/templates',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.createTemplateFromEvent),
  OrganizerDashboardController.createTemplateFromEvent,
);

// Event Drafts
router.post(
  '/drafts',
  validate(organizerDashboardValidations.createDraft),
  OrganizerDashboardController.createDraft,
);
router.get(
  '/drafts',
  validateQuery(organizerDashboardValidations.paginationQuery),
  OrganizerDashboardController.getDrafts,
);
router.get(
  '/drafts/:draftId',
  validateParams(Joi.object({ draftId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getDraftById,
);
router.put(
  '/drafts/:draftId',
  validateParams(Joi.object({ draftId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.updateDraft),
  OrganizerDashboardController.updateDraft,
);
router.post(
  '/drafts/:draftId/versions',
  validateParams(Joi.object({ draftId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.createDraftVersion),
  OrganizerDashboardController.createDraftVersion,
);
router.post(
  '/drafts/:draftId/schedule',
  validateParams(Joi.object({ draftId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.scheduleDraft),
  OrganizerDashboardController.scheduleDraft,
);
router.post(
  '/drafts/:draftId/publish',
  validateParams(Joi.object({ draftId: Joi.string().uuid().required() })),
  OrganizerDashboardController.publishDraft,
);
router.delete(
  '/drafts/:draftId',
  validateParams(Joi.object({ draftId: Joi.string().uuid().required() })),
  OrganizerDashboardController.deleteDraft,
);

// Attendee Segmentation
router.post(
  '/segments',
  validate(organizerDashboardValidations.createSegment),
  OrganizerDashboardController.createSegment,
);
router.get(
  '/segments',
  validateQuery(organizerDashboardValidations.segmentsQuery),
  OrganizerDashboardController.getSegments,
);
router.get(
  '/segments/:segmentId',
  validateParams(Joi.object({ segmentId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getSegmentById,
);
router.put(
  '/segments/:segmentId',
  validateParams(Joi.object({ segmentId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.updateSegment),
  OrganizerDashboardController.updateSegment,
);
router.post(
  '/segments/:segmentId/update-members',
  validateParams(Joi.object({ segmentId: Joi.string().uuid().required() })),
  OrganizerDashboardController.updateSegmentMembers,
);
router.post(
  '/segments/:segmentId/members',
  validateParams(Joi.object({ segmentId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.addMemberToSegment),
  OrganizerDashboardController.addMemberToSegment,
);
router.delete(
  '/segments/:segmentId/members/:userId',
  validateParams(Joi.object({
    segmentId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
  })),
  OrganizerDashboardController.removeMemberFromSegment,
);
router.delete(
  '/segments/:segmentId',
  validateParams(Joi.object({ segmentId: Joi.string().uuid().required() })),
  OrganizerDashboardController.deleteSegment,
);

// Attendee Tags
router.post(
  '/tags',
  validate(organizerDashboardValidations.createTag),
  OrganizerDashboardController.createTag,
);
router.get('/tags', OrganizerDashboardController.getTags);
router.get(
  '/tags/:tagId',
  validateParams(Joi.object({ tagId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getTagById,
);
router.put(
  '/tags/:tagId',
  validateParams(Joi.object({ tagId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.updateTag),
  OrganizerDashboardController.updateTag,
);
router.post(
  '/tags/:tagId/users',
  validateParams(Joi.object({ tagId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.tagUser),
  OrganizerDashboardController.tagUser,
);
router.delete(
  '/tags/:tagId/users/:userId',
  validateParams(Joi.object({
    tagId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
  })),
  OrganizerDashboardController.untagUser,
);
router.get(
  '/tags/:tagId/users',
  validateParams(Joi.object({ tagId: Joi.string().uuid().required() })),
  validateQuery(organizerDashboardValidations.taggedUsersQuery),
  OrganizerDashboardController.getTaggedUsers,
);
router.delete(
  '/tags/:tagId',
  validateParams(Joi.object({ tagId: Joi.string().uuid().required() })),
  OrganizerDashboardController.deleteTag,
);

// Attendee Communication
router.post(
  '/segments/:segmentId/send',
  validateParams(Joi.object({ segmentId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.sendMessage),
  OrganizerDashboardController.sendToSegment,
);
router.post(
  '/tags/:tagId/send',
  validateParams(Joi.object({ tagId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.sendMessage),
  OrganizerDashboardController.sendToTaggedUsers,
);
router.post(
  '/events/:eventId/send',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.sendMessage),
  OrganizerDashboardController.sendToEventRegistrations,
);
router.get(
  '/communications',
  validateQuery(organizerDashboardValidations.communicationHistoryQuery),
  OrganizerDashboardController.getCommunicationHistory,
);

// Analytics
router.get(
  '/analytics/events/:eventId',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validateQuery(organizerDashboardValidations.analyticsQuery),
  OrganizerDashboardController.getEventAnalytics,
);
router.get(
  '/analytics/revenue',
  validateQuery(organizerDashboardValidations.revenueAnalyticsQuery),
  OrganizerDashboardController.getRevenueAnalytics,
);
router.get(
  '/analytics/attendees',
  validateQuery(organizerDashboardValidations.attendeeInsightsQuery),
  OrganizerDashboardController.getAttendeeInsights,
);
router.get(
  '/analytics/marketing',
  validateQuery(organizerDashboardValidations.marketingAnalyticsQuery),
  OrganizerDashboardController.getMarketingAnalytics,
);

// Advanced Promo Codes
router.post(
  '/promo-codes/:promoCodeId/variants',
  validateParams(Joi.object({ promoCodeId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.createPromoCodeVariant),
  OrganizerDashboardController.createPromoCodeVariant,
);
router.get(
  '/promo-codes/:promoCodeId/analytics',
  validateParams(Joi.object({ promoCodeId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getPromoCodeAnalytics,
);
router.get(
  '/promo-codes/analytics',
  validateQuery(organizerDashboardValidations.promoCodeAnalyticsQuery),
  OrganizerDashboardController.getOrganizerPromoCodeAnalytics,
);

// Financial Management
router.post(
  '/expenses',
  validate(organizerDashboardValidations.createExpense),
  OrganizerDashboardController.createExpense,
);
router.get(
  '/expenses',
  validateQuery(organizerDashboardValidations.expensesQuery),
  OrganizerDashboardController.getExpenses,
);
router.get(
  '/financial/profit-loss',
  validateQuery(organizerDashboardValidations.financialQuery),
  OrganizerDashboardController.getProfitLossStatement,
);
router.post(
  '/financial/goals',
  validate(organizerDashboardValidations.createFinancialGoal),
  OrganizerDashboardController.createFinancialGoal,
);
router.get(
  '/financial/goals',
  validateQuery(organizerDashboardValidations.financialGoalsQuery),
  OrganizerDashboardController.getFinancialGoals,
);
router.get(
  '/financial/tax-summary',
  validateQuery(organizerDashboardValidations.taxSummaryQuery),
  OrganizerDashboardController.getTaxSummary,
);

// Payout Management
router.get('/payouts/preferences', OrganizerDashboardController.getPayoutPreferences);
router.put(
  '/payouts/preferences',
  validate(organizerDashboardValidations.updatePayoutPreferences),
  OrganizerDashboardController.updatePayoutPreferences,
);
router.get(
  '/payouts/history',
  validateQuery(organizerDashboardValidations.payoutHistoryQuery),
  OrganizerDashboardController.getPayoutHistory,
);
router.post(
  '/payouts/schedule',
  validate(organizerDashboardValidations.schedulePayout),
  OrganizerDashboardController.schedulePayout,
);
router.get('/payouts/summary', OrganizerDashboardController.getPayoutSummary);

// Event Collaboration
router.post(
  '/events/:eventId/collaborators',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.inviteCollaborator),
  OrganizerDashboardController.inviteCollaborator,
);
router.post(
  '/collaborations/:collaborationId/accept',
  validateParams(Joi.object({ collaborationId: Joi.string().uuid().required() })),
  OrganizerDashboardController.acceptInvitation,
);
router.get(
  '/events/:eventId/collaborators',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getEventCollaborators,
);
router.put(
  '/collaborations/:collaborationId',
  validateParams(Joi.object({ collaborationId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.updateCollaboratorPermissions),
  OrganizerDashboardController.updateCollaboratorPermissions,
);
router.delete(
  '/collaborations/:collaborationId',
  validateParams(Joi.object({ collaborationId: Joi.string().uuid().required() })),
  OrganizerDashboardController.removeCollaborator,
);
router.get(
  '/events/:eventId/activity-log',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validateQuery(organizerDashboardValidations.activityLogQuery),
  OrganizerDashboardController.getEventActivityLog,
);

// Phase 3: Advanced Ticket Types
router.post(
  '/ticket-packages',
  validate(organizerDashboardValidations.createTicketPackage),
  OrganizerDashboardController.createTicketPackage,
);
router.get(
  '/events/:eventId/ticket-packages',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validateQuery(organizerDashboardValidations.ticketPackagesQuery),
  OrganizerDashboardController.getEventTicketPackages,
);
router.put(
  '/ticket-packages/:packageId',
  validateParams(Joi.object({ packageId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.updateTicketPackage),
  OrganizerDashboardController.updateTicketPackage,
);
router.get(
  '/events/:eventId/reserved-seating',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getReservedSeating,
);
router.delete(
  '/ticket-packages/:packageId',
  validateParams(Joi.object({ packageId: Joi.string().uuid().required() })),
  OrganizerDashboardController.deleteTicketPackage,
);

// Phase 3: Dynamic Pricing
router.post(
  '/pricing-rules',
  validate(organizerDashboardValidations.createPricingRule),
  OrganizerDashboardController.createPricingRule,
);
router.get(
  '/events/:eventId/pricing-rules',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validateQuery(organizerDashboardValidations.pricingRulesQuery),
  OrganizerDashboardController.getEventPricingRules,
);
router.get(
  '/events/:eventId/calculate-price',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validateQuery(organizerDashboardValidations.calculatePriceQuery),
  OrganizerDashboardController.calculateDynamicPrice,
);
router.put(
  '/pricing-rules/:ruleId',
  validateParams(Joi.object({ ruleId: Joi.string().uuid().required() })),
  validate(organizerDashboardValidations.updatePricingRule),
  OrganizerDashboardController.updatePricingRule,
);
router.delete(
  '/pricing-rules/:ruleId',
  validateParams(Joi.object({ ruleId: Joi.string().uuid().required() })),
  OrganizerDashboardController.deletePricingRule,
);

// Phase 3: Affiliate Program
router.post(
  '/affiliate-programs',
  validate(organizerDashboardValidations.createAffiliateProgram),
  OrganizerDashboardController.createAffiliateProgram,
);
router.get(
  '/affiliate-programs',
  validateQuery(organizerDashboardValidations.affiliateProgramsQuery),
  OrganizerDashboardController.getAffiliatePrograms,
);
router.post(
  '/affiliate-programs/:programId/apply',
  validateParams(Joi.object({ programId: Joi.string().uuid().required() })),
  OrganizerDashboardController.applyAsAffiliate,
);
router.get(
  '/affiliates/:affiliateId/dashboard',
  validateParams(Joi.object({ affiliateId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getAffiliateDashboard,
);
router.get(
  '/affiliates/:affiliateId/conversions',
  validateParams(Joi.object({ affiliateId: Joi.string().uuid().required() })),
  validateQuery(organizerDashboardValidations.affiliateConversionsQuery),
  OrganizerDashboardController.getAffiliateConversions,
);

// Phase 3: Email Marketing
router.post(
  '/email-campaigns',
  validate(organizerDashboardValidations.createEmailCampaign),
  OrganizerDashboardController.createEmailCampaign,
);
router.get(
  '/email-campaigns',
  validateQuery(organizerDashboardValidations.emailCampaignsQuery),
  OrganizerDashboardController.getEmailCampaigns,
);
router.post(
  '/email-campaigns/:campaignId/send',
  validateParams(Joi.object({ campaignId: Joi.string().uuid().required() })),
  OrganizerDashboardController.sendEmailCampaign,
);
router.get(
  '/email-campaigns/:campaignId/analytics',
  validateParams(Joi.object({ campaignId: Joi.string().uuid().required() })),
  OrganizerDashboardController.getCampaignAnalytics,
);

// Phase 3: Social Media
// OAuth Routes
router.post(
  '/social-posts',
  validate(organizerDashboardValidations.createSocialPost),
  OrganizerDashboardController.createSocialPost,
);
router.get(
  '/social-posts',
  validateQuery(organizerDashboardValidations.socialPostsQuery),
  OrganizerDashboardController.getSocialPosts,
);
router.post(
  '/social-posts/:postId/publish',
  validateParams(Joi.object({ postId: Joi.string().uuid().required() })),
  OrganizerDashboardController.publishSocialPost,
);
router.get(
  '/social-media/analytics',
  validateQuery(organizerDashboardValidations.socialMediaAnalyticsQuery),
  OrganizerDashboardController.getSocialMediaAnalytics,
);

// Social Media OAuth Routes
router.get(
  '/social-media/oauth/:platform/authorize',
  validateParams(Joi.object({ platform: Joi.string().valid('facebook', 'twitter', 'instagram', 'linkedin').required() })),
  SocialOAuthController.authorize,
);
router.get(
  '/social-media/oauth/:platform/callback',
  validateParams(Joi.object({ platform: Joi.string().valid('facebook', 'twitter', 'instagram', 'linkedin').required() })),
  SocialOAuthController.callback,
);
router.get(
  '/social-media/accounts',
  SocialOAuthController.getAccounts,
);
router.delete(
  '/social-media/accounts/:accountId',
  validateParams(Joi.object({ accountId: Joi.string().uuid().required() })),
  SocialOAuthController.disconnectAccount,
);

// ========== Venues & Seating ==========
/**
 * @route   POST /api/v1/organizer-dashboard/venues
 * @desc    Create venue
 * @access  Private (ORGANIZER+)
 */
router.post('/venues', validate(createVenueSchema), VenueController.createVenue);

/**
 * @route   GET /api/v1/organizer-dashboard/venues
 * @desc    Get organizer's venues
 * @access  Private (ORGANIZER+)
 */
router.get('/venues', VenueController.getVenues);

/**
 * @route   GET /api/v1/organizer-dashboard/venues/:venueId
 * @desc    Get venue by ID
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/venues/:venueId',
  validateParams(Joi.object({ venueId: Joi.string().uuid().required() })),
  VenueController.getVenueById,
);

/**
 * @route   PUT /api/v1/organizer-dashboard/venues/:venueId
 * @desc    Update venue
 * @access  Private (ORGANIZER+)
 */
router.put(
  '/venues/:venueId',
  validateParams(Joi.object({ venueId: Joi.string().uuid().required() })),
  validate(updateVenueSchema),
  VenueController.updateVenue,
);

/**
 * @route   DELETE /api/v1/organizer-dashboard/venues/:venueId
 * @desc    Delete venue
 * @access  Private (ORGANIZER+)
 */
router.delete(
  '/venues/:venueId',
  validateParams(Joi.object({ venueId: Joi.string().uuid().required() })),
  VenueController.deleteVenue,
);

/**
 * @route   POST /api/v1/organizer-dashboard/events/:eventId/seat-map
 * @desc    Create or update seat map for event
 * @access  Private (ORGANIZER+)
 */
router.post(
  '/events/:eventId/seat-map',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validate(createSeatMapSchema),
  SeatMapController.upsertSeatMap,
);

/**
 * @route   GET /api/v1/organizer-dashboard/events/:eventId/seat-map
 * @desc    Get seat map for event
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/events/:eventId/seat-map',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  SeatMapController.getSeatMap,
);

/**
 * @route   GET /api/v1/organizer-dashboard/events/:eventId/seats/available
 * @desc    Get available seats
 * @access  Private (ORGANIZER+)
 */
router.get(
  '/events/:eventId/seats/available',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  SeatMapController.getAvailableSeats,
);

/**
 * @route   DELETE /api/v1/organizer-dashboard/events/:eventId/seat-map
 * @desc    Delete seat map
 * @access  Private (ORGANIZER+)
 */
router.delete(
  '/events/:eventId/seat-map',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  SeatMapController.deleteSeatMap,
);

// Phase 3: Advanced Team Features
router.post(
  '/team/role-templates',
  validate(organizerDashboardValidations.createRoleTemplate),
  OrganizerDashboardController.createRoleTemplate,
);
router.get(
  '/team/role-templates',
  validateQuery(organizerDashboardValidations.roleTemplatesQuery),
  OrganizerDashboardController.getRoleTemplates,
);
router.get(
  '/team/activity-feed',
  validateQuery(organizerDashboardValidations.teamActivityQuery),
  OrganizerDashboardController.getTeamActivityFeed,
);
router.get(
  '/team/performance-metrics',
  validateQuery(organizerDashboardValidations.teamMetricsQuery),
  OrganizerDashboardController.getTeamPerformanceMetrics,
);

export default router;
