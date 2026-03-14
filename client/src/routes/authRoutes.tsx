/**
 * Authentication Routes
 * All routes under /auth/* path
 */

import { lazy, createElement } from 'react';
import type { RouteConfig } from './types';

// Lazy load auth page components
const SignIn = lazy(() => import('../pages/auth/SignIn'));
const SignUp = lazy(() => import('../pages/auth/SignUp'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const MagicLinkVerify = lazy(() => import('../pages/auth/MagicLinkVerify'));
const CreateAccount = lazy(() => import('../pages/auth/CreateAccount'));
const AcceptStaffInvite = lazy(() => import('../pages/auth/AcceptStaffInvite'));
const OrganizerRegistration = lazy(() => import('../pages/auth/OrganizerRegistration'));
const AttendeeRegistration = lazy(() => import('../pages/auth/AttendeeRegistration'));
const NotFound = lazy(() => import('../pages/NotFound'));

/**
 * Auth route definitions
 * All routes are public (no authentication required)
 */
export const authRoutes: RouteConfig[] = [
  {
    path: 'signin',
    element: createElement(SignIn),
  },
  {
    path: 'signup',
    element: createElement(SignUp),
  },
  {
    path: 'register',
    element: createElement(SignUp),
  },
  {
    path: 'register/organizer',
    element: createElement(OrganizerRegistration),
  },
  {
    path: 'register/attendee',
    element: createElement(AttendeeRegistration),
  },
  {
    path: 'forgot-password',
    element: createElement(ForgotPassword),
  },
  {
    path: 'reset-password',
    element: createElement(ResetPassword),
  },
  {
    path: 'magic-link/verify',
    element: createElement(MagicLinkVerify),
  },
  {
    path: 'create-account',
    element: createElement(CreateAccount),
  },
  {
    path: 'accept-invite',
    element: createElement(AcceptStaffInvite),
  },
  {
    path: '*',
    element: createElement(NotFound),
  },
];
