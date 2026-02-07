/**
 * Support API Functions
 * Admin support endpoints for unified inbox and query management
 */

import { apiGet, apiPost, apiPatch, type ApiResponse } from './api';

// Support channel types
export type SupportChannel = 'social' | 'email' | 'website' | 'phone';

// Support query status
export type SupportQueryStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';

// Support priority
export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Social platform types
export type SocialPlatform = 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'WHATSAPP' | 'TIKTOK';

// Support inbox filters
export interface SupportInboxFilters {
  channel?: SupportChannel;
  platform?: SocialPlatform;
  status?: SupportQueryStatus;
  priority?: SupportPriority;
  assignedTo?: string;
  category?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
}

// Support query (unified format)
export interface SupportQuery {
  id: string;
  channel: SupportChannel;
  platform?: SocialPlatform;
  senderName: string;
  senderEmail?: string;
  senderHandle?: string;
  message: string;
  status: SupportQueryStatus;
  priority: SupportPriority;
  category?: string;
  assignedTo?: string;
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
  };
  postId?: string;
  relatedPost?: {
    id: string;
    content: string;
  };
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
  responseCount: number;
}

// Support query with responses
export interface SupportQueryDetails extends SupportQuery {
  responses: Array<{
    id: string;
    response: string;
    isInternal: boolean;
    sentBy: string;
    sentAt: string;
    agent?: {
      id: string;
      name: string;
    };
  }>;
}

// Assign query request
export interface AssignQueryRequest {
  agentId: string;
  channel?: SupportChannel;
}

// Assign query response
export interface AssignQueryResult {
  id: string;
  assignedTo: string;
  assignedAgent?: {
    id: string;
    name: string;
  };
  status: SupportQueryStatus;
}

// Update status request
export interface UpdateQueryStatusRequest {
  status: SupportQueryStatus;
  channel?: SupportChannel;
}

// Update status response
export interface UpdateQueryStatusResult {
  id: string;
  status: SupportQueryStatus;
  resolvedAt?: string;
}

// Add response request
export interface AddResponseRequest {
  response: string;
  isInternal?: boolean;
  channel?: SupportChannel;
}

// Support response
export interface SupportResponse {
  id: string;
  messageId: string;
  response: string;
  isInternal: boolean;
  sentBy: string;
  sentAt: string;
  deliveredAt?: string;
  externalId?: string;
}

// Statistics filters
export interface StatisticsFilters {
  startDate?: string;
  endDate?: string;
  platform?: SocialPlatform;
}

// Support statistics
export interface SupportStatistics {
  total: number;
  byStatus: {
    new: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byPlatform: Record<string, number>;
  byPriority: Record<string, number>;
  byStatusBreakdown: Record<string, number>;
  averageResponseTime: number; // in milliseconds
  resolutionRate: number; // percentage
}

// Agent performance filters
export interface AgentPerformanceFilters {
  startDate?: string;
  endDate?: string;
}

// Agent performance metrics
export interface AgentPerformance {
  agentId: string;
  totalAssigned: number;
  resolved: number;
  inProgress: number;
  totalResponses: number;
  resolutionRate: number; // percentage
  averageResolutionTime: number; // in milliseconds
}

// Helper to build query string
const buildQueryParams = (filters?: Record<string, string | undefined>): string => {
  if (!filters) return '';

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Get unified support inbox (all channels)
 * GET /api/v1/admin/support/inbox
 */
export const getSupportInbox = async (
  filters?: SupportInboxFilters
): Promise<ApiResponse<{ queries: SupportQuery[] }>> => {
  const query = buildQueryParams(filters as Record<string, string | undefined>);
  return apiGet<ApiResponse<{ queries: SupportQuery[] }>>(`/admin/support/inbox${query}`);
};

/**
 * Get support query by ID
 * GET /api/v1/admin/support/queries/:id
 */
export const getSupportQueryById = async (
  queryId: string,
  channel?: SupportChannel
): Promise<ApiResponse<{ query: SupportQueryDetails }>> => {
  const query = channel ? `?channel=${channel}` : '';
  return apiGet<ApiResponse<{ query: SupportQueryDetails }>>(`/admin/support/queries/${queryId}${query}`);
};

/**
 * Assign query to agent
 * POST /api/v1/admin/support/queries/:id/assign
 */
export const assignQuery = async (
  queryId: string,
  data: AssignQueryRequest
): Promise<ApiResponse<AssignQueryResult>> => {
  return apiPost<ApiResponse<AssignQueryResult>>(`/admin/support/queries/${queryId}/assign`, data);
};

/**
 * Update query status
 * PATCH /api/v1/admin/support/queries/:id/status
 */
export const updateQueryStatus = async (
  queryId: string,
  data: UpdateQueryStatusRequest
): Promise<ApiResponse<UpdateQueryStatusResult>> => {
  return apiPatch<ApiResponse<UpdateQueryStatusResult>>(`/admin/support/queries/${queryId}/status`, data);
};

/**
 * Add response to query
 * POST /api/v1/admin/support/queries/:id/responses
 */
export const addQueryResponse = async (
  queryId: string,
  data: AddResponseRequest
): Promise<ApiResponse<{ response: SupportResponse }>> => {
  return apiPost<ApiResponse<{ response: SupportResponse }>>(`/admin/support/queries/${queryId}/responses`, data);
};

/**
 * Get support statistics
 * GET /api/v1/admin/support/statistics
 */
export const getSupportStatistics = async (
  filters?: StatisticsFilters
): Promise<ApiResponse<{ statistics: SupportStatistics }>> => {
  const query = buildQueryParams(filters as Record<string, string | undefined>);
  return apiGet<ApiResponse<{ statistics: SupportStatistics }>>(`/admin/support/statistics${query}`);
};

/**
 * Get agent performance metrics
 * GET /api/v1/admin/support/agents/:id/performance
 */
export const getAgentPerformance = async (
  agentId: string,
  filters?: AgentPerformanceFilters
): Promise<ApiResponse<{ performance: AgentPerformance }>> => {
  const query = buildQueryParams(filters as Record<string, string | undefined>);
  return apiGet<ApiResponse<{ performance: AgentPerformance }>>(`/admin/support/agents/${agentId}/performance${query}`);
};
