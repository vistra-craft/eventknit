/**
 * Social Media API Functions
 * Handles social media accounts, posts, messages, and metrics
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';
import type { ApiResponse } from './api';

// ==================== Types ====================

export type SocialPlatform = 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'YOUTUBE' | 'TIKTOK';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'ARCHIVED';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accountHandle?: string;
  profileImageUrl?: string;
  followers?: number;
  following?: number;
  isActive: boolean;
  lastSyncedAt?: string;
  tokenExpiry?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  organizerId?: string;
  eventId?: string;
  platform: string;
  content: string;
  mediaUrls: string[];
  scheduledAt?: string;
  postedAt?: string;
  status: string;
  // Metrics
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  reach?: number;
  views?: number;
  externalPostId?: string;
  createdAt: string;
  updatedAt: string;
  // Related data
  event?: {
    id: string;
    title: string;
  };
}

export interface SocialMessage {
  id: string;
  platform: SocialPlatform;
  messageType: string;
  senderName?: string;
  senderHandle?: string;
  content: string;
  status: string;
  priority: string;
  assignedTo?: string;
  assignedAgent?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  postId?: string;
  responses: SocialResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialResponse {
  id: string;
  response: string;
  respondedBy: string;
  respondedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  isInternal: boolean;
  createdAt: string;
}

export interface SocialMetrics {
  totalPosts: number;
  totalImpressions: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalClicks: number;
  totalReach: number;
  engagementRate: number;
  topPlatform: string;
  platformBreakdown: Record<string, {
    posts: number;
    impressions: number;
    engagement: number;
  }>;
}

// ==================== Account API ====================

export interface ConnectAccountData {
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accountHandle?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Connect a social media account
 */
export const connectSocialAccount = async (
  data: ConnectAccountData
): Promise<ApiResponse<{ account: SocialAccount }>> => {
  return apiPost<ApiResponse<{ account: SocialAccount }>>(
    '/admin/social-media/accounts',
    data
  );
};

/**
 * Get all social media accounts
 */
export const getSocialAccounts = async (params?: {
  platform?: SocialPlatform;
  isActive?: boolean;
}): Promise<ApiResponse<{ accounts: SocialAccount[] }>> => {
  const queryParams = new URLSearchParams();
  if (params?.platform) queryParams.append('platform', params.platform);
  if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));

  const query = queryParams.toString();
  return apiGet<ApiResponse<{ accounts: SocialAccount[] }>>(
    `/admin/social-media/accounts${query ? `?${query}` : ''}`
  );
};

/**
 * Get social account by ID
 */
export const getSocialAccountById = async (
  id: string
): Promise<ApiResponse<{ account: SocialAccount }>> => {
  return apiGet<ApiResponse<{ account: SocialAccount }>>(
    `/admin/social-media/accounts/${id}`
  );
};

/**
 * Update social account
 */
export const updateSocialAccount = async (
  id: string,
  data: Partial<SocialAccount>
): Promise<ApiResponse<{ account: SocialAccount }>> => {
  return apiPut<ApiResponse<{ account: SocialAccount }>>(
    `/admin/social-media/accounts/${id}`,
    data
  );
};

/**
 * Disconnect social account
 */
export const disconnectSocialAccount = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete<ApiResponse<{ success: boolean }>>(
    `/admin/social-media/accounts/${id}`
  );
};

// ==================== Post API ====================

export interface CreatePostData {
  socialAccountId?: string;
  platform: SocialPlatform | string;
  content: string;
  mediaUrls?: string[];
  eventId?: string;
  scheduledAt?: string;
}

/**
 * Create a social media post
 */
export const createSocialPost = async (
  data: CreatePostData
): Promise<ApiResponse<{ post: SocialPost }>> => {
  return apiPost<ApiResponse<{ post: SocialPost }>>(
    '/admin/social-media/posts',
    data
  );
};

/**
 * Get social media posts
 */
export const getSocialPosts = async (params?: {
  socialAccountId?: string;
  platform?: SocialPlatform | string;
  status?: PostStatus | string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{ posts: SocialPost[] }>> => {
  const queryParams = new URLSearchParams();
  if (params?.socialAccountId) queryParams.append('socialAccountId', params.socialAccountId);
  if (params?.platform) queryParams.append('platform', params.platform);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.campaignId) queryParams.append('campaignId', params.campaignId);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiGet<ApiResponse<{ posts: SocialPost[] }>>(
    `/admin/social-media/posts${query ? `?${query}` : ''}`
  );
};

/**
 * Get social post by ID
 */
export const getSocialPostById = async (
  id: string
): Promise<ApiResponse<{ post: SocialPost }>> => {
  return apiGet<ApiResponse<{ post: SocialPost }>>(
    `/admin/social-media/posts/${id}`
  );
};

/**
 * Update social post
 */
export const updateSocialPost = async (
  id: string,
  data: Partial<CreatePostData & { status?: string }>
): Promise<ApiResponse<{ post: SocialPost }>> => {
  return apiPut<ApiResponse<{ post: SocialPost }>>(
    `/admin/social-media/posts/${id}`,
    data
  );
};

/**
 * Delete social post
 */
export const deleteSocialPost = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete<ApiResponse<{ success: boolean }>>(
    `/admin/social-media/posts/${id}`
  );
};

/**
 * Update post metrics
 */
export const updatePostMetrics = async (
  id: string,
  metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    clicks?: number;
    reach?: number;
    impressions?: number;
  }
): Promise<ApiResponse<{ metrics: Record<string, number> }>> => {
  return apiPatch<ApiResponse<{ metrics: Record<string, number> }>>(
    `/admin/social-media/posts/${id}/metrics`,
    metrics
  );
};

// ==================== Messages API ====================

/**
 * Get social media messages/mentions
 */
export const getSocialMessages = async (params?: {
  socialAccountId?: string;
  platform?: SocialPlatform;
  status?: string;
  priority?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{ messages: SocialMessage[] }>> => {
  const queryParams = new URLSearchParams();
  if (params?.socialAccountId) queryParams.append('socialAccountId', params.socialAccountId);
  if (params?.platform) queryParams.append('platform', params.platform);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiGet<ApiResponse<{ messages: SocialMessage[] }>>(
    `/admin/social-media/messages${query ? `?${query}` : ''}`
  );
};

/**
 * Get social message by ID
 */
export const getSocialMessageById = async (
  id: string
): Promise<ApiResponse<{ message: SocialMessage }>> => {
  return apiGet<ApiResponse<{ message: SocialMessage }>>(
    `/admin/social-media/messages/${id}`
  );
};

/**
 * Assign message to agent
 */
export const assignMessage = async (
  id: string,
  agentId: string
): Promise<ApiResponse<{ message: SocialMessage }>> => {
  return apiPost<ApiResponse<{ message: SocialMessage }>>(
    `/admin/social-media/messages/${id}/assign`,
    { agentId }
  );
};

/**
 * Update message status
 */
export const updateMessageStatus = async (
  id: string,
  status: string
): Promise<ApiResponse<{ message: SocialMessage }>> => {
  return apiPatch<ApiResponse<{ message: SocialMessage }>>(
    `/admin/social-media/messages/${id}/status`,
    { status }
  );
};

/**
 * Add response to message
 */
export const addMessageResponse = async (
  id: string,
  response: string,
  isInternal?: boolean
): Promise<ApiResponse<{ response: SocialResponse }>> => {
  return apiPost<ApiResponse<{ response: SocialResponse }>>(
    `/admin/social-media/messages/${id}/responses`,
    { response, isInternal }
  );
};

// ==================== Analytics/Metrics API ====================

/**
 * Get aggregated social media metrics
 */
export const getSocialMetrics = async (params?: {
  startDate?: string;
  endDate?: string;
  platform?: SocialPlatform;
}): Promise<ApiResponse<SocialMetrics>> => {
  // Aggregate metrics from posts
  const postsResponse = await getSocialPosts({
    platform: params?.platform,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });

  if (!postsResponse.success || !postsResponse.data?.posts) {
    return {
      success: false,
      message: 'Failed to fetch social metrics',
      data: null as unknown as SocialMetrics,
    };
  }

  const posts = postsResponse.data.posts;

  // Calculate aggregated metrics
  const platformStats: Record<string, { posts: number; impressions: number; engagement: number }> = {};

  let totalImpressions = 0;
  let totalLikes = 0;
  let totalShares = 0;
  let totalComments = 0;
  let totalClicks = 0;
  let totalReach = 0;

  posts.forEach(post => {
    totalImpressions += post.impressions || 0;
    totalLikes += post.likes || 0;
    totalShares += post.shares || 0;
    totalComments += post.comments || 0;
    totalClicks += post.clicks || 0;
    totalReach += post.reach || 0;

    const platform = post.platform.toUpperCase();
    if (!platformStats[platform]) {
      platformStats[platform] = { posts: 0, impressions: 0, engagement: 0 };
    }
    platformStats[platform].posts++;
    platformStats[platform].impressions += post.impressions || 0;
    platformStats[platform].engagement += (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
  });

  // Find top platform by engagement
  let topPlatform = 'NONE';
  let maxEngagement = 0;
  Object.entries(platformStats).forEach(([platform, stats]) => {
    if (stats.engagement > maxEngagement) {
      maxEngagement = stats.engagement;
      topPlatform = platform;
    }
  });

  // Calculate engagement rate
  const totalEngagement = totalLikes + totalComments + totalShares;
  const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

  return {
    success: true,
    data: {
      totalPosts: posts.length,
      totalImpressions,
      totalLikes,
      totalShares,
      totalComments,
      totalClicks,
      totalReach,
      engagementRate: Math.round(engagementRate * 100) / 100,
      topPlatform,
      platformBreakdown: platformStats,
    },
    message: 'Social metrics fetched successfully',
  };
};

/**
 * Get social media ROI metrics (from analytics endpoint)
 */
export const getSocialROI = async (): Promise<ApiResponse<{
  totalSpend: number;
  totalRevenue: number;
  roi: number;
  conversionRate: number;
}>> => {
  return apiGet<ApiResponse<{
    totalSpend: number;
    totalRevenue: number;
    roi: number;
    conversionRate: number;
  }>>('/admin/analytics/social-roi');
};
