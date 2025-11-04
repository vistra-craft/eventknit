/**
 * Organizer API Functions
 */

import { apiGet } from './api';

/**
 * Organizer Dashboard Stats Response
 */
export interface OrganizerDashboardStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalEvents: number;
      totalSpeakers: number;
      totalExhibitors: number;
      totalAttendees: number;
      totalRevenue: number;
    };
  };
}

/**
 * Organizer Dashboard Event
 */
export interface OrganizerDashboardEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  status: string;
  attendees: number;
  capacity: number;
  revenue: number;
  views: number;
  conversion: string;
  speakers: number;
  exhibitors: number;
  sponsors: number;
  image: string;
  description: string;
  category: string;
  organizer: string;
  price: string;
  rating: number;
  fullDescription: string;
  duration: string;
  ageRestriction: string;
}

/**
 * Organizer Dashboard Events Response
 */
export interface OrganizerDashboardEventsResponse {
  success: boolean;
  data: {
    events: OrganizerDashboardEvent[];
  };
}

/**
 * Get organizer dashboard stats
 */
export const getOrganizerDashboardStats = async (): Promise<OrganizerDashboardStatsResponse> => {
  return apiGet<OrganizerDashboardStatsResponse>('/organizer/dashboard/stats');
};

/**
 * Get organizer dashboard events
 */
export const getOrganizerDashboardEvents = async (limit?: number): Promise<OrganizerDashboardEventsResponse> => {
  const queryParams = limit ? `?limit=${limit}` : '';
  return apiGet<OrganizerDashboardEventsResponse>(`/organizer/dashboard/events${queryParams}`);
};

