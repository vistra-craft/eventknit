/**
 * User Routes
 * All routes under /user/* path (protected, requires authentication)
 */

import { lazy, createElement } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteConfig } from './types';


// Lazy load user dashboard page components
const DashboardHome = lazy(() => import('../pages/user/DashboardHome'));
const DashboardMyEvent = lazy(() => import('../pages/user/DashboardMyEvent'));
const MyTickets = lazy(() => import('../pages/user/MyTickets'));
const SavedEvents = lazy(() => import('../pages/user/SavedEvents'));
const DashboardSpeakers = lazy(() => import('../pages/user/DashboardSpeakers'));
const DashboardExhibitors = lazy(() => import('../pages/user/DashboardExhibitors'));
const DashboardSponsors = lazy(() => import('../pages/user/DashboardSponsors'));
const DashboardAttendees = lazy(() => import('../pages/user/DashboardAttendees'));
const DashboardAgenda = lazy(() => import('../pages/user/DashboardAgenda'));
const DashboardMyBadge = lazy(() => import('../pages/user/DashboardMyBadge'));
const AttendeeDiscovery = lazy(() => import('../pages/user/AttendeeDiscovery'));
const NotificationsCenter = lazy(() => import('../pages/user/NotificationsCenter'));
const PersonalAnalytics = lazy(() => import('../pages/user/PersonalAnalytics'));
const PersonalizedRecommendations = lazy(() => import('../pages/user/PersonalizedRecommendations'));
const TicketTransfer = lazy(() => import('../pages/user/TicketTransfer'));
const EventCollections = lazy(() => import('../pages/user/EventCollections'));
const InterestManagement = lazy(() => import('../pages/user/InterestManagement'));
const AdvancedSearch = lazy(() => import('../pages/user/AdvancedSearch'));
const DirectMessaging = lazy(() => import('../pages/user/DirectMessaging'));
const SocialNetworking = lazy(() => import('../pages/user/SocialNetworking'));
const TicketResale = lazy(() => import('../pages/user/TicketResale'));
const DigitalWallet = lazy(() => import('../pages/user/DigitalWallet'));
const EventCalendarIntegration = lazy(() => import('../pages/user/EventCalendarIntegration'));
const PersonalEventFeed = lazy(() => import('../pages/user/PersonalEventFeed'));
const EventUpdatesSubscription = lazy(() => import('../pages/user/EventUpdatesSubscription'));
const PaymentPlans = lazy(() => import('../pages/user/PaymentPlans'));
const Invoices = lazy(() => import('../pages/user/Invoices'));
const TicketViewPage = lazy(() => import('../pages/user/TicketViewPage'));
const UserProfilePage = lazy(() => import('../pages/user/UserProfilePage'));
const NotificationPreferencesPage = lazy(() => import('../pages/user/NotificationPreferencesPage'));
const EventManagementHub = lazy(() => import('../pages/user/EventManagementHub'));
const CreateEventEntry = lazy(() => import('../pages/user/CreateEventEntry'));
const CreateEventStepwise = lazy(() => import('../pages/CreateEventStepwise'));
const VerificationPage = lazy(() => import('../pages/organizer/settings/VerificationPage'));
const KYCVerificationPage = lazy(() => import('../pages/organizer/settings/KYCVerificationPage'));

/**
 * User route definitions
 * All routes require authentication
 */
export const userRoutes: RouteConfig[] = [
  // Dashboard home (default)
  {
    path: 'dashboard',
    element: createElement(DashboardHome),
  },
  {
    path: '', // /user/ redirects to dashboard
    element: createElement(DashboardHome),
  },

  // Event-related routes
  {
    path: 'event/:id',
    element: createElement(DashboardMyEvent),
  },
  {
    path: 'my-events',
    element: createElement(DashboardMyEvent),
  },

  // Event Management (Organizer features in unified dashboard)
  {
    path: 'manage-events/:eventId',
    element: createElement(EventManagementHub),
  },

  // Event Creation (Role-aware routing)
  {
    path: 'create-event',
    element: createElement(CreateEventEntry),
  },
  {
    path: 'create-event-form',
    element: createElement(CreateEventStepwise),
  },

  // Ticket management
  {
    path: 'tickets',
    element: createElement(MyTickets),
  },
  {
    path: 'tickets/:registrationId',
    element: createElement(TicketViewPage),
  },
  {
    path: 'ticket-transfer',
    element: createElement(TicketTransfer),
  },
  {
    path: 'ticket-resale',
    element: createElement(TicketResale),
  },

  // Event discovery
  {
    path: 'saved',
    element: createElement(SavedEvents),
  },
  {
    path: 'search',
    element: createElement(AdvancedSearch),
  },
  {
    path: 'collections',
    element: createElement(EventCollections),
  },
  {
    path: 'feed',
    element: createElement(PersonalEventFeed),
  },
  {
    path: 'recommendations',
    element: createElement(PersonalizedRecommendations),
  },

  // Event details sections
  {
    path: 'speakers',
    element: createElement(DashboardSpeakers),
  },
  {
    path: 'exhibitors',
    element: createElement(DashboardExhibitors),
  },
  {
    path: 'sponsors',
    element: createElement(DashboardSponsors),
  },
  {
    path: 'attendees',
    element: createElement(DashboardAttendees),
  },
  {
    path: 'agenda',
    element: createElement(DashboardAgenda),
  },

  // Personal event features
  {
    path: 'my-badge',
    element: createElement(DashboardMyBadge),
  },

  // Networking
  {
    path: 'networking',
    element: createElement(AttendeeDiscovery),
  },
  {
    path: 'messages',
    element: createElement(DirectMessaging),
  },
  {
    path: 'social',
    element: createElement(SocialNetworking),
  },

  // Notifications & preferences
  {
    path: 'notifications',
    element: createElement(NotificationsCenter),
  },
  {
    path: 'notification-preferences',
    element: createElement(NotificationPreferencesPage),
  },
  {
    path: 'subscriptions',
    element: createElement(EventUpdatesSubscription),
  },

  // Analytics & insights
  {
    path: 'analytics',
    element: createElement(PersonalAnalytics),
  },

  // User preferences
  {
    path: 'interests',
    element: createElement(InterestManagement),
  },
  {
    path: 'calendar',
    element: createElement(EventCalendarIntegration),
  },

  // Profile & account
  {
    path: 'profile',
    element: createElement(UserProfilePage),
  },

  // Settings — rendered as a full section in UserDashboard via ?section=settings
  {
    path: 'settings',
    element: createElement(Navigate, { to: '/user/dashboard?section=settings', replace: true }),
  },
  {
    path: 'settings/profile',
    element: createElement(Navigate, { to: '/user/dashboard?section=settings&tab=profile', replace: true }),
  },
  {
    path: 'settings/notifications',
    element: createElement(Navigate, { to: '/user/dashboard?section=settings&tab=notifications', replace: true }),
  },
  {
    path: 'settings/security',
    element: createElement(Navigate, { to: '/user/dashboard?section=settings&tab=security', replace: true }),
  },
  {
    path: 'settings/appearance',
    element: createElement(Navigate, { to: '/user/dashboard?section=settings&tab=appearance', replace: true }),
  },

  // Verification & KYC (same components as organizer, rendered in attendee layout)
  {
    path: 'verification',
    element: createElement(VerificationPage),
  },
  {
    path: 'kyc',
    element: createElement(KYCVerificationPage),
  },

  // Financial
  {
    path: 'wallet',
    element: createElement(DigitalWallet),
  },
  {
    path: 'payment-plans',
    element: createElement(PaymentPlans),
  },
  {
    path: 'invoices',
    element: createElement(Invoices),
  },
];
