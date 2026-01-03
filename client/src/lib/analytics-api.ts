/**
 * Analytics API Functions
 * Admin analytics endpoints for dashboard data
 */

import { apiGet, type ApiResponse } from './api';

// Social platform types
export type SocialPlatform = 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'WHATSAPP' | 'TIKTOK';

// Common filter interface
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  platform?: SocialPlatform;
  campaignId?: string;
}

// Unified Analytics types
export interface UnifiedAnalytics {
  overview: {
    totalMessages: number;
    totalResponses: number;
    responseRate: number;
    avgResponseTime: number;
    totalEngagement: number;
  };
  messagesByPlatform: Array<{
    platform: SocialPlatform;
    count: number;
    percentage: number;
  }>;
  messagesByStatus: Array<{
    status: string;
    count: number;
  }>;
  trends: Array<{
    date: string;
    messages: number;
    responses: number;
  }>;
}

// Platform breakdown types
export interface PlatformBreakdown {
  platforms: Array<{
    platform: SocialPlatform;
    totalMessages: number;
    totalResponses: number;
    avgResponseTime: number;
    engagement: number;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  }>;
  comparison: {
    bestPerforming: SocialPlatform;
    worstPerforming: SocialPlatform;
    recommendations: string[];
  };
}

// Campaign attribution types
export interface CampaignAttribution {
  campaigns: Array<{
    id: string;
    name: string;
    platform: SocialPlatform;
    queriesGenerated: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }>;
  totalQueriesFromCampaigns: number;
  totalConversions: number;
  overallConversionRate: number;
}

// Customer journey types
export interface CustomerJourney {
  customer: {
    identifier: string;
    firstContact: string;
    lastContact: string;
    totalInteractions: number;
  };
  touchpoints: Array<{
    timestamp: string;
    platform: SocialPlatform;
    type: string;
    content: string;
    sentiment?: string;
  }>;
  insights: {
    preferredPlatform: SocialPlatform;
    avgTimeBetweenContacts: number;
    satisfaction: string;
  };
}

// Social ROI types
export interface SocialMediaROI {
  overall: {
    totalSpend: number;
    totalRevenue: number;
    roi: number;
    costPerConversion: number;
  };
  byPlatform: Array<{
    platform: SocialPlatform;
    spend: number;
    revenue: number;
    roi: number;
    conversions: number;
  }>;
  trends: Array<{
    period: string;
    spend: number;
    revenue: number;
    roi: number;
  }>;
}

// Support efficiency types
export interface SupportEfficiency {
  metrics: {
    avgFirstResponseTime: number;
    avgResolutionTime: number;
    firstContactResolutionRate: number;
    customerSatisfactionScore: number;
    ticketVolume: number;
    resolvedTickets: number;
  };
  byAgent: Array<{
    agentId: string;
    agentName: string;
    ticketsHandled: number;
    avgResponseTime: number;
    satisfactionScore: number;
  }>;
  trends: Array<{
    date: string;
    volume: number;
    avgResolutionTime: number;
    satisfactionScore: number;
  }>;
}

// Geography analytics types
export interface GeographyAnalytics {
  countries: Array<{
    country: string;
    countryCode: string;
    userCount: number;
    percentage: number;
  }>;
  cities: Array<{
    city: string;
    country: string;
    userCount: number;
  }>;
  loginsByCountry: Array<{
    country: string;
    loginCount: number;
    uniqueUsers: number;
  }>;
}

// Security analytics types
export interface SecurityAnalytics {
  overview: {
    totalLoginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    suspiciousActivities: number;
  };
  loginAttempts: Array<{
    date: string;
    successful: number;
    failed: number;
  }>;
  suspiciousEvents: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  blockedIPs: number;
}

// Sessions analytics types
export interface SessionsAnalytics {
  overview: {
    activeSessions: number;
    avgSessionDuration: number;
    peakConcurrentSessions: number;
  };
  byCountry: Array<{
    country: string;
    sessions: number;
    avgDuration: number;
  }>;
  trends: Array<{
    date: string;
    sessions: number;
    avgDuration: number;
  }>;
}

// Helper to build query string
const buildQueryParams = (filters?: AnalyticsFilters): string => {
  if (!filters) return '';

  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.platform) params.append('platform', filters.platform);
  if (filters.campaignId) params.append('campaignId', filters.campaignId);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Get unified analytics dashboard
 */
export const getUnifiedAnalytics = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ analytics: UnifiedAnalytics }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ analytics: UnifiedAnalytics }>>(`/admin/analytics/unified${query}`);
};

/**
 * Get platform breakdown
 */
export const getPlatformBreakdown = async (
  filters?: Omit<AnalyticsFilters, 'campaignId'>
): Promise<ApiResponse<{ breakdown: PlatformBreakdown }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ breakdown: PlatformBreakdown }>>(`/admin/analytics/platforms${query}`);
};

/**
 * Get campaign attribution
 */
export const getCampaignAttribution = async (
  filters?: Omit<AnalyticsFilters, 'campaignId'>
): Promise<ApiResponse<{ attribution: CampaignAttribution }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ attribution: CampaignAttribution }>>(`/admin/analytics/campaign-attribution${query}`);
};

/**
 * Get customer journey tracking
 */
export const getCustomerJourney = async (
  identifier: string,
  filters?: Omit<AnalyticsFilters, 'campaignId'>
): Promise<ApiResponse<{ journey: CustomerJourney }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ journey: CustomerJourney }>>(`/admin/analytics/customer-journey/${identifier}${query}`);
};

/**
 * Get social media ROI
 */
export const getSocialMediaROI = async (
  filters?: Omit<AnalyticsFilters, 'campaignId'>
): Promise<ApiResponse<{ roi: SocialMediaROI }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ roi: SocialMediaROI }>>(`/admin/analytics/social-roi${query}`);
};

/**
 * Get support efficiency metrics
 */
export const getSupportEfficiency = async (
  filters?: Omit<AnalyticsFilters, 'campaignId'>
): Promise<ApiResponse<{ efficiency: SupportEfficiency }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ efficiency: SupportEfficiency }>>(`/admin/analytics/support-efficiency${query}`);
};

/**
 * Get user geography analytics
 */
export const getUserGeographyAnalytics = async (
  filters?: Pick<AnalyticsFilters, 'startDate' | 'endDate'>
): Promise<ApiResponse<{ analytics: GeographyAnalytics }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ analytics: GeographyAnalytics }>>(`/admin/analytics/geography${query}`);
};

/**
 * Get security events analytics
 */
export const getSecurityEventsAnalytics = async (
  filters?: Pick<AnalyticsFilters, 'startDate' | 'endDate'>
): Promise<ApiResponse<{ analytics: SecurityAnalytics }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ analytics: SecurityAnalytics }>>(`/admin/analytics/security${query}`);
};

/**
 * Get user sessions analytics
 */
export const getUserSessionsAnalytics = async (
  filters?: Pick<AnalyticsFilters, 'startDate' | 'endDate'>
): Promise<ApiResponse<{ analytics: SessionsAnalytics }>> => {
  const query = buildQueryParams(filters);
  return apiGet<ApiResponse<{ analytics: SessionsAnalytics }>>(`/admin/analytics/sessions${query}`);
};
