/**
 * User Dashboard API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPatch, type ApiResponse } from "./api";
import type { User } from "@/types/auth";
import type {
  EventRecommendation,
  UserActivity,
  EventReview,
  TicketTransfer,
  EventCollection,
  CollectionItem,
  UserInterest,
  SavedSearch,
  SearchFilters,
  DirectMessage,
  UserProfile,
  UserFollow,
  EventShare,
  SharePlatformStats,
  TicketResale,
  UserWallet,
  WalletTicket,
  WalletPassData,
  CalendarSync,
  CalendarEventData,
  CalendarType,
  UserFeed,
  EventSubscription,
} from "@/types/user-dashboard";

/**
 * Check if user is registered for an event
 */
export const getRegistrationStatus = async (eventId: string): Promise<ApiResponse<{ isRegistered: boolean; registrationId: string | null; status: string | null }>> => {
  return apiGet(`/user-dashboard/registration-status/${eventId}`);
};

/**
 * Get personalized event recommendations
 */
export const getPersonalizedRecommendations = async (limit?: number): Promise<ApiResponse<{ recommendations: EventRecommendation[] }>> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/recommendations?${queryString}` : '/user-dashboard/recommendations';
  return apiGet<ApiResponse<{ recommendations: EventRecommendation[] }>>(endpoint);
};

/**
 * Get personal analytics
 */
export const getPersonalAnalytics = async (): Promise<ApiResponse<{
  totalEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  totalSpent: number;
  registrationsByCategory: Array<{ category: string; count: number }>;
  registrationsByMonth: Array<{ month: string; count: number }>;
  favoriteCategories: Array<{ category: string; count: number }>;
}>> => {
  return apiGet('/user-dashboard/analytics');
};

/**
 * Get activity history
 */
export const getActivityHistory = async (filters?: {
  page?: number;
  limit?: number;
  activityType?: string;
}): Promise<ApiResponse<{
  activities: UserActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.activityType) queryParams.append('activityType', filters.activityType);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/activity-history?${queryString}` : '/user-dashboard/activity-history';
  return apiGet(endpoint);
};

/**
 * Create or update event review
 */
export const createEventReview = async (eventId: string, data: {
  rating: number;
  title?: string;
  review?: string;
  pros?: string[];
  cons?: string[];
  registrationId?: string;
}): Promise<ApiResponse<{ review: EventReview }>> => {
  return apiPost(`/user-dashboard/events/${eventId}/reviews`, data);
};

/**
 * Get event reviews
 */
export const getEventReviews = async (eventId: string, filters?: {
  page?: number;
  limit?: number;
  rating?: number;
}): Promise<ApiResponse<{
  reviews: EventReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  averageRating: number;
  totalReviews: number;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.rating) queryParams.append('rating', filters.rating.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/events/${eventId}/reviews?${queryString}` : `/user-dashboard/events/${eventId}/reviews`;
  return apiGet(endpoint);
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<ApiResponse<{ review: EventReview }>> => {
  return apiPost(`/user-dashboard/reviews/${reviewId}/helpful`);
};

/**
 * Get transfer details by token (public, no auth required)
 */
export const getTransferByToken = async (token: string): Promise<ApiResponse<{ transfer: {
  id: string;
  status: string;
  expiresAt: string;
  message?: string;
  ticketType?: string;
  quantity: number;
  fromUser: { firstName: string; lastName: string };
  event: {
    id: string;
    title: string;
    image?: string;
    startDate: string;
    endDate?: string;
    venue?: string;
    location?: string;
  };
  createdAt: string;
} }>> => {
  return apiGet(`/user-dashboard/transfers/token/${token}`);
};

/**
 * Initiate ticket transfer
 */
export const initiateTicketTransfer = async (registrationId: string, data: {
  toUserId?: string;
  toEmail?: string;
  message?: string;
}): Promise<ApiResponse<{ transfer: TicketTransfer }>> => {
  return apiPost(`/user-dashboard/transfers/${registrationId}`, data);
};

/**
 * Accept ticket transfer
 */
export const acceptTicketTransfer = async (transferToken: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return apiPost(`/user-dashboard/transfers/accept/${transferToken}`);
};

/**
 * Cancel ticket transfer
 */
export const cancelTicketTransfer = async (transferId: string): Promise<ApiResponse<{ transfer: TicketTransfer }>> => {
  return apiPost(`/user-dashboard/transfers/${transferId}/cancel`);
};

/**
 * Get transfer history
 */
export const getTransferHistory = async (filters?: {
  page?: number;
  limit?: number;
  type?: 'sent' | 'received';
}): Promise<ApiResponse<{
  transfers: TicketTransfer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.type) queryParams.append('type', filters.type);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/transfers?${queryString}` : '/user-dashboard/transfers';
  return apiGet(endpoint);
};

/**
 * Event Collections
 */
export const createCollection = async (data: {
  name: string;
  description?: string;
  isPublic?: boolean;
  coverImage?: string;
}): Promise<ApiResponse<{ collection: EventCollection }>> => {
  return apiPost('/user-dashboard/collections', data);
};

export const getUserCollections = async (filters?: {
  page?: number;
  limit?: number;
  isPublic?: boolean;
}): Promise<ApiResponse<{
  collections: EventCollection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.isPublic !== undefined) queryParams.append('isPublic', filters.isPublic.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/collections?${queryString}` : '/user-dashboard/collections';
  return apiGet(endpoint);
};

export const getPublicCollections = async (filters?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  collections: EventCollection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/collections/public?${queryString}` : '/user-dashboard/collections/public';
  return apiGet(endpoint);
};

export const getCollectionById = async (collectionId: string): Promise<ApiResponse<{ collection: EventCollection }>> => {
  return apiGet(`/user-dashboard/collections/${collectionId}`);
};

export const addEventToCollection = async (collectionId: string, eventId: string, notes?: string): Promise<ApiResponse<{ item: CollectionItem }>> => {
  return apiPost(`/user-dashboard/collections/${collectionId}/events/${eventId}`, { notes });
};

export const removeEventFromCollection = async (collectionId: string, eventId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/user-dashboard/collections/${collectionId}/events/${eventId}`);
};

export const toggleFollowCollection = async (collectionId: string): Promise<ApiResponse<{ isFollowing: boolean }>> => {
  return apiPost(`/user-dashboard/collections/${collectionId}/follow`);
};

export const updateCollection = async (collectionId: string, data: {
  name?: string;
  description?: string;
  isPublic?: boolean;
  coverImage?: string;
}): Promise<ApiResponse<{ collection: EventCollection }>> => {
  return apiPut(`/user-dashboard/collections/${collectionId}`, data);
};

export const deleteCollection = async (collectionId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/user-dashboard/collections/${collectionId}`);
};

/**
 * User Interests
 */
export const upsertInterest = async (data: {
  category: string;
  subcategory?: string;
  tags?: string[];
  weight?: number;
}): Promise<ApiResponse<{ interest: UserInterest }>> => {
  return apiPost('/user-dashboard/interests', data);
};

export const getUserInterests = async (): Promise<ApiResponse<{ interests: UserInterest[] }>> => {
  return apiGet('/user-dashboard/interests');
};

export const removeInterest = async (category: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/user-dashboard/interests/${category}`);
};

export const updateInterestWeight = async (category: string, weight: number): Promise<ApiResponse<{ interest: UserInterest }>> => {
  return apiPatch(`/user-dashboard/interests/${category}/weight`, { weight });
};

/**
 * Saved Searches
 */
export const createSavedSearch = async (data: {
  name: string;
  searchQuery: string;
  filters?: SearchFilters;
  notifyOnNewEvents?: boolean;
  notificationFrequency?: string;
}): Promise<ApiResponse<{ search: SavedSearch }>> => {
  return apiPost('/user-dashboard/saved-searches', data);
};

export const getUserSavedSearches = async (): Promise<ApiResponse<{ searches: SavedSearch[] }>> => {
  return apiGet('/user-dashboard/saved-searches');
};

export const updateSavedSearch = async (searchId: string, data: {
  name?: string;
  searchQuery?: string;
  filters?: SearchFilters;
  notifyOnNewEvents?: boolean;
  notificationFrequency?: string;
}): Promise<ApiResponse<{ search: SavedSearch }>> => {
  return apiPut(`/user-dashboard/saved-searches/${searchId}`, data);
};

export const deleteSavedSearch = async (searchId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/user-dashboard/saved-searches/${searchId}`);
};

export const executeSavedSearch = async (searchId: string): Promise<ApiResponse<{
  searchQuery: string;
  filters: SearchFilters;
}>> => {
  return apiPost(`/user-dashboard/saved-searches/${searchId}/execute`);
};

/**
 * Direct Messaging
 */
export const sendMessage = async (data: {
  recipientId: string;
  subject?: string;
  content: string;
  eventId?: string;
  registrationId?: string;
  parentMessageId?: string;
}): Promise<ApiResponse<{ message: DirectMessage }>> => {
  return apiPost('/user-dashboard/messages', data);
};

export const getInbox = async (filters?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}): Promise<ApiResponse<{
  messages: DirectMessage[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.isRead !== undefined) queryParams.append('isRead', filters.isRead.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/messages/inbox?${queryString}` : '/user-dashboard/messages/inbox';
  return apiGet(endpoint);
};

export const getSentMessages = async (filters?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  messages: DirectMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/messages/sent?${queryString}` : '/user-dashboard/messages/sent';
  return apiGet(endpoint);
};

export const getMessageThread = async (messageId: string): Promise<ApiResponse<{ message: DirectMessage }>> => {
  return apiGet(`/user-dashboard/messages/${messageId}`);
};

export const markMessageAsRead = async (messageId: string): Promise<ApiResponse<{ message: DirectMessage }>> => {
  return apiPost(`/user-dashboard/messages/${messageId}/read`);
};

export const deleteMessage = async (messageId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/user-dashboard/messages/${messageId}`);
};

/**
 * Social Networking
 */
export const followUser = async (userId: string): Promise<ApiResponse<{ follow: UserFollow }>> => {
  return apiPost(`/user-dashboard/social/follow/${userId}`);
};

export const unfollowUser = async (userId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/user-dashboard/social/unfollow/${userId}`);
};

export const getFollowers = async (userId: string, filters?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  followers: UserFollow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/social/followers/${userId}?${queryString}` : `/user-dashboard/social/followers/${userId}`;
  return apiGet(endpoint);
};

export const getFollowing = async (userId: string, filters?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  following: UserFollow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/social/following/${userId}?${queryString}` : `/user-dashboard/social/following/${userId}`;
  return apiGet(endpoint);
};

export const isFollowing = async (userId: string): Promise<ApiResponse<{ isFollowing: boolean }>> => {
  return apiGet(`/user-dashboard/social/is-following/${userId}`);
};

export const getUserProfile = async (userId: string): Promise<ApiResponse<{ profile: UserProfile }>> => {
  return apiGet(`/user-dashboard/social/profile/${userId}`);
};

/**
 * Event Sharing
 */
export const trackEventShare = async (eventId: string, data: {
  platform: string;
  shareUrl?: string;
  referrer?: string;
}): Promise<ApiResponse<{ share: EventShare }>> => {
  return apiPost(`/user-dashboard/events/${eventId}/share`, data);
};

export const getEventShareAnalytics = async (eventId: string): Promise<ApiResponse<{
  totalShares: number;
  totalClicks: number;
  totalConversions: number;
  platformStats: SharePlatformStats[];
  recentShares: EventShare[];
}>> => {
  return apiGet(`/user-dashboard/events/${eventId}/share/analytics`);
};

// ========== Ticket Resale ==========
export const listTicketForResale = async (data: {
  registrationId: string;
  resalePrice: number;
  expiresAt?: string;
}): Promise<ApiResponse<{ resale: TicketResale }>> => {
  return apiPost('/user-dashboard/resale/list', data);
};

export const getMarketplaceTickets = async (filters?: {
  eventId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  tickets: TicketResale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/resale/marketplace?${queryString}` : '/user-dashboard/resale/marketplace';
  return apiGet(endpoint);
};

export const getUserResales = async (status?: string): Promise<ApiResponse<{ resales: TicketResale[] }>> => {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/resale/my-listings?${queryString}` : '/user-dashboard/resale/my-listings';
  return apiGet(endpoint);
};

/** @deprecated Use initializeResalePayment + verifyResalePayment instead */
export const purchaseResaleTicket = async (resaleId: string): Promise<ApiResponse<{ message: string }>> => {
  return apiPost(`/user-dashboard/resale/${resaleId}/purchase`, {});
};

export const initializeResalePayment = async (resaleId: string): Promise<ApiResponse<{
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}>> => {
  return apiPost(`/user-dashboard/resale/${resaleId}/initialize-payment`, {});
};

export const verifyResalePayment = async (reference: string): Promise<ApiResponse<{
  success: boolean;
  message: string;
  registrationId: string;
}>> => {
  return apiGet(`/user-dashboard/resale/verify-payment?reference=${encodeURIComponent(reference)}`);
};

export const cancelResale = async (resaleId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/user-dashboard/resale/${resaleId}/cancel`, {});
};

// ========== Digital Wallet ==========
export const getWallet = async (): Promise<ApiResponse<{ wallet: UserWallet }>> => {
  return apiGet('/user-dashboard/wallet');
};

export const addTicketToWallet = async (registrationId: string): Promise<ApiResponse<{ walletTicket: WalletTicket }>> => {
  return apiPost('/user-dashboard/wallet/add', { registrationId });
};

export const removeTicketFromWallet = async (registrationId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/user-dashboard/wallet/${registrationId}`);
};

export const updateWalletPreferences = async (data: {
  autoAddTickets?: boolean;
  backupEnabled?: boolean;
}): Promise<ApiResponse<{ wallet: UserWallet }>> => {
  return apiPut('/user-dashboard/wallet/preferences', data);
};

export const generateAppleWalletPass = async (registrationId: string): Promise<ApiResponse<{
  passData: WalletPassData;
  downloadUrl: string;
}>> => {
  return apiGet(`/user-dashboard/wallet/${registrationId}/apple-pass`);
};

export const generateGooglePayPass = async (registrationId: string): Promise<ApiResponse<{
  passData: WalletPassData;
  saveUrl: string;
}>> => {
  return apiGet(`/user-dashboard/wallet/${registrationId}/google-pass`);
};

// ========== Event Calendar Integration ==========
export const syncToCalendar = async (data: {
  registrationId: string;
  calendarType: CalendarType;
  reminderMinutes?: number;
}): Promise<ApiResponse<{ sync: CalendarSync; calendarData: CalendarEventData }>> => {
  return apiPost('/user-dashboard/calendar/sync', data);
};

export const getUserCalendarSyncs = async (): Promise<ApiResponse<{ syncs: CalendarSync[] }>> => {
  return apiGet('/user-dashboard/calendar/syncs');
};

export const removeCalendarSync = async (syncId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/user-dashboard/calendar/syncs/${syncId}`);
};

// ========== Personal Event Feed ==========
export const getFeed = async (): Promise<ApiResponse<{ feed: UserFeed }>> => {
  return apiGet('/user-dashboard/feed');
};

export const refreshFeed = async (): Promise<ApiResponse<{ success: boolean; itemsAdded: number }>> => {
  return apiPost('/user-dashboard/feed/refresh', {});
};

export const updateFeedPreferences = async (data: {
  preferences?: UserFeed['preferences'];
  filters?: UserFeed['filters'];
}): Promise<ApiResponse<{ feed: UserFeed }>> => {
  return apiPut('/user-dashboard/feed/preferences', data);
};

export const markFeedItemViewed = async (itemId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/user-dashboard/feed/items/${itemId}/viewed`, {});
};

export const dismissFeedItem = async (itemId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/user-dashboard/feed/items/${itemId}/dismiss`, {});
};

// ========== Event Updates Subscription ==========
export const subscribeToEvent = async (data: {
  eventId: string;
  updateTypes?: string[];
  channels?: string[];
}): Promise<ApiResponse<{ subscription: EventSubscription }>> => {
  return apiPost(`/user-dashboard/events/${data.eventId}/subscribe`, data);
};

export const unsubscribeFromEvent = async (eventId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/user-dashboard/events/${eventId}/unsubscribe`, {});
};

export const getUserSubscriptions = async (activeOnly?: boolean): Promise<ApiResponse<{ subscriptions: EventSubscription[] }>> => {
  const queryParams = new URLSearchParams();
  if (activeOnly !== undefined) queryParams.append('activeOnly', activeOnly.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/user-dashboard/subscriptions?${queryString}` : '/user-dashboard/subscriptions';
  return apiGet(endpoint);
};

export const updateSubscriptionPreferences = async (eventId: string, data: {
  updateTypes?: string[];
  channels?: string[];
}): Promise<ApiResponse<{ subscription: EventSubscription }>> => {
  return apiPut(`/user-dashboard/subscriptions/${eventId}/preferences`, data);
};

// ========== Role Switching ==========

export interface RoleSwitchOptions {
  currentRole: string;
  canBecomeOrganizer: boolean;
  canBecomeAttendee: boolean;
  hasOrganizerHistory: boolean;
  blockedReason?: string;
}

/**
 * Get available role switch options for the current user
 */
export const getRoleSwitchOptions = async (): Promise<ApiResponse<RoleSwitchOptions>> => {
  return apiGet('/user/role-switch/options');
};

/**
 * Switch from ATTENDEE to ORGANIZER role
 */
export const becomeOrganizer = async (data: {
  organizationName: string;
  businessEmail?: string;
  description?: string;
}): Promise<ApiResponse<{ user: User }>> => {
  return apiPost('/user/role-switch/become-organizer', data);
};

/**
 * Request organizer approval (sets status to PENDING_APPROVAL, triggers emails)
 */
export const requestOrganizerApproval = async (): Promise<ApiResponse<{ user: User }>> => {
  return apiPost('/user/role-switch/request-approval', {});
};

/**
 * Switch from ORGANIZER to ATTENDEE role
 */
export const becomeAttendee = async (): Promise<ApiResponse<{ user: User }>> => {
  return apiPost('/user/role-switch/become-attendee', {});
};

