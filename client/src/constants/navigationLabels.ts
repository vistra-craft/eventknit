/**
 * Navigation Label Constants
 * User-friendly labels for navigation items and pages
 *
 * Strategy: Centralize all navigation text for consistency
 * and easier future updates.
 *
 * Based on UNIFIED_DASHBOARD_PLAN.md and industry best practices
 */

/**
 * Navigation item labels
 */
export const NAV_LABELS = {
  // Unified Dashboard
  MY_EVENTS: 'My Events',
  ATTENDING: 'Attending',
  ORGANIZING: 'Organizing',
  SAVED: 'Saved',
  CREATE_EVENT: 'Create Event',

  // Attendee Features
  MY_TICKETS: 'My Tickets',
  DISCOVER: 'Discover Events',
  BROWSE_EVENTS: 'Browse Events',
  SEARCH: 'Search',
  RECOMMENDATIONS: 'Recommendations',
  FEED: 'Feed',
  SAVED_EVENTS: 'Saved Events',
  COLLECTIONS: 'Collections',

  // Organizer Features
  MANAGE_EVENTS: 'Manage Events',
  EVENT_MANAGEMENT: 'Event Management',
  ANALYTICS: 'Analytics',
  MARKETING: 'Marketing',
  TEAM: 'Team',
  FINANCE: 'Finance',

  // Event Management Tabs
  OVERVIEW: 'Overview',
  REGISTRATIONS: 'Registrations',
  COMMUNICATION: 'Communication',
  ATTENDEES: 'Attendees',
  SALES: 'Sales',
  SETTINGS: 'Settings',
  CHECK_IN: 'Check-In',
  MESSAGES: 'Messages',

  // User Features
  PROFILE: 'Profile',
  NOTIFICATIONS: 'Notifications',
  WALLET: 'Wallet',
  SETTINGS_USER: 'Settings',

  // Actions
  SWITCH_TO_ORGANIZER: 'Become an Organizer',
  SWITCH_TO_ATTENDEE: 'Browse Events',
  UPGRADE_TO_ORGANIZER: 'Start Organizing Events',
} as const;

/**
 * Page titles (for h1, document.title, breadcrumbs)
 */
export const PAGE_TITLES = {
  // Dashboard
  MY_EVENTS: 'My Events',
  DASHBOARD: 'Dashboard',
  HOME: 'Home',

  // Events
  ATTENDING_EVENTS: 'Events I\'m Attending',
  ORGANIZING_EVENTS: 'Events I\'m Organizing',
  SAVED_EVENTS: 'Saved Events',
  CREATE_EVENT: 'Create Event',
  MANAGE_EVENT: 'Manage Event',
  EVENT_DETAILS: 'Event Details',
  EDIT_EVENT: 'Edit Event',

  // Tickets
  MY_TICKETS: 'My Tickets',
  TICKET_DETAILS: 'Ticket Details',
  TRANSFER_TICKET: 'Transfer Ticket',
  TICKET_RESALE: 'Ticket Resale',

  // Discovery
  DISCOVER: 'Discover Events',
  SEARCH_RESULTS: 'Search Results',
  RECOMMENDATIONS: 'Recommended Events',
  EVENT_FEED: 'Event Feed',
  COLLECTIONS: 'Event Collections',

  // Event Management
  EVENT_OVERVIEW: 'Event Overview',
  REGISTRATIONS: 'Registrations',
  ATTENDEE_LIST: 'Attendees',
  EVENT_ANALYTICS: 'Event Analytics',
  EVENT_MESSAGES: 'Messages',
  CHECK_IN: 'Check-In',
  TEAM_MANAGEMENT: 'Team',
  EVENT_SETTINGS: 'Event Settings',

  // User
  PROFILE: 'My Profile',
  NOTIFICATIONS: 'Notifications',
  NOTIFICATION_PREFERENCES: 'Notification Preferences',
  WALLET: 'My Wallet',
  USER_SETTINGS: 'Settings',
  INTERESTS: 'My Interests',

  // Organizer
  ORGANIZER_ANALYTICS: 'Analytics Dashboard',
  PROMO_CODES: 'Promo Codes',
  FINANCIAL_OVERVIEW: 'Financial Overview',

  // Networking
  NETWORKING: 'Networking',
  ATTENDEE_PROFILE: 'Attendee Profile',
  MESSAGES_INBOX: 'Messages',

  // Onboarding
  WELCOME: 'Welcome',
  GETTING_STARTED: 'Getting Started',
  SETUP_COMPLETE: 'Setup Complete',
} as const;

/**
 * Button and CTA labels
 */
export const CTA_LABELS = {
  // Event Actions
  CREATE_EVENT: 'Create Event',
  CREATE_FIRST_EVENT: 'Create Your First Event',
  VIEW_EVENT: 'View Event',
  MANAGE_EVENT: 'Manage Event',
  EDIT_EVENT: 'Edit Event',
  DUPLICATE_EVENT: 'Duplicate Event',
  CANCEL_EVENT: 'Cancel Event',
  PUBLISH_EVENT: 'Publish Event',

  // Registration Actions
  REGISTER: 'Register',
  REGISTER_NOW: 'Register Now',
  BUY_TICKETS: 'Buy Tickets',
  GET_TICKETS: 'Get Tickets',

  // Ticket Actions
  VIEW_TICKET: 'View Ticket',
  DOWNLOAD_TICKET: 'Download Ticket',
  TRANSFER_TICKET: 'Transfer Ticket',
  SHARE_EVENT: 'Share Event',

  // Save Actions
  SAVE_EVENT: 'Save Event',
  REMOVE_FROM_SAVED: 'Remove from Saved',
  ADD_TO_COLLECTION: 'Add to Collection',

  // Role Actions
  BECOME_ORGANIZER: 'Become an Organizer',
  UPGRADE_TO_ORGANIZER: 'Upgrade to Organizer',
  START_ORGANIZING: 'Start Organizing',

  // Navigation
  BACK: 'Back',
  CONTINUE: 'Continue',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  DONE: 'Done',
  CLOSE: 'Close',

  // Filters
  FILTER: 'Filter',
  CLEAR_FILTERS: 'Clear Filters',
  APPLY_FILTERS: 'Apply Filters',
  SORT_BY: 'Sort By',

  // Search
  SEARCH: 'Search',
  SEARCH_EVENTS: 'Search Events',
  ADVANCED_SEARCH: 'Advanced Search',
} as const;

/**
 * Description text for empty states
 */
export const EMPTY_STATE_MESSAGES = {
  NO_ATTENDING_EVENTS: 'You haven\'t registered for any events yet.',
  NO_ORGANIZING_EVENTS: 'You haven\'t created any events yet.',
  NO_SAVED_EVENTS: 'You haven\'t saved any events yet.',
  NO_TICKETS: 'You don\'t have any tickets yet.',
  NO_NOTIFICATIONS: 'No new notifications.',
  NO_SEARCH_RESULTS: 'No events found matching your search.',
  NO_RECOMMENDATIONS: 'We don\'t have any recommendations for you yet.',
  NO_COLLECTIONS: 'You haven\'t created any collections yet.',
} as const;

/**
 * Empty state CTA descriptions
 */
export const EMPTY_STATE_CTAS = {
  ATTENDING: 'Discover events and register to see them here.',
  ORGANIZING: 'Create your first event and start building your community.',
  SAVED: 'Browse events and save your favorites.',
  TICKETS: 'Register for events to get tickets.',
  COLLECTIONS: 'Create collections to organize your favorite events.',
} as const;

/**
 * Mode labels for unified dashboard
 */
export const MODE_LABELS = {
  ATTENDING: 'Attending Mode',
  ORGANIZING: 'Organizing Mode',
  ATTENDING_SHORT: 'Attending',
  ORGANIZING_SHORT: 'Organizing',
  SWITCH_TO_ATTENDING: 'Switch to Attending',
  SWITCH_TO_ORGANIZING: 'Switch to Organizing',
} as const;

/**
 * Tab labels
 */
export const TAB_LABELS = {
  ALL: 'All',
  ATTENDING: 'Attending',
  ORGANIZING: 'Organizing',
  SAVED: 'Saved',
  UPCOMING: 'Upcoming',
  PAST: 'Past',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  PENDING: 'Pending',
} as const;

/**
 * Helper type for extracting label values
 */
export type NavLabel = typeof NAV_LABELS[keyof typeof NAV_LABELS];
export type PageTitle = typeof PAGE_TITLES[keyof typeof PAGE_TITLES];
export type CTALabel = typeof CTA_LABELS[keyof typeof CTA_LABELS];
export type EmptyStateMessage = typeof EMPTY_STATE_MESSAGES[keyof typeof EMPTY_STATE_MESSAGES];
export type ModeLabel = typeof MODE_LABELS[keyof typeof MODE_LABELS];
export type TabLabel = typeof TAB_LABELS[keyof typeof TAB_LABELS];
