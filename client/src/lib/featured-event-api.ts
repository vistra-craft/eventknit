/**
 * Featured Event API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from './api';

/**
 * Featured Item Type
 */
export type FeaturedItemType = 'EVENT' | 'IMAGE';

/**
 * Featured Event Data
 */
export interface FeaturedEventData {
  id: string;
  type: FeaturedItemType;
  eventId: string | null;
  customTitle?: string | null;
  customImage?: string | null;
  customCategory?: string | null;
  // IMAGE type fields
  imageUrl?: string | null;
  title?: string | null;
  description?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  displayStartDate?: string | null;
  displayEndDate?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    title: string;
    image?: string | null;
    category?: string | null;
    startDate: string;
    startTime?: string | null;
    venue?: string | null;
    location: string;
    price?: number | null;
    isFree: boolean;
    status?: string;
  } | null;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Active Featured Event (for hero section)
 */
export interface ActiveFeaturedEvent {
  id: string;
  type: FeaturedItemType;
  eventId: string | null;
  title: string;
  image: string;
  category: string;
  date: string | null;
  time: string;
  venue: string;
  location: string;
  price: string;
  displayOrder: number;
  // IMAGE type specific fields
  description?: string;
  linkUrl?: string | null;
  linkText?: string | null;
  event: {
    id: string;
    title: string;
    image?: string | null;
    category?: string | null;
    startDate: string;
    startTime?: string | null;
    venue?: string | null;
    location: string;
    price?: number | null;
    isFree: boolean;
  } | null;
}

/**
 * Create Featured Event Data
 */
export interface CreateFeaturedEventData {
  type: FeaturedItemType;
  // EVENT type fields
  eventId?: string;
  customTitle?: string;
  customImage?: string;
  customCategory?: string;
  // IMAGE type fields
  imageUrl?: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
  // Common fields
  displayStartDate?: string;
  displayEndDate?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Update Featured Event Data
 */
export interface UpdateFeaturedEventData {
  // EVENT type fields
  customTitle?: string;
  customImage?: string;
  customCategory?: string;
  // IMAGE type fields
  imageUrl?: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
  // Common fields
  displayStartDate?: string;
  displayEndDate?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Featured Event Response
 */
export interface FeaturedEventResponse {
  success: boolean;
  message?: string;
  data: {
    featuredEvent: FeaturedEventData;
  };
}

/**
 * Featured Events List Response
 */
export interface FeaturedEventsListResponse {
  success: boolean;
  data: {
    featuredEvents: FeaturedEventData[];
  };
}

/**
 * Active Featured Events Response
 */
export interface ActiveFeaturedEventsResponse {
  success: boolean;
  data: {
    featuredEvents: ActiveFeaturedEvent[];
  };
}

/**
 * Get active featured events (public - for hero section)
 */
export const getActiveFeaturedEvents = async (): Promise<ActiveFeaturedEvent[]> => {
  const response = await apiGet<ActiveFeaturedEventsResponse>('/featured-events/active');
  return response.data.featuredEvents;
};

/**
 * Get all featured events (admin)
 */
export const getAllFeaturedEvents = async (): Promise<FeaturedEventData[]> => {
  const response = await apiGet<FeaturedEventsListResponse>('/featured-events');
  return response.data.featuredEvents;
};

/**
 * Get featured event by ID
 */
export const getFeaturedEventById = async (id: string): Promise<FeaturedEventData> => {
  const response = await apiGet<FeaturedEventResponse>(`/featured-events/${id}`);
  return response.data.featuredEvent;
};

/**
 * Create featured event
 */
export const createFeaturedEvent = async (
  data: CreateFeaturedEventData,
): Promise<FeaturedEventData> => {
  const response = await apiPost<FeaturedEventResponse>('/featured-events', data);
  return response.data.featuredEvent;
};

/**
 * Update featured event
 */
export const updateFeaturedEvent = async (
  id: string,
  data: UpdateFeaturedEventData,
): Promise<FeaturedEventData> => {
  const response = await apiPut<FeaturedEventResponse>(`/featured-events/${id}`, data);
  return response.data.featuredEvent;
};

/**
 * Delete featured event
 */
export const deleteFeaturedEvent = async (id: string): Promise<void> => {
  await apiDelete<ApiResponse<void>>(`/featured-events/${id}`);
};


