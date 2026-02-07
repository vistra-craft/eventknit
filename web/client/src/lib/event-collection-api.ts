import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface EventCollectionData {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  coverImage: string | null;
  shareToken: string | null;
  isShared: boolean;
  eventCount: number;
  followerCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    events: number;
    followers: number;
  };
  isFollowing?: boolean;
}

export interface CollectionEventItem {
  id: string;
  collectionId: string;
  eventId: string;
  addedAt: string;
  notes: string | null;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
    venueName: string | null;
    coverImage: string | null;
    category: string | null;
    eventType: string;
    status: string;
    organizer?: {
      id: string;
      firstName: string;
      lastName: string;
      organizationName: string | null;
    };
    _count?: {
      registrations: number;
    };
  };
}

export interface CollectionWithEvents extends EventCollectionData {
  events: CollectionEventItem[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Get current user's collections
 */
export async function getMyCollections(options?: {
  page?: number;
  limit?: number;
  isPublic?: boolean;
}): Promise<{ success: boolean; data: EventCollectionData[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.isPublic !== undefined) params.append('isPublic', options.isPublic.toString());

  const queryString = params.toString();
  const url = `/collections${queryString ? `?${queryString}` : ''}`;

  return apiGet<{ success: boolean; data: EventCollectionData[]; pagination: PaginationInfo }>(url);
}

/**
 * Get public collections (discover)
 */
export async function getPublicCollections(options?: {
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data: EventCollectionData[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `/collections/public${queryString ? `?${queryString}` : ''}`;

  return apiGet<{ success: boolean; data: EventCollectionData[]; pagination: PaginationInfo }>(url);
}

/**
 * Get collection by ID
 */
export async function getCollectionById(
  collectionId: string
): Promise<{ success: boolean; data: CollectionWithEvents }> {
  return apiGet<{ success: boolean; data: CollectionWithEvents }>(`/collections/${collectionId}`);
}

/**
 * Create a new collection
 */
export async function createCollection(data: {
  name: string;
  description?: string;
  isPublic?: boolean;
  coverImage?: string;
}): Promise<{ success: boolean; data: EventCollectionData; message: string }> {
  return apiPost<{ success: boolean; data: EventCollectionData; message: string }>('/collections', data);
}

/**
 * Update collection
 */
export async function updateCollection(
  collectionId: string,
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    coverImage?: string;
  }
): Promise<{ success: boolean; data: EventCollectionData; message: string }> {
  return apiPut<{ success: boolean; data: EventCollectionData; message: string }>(`/collections/${collectionId}`, data);
}

/**
 * Delete collection
 */
export async function deleteCollection(
  collectionId: string
): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/collections/${collectionId}`);
}

/**
 * Add event to collection
 */
export async function addEventToCollection(
  collectionId: string,
  eventId: string,
  notes?: string
): Promise<{ success: boolean; data: CollectionEventItem; message: string }> {
  return apiPost<{ success: boolean; data: CollectionEventItem; message: string }>(`/collections/${collectionId}/events`, { eventId, notes });
}

/**
 * Remove event from collection
 */
export async function removeEventFromCollection(
  collectionId: string,
  eventId: string
): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/collections/${collectionId}/events/${eventId}`);
}

/**
 * Toggle follow/unfollow collection
 */
export async function toggleFollowCollection(
  collectionId: string
): Promise<{ success: boolean; data: { isFollowing: boolean }; message: string }> {
  return apiPost<{ success: boolean; data: { isFollowing: boolean }; message: string }>(`/collections/${collectionId}/follow`);
}
