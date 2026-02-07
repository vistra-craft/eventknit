import { Router } from 'express';
import Joi from 'joi';
import { UserDashboardController } from '../controllers/user-dashboard.controller.js';
import { UserFeaturesController } from '../controllers/user-features.controller.js';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { PaymentPlanController } from '../controllers/payment-plan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { userDashboardValidations } from '../validations/user-dashboard.validations.js';
import {
  listTicketForResaleSchema,
  addTicketToWalletSchema,
  updateWalletPreferencesSchema,
  syncToCalendarSchema,
  updateFeedPreferencesSchema,
  subscribeToEventSchema,
  updateSubscriptionPreferencesSchema,
} from '../validations/user-features.validations.js';
import {
  createPaymentPlanSchema,
  processInstallmentPaymentSchema,
} from '../validations/payment-plan.validations.js';

const router = Router();

// Recommendations
router.get(
  '/recommendations',
  authenticate,
  validateQuery(userDashboardValidations.recommendationsQuery),
  UserDashboardController.getRecommendations,
);

// Analytics
router.get('/analytics', authenticate, UserDashboardController.getPersonalAnalytics);
router.get(
  '/activity-history',
  authenticate,
  validateQuery(userDashboardValidations.activityHistoryQuery),
  UserDashboardController.getActivityHistory,
);

// Reviews
router.post(
  '/events/:eventId/reviews',
  authenticate,
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validate(userDashboardValidations.createReview),
  UserDashboardController.createReview,
);
router.get(
  '/events/:eventId/reviews',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validateQuery(userDashboardValidations.reviewsQuery),
  UserDashboardController.getEventReviews,
);
router.post(
  '/reviews/:reviewId/helpful',
  authenticate,
  validateParams(Joi.object({ reviewId: Joi.string().uuid().required() })),
  UserDashboardController.markReviewHelpful,
);

// Ticket Transfers
router.post(
  '/transfers/:registrationId',
  authenticate,
  validateParams(Joi.object({ registrationId: Joi.string().uuid().required() })),
  validate(userDashboardValidations.initiateTransfer),
  UserDashboardController.initiateTransfer,
);
router.post(
  '/transfers/accept/:transferToken',
  authenticate,
  validateParams(Joi.object({ transferToken: Joi.string().required() })),
  UserDashboardController.acceptTransfer,
);
router.post(
  '/transfers/:transferId/cancel',
  authenticate,
  validateParams(Joi.object({ transferId: Joi.string().uuid().required() })),
  UserDashboardController.cancelTransfer,
);
router.get(
  '/transfers',
  authenticate,
  validateQuery(userDashboardValidations.transferHistoryQuery),
  UserDashboardController.getTransferHistory,
);

// Event Collections
router.post(
  '/collections',
  authenticate,
  validate(userDashboardValidations.createCollection),
  UserDashboardController.createCollection,
);
router.get(
  '/collections',
  authenticate,
  validateQuery(userDashboardValidations.collectionsQuery),
  UserDashboardController.getUserCollections,
);
router.get(
  '/collections/public',
  validateQuery(userDashboardValidations.paginationQuery),
  UserDashboardController.getPublicCollections,
);
router.get(
  '/collections/:collectionId',
  validateParams(Joi.object({ collectionId: Joi.string().uuid().required() })),
  authenticate,
  UserDashboardController.getCollectionById,
);
router.post(
  '/collections/:collectionId/events/:eventId',
  authenticate,
  validateParams(Joi.object({
    collectionId: Joi.string().uuid().required(),
    eventId: Joi.string().uuid().required(),
  })),
  validate(userDashboardValidations.addEventToCollection),
  UserDashboardController.addEventToCollection,
);
router.delete(
  '/collections/:collectionId/events/:eventId',
  authenticate,
  validateParams(Joi.object({
    collectionId: Joi.string().uuid().required(),
    eventId: Joi.string().uuid().required(),
  })),
  UserDashboardController.removeEventFromCollection,
);
router.post(
  '/collections/:collectionId/follow',
  authenticate,
  validateParams(Joi.object({ collectionId: Joi.string().uuid().required() })),
  UserDashboardController.toggleFollowCollection,
);
router.put(
  '/collections/:collectionId',
  authenticate,
  validateParams(Joi.object({ collectionId: Joi.string().uuid().required() })),
  validate(userDashboardValidations.updateCollection),
  UserDashboardController.updateCollection,
);
router.delete(
  '/collections/:collectionId',
  authenticate,
  validateParams(Joi.object({ collectionId: Joi.string().uuid().required() })),
  UserDashboardController.deleteCollection,
);

// User Interests
router.post(
  '/interests',
  authenticate,
  validate(userDashboardValidations.upsertInterest),
  UserDashboardController.upsertInterest,
);
router.get('/interests', authenticate, UserDashboardController.getUserInterests);
router.delete(
  '/interests/:category',
  authenticate,
  validateParams(Joi.object({ category: Joi.string().required() })),
  UserDashboardController.removeInterest,
);
router.patch(
  '/interests/:category/weight',
  authenticate,
  validateParams(Joi.object({ category: Joi.string().required() })),
  validate(userDashboardValidations.updateInterestWeight),
  UserDashboardController.updateInterestWeight,
);

// Saved Searches
router.post(
  '/saved-searches',
  authenticate,
  validate(userDashboardValidations.createSavedSearch),
  UserDashboardController.createSavedSearch,
);
router.get('/saved-searches', authenticate, UserDashboardController.getUserSavedSearches);
router.put(
  '/saved-searches/:searchId',
  authenticate,
  validateParams(Joi.object({ searchId: Joi.string().uuid().required() })),
  validate(userDashboardValidations.updateSavedSearch),
  UserDashboardController.updateSavedSearch,
);
router.delete(
  '/saved-searches/:searchId',
  authenticate,
  validateParams(Joi.object({ searchId: Joi.string().uuid().required() })),
  UserDashboardController.deleteSavedSearch,
);
router.post(
  '/saved-searches/:searchId/execute',
  authenticate,
  validateParams(Joi.object({ searchId: Joi.string().uuid().required() })),
  UserDashboardController.executeSavedSearch,
);

// Direct Messaging
router.post(
  '/messages',
  authenticate,
  validate(userDashboardValidations.sendMessage),
  UserDashboardController.sendMessage,
);
router.get(
  '/messages/inbox',
  authenticate,
  validateQuery(userDashboardValidations.messagesQuery),
  UserDashboardController.getInbox,
);
router.get(
  '/messages/sent',
  authenticate,
  validateQuery(userDashboardValidations.paginationQuery),
  UserDashboardController.getSentMessages,
);
router.get(
  '/messages/:messageId',
  authenticate,
  validateParams(Joi.object({ messageId: Joi.string().uuid().required() })),
  UserDashboardController.getMessageThread,
);
router.post(
  '/messages/:messageId/read',
  authenticate,
  validateParams(Joi.object({ messageId: Joi.string().uuid().required() })),
  UserDashboardController.markMessageAsRead,
);
router.delete(
  '/messages/:messageId',
  authenticate,
  validateParams(Joi.object({ messageId: Joi.string().uuid().required() })),
  UserDashboardController.deleteMessage,
);

// Social Networking
router.post(
  '/social/follow/:userId',
  authenticate,
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  UserDashboardController.followUser,
);
router.post(
  '/social/unfollow/:userId',
  authenticate,
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  UserDashboardController.unfollowUser,
);
router.get(
  '/social/followers/:userId',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  validateQuery(userDashboardValidations.socialQuery),
  UserDashboardController.getFollowers,
);
router.get(
  '/social/following/:userId',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  validateQuery(userDashboardValidations.socialQuery),
  UserDashboardController.getFollowing,
);
router.get(
  '/social/is-following/:userId',
  authenticate,
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  UserDashboardController.isFollowing,
);
router.get(
  '/social/profile/:userId',
  validateParams(Joi.object({ userId: Joi.string().uuid().required() })),
  authenticate,
  UserDashboardController.getUserProfile,
);

// Event Sharing
router.post(
  '/events/:eventId/share',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  authenticate,
  validate(userDashboardValidations.trackShare),
  UserDashboardController.trackShare,
);
router.get(
  '/events/:eventId/share/analytics',
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  authenticate,
  UserDashboardController.getShareAnalytics,
);

// ========== Ticket Resale ==========
router.post(
  '/resale/list',
  authenticate,
  validate(listTicketForResaleSchema),
  UserFeaturesController.listTicketForResale,
);
router.get('/resale/marketplace', UserFeaturesController.getMarketplaceTickets);
router.get('/resale/my-listings', authenticate, UserFeaturesController.getUserResales);
router.post(
  '/resale/:resaleId/purchase',
  authenticate,
  validateParams(Joi.object({ resaleId: Joi.string().uuid().required() })),
  UserFeaturesController.purchaseResaleTicket,
);
router.post(
  '/resale/:resaleId/cancel',
  authenticate,
  validateParams(Joi.object({ resaleId: Joi.string().uuid().required() })),
  UserFeaturesController.cancelResale,
);

// ========== Digital Wallet ==========
router.get('/wallet', authenticate, UserFeaturesController.getWallet);
router.post(
  '/wallet/add',
  authenticate,
  validate(addTicketToWalletSchema),
  UserFeaturesController.addTicketToWallet,
);
router.delete(
  '/wallet/:registrationId',
  authenticate,
  validateParams(Joi.object({ registrationId: Joi.string().uuid().required() })),
  UserFeaturesController.removeTicketFromWallet,
);
router.put(
  '/wallet/preferences',
  authenticate,
  validate(updateWalletPreferencesSchema),
  UserFeaturesController.updateWalletPreferences,
);
router.get(
  '/wallet/:registrationId/apple-pass',
  authenticate,
  validateParams(Joi.object({ registrationId: Joi.string().uuid().required() })),
  UserFeaturesController.generateAppleWalletPass,
);
router.get(
  '/wallet/:registrationId/google-pass',
  authenticate,
  validateParams(Joi.object({ registrationId: Joi.string().uuid().required() })),
  UserFeaturesController.generateGooglePayPass,
);

// ========== Event Calendar Integration ==========
router.post(
  '/calendar/sync',
  authenticate,
  validate(syncToCalendarSchema),
  UserFeaturesController.syncToCalendar,
);
router.get('/calendar/syncs', authenticate, UserFeaturesController.getUserCalendarSyncs);
router.delete(
  '/calendar/syncs/:syncId',
  authenticate,
  validateParams(Joi.object({ syncId: Joi.string().uuid().required() })),
  UserFeaturesController.removeCalendarSync,
);

// ========== Personal Event Feed ==========
router.get('/feed', authenticate, UserFeaturesController.getFeed);
router.post('/feed/refresh', authenticate, UserFeaturesController.refreshFeed);
router.put(
  '/feed/preferences',
  authenticate,
  validate(updateFeedPreferencesSchema),
  UserFeaturesController.updateFeedPreferences,
);
router.post(
  '/feed/items/:itemId/viewed',
  authenticate,
  validateParams(Joi.object({ itemId: Joi.string().uuid().required() })),
  UserFeaturesController.markFeedItemViewed,
);
router.post(
  '/feed/items/:itemId/dismiss',
  authenticate,
  validateParams(Joi.object({ itemId: Joi.string().uuid().required() })),
  UserFeaturesController.dismissFeedItem,
);

// ========== Event Updates Subscription ==========
router.post(
  '/events/:eventId/subscribe',
  authenticate,
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validate(subscribeToEventSchema),
  UserFeaturesController.subscribeToEvent,
);
router.post(
  '/events/:eventId/unsubscribe',
  authenticate,
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  UserFeaturesController.unsubscribeFromEvent,
);
router.get('/subscriptions', authenticate, UserFeaturesController.getUserSubscriptions);
router.put(
  '/subscriptions/:eventId/preferences',
  authenticate,
  validateParams(Joi.object({ eventId: Joi.string().uuid().required() })),
  validate(updateSubscriptionPreferencesSchema),
  UserFeaturesController.updateSubscriptionPreferences,
);

// ========== Invoices ==========
router.get(
  '/invoices',
  authenticate,
  validateQuery(Joi.object({
    status: Joi.string().optional(),
    eventId: Joi.string().uuid().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  })),
  InvoiceController.getUserInvoices,
);
router.get(
  '/invoices/:invoiceId',
  authenticate,
  validateParams(Joi.object({ invoiceId: Joi.string().uuid().required() })),
  InvoiceController.getInvoiceById,
);
router.get(
  '/invoices/number/:invoiceNumber',
  authenticate,
  validateParams(Joi.object({ invoiceNumber: Joi.string().required() })),
  InvoiceController.getInvoiceByNumber,
);
router.get(
  '/invoices/:invoiceId/html',
  authenticate,
  validateParams(Joi.object({ invoiceId: Joi.string().uuid().required() })),
  InvoiceController.generateInvoiceHTML,
);
router.get(
  '/invoices/:invoiceId/download',
  authenticate,
  validateParams(Joi.object({ invoiceId: Joi.string().uuid().required() })),
  InvoiceController.downloadInvoice,
);

// ========== Payment Plans ==========
router.get(
  '/payment-plans',
  authenticate,
  validateQuery(Joi.object({
    status: Joi.string().optional(),
    eventId: Joi.string().uuid().optional(),
  })),
  PaymentPlanController.getUserPaymentPlans,
);
router.post(
  '/payment-plans',
  authenticate,
  validate(createPaymentPlanSchema),
  PaymentPlanController.createPaymentPlan,
);
router.get(
  '/payment-plans',
  authenticate,
  validateQuery(Joi.object({
    status: Joi.string().optional(),
    eventId: Joi.string().uuid().optional(),
  })),
  PaymentPlanController.getUserPaymentPlans,
);
router.get(
  '/payment-plans/registration/:registrationId',
  authenticate,
  validateParams(Joi.object({ registrationId: Joi.string().uuid().required() })),
  PaymentPlanController.getPaymentPlanByRegistration,
);
router.post(
  '/payment-plans/installments/:installmentId/pay',
  authenticate,
  validateParams(Joi.object({ installmentId: Joi.string().uuid().required() })),
  validate(processInstallmentPaymentSchema),
  PaymentPlanController.processInstallmentPayment,
);
router.get(
  '/payment-plans/overdue',
  authenticate,
  PaymentPlanController.getOverdueInstallments,
);
router.post(
  '/payment-plans/:planId/cancel',
  authenticate,
  validateParams(Joi.object({ planId: Joi.string().uuid().required() })),
  PaymentPlanController.cancelPaymentPlan,
);

export default router;
