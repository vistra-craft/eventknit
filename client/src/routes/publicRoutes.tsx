/**
 * Public Routes
 * All routes accessible without authentication
 * Includes homepage, info pages, event pages, and support
 */

import { lazy, createElement } from 'react';
import type { RouteConfig } from './types';

// Lazy load public page components
const Index = lazy(() => import('../pages/index'));
const About = lazy(() => import('../pages/About'));
const Careers = lazy(() => import('../pages/Careers'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const CookiePolicy = lazy(() => import('../pages/CookiePolicy'));
const CreateEvent = lazy(() => import('../pages/CreateEvent'));
const CreateEventStepwise = lazy(() => import('../pages/CreateEventStepwise'));
const AuthDemo = lazy(() => import('../pages/AuthDemo'));
const EventDetails = lazy(() => import('../pages/EventDetails'));
const RegisterEvent = lazy(() => import('../pages/RegisterEvent'));
const Payment = lazy(() => import('../pages/Payment'));
const Confirmation = lazy(() => import('../pages/Confirmation'));
const RegistrationConfirmation = lazy(() => import('../pages/RegistrationConfirmation'));
const PublicEventForm = lazy(() => import('../pages/PublicEventForm'));
const FeedbackPage = lazy(() => import('../pages/FeedbackPage'));
const ExhibitorDetails = lazy(() => import('../pages/user/ExhibitorDetails'));
const Support = lazy(() => import('../pages/Support'));
const TransferAccept = lazy(() => import('../pages/TransferAccept'));
const TicketViewPage = lazy(() => import('../pages/user/TicketViewPage'));
const EventSurveyPage = lazy(() => import('../pages/EventSurveyPage'));
const PaymentCallback = lazy(() => import('../pages/PaymentCallback'));
const NotFound = lazy(() => import('../pages/NotFound'));

/**
 * Public route definitions
 * All routes are accessible to everyone (logged in or not)
 */
export const publicRoutes: RouteConfig[] = [
  // Homepage
  {
    path: '/',
    element: createElement(Index),
  },

  // Info pages
  {
    path: 'about',
    element: createElement(About),
  },
  {
    path: 'careers',
    element: createElement(Careers),
  },
  {
    path: 'privacy-policy',
    element: createElement(PrivacyPolicy),
  },
  {
    path: 'terms-of-service',
    element: createElement(TermsOfService),
  },
  {
    path: 'cookie-policy',
    element: createElement(CookiePolicy),
  },

  // Event creation (public access)
  {
    path: 'create-event',
    element: createElement(CreateEvent),
  },
  {
    path: 'create-event-stepwise',
    element: createElement(CreateEventStepwise),
  },

  // Auth demo
  {
    path: 'auth-demo',
    element: createElement(AuthDemo),
  },

  // Event pages
  {
    path: 'event/:id',
    element: createElement(EventDetails),
  },
  {
    path: 'event/:id/register',
    element: createElement(RegisterEvent),
  },
  {
    path: 'event/:id/payment',
    element: createElement(Payment),
  },
  {
    path: 'event/:id/confirmation',
    element: createElement(Confirmation),
  },
  {
    path: 'event/:id/registration-confirmation',
    element: createElement(RegistrationConfirmation),
  },

  // Public forms
  {
    path: 'forms/:type/:templateId',
    element: createElement(PublicEventForm),
  },

  // Feedback (token-based access)
  {
    path: 'feedback/:token',
    element: createElement(FeedbackPage),
  },

  // Exhibitors (public access)
  {
    path: 'exhibitors/:id',
    element: createElement(ExhibitorDetails),
  },

  // Support
  {
    path: 'support',
    element: createElement(Support),
  },

  // Public ticket view (works with or without auth, uses email verification)
  {
    path: 'tickets/:registrationId/view',
    element: createElement(TicketViewPage),
  },

  // Post-event survey (linked from email)
  {
    path: 'events/:eventId/survey',
    element: createElement(EventSurveyPage),
  },

  // Ticket transfer acceptance (public, works with or without auth)
  {
    path: 'tickets/transfer/accept',
    element: createElement(TransferAccept),
  },

  // Paystack / Stripe payment callback after redirect from gateway
  {
    path: 'payment/callback',
    element: createElement(PaymentCallback),
  },

  // Top-level confirmation page (reached after payment callback)
  {
    path: 'confirmation',
    element: createElement(Confirmation),
  },

  // 404 - Catch all unknown routes
  {
    path: '*',
    element: createElement(NotFound),
  },
];
