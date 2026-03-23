/**
 * Organizer Routes
 * All routes under /organizer/* path (protected, requires organizer roles)
 * Supports multiple role variations: ORGANIZER, ORGANIZER_ADMIN, ORGANIZER_TELLER
 */

import { lazy, createElement } from 'react';
import { Navigate } from 'react-router-dom';
import type { ProtectedRouteConfig } from './types';
import { UserRole } from '../types/auth';

// Service Point (shared with admin, used by ORGANIZER_TELLER role)
const ServicePointEvents = lazy(() => import('../pages/admin/service-point/ServicePointEvents'));
const ServicePointEventDashboard = lazy(() => import('../pages/admin/service-point/ServicePointEventDashboard'));
const ServicePointScanner = lazy(() => import('../pages/admin/service-point/ServicePointScanner'));
const ServicePointHistory = lazy(() => import('../pages/admin/service-point/ServicePointHistory'));

// Lazy load organizer page components

// Dashboard & Onboarding
const OrganizerDashboard = lazy(() => import('../pages/organizer/OrganizerDashboard'));
const OnboardingWizard = lazy(() => import('../pages/organizer/OnboardingWizard'));

// Event Management - Unified Page
const UnifiedEventsPage = lazy(() => import('../pages/organizer/UnifiedEventsPage'));
const AttendingEventsPage = lazy(() => import('../pages/organizer/AttendingEventsPage'));
const CreateEventPage = lazy(() => import('../pages/organizer/CreateEventPage'));
const StandaloneCreateEventPage = lazy(() => import('../pages/organizer/StandaloneCreateEventPage'));
const EventManagementPage = lazy(() => import('../pages/organizer/EventManagementPage'));
const EventTemplates = lazy(() => import('../pages/organizer/EventTemplates'));
const EventCollaboration = lazy(() => import('../pages/organizer/EventCollaboration'));
const EventSurveyManagement = lazy(() => import('../pages/organizer/EventSurveyManagement'));

// Analytics
const AnalyticsOverview = lazy(() => import('../pages/organizer/analytics').then(m => ({ default: m.AnalyticsOverview })));
const EventPerformance = lazy(() => import('../pages/organizer/analytics').then(m => ({ default: m.EventPerformance })));
const AttendeeInsights = lazy(() => import('../pages/organizer/analytics').then(m => ({ default: m.AttendeeInsights })));
const RevenueReports = lazy(() => import('../pages/organizer/analytics').then(m => ({ default: m.RevenueReports })));

// Team Management
const StaffManagementPage = lazy(() => import('../pages/organizer/team').then(m => ({ default: m.StaffManagementPage })));
// const RolesPermissionsPage = lazy(() => import('../pages/organizer/team').then(m => ({ default: m.RolesPermissionsPage })));
// const TeamCalendarPage = lazy(() => import('../pages/organizer/team').then(m => ({ default: m.TeamCalendarPage })));

// Settings & Profile
const OrganizerSettingsPage = lazy(() => import('../pages/organizer/OrganizerSettingsPage'));
const OrganizerProfileSetup = lazy(() => import('../pages/organizer/OrganizerProfileSetup'));

// Verification & Subscription
const VerificationPage = lazy(() => import('../pages/organizer/VerificationPage'));
const KYCVerificationPage = lazy(() => import('../pages/organizer/KYCVerificationPage'));
const SubscriptionManagement = lazy(() => import('../pages/organizer/SubscriptionManagement'));

// Venues
const VenueManagement = lazy(() => import('../pages/organizer/VenueManagement'));

// Attendees & Communication
const AttendeeSegmentation = lazy(() => import('../pages/organizer/AttendeeSegmentation'));
const AttendeeTagsManagement = lazy(() => import('../pages/organizer/AttendeeTagsManagement'));
const AttendeeCommunication = lazy(() => import('../pages/organizer/AttendeeCommunication'));
const OrganizerNotificationsCenter = lazy(() => import('../pages/organizer/OrganizerNotificationsCenter'));

// Marketing
const AffiliateProgram = lazy(() => import('../pages/organizer/AffiliateProgram'));

// Financial
const FinancialManagement = lazy(() => import('../pages/organizer/FinancialManagement'));
const PayoutManagement = lazy(() => import('../pages/organizer/PayoutManagement'));

// Tickets Management (consolidated hub)
const TicketsManagementHub = lazy(() => import('../pages/organizer/TicketsManagementHub'));

// Branding
const OrganizerBrandingPage = lazy(() => import('../pages/organizer/OrganizerBrandingPage'));

/**
 * Common role combinations
 */
const ALL_ORGANIZER_ROLES = [
  UserRole.ORGANIZER,
  UserRole.ORGANIZER_ADMIN,
  UserRole.ORGANIZER_TELLER,
  UserRole.SUPERADMIN,
];

const NON_TELLER_ROLES = [
  UserRole.ORGANIZER,
  UserRole.ORGANIZER_ADMIN,
  UserRole.SUPERADMIN,
];

const ORGANIZER_ADMIN_ONLY = [
  UserRole.ORGANIZER,
  UserRole.SUPERADMIN,
];

/**
 * Organizer route definitions
 * All routes require organizer-related roles
 */
export const organizerRoutes: ProtectedRouteConfig[] = [
  // Dashboard & Onboarding
  {
    path: 'dashboard',
    element: createElement(OrganizerDashboard),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
  {
    path: 'onboarding',
    element: createElement(OnboardingWizard),
    allowedRoles: [UserRole.ORGANIZER, UserRole.ORGANIZER_ADMIN, UserRole.ORGANIZER_TELLER],
  },
  {
    path: 'profile-setup',
    element: createElement(OrganizerProfileSetup),
    allowedRoles: ORGANIZER_ADMIN_ONLY,
  },

  // Events - Unified Page (All, Upcoming, Past, Cancelled, Templates, Drafts)
  {
    path: 'events',
    element: createElement(UnifiedEventsPage),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },

  // Backward-compat redirects: old URLs → unified page with query param
  {
    path: 'events/upcoming',
    element: createElement(Navigate, { to: '/organizer/events?view=upcoming', replace: true }),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
  {
    path: 'events/past',
    element: createElement(Navigate, { to: '/organizer/events?view=past', replace: true }),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
  {
    path: 'events/cancelled',
    element: createElement(Navigate, { to: '/organizer/events?view=cancelled', replace: true }),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
  {
    path: 'events/templates-management',
    element: createElement(Navigate, { to: '/organizer/events?view=templates', replace: true }),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'events/drafts',
    element: createElement(Navigate, { to: '/organizer/events?view=drafts', replace: true }),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Attending Events (standalone page)
  {
    path: 'attending',
    element: createElement(AttendingEventsPage),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },

  // Events - Creation (keep as separate routes)
  {
    path: 'events/create',
    element: createElement(CreateEventPage),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'events/create-standalone',
    element: createElement(StandaloneCreateEventPage),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Events - Templates (legacy direct route)
  {
    path: 'events/templates',
    element: createElement(EventTemplates),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Event Management (specific event)
  {
    path: 'event/:eventId',
    element: createElement(EventManagementPage),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
  {
    path: 'event/:eventId/collaboration',
    element: createElement(EventCollaboration),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'event/:eventId/survey',
    element: createElement(EventSurveyManagement),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Analytics
  {
    path: 'analytics',
    element: createElement(AnalyticsOverview),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'analytics/events',
    element: createElement(EventPerformance),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'analytics/attendees',
    element: createElement(AttendeeInsights),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'analytics/revenue',
    element: createElement(RevenueReports),
    allowedRoles: NON_TELLER_ROLES,
  },
  // Team Management
  {
    path: 'team/staff',
    element: createElement(StaffManagementPage),
    allowedRoles: ORGANIZER_ADMIN_ONLY,
  },
  // TODO: Uncomment when implemented
  // {
  //   path: 'team/roles',
  //   element: createElement(RolesPermissionsPage),
  //   allowedRoles: ORGANIZER_ADMIN_ONLY,
  // },
  // {
  //   path: 'team/calendar',
  //   element: createElement(TeamCalendarPage),
  //   allowedRoles: NON_TELLER_ROLES,
  // },

  // Settings — open to all authenticated users (ATTENDEE sees profile/security/notifications/appearance; organizer-specific sections hidden by role)
  {
    path: 'settings',
    element: createElement(OrganizerSettingsPage),
    allowedRoles: [...ALL_ORGANIZER_ROLES, UserRole.ATTENDEE],
  },
  {
    path: 'settings/profile',
    element: createElement(OrganizerSettingsPage),
    allowedRoles: [...ALL_ORGANIZER_ROLES, UserRole.ATTENDEE],
  },
  {
    path: 'settings/notifications',
    element: createElement(OrganizerSettingsPage),
    allowedRoles: [...ALL_ORGANIZER_ROLES, UserRole.ATTENDEE],
  },
  {
    path: 'settings/security',
    element: createElement(OrganizerSettingsPage),
    allowedRoles: [...ALL_ORGANIZER_ROLES, UserRole.ATTENDEE],
  },
  {
    path: 'settings/appearance',
    element: createElement(OrganizerSettingsPage),
    allowedRoles: [...ALL_ORGANIZER_ROLES, UserRole.ATTENDEE],
  },

  // Profile (legacy route, redirects to settings)
  {
    path: 'profile',
    element: createElement(OrganizerSettingsPage),
    allowedRoles: [...ALL_ORGANIZER_ROLES, UserRole.ATTENDEE],
  },

  // Verification & Subscription
  {
    path: 'verification',
    element: createElement(VerificationPage),
    allowedRoles: ORGANIZER_ADMIN_ONLY,
  },
  {
    path: 'kyc',
    element: createElement(KYCVerificationPage),
    allowedRoles: [...ORGANIZER_ADMIN_ONLY, UserRole.ATTENDEE],
  },
  {
    path: 'subscription',
    element: createElement(SubscriptionManagement),
    allowedRoles: ORGANIZER_ADMIN_ONLY,
  },

  // Venues
  {
    path: 'venues',
    element: createElement(VenueManagement),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Notifications
  {
    path: 'notifications',
    element: createElement(OrganizerNotificationsCenter),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },

  // Attendees
  {
    path: 'attendees/segmentation',
    element: createElement(AttendeeSegmentation),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'attendees/tags',
    element: createElement(AttendeeTagsManagement),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'attendees/communication',
    element: createElement(AttendeeCommunication),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Marketing
  {
    path: 'marketing/affiliate',
    element: createElement(AffiliateProgram),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Financial
  {
    path: 'financial',
    element: createElement(FinancialManagement),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'payouts',
    element: createElement(PayoutManagement),
    allowedRoles: ORGANIZER_ADMIN_ONLY,
  },

  // Tickets Management (consolidated hub)
  {
    path: 'tickets',
    element: createElement(TicketsManagementHub),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'tickets/:eventId',
    element: createElement(TicketsManagementHub),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Legacy Advanced Tickets & Pricing (redirect to new hub)
  {
    path: 'event/:eventId/tickets/advanced',
    element: createElement(Navigate, { to: '/organizer/tickets/:eventId', replace: true }),
    allowedRoles: NON_TELLER_ROLES,
  },
  {
    path: 'event/:eventId/pricing',
    element: createElement(Navigate, { to: '/organizer/tickets/:eventId', replace: true }),
    allowedRoles: NON_TELLER_ROLES,
  },

  // Branding
  {
    path: 'branding',
    element: createElement(OrganizerBrandingPage),
    allowedRoles: ORGANIZER_ADMIN_ONLY,
  },

  // Event Day Hub (for ORGANIZER_TELLER role — shared operational pages)
  {
    path: 'event-day',
    element: createElement(ServicePointEvents),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
  {
    path: 'event-day/event/:eventId',
    element: createElement(ServicePointEventDashboard),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
  {
    path: 'event-day/scanner',
    element: createElement(ServicePointScanner),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
  {
    path: 'event-day/history',
    element: createElement(ServicePointHistory),
    allowedRoles: ALL_ORGANIZER_ROLES,
  },
];
