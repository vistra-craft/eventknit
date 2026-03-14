/**
 * Admin Routes
 * All routes under /admin/* path (protected, requires admin roles)
 * Supports multiple role variations: SUPERADMIN, ADMIN, SUPPORT, TELLER
 */

import { lazy, createElement } from 'react';
import { Navigate } from 'react-router-dom';
import type { ProtectedRouteConfig } from './types';
import { UserRole } from '../types/auth';

// Lazy load admin page components

// Dashboard & Profile
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminProfilePage = lazy(() => import('../pages/admin/AdminProfilePage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminIntegrationsPage = lazy(() => import('../pages/admin/AdminIntegrationsPage'));

// Events
const AdminAllEventsPage = lazy(() => import('../pages/admin/events/AllEventsPage'));
const AdminPendingApprovalPage = lazy(() => import('../pages/admin/events/PendingApprovalPage'));
const AdminFeaturedEventsPage = lazy(() => import('../pages/admin/events/FeaturedEventsPage'));
const CreateFeaturedEventPage = lazy(() => import('../pages/admin/events/featured/CreateFeaturedEventPage'));
const EditFeaturedEventPage = lazy(() => import('../pages/admin/events/featured/EditFeaturedEventPage'));
const AdminPastEventsPage = lazy(() => import('../pages/admin/events/PastEventsPage'));
const AdminUpcomingEventsPage = lazy(() => import('../pages/admin/events/UpcomingEventsPage'));
const AdminDeclinedEventsPage = lazy(() => import('../pages/admin/events/DeclinedEventsPage'));
const AdminRecalledEventsPage = lazy(() => import('../pages/admin/events/RecalledEventsPage'));
const AdminCreateEventPage = lazy(() => import('../pages/admin/AdminCreateEventPage'));
const EventPreviewPage = lazy(() => import('../pages/admin/events/EventPreviewPage'));
const EventDetailsPage = lazy(() => import('../pages/admin/events/EventDetailsPage'));

// Users
const UsersManagementPage = lazy(() => import('../pages/admin/UsersManagementPage'));
const AttendeesPage = lazy(() => import('../pages/admin/AttendeesPage'));
const AttendeeDetailsPage = lazy(() => import('../pages/admin/AttendeeDetailsPage'));
const AdminStaffManagementPage = lazy(() => import('../pages/admin/StaffManagementPage'));
const StaffDetailsPage = lazy(() => import('../pages/admin/StaffDetailsPage'));
const StaffEditPage = lazy(() => import('../pages/admin/StaffEditPage'));
const OrganizersPage = lazy(() => import('../pages/admin/OrganizersPage'));
const CreateOrganizerPage = lazy(() => import('../pages/admin/organizers/CreateOrganizerPage'));
const OrganizerPreviewPage = lazy(() => import('../pages/admin/organizers/OrganizerPreviewPage'));
const OrganizerDetailsPage = lazy(() => import('../pages/admin/OrganizerDetailsPage'));
const OrganizerEditPage = lazy(() => import('../pages/admin/OrganizerEditPage'));
const UserRolesPage = lazy(() => import('../pages/admin/UserRolesPage'));

// Staff Performance
const StaffPerformanceDashboard = lazy(() => import('../pages/admin/StaffPerformanceDashboard'));
const StaffPerformanceDetail = lazy(() => import('../pages/admin/StaffPerformanceDetail'));

// System
const SystemHealthPage = lazy(() => import('../pages/admin/system').then(m => ({ default: m.SystemHealthPage })));
const DatabasePage = lazy(() => import('../pages/admin/system').then(m => ({ default: m.DatabasePage })));
const LogsPage = lazy(() => import('../pages/admin/system').then(m => ({ default: m.LogsPage })));
const BackupsPage = lazy(() => import('../pages/admin/system').then(m => ({ default: m.BackupsPage })));
const MaintenancePage = lazy(() => import('../pages/admin/system').then(m => ({ default: m.MaintenancePage })));

// Moderation
const ModerationPage = lazy(() => import('../pages/admin/ModerationPage'));
const FlaggedEventsPage = lazy(() => import('../pages/admin/FlaggedEventsPage'));
const CareersPage = lazy(() => import('../pages/admin/CareersPage'));

// Communications & Notifications
const AdminCommunicationsPage = lazy(() => import('../pages/admin/CommunicationsPage'));
const AdminNotificationsCenter = lazy(() => import('../pages/admin/AdminNotificationsCenter'));
const AdminNotificationSettingsPage = lazy(() => import('../pages/admin/AdminNotificationSettingsPage'));

// Support
const SupportPage = lazy(() => import('../pages/admin/SupportPage'));
const PlatformFeedbackPage = lazy(() => import('../pages/admin/PlatformFeedbackPage'));

// Branding
const AdminWhiteLabelPage = lazy(() => import('../pages/admin/white-label/AdminWhiteLabelPage'));

// Marketing
const AdminMarketingPage = lazy(() => import('../pages/admin/AdminMarketingPage'));
const AdminCampaignsPage = lazy(() => import('../pages/admin/marketing').then(m => ({ default: m.AdminCampaignsPage })));
const AdminSocialMediaPage = lazy(() => import('../pages/admin/marketing').then(m => ({ default: m.AdminSocialMediaPage })));
const AdminEmailMarketingPage = lazy(() => import('../pages/admin/marketing').then(m => ({ default: m.AdminEmailMarketingPage })));
const AdminPromotionsPage = lazy(() => import('../pages/admin/marketing').then(m => ({ default: m.AdminPromotionsPage })));
const AdminPartnershipsPage = lazy(() => import('../pages/admin/marketing').then(m => ({ default: m.AdminPartnershipsPage })));
const AdminPromoCodeFormPage = lazy(() => import('../pages/admin/marketing/AdminPromoCodeFormPage'));

// Subscriptions
const SubscriptionPlansPage = lazy(() => import('../pages/admin/subscriptions/SubscriptionPlansPage'));

// Tickets
const AdminAdvancedTicketTypes = lazy(() => import('../pages/admin/tickets/AdminAdvancedTicketTypes'));
const AdminDynamicPricing = lazy(() => import('../pages/admin/tickets/AdminDynamicPricing'));
const AdminTicketIssuancesPage = lazy(() => import('../pages/admin/tickets/AdminTicketIssuancesPage'));

// Analytics
const AdminAnalyticsOverview = lazy(() => import('../pages/admin/analytics').then(m => ({ default: m.AdminAnalyticsOverview })));

// Financial
const FinancialManagement = lazy(() => import('../pages/organizer/FinancialManagement'));
const AffiliateProgram = lazy(() => import('../pages/organizer/AffiliateProgram'));

// Finance
const FinanceDashboard = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.FinanceDashboard })));
const EventFinanceDashboard = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.EventFinanceDashboard })));
const PaymentTransactionsPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.PaymentTransactionsPage })));
const PaymentTransactionDetailPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.PaymentTransactionDetailPage })));
const DisbursementsPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.DisbursementsPage })));
const RefundsPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.RefundsPage })));
const ReconciliationPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.ReconciliationPage })));
const ExpensesPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.ExpensesPage })));
const IncomePage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.IncomePage })));
const WagesPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.WagesPage })));
const TransactionsPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.TransactionsPage })));
const IncomeStatementPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.IncomeStatementPage })));
const EditTransactionPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.EditTransactionPage })));
const EditExpensePage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.EditExpensePage })));
const EditIncomePage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.EditIncomePage })));
const EditWagePage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.EditWagePage })));
const PlatformFeeConfigPage = lazy(() => import('../pages/admin/finance/PlatformFeeConfigPage'));
const ResaleTransferReportingPage = lazy(() => import('../pages/admin/finance').then(m => ({ default: m.ResaleTransferReportingPage })));

// KYC Review
const KYCReviewDashboard = lazy(() => import('../pages/admin/kyc/KYCReviewDashboard'));
const KYCOrganizerReviewPage = lazy(() => import('../pages/admin/kyc/KYCOrganizerReviewPage'));
const KYCEntityManagement = lazy(() => import('../pages/admin/kyc/KYCEntityManagement'));

// Event Day Hub (formerly Service Point)
const ServicePointEvents = lazy(() => import('../pages/admin/service-point/ServicePointEvents'));
const ServicePointEventDashboard = lazy(() => import('../pages/admin/service-point/ServicePointEventDashboard'));
const RealtimeDashboard = lazy(() => import('../pages/admin/service-point/RealtimeDashboard'));
const ServicePointScanner = lazy(() => import('../pages/admin/service-point/ServicePointScanner'));
const ServicePointPrint = lazy(() => import('../pages/admin/service-point/ServicePointPrint'));
const ServicePointTemplates = lazy(() => import('../pages/admin/service-point/ServicePointTemplates'));
const FacilityZones = lazy(() => import('../pages/admin/service-point/FacilityZones'));
const ServicePointHistory = lazy(() => import('../pages/admin/service-point/ServicePointHistory'));
const WalkInRegistration = lazy(() => import('../pages/admin/service-point/WalkInRegistration'));

// Managed Events
const AdminManagedEventsPage = lazy(() => import('../pages/admin/AdminManagedEventsPage'));
const AdminManagedEventCreatePage = lazy(() => import('../pages/admin/AdminManagedEventCreatePage'));

/**
 * Common role combinations
 */
const ALL_ADMIN_ROLES = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.SUPPORT,
  UserRole.TELLER,
];

const SUPERADMIN_ONLY = [UserRole.SUPERADMIN];

const ADMIN_ROLES = [UserRole.SUPERADMIN, UserRole.ADMIN];

const MARKETING_ROLES = [UserRole.SUPERADMIN, UserRole.ADMIN];

const SUPPORT_ROLES = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT];

const TELLER_ROLES = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.TELLER];

/**
 * Admin route definitions
 * All routes require admin-related roles
 */
export const adminRoutes: ProtectedRouteConfig[] = [
  // Root redirect: /admin → /admin/dashboard
  {
    index: true,
    element: createElement(Navigate, { to: '/admin/dashboard', replace: true }),
  },

  // Dashboard & Profile
  {
    path: 'dashboard',
    element: createElement(AdminDashboard),
    allowedRoles: ALL_ADMIN_ROLES,
  },
  {
    path: 'profile',
    element: createElement(AdminProfilePage),
    allowedRoles: ALL_ADMIN_ROLES,
  },
  {
    path: 'settings',
    element: createElement(AdminSettingsPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'settings/integrations',
    element: createElement(AdminIntegrationsPage),
    allowedRoles: SUPERADMIN_ONLY,
  },

  // Events - List Views
  {
    path: 'events',
    element: createElement(AdminAllEventsPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'events/pending',
    element: createElement(AdminPendingApprovalPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'events/featured',
    element: createElement(AdminFeaturedEventsPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'events/featured/create',
    element: createElement(CreateFeaturedEventPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'events/featured/:id/edit',
    element: createElement(EditFeaturedEventPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'events/past',
    element: createElement(AdminPastEventsPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'events/upcoming',
    element: createElement(AdminUpcomingEventsPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'events/declined',
    element: createElement(AdminDeclinedEventsPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'events/recalled',
    element: createElement(AdminRecalledEventsPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'events/create',
    element: createElement(AdminCreateEventPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'events/:eventId/preview',
    element: createElement(EventPreviewPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'events/:eventId',
    element: createElement(EventDetailsPage),
    allowedRoles: MARKETING_ROLES,
  },

  // Users Management
  {
    path: 'users',
    element: createElement(UsersManagementPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'users/attendees',
    element: createElement(AttendeesPage),
    allowedRoles: SUPPORT_ROLES,
  },
  {
    path: 'users/attendees/:attendeeId',
    element: createElement(AttendeeDetailsPage),
    allowedRoles: SUPPORT_ROLES,
  },
  {
    path: 'users/staff',
    element: createElement(AdminStaffManagementPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'users/staff/:staffId',
    element: createElement(StaffDetailsPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'users/staff/:staffId/edit',
    element: createElement(StaffEditPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'users/organizers',
    element: createElement(OrganizersPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'users/organizers/create',
    element: createElement(CreateOrganizerPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'users/organizers/:organizerId/preview',
    element: createElement(OrganizerPreviewPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'users/organizers/:organizerId',
    element: createElement(OrganizerDetailsPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'users/organizers/:organizerId/edit',
    element: createElement(OrganizerEditPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'users/roles',
    element: createElement(UserRolesPage),
    allowedRoles: SUPERADMIN_ONLY,
  },

  // Staff Performance
  {
    path: 'staff-performance',
    element: createElement(StaffPerformanceDashboard),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'staff-performance/:staffId',
    element: createElement(StaffPerformanceDetail),
    allowedRoles: SUPERADMIN_ONLY,
  },

  // System Management
  {
    path: 'system',
    element: createElement(SystemHealthPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'system/health',
    element: createElement(SystemHealthPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'system/database',
    element: createElement(DatabasePage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'system/logs',
    element: createElement(LogsPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'system/backups',
    element: createElement(BackupsPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'system/maintenance',
    element: createElement(MaintenancePage),
    allowedRoles: SUPERADMIN_ONLY,
  },

  // Moderation
  {
    path: 'moderation',
    element: createElement(ModerationPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'flagged-events',
    element: createElement(FlaggedEventsPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'careers',
    element: createElement(CareersPage),
    allowedRoles: ADMIN_ROLES,
  },

  // Communications & Notifications
  {
    path: 'notifications',
    element: createElement(AdminNotificationsCenter),
    allowedRoles: ALL_ADMIN_ROLES,
  },
  {
    path: 'communications',
    element: createElement(AdminCommunicationsPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'notification-settings',
    element: createElement(AdminNotificationSettingsPage),
    allowedRoles: SUPERADMIN_ONLY,
  },

  // Support
  {
    path: 'support',
    element: createElement(SupportPage),
    allowedRoles: SUPPORT_ROLES,
  },
  {
    path: 'feedback',
    element: createElement(PlatformFeedbackPage),
    allowedRoles: ADMIN_ROLES,
  },

  // Branding
  {
    path: 'white-label',
    element: createElement(AdminWhiteLabelPage),
    allowedRoles: ADMIN_ROLES,
  },

  // Marketing
  {
    path: 'marketing',
    element: createElement(AdminMarketingPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'marketing/campaigns',
    element: createElement(AdminCampaignsPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'marketing/social',
    element: createElement(AdminSocialMediaPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'marketing/email',
    element: createElement(AdminEmailMarketingPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'marketing/promotions',
    element: createElement(AdminPromotionsPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'marketing/affiliate',
    element: createElement(AffiliateProgram),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'marketing/partnerships',
    element: createElement(AdminPartnershipsPage),
    allowedRoles: MARKETING_ROLES,
  },

  // Subscriptions
  {
    path: 'subscriptions',
    element: createElement(SubscriptionPlansPage),
    allowedRoles: ADMIN_ROLES,
  },

  // Tickets
  {
    path: 'tickets/advanced',
    element: createElement(AdminAdvancedTicketTypes),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'event/:eventId/tickets/advanced',
    element: createElement(AdminAdvancedTicketTypes),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'tickets/pricing',
    element: createElement(AdminDynamicPricing),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'event/:eventId/tickets/pricing',
    element: createElement(AdminDynamicPricing),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'tickets/issuances',
    element: createElement(AdminTicketIssuancesPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'tickets/promo-codes',
    element: createElement(AdminPromotionsPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'tickets/promo-codes/create',
    element: createElement(AdminPromoCodeFormPage),
    allowedRoles: MARKETING_ROLES,
  },
  {
    path: 'tickets/promo-codes/:id/edit',
    element: createElement(AdminPromoCodeFormPage),
    allowedRoles: MARKETING_ROLES,
  },

  // Analytics
  {
    path: 'analytics',
    element: createElement(AdminAnalyticsOverview),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'analytics/events',
    element: createElement(AdminAnalyticsOverview),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'analytics/users',
    element: createElement(AdminAnalyticsOverview),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'analytics/revenue',
    element: createElement(AdminAnalyticsOverview),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'analytics/system',
    element: createElement(AdminAnalyticsOverview),
    allowedRoles: SUPERADMIN_ONLY,
  },

  // Finance
  {
    path: 'finance',
    element: createElement(FinanceDashboard),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'finance/events',
    element: createElement(EventFinanceDashboard),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'finance/payments',
    element: createElement(PaymentTransactionsPage),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'finance/payments/:id',
    element: createElement(PaymentTransactionDetailPage),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'finance/disbursements',
    element: createElement(DisbursementsPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'finance/refunds',
    element: createElement(RefundsPage),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'finance/reconciliation',
    element: createElement(ReconciliationPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'finance/expenses',
    element: createElement(ExpensesPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'finance/income',
    element: createElement(IncomePage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'finance/wages',
    element: createElement(WagesPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'finance/transactions',
    element: createElement(TransactionsPage),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'finance/income-statement',
    element: createElement(IncomeStatementPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'finance/platform-fees',
    element: createElement(PlatformFeeConfigPage),
    allowedRoles: SUPERADMIN_ONLY,
  },
  {
    path: 'finance/resale-transfers',
    element: createElement(ResaleTransferReportingPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'finance/transactions/edit/:id',
    element: createElement(EditTransactionPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'finance/expenses/edit/:id',
    element: createElement(EditExpensePage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'finance/income/edit/:id',
    element: createElement(EditIncomePage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'finance/wages/edit/:id',
    element: createElement(EditWagePage),
    allowedRoles: SUPERADMIN_ONLY,
  },

  // Financial Management
  {
    path: 'financial',
    element: createElement(FinancialManagement),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'financial/payouts',
    element: createElement(FinancialManagement),
    allowedRoles: ADMIN_ROLES,
  },

  // Event Day Hub
  {
    path: 'event-day',
    element: createElement(ServicePointEvents),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'event-day/event/:eventId',
    element: createElement(ServicePointEventDashboard),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'event-day/dashboard/:eventId',
    element: createElement(RealtimeDashboard),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'event-day/scanner',
    element: createElement(ServicePointScanner),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'event-day/print',
    element: createElement(ServicePointPrint),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'event-day/templates',
    element: createElement(ServicePointTemplates),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'event-day/zones/:eventId',
    element: createElement(FacilityZones),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'event-day/history',
    element: createElement(ServicePointHistory),
    allowedRoles: TELLER_ROLES,
  },
  {
    path: 'event-day/event/:eventId/templates',
    element: createElement(ServicePointTemplates),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'event-day/event/:eventId/walk-in',
    element: createElement(WalkInRegistration),
    allowedRoles: TELLER_ROLES,
  },
  // NOTE: event/:eventId/manage removed — admin event editing belongs in Support Mode on EventDetailsPage

  // Managed Events
  {
    path: 'managed-events',
    element: createElement(AdminManagedEventsPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'managed-events/create',
    element: createElement(AdminManagedEventCreatePage),
    allowedRoles: ADMIN_ROLES,
  },

  // KYC Review
  {
    path: 'kyc',
    element: createElement(KYCReviewDashboard),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'kyc/review/:userId',
    element: createElement(KYCOrganizerReviewPage),
    allowedRoles: ADMIN_ROLES,
  },
  {
    path: 'kyc/entity-management',
    element: createElement(KYCEntityManagement),
    allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN], // Restricted to SUPERADMIN/ADMIN only
  },
];
