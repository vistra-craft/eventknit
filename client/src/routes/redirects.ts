/**
 * Legacy Route Redirects
 * Comprehensive mapping of deprecated organizer routes to new unified dashboard routes
 *
 * These redirects ensure backward compatibility with bookmarked URLs, email links,
 * and any external references to the old organizer dashboard structure.
 */

export const LEGACY_REDIRECTS = {
  // Dashboard redirects
  '/dashboard': '/user/dashboard',
  '/organizer/dashboard': '/user/dashboard',
  '/organizer': '/user/dashboard',

  // Event list redirects
  '/organizer/events': '/user/dashboard?tab=organizing',
  '/organizer/my-events': '/user/dashboard?tab=organizing',

  // Event creation redirects
  '/organizer/events/create': '/user/create-event',
  '/organizer/events/create-standalone': '/user/create-event',
  '/organizer/create-event': '/user/create-event',

  // Event management redirects (dynamic - requires parameter handling)
  '/organizer/event/:eventId': '/user/manage-events/:eventId',
  '/organizer/events/:eventId': '/user/manage-events/:eventId',
  '/organizer/events/:eventId/edit': '/user/manage-events/:eventId',
  '/organizer/events/:eventId/manage': '/user/manage-events/:eventId',

  // Event-specific sections with query params
  '/organizer/event/:eventId/overview': '/user/manage-events/:eventId?tab=overview',
  '/organizer/event/:eventId/registrations': '/user/manage-events/:eventId?tab=registrations',
  '/organizer/event/:eventId/attendees': '/user/manage-events/:eventId?tab=registrations',
  '/organizer/event/:eventId/communication': '/user/manage-events/:eventId?tab=communication',
  '/organizer/event/:eventId/analytics': '/user/manage-events/:eventId?tab=analytics',
  '/organizer/event/:eventId/team': '/user/manage-events/:eventId?tab=team',
  '/organizer/event/:eventId/settings': '/user/manage-events/:eventId?tab=settings',

  // Analytics redirects
  '/organizer/analytics': '/user/analytics',
  '/organizer/reports': '/user/analytics',

  // Profile/Settings redirects
  '/organizer/profile': '/user/profile',
  '/organizer/settings': '/user/profile',
  '/organizer/account': '/user/profile',
} as const;

/**
 * Redirect helper function
 * Replaces :eventId parameters with actual values
 */
export const getRedirectPath = (oldPath: string, params?: Record<string, string>): string => {
  let redirectPath: string | undefined = LEGACY_REDIRECTS[oldPath as keyof typeof LEGACY_REDIRECTS];

  if (!redirectPath) {
    // Try to find a matching pattern for dynamic routes
    const dynamicMatch = Object.entries(LEGACY_REDIRECTS).find(([pattern]) => {
      return pattern.includes(':eventId') && oldPath.match(pattern.replace(':eventId', '[^/]+'));
    });

    if (dynamicMatch) {
      redirectPath = dynamicMatch[1];
    }
  }

  // Replace parameters if provided
  if (redirectPath && params) {
    Object.entries(params).forEach(([key, value]) => {
      redirectPath = redirectPath!.replace(`:${key}`, value);
    });
  }

  return redirectPath || oldPath;
};

/**
 * Check if a path is a legacy route that needs redirection
 */
export const isLegacyRoute = (path: string): boolean => {
  return path.startsWith('/organizer/') || path === '/organizer';
};

/**
 * Migration notes for developers:
 *
 * 1. All /organizer/* routes have been consolidated into /user/* routes
 * 2. The unified dashboard supports both attending and organizing modes
 * 3. Event management is now accessed via /user/manage-events/:eventId
 * 4. Event creation is role-aware at /user/create-event
 * 5. Analytics and profile routes are now under /user/*
 *
 * When updating code:
 * - Replace navigate('/organizer/dashboard') with navigate('/user/dashboard')
 * - Replace navigate('/organizer/events/create') with navigate('/user/create-event')
 * - Replace navigate('/organizer/event/:id') with navigate('/user/manage-events/:id')
 * - Update any hardcoded links in email templates or external documentation
 */
