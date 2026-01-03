/**
 * Admin Analytics API Client
 * Connects to the backend analytics service for platform-wide metrics
 */

import { apiGet } from './api';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  platform?: string;
  campaignId?: string;
}

export interface SocialMediaMetrics {
  accounts: {
    total: number;
    active: number;
  };
  posts: {
    total: number;
    published: number;
    scheduled: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach: number;
    impressions: number;
  };
  engagementRate: number;
}

export interface SupportMetrics {
  totalQueries: number;
  byStatus: {
    new: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  averageResponseTime: number;
  resolutionRate: number;
}

export interface PlatformBreakdown {
  platform: string;
  posts: number;
  messages: number;
  accounts: number;
  followers: number;
}

export interface UnifiedAnalytics {
  socialMedia: SocialMediaMetrics;
  support: SupportMetrics;
  platformBreakdown: PlatformBreakdown[];
}

export interface CampaignAttribution {
  campaignId: string;
  campaignName?: string;
  supportQueries: number;
  supportCost?: number;
  revenue?: number;
  roi?: number;
}

export interface CustomerJourney {
  customerIdentifier: string;
  touchpoints: Array<{
    timestamp: string;
    type: string;
    platform: string;
    message: string;
    status: string;
    relatedPost: {
      id: string;
      content: string;
      publishedAt: string;
      campaignId: string | null;
    } | null;
    campaignId: string | null;
  }>;
  totalTouchpoints: number;
  campaigns: string[];
}

export interface SocialMediaROI {
  totalPosts: number;
  totalEngagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach: number;
  };
  estimatedCost: number;
  estimatedValue: number;
  roi: number;
  engagementRate: number;
}

export interface SupportEfficiency {
  totalQueries: number;
  resolvedQueries: number;
  resolutionRate: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  byPriority: Record<string, number>;
}

export interface GeographyAnalytics {
  totalUniqueCountries: number;
  countryBreakdown: Array<{
    countryCode: string;
    country: string;
    count: number;
  }>;
  topCities: Array<{
    city: string;
    countryCode: string;
    count: number;
  }>;
  loginEventsByCountry: Record<string, {
    countryCode: string;
    loginSuccess: number;
    loginFailure: number;
    loginLocked: number;
  }>;
}

export interface SecurityAnalytics {
  eventsByType: Array<{
    action: string;
    count: number;
  }>;
  eventsByCountry: Record<string, Record<string, number>>;
  recentSuspiciousActivities: Array<{
    id: string;
    userId: string | null;
    action: string;
    ipAddress: string | null;
    country: string | null;
    countryCode: string | null;
    city: string | null;
    userAgent: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
  totalSecurityEvents: number;
}

export interface SessionsAnalytics {
  totalSessions: number;
  sessionsByCountry: Array<{
    countryCode: string;
    country: string;
    sessionCount: number;
    uniqueUsers: number;
  }>;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Get unified analytics dashboard data
 */
export const getUnifiedAnalytics = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ analytics: UnifiedAnalytics }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.campaignId) params.append('campaignId', filters.campaignId);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ analytics: UnifiedAnalytics }>>(
    `/admin/analytics/unified${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get platform breakdown
 */
export const getPlatformBreakdown = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ breakdown: PlatformBreakdown[] }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.platform) params.append('platform', filters.platform);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ breakdown: PlatformBreakdown[] }>>(
    `/admin/analytics/platforms${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get campaign attribution
 */
export const getCampaignAttribution = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ attribution: CampaignAttribution[] }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.platform) params.append('platform', filters.platform);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ attribution: CampaignAttribution[] }>>(
    `/admin/analytics/campaign-attribution${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get customer journey
 */
export const getCustomerJourney = async (
  identifier: string,
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ journey: CustomerJourney }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.platform) params.append('platform', filters.platform);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ journey: CustomerJourney }>>(
    `/admin/analytics/customer-journey/${encodeURIComponent(identifier)}${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get social media ROI
 */
export const getSocialMediaROI = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ roi: SocialMediaROI }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.platform) params.append('platform', filters.platform);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ roi: SocialMediaROI }>>(
    `/admin/analytics/social-roi${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get support efficiency metrics
 */
export const getSupportEfficiency = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ efficiency: SupportEfficiency }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.platform) params.append('platform', filters.platform);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ efficiency: SupportEfficiency }>>(
    `/admin/analytics/support-efficiency${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get user geography analytics
 */
export const getGeographyAnalytics = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ analytics: GeographyAnalytics }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ analytics: GeographyAnalytics }>>(
    `/admin/analytics/geography${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get security events analytics
 */
export const getSecurityAnalytics = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ analytics: SecurityAnalytics }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ analytics: SecurityAnalytics }>>(
    `/admin/analytics/security${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Get user sessions analytics
 */
export const getSessionsAnalytics = async (
  filters?: AnalyticsFilters
): Promise<ApiResponse<{ analytics: SessionsAnalytics }>> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  return apiGet<ApiResponse<{ analytics: SessionsAnalytics }>>(
    `/admin/analytics/sessions${queryString ? `?${queryString}` : ''}`
  );
};

/**
 * Helper function to format date range for API
 */
export const getDateRangeFromPreset = (preset: string): { startDate: string; endDate: string } => {
  const endDate = new Date();
  const startDate = new Date();

  switch (preset) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

/**
 * Helper to format milliseconds to human-readable time
 */
export const formatDuration = (ms: number): string => {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
};

/**
 * Helper to format large numbers
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

/**
 * Helper to format currency
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Helper to calculate percentage change
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
