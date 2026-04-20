/**
 * User Dashboard Types
 *
 * Type definitions for user dashboard API responses.
 */

import type { EventData } from './event';

// ========== Common Types ==========

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ========== Recommendations ==========

export interface EventRecommendation {
  id: string;
  event: EventData;
  score: number;
  reason: string;
  matchedInterests?: string[];
}

// ========== Activity History ==========

export type ActivityType =
  | 'REGISTRATION'
  | 'CANCELLATION'
  | 'PAYMENT'
  | 'REFUND'
  | 'REVIEW'
  | 'TRANSFER'
  | 'COLLECTION_CREATE'
  | 'FOLLOW'
  | 'SHARE';

export interface UserActivity {
  id: string;
  type: ActivityType;
  description: string;
  eventId?: string;
  eventTitle?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ========== Reviews ==========

export interface EventReview {
  id: string;
  userId: string;
  eventId: string;
  registrationId?: string;
  rating: number;
  title?: string;
  review?: string;
  pros?: string[];
  cons?: string[];
  helpfulCount: number;
  isVerified: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ========== Ticket Transfers ==========

export type TransferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface TicketTransfer {
  id: string;
  registrationId: string;
  fromUserId: string;
  toUserId?: string;
  toEmail?: string;
  message?: string;
  status: TransferStatus;
  transferToken: string;
  expiresAt: string;
  acceptedAt?: string;
  fromUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  toUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  registration?: {
    id: string;
    eventId: string;
    event?: EventData;
  };
  createdAt: string;
  updatedAt: string;
}

// ========== Collections ==========

export interface EventCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  itemCount: number;
  followerCount: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  items?: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  eventId: string;
  notes?: string;
  event?: EventData;
  addedAt: string;
}

// ========== User Interests ==========

export interface UserInterest {
  id: string;
  userId: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  weight: number;
  createdAt: string;
  updatedAt: string;
}

// ========== Saved Searches ==========

export interface SearchFilters {
  category?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  isOnline?: boolean;
  [key: string]: unknown;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  searchQuery: string;
  filters?: SearchFilters;
  notifyOnNewEvents: boolean;
  notificationFrequency?: string;
  lastExecutedAt?: string;
  resultCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ========== Messaging ==========

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  subject?: string;
  content: string;
  eventId?: string;
  registrationId?: string;
  parentMessageId?: string;
  isRead: boolean;
  readAt?: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  recipient?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  event?: EventData;
  replies?: DirectMessage[];
  createdAt: string;
  updatedAt: string;
}

// ========== Social Networking ==========

export interface UserFollow {
  id: string;
  followerId: string;
  followingId: string;
  follower?: UserProfile;
  following?: UserProfile;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  eventCount?: number;
  publicCollections?: EventCollection[];
  recentActivity?: UserActivity[];
}

// ========== Event Sharing ==========

export type SharePlatform = 'TWITTER' | 'FACEBOOK' | 'LINKEDIN' | 'WHATSAPP' | 'EMAIL' | 'COPY_LINK' | 'OTHER';

export interface EventShare {
  id: string;
  userId: string;
  eventId: string;
  platform: SharePlatform;
  shareUrl?: string;
  referrer?: string;
  clickCount: number;
  conversionCount: number;
  createdAt: string;
}

export interface SharePlatformStats {
  platform: SharePlatform;
  shares: number;
  clicks: number;
  conversions: number;
}

// ========== Ticket Resale ==========

export type ResaleStatus = 'LISTED' | 'RESERVED' | 'SOLD' | 'CANCELLED' | 'EXPIRED';

export interface TicketResale {
  id: string;
  registrationId: string;
  sellerId: string;
  buyerId?: string;
  originalPrice: number;
  resalePrice: number;
  status: ResaleStatus;
  expiresAt?: string;
  soldAt?: string;
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  registration?: {
    id: string;
    eventId: string;
    ticketType?: string;
    event?: EventData;
  };
  createdAt: string;
  updatedAt: string;
}

// ========== Digital Wallet ==========

export interface WalletTicket {
  id: string;
  walletId: string;
  registrationId: string;
  addedAt: string;
  registration?: {
    id: string;
    eventId: string;
    ticketType?: string;
    qrCode?: string;
    event?: EventData;
  };
}

export interface UserWallet {
  id: string;
  userId: string;
  autoAddTickets: boolean;
  backupEnabled: boolean;
  tickets: WalletTicket[];
  ticketCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletPassData {
  type: 'APPLE' | 'GOOGLE';
  passId: string;
  serialNumber: string;
  barcode: string;
  eventInfo: {
    title: string;
    date: string;
    venue: string;
  };
}

// ========== Calendar Integration ==========

export type CalendarType = 'GOOGLE' | 'APPLE' | 'OUTLOOK' | 'ICAL';

export interface CalendarSync {
  id: string;
  userId: string;
  registrationId: string;
  calendarType: CalendarType;
  calendarEventId?: string;
  reminderMinutes?: number;
  registration?: {
    id: string;
    eventId: string;
    event?: EventData;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  url?: string;
  reminders?: number[];
}

// ========== Personal Event Feed ==========

export type FeedItemType =
  | 'RECOMMENDED_EVENT'
  | 'FOLLOWED_USER_ACTIVITY'
  | 'INTEREST_MATCH'
  | 'SAVED_SEARCH_RESULT'
  | 'COLLECTION_UPDATE'
  | 'TRENDING_EVENT';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  eventId?: string;
  event?: EventData;
  userId?: string;
  user?: UserProfile;
  collectionId?: string;
  collection?: EventCollection;
  title: string;
  description?: string;
  priority: number;
  isViewed: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface FeedPreferences {
  showRecommendations: boolean;
  showFollowedUserActivity: boolean;
  showTrendingEvents: boolean;
  showCollectionUpdates: boolean;
  categories?: string[];
  excludedCategories?: string[];
}

export interface FeedFilters {
  types?: FeedItemType[];
  startDate?: string;
  endDate?: string;
  categories?: string[];
}

export interface UserFeed {
  id: string;
  userId: string;
  items: FeedItem[];
  preferences: FeedPreferences;
  filters: FeedFilters;
  lastRefreshedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ========== Event Subscriptions ==========

export type EventUpdateType =
  | 'SCHEDULE_CHANGE'
  | 'VENUE_CHANGE'
  | 'PRICE_CHANGE'
  | 'CANCELLATION'
  | 'NEW_ANNOUNCEMENT'
  | 'REMINDER';

export type NotificationChannel = 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP';

export interface EventSubscription {
  id: string;
  userId: string;
  eventId: string;
  updateTypes: EventUpdateType[];
  channels: NotificationChannel[];
  isActive: boolean;
  event?: EventData;
  createdAt: string;
  updatedAt: string;
}
