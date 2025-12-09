/**
 * Organizer Dashboard API Functions
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from "./api";

// Generic helpers
type Id = string;
type Pagination = { page?: number; limit?: number };
type WithEvent<T = unknown> = { eventId?: Id } & T;

// Template domain types
export interface EventTemplatePayload {
  name: string;
  description?: string;
  eventData: Record<string, unknown>;
  isPublic?: boolean;
}

export interface EventTemplateResponse {
  template: Record<string, unknown>;
}

// Draft domain types
export interface EventDraftPayload {
  eventId?: Id;
  name: string;
  description?: string;
  eventData: Record<string, unknown>;
}

export interface EventDraftResponse {
  draft: Record<string, unknown>;
}

export interface SegmentCriteria {
  [key: string]: unknown;
}

// Attendee segmentation types
export interface SegmentPayload {
  eventId?: Id;
  name: string;
  description?: string;
  criteria: SegmentCriteria;
}

// Pricing rules
export type PricingRuleType = "time_based" | "demand_based" | "group_discount" | "loyalty";
export interface PricingRulePayload extends WithEvent {
  name: string;
  type: PricingRuleType;
  priority: number;
  startDate?: string;
  endDate?: string;
  demandThreshold?: number;
  priceMultiplier?: number;
  minGroupSize?: number;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  applicableTicketTypes?: string[];
}

// Financials
export interface ExpensePayload {
  eventId?: Id;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  isTaxDeductible?: boolean;
  expenseDate?: string;
}

export interface GoalPayload {
  name: string;
  description?: string;
  targetAmount: number;
  currency?: string;
  eventId?: Id;
  startDate: string;
  endDate: string;
}

// ==================== Event Templates ====================

export const createEventTemplate = async (data: EventTemplatePayload): Promise<ApiResponse<EventTemplateResponse>> => {
  return apiPost('/organizer-dashboard/templates', data);
};

export const getOrganizerTemplates = async (filters?: Pagination & { isPublic?: boolean }): Promise<
  ApiResponse<{ templates: Record<string, unknown>[]; total?: number; page?: number; limit?: number; totalPages?: number }>
> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.isPublic !== undefined) queryParams.append('isPublic', filters.isPublic.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/templates?${queryString}` : '/organizer-dashboard/templates';
  return apiGet(endpoint);
};

export const getPublicTemplates = async (filters?: Pagination): Promise<
  ApiResponse<{ templates: Record<string, unknown>[]; total?: number }>
> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/templates/public?${queryString}` : '/organizer-dashboard/templates/public';
  return apiGet(endpoint);
};

export const getTemplateById = async (templateId: string): Promise<ApiResponse<EventTemplateResponse>> => {
  return apiGet(`/organizer-dashboard/templates/${templateId}`);
};

export const updateTemplate = async (
  templateId: string,
  data: Partial<EventTemplatePayload>,
): Promise<ApiResponse<EventTemplateResponse>> => {
  return apiPut(`/organizer-dashboard/templates/${templateId}`, data);
};

export const createTemplateVersion = async (
  templateId: string,
  data: Partial<EventTemplatePayload>,
): Promise<ApiResponse<EventTemplateResponse>> => {
  return apiPost(`/organizer-dashboard/templates/${templateId}/versions`, data);
};

export const shareTemplate = async (templateId: string): Promise<ApiResponse<{ shareToken: string; shareUrl: string }>> => {
  return apiPost(`/organizer-dashboard/templates/${templateId}/share`);
};

export const useTemplate = async (
  templateId: string,
): Promise<ApiResponse<{ eventData: Record<string, unknown> }>> => {
  return apiPost(`/organizer-dashboard/templates/${templateId}/use`);
};

export const deleteTemplate = async (templateId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/templates/${templateId}`);
};

export const createTemplateFromEvent = async (
  eventId: string,
  data: { name: string; description?: string; isPublic?: boolean },
): Promise<ApiResponse<EventTemplateResponse>> => {
  return apiPost(`/organizer-dashboard/events/${eventId}/create-template`, data);
};

// ==================== Event Drafts ====================

export const createEventDraft = async (data: EventDraftPayload): Promise<ApiResponse<EventDraftResponse>> => {
  return apiPost('/organizer-dashboard/drafts', data);
};

export const getOrganizerDrafts = async (filters?: Pagination & { eventId?: Id }): Promise<
  ApiResponse<{ drafts: Record<string, unknown>[]; total?: number; page?: number; limit?: number; totalPages?: number }>
> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/drafts?${queryString}` : '/organizer-dashboard/drafts';
  return apiGet(endpoint);
};

export const getDraftById = async (draftId: string): Promise<ApiResponse<EventDraftResponse>> => {
  return apiGet(`/organizer-dashboard/drafts/${draftId}`);
};

export const updateDraft = async (
  draftId: string,
  data: Partial<EventDraftPayload>,
): Promise<ApiResponse<EventDraftResponse>> => {
  return apiPut(`/organizer-dashboard/drafts/${draftId}`, data);
};

export const createDraftVersion = async (
  draftId: string,
  data: Partial<EventDraftPayload>,
): Promise<ApiResponse<EventDraftResponse>> => {
  return apiPost(`/organizer-dashboard/drafts/${draftId}/versions`, data);
};

export const scheduleDraft = async (
  draftId: string,
  data: { scheduledDate: string },
): Promise<ApiResponse<EventDraftResponse>> => {
  return apiPost(`/organizer-dashboard/drafts/${draftId}/schedule`, data);
};

export const publishDraft = async (
  draftId: string,
): Promise<ApiResponse<{ eventData: Record<string, unknown> }>> => {
  return apiPost(`/organizer-dashboard/drafts/${draftId}/publish`);
};

export const deleteDraft = async (draftId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/drafts/${draftId}`);
};

// ==================== Attendee Segmentation ====================

export const createSegment = async (data: SegmentPayload): Promise<ApiResponse<{ segment: Record<string, unknown> }>> => {
  return apiPost('/organizer-dashboard/segments', data);
};

export const getOrganizerSegments = async (filters?: { eventId?: Id }): Promise<
  ApiResponse<{ segments: Record<string, unknown>[] }>
> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/segments?${queryString}` : '/organizer-dashboard/segments';
  return apiGet(endpoint);
};

export const getSegmentById = async (
  segmentId: string,
): Promise<ApiResponse<{ segment: Record<string, unknown>; members: Record<string, unknown>[] }>> => {
  return apiGet(`/organizer-dashboard/segments/${segmentId}`);
};

export const updateSegment = async (
  segmentId: string,
  data: Partial<SegmentPayload>,
): Promise<ApiResponse<{ segment: Record<string, unknown> }>> => {
  return apiPut(`/organizer-dashboard/segments/${segmentId}`, data);
};

export const updateSegmentMembers = async (
  segmentId: string,
): Promise<ApiResponse<{ segment: Record<string, unknown>; membersAdded: number; membersRemoved: number }>> => {
  return apiPost(`/organizer-dashboard/segments/${segmentId}/update-members`);
};

export const addMemberToSegment = async (segmentId: string, data: {
  userId: string;
}): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/organizer-dashboard/segments/${segmentId}/members`, data);
};

export const removeMemberFromSegment = async (segmentId: string, data: {
  userId: string;
}): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/segments/${segmentId}/members/${data.userId}`);
};

export const deleteSegment = async (segmentId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/segments/${segmentId}`);
};

// ==================== Attendee Tags ====================

export const createTag = async (data: {
  name: string;
  description?: string;
  color?: string;
}): Promise<ApiResponse<{ tag: any }>> => {
  return apiPost('/organizer-dashboard/tags', data);
};

export const getOrganizerTags = async (): Promise<ApiResponse<{ tags: any[] }>> => {
  return apiGet('/organizer-dashboard/tags');
};

export const getTagById = async (tagId: string): Promise<ApiResponse<{ tag: any; taggedUsers: any[] }>> => {
  return apiGet(`/organizer-dashboard/tags/${tagId}`);
};

export const updateTag = async (tagId: string, data: {
  name?: string;
  description?: string;
  color?: string;
}): Promise<ApiResponse<{ tag: any }>> => {
  return apiPut(`/organizer-dashboard/tags/${tagId}`, data);
};

export const tagUser = async (tagId: string, data: {
  userId: string;
  eventId?: string;
  notes?: string;
}): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/organizer-dashboard/tags/${tagId}/tag`, data);
};

export const untagUser = async (tagId: string, data: {
  userId: string;
  eventId?: string;
}): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/tags/${tagId}/untag`, data);
};

export const getTaggedUsers = async (tagId: string, filters?: {
  eventId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ users: any[]; total: number; page: number; limit: number; totalPages: number }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/tags/${tagId}/users?${queryString}` : `/organizer-dashboard/tags/${tagId}/users`;
  return apiGet(endpoint);
};

export const deleteTag = async (tagId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/tags/${tagId}`);
};

// ==================== Attendee Communication ====================

export const sendToSegment = async (segmentId: string, data: {
  subject: string;
  content: string;
  sendEmail?: boolean;
  sendNotification?: boolean;
}): Promise<ApiResponse<{ sent: number; failed: number }>> => {
  return apiPost(`/organizer-dashboard/segments/${segmentId}/send`, data);
};

export const sendToTaggedUsers = async (tagId: string, data: {
  subject: string;
  content: string;
  sendEmail?: boolean;
  sendNotification?: boolean;
}): Promise<ApiResponse<{ sent: number; failed: number }>> => {
  return apiPost(`/organizer-dashboard/tags/${tagId}/send`, data);
};

export const sendToEventRegistrations = async (eventId: string, data: {
  subject: string;
  content: string;
  sendEmail?: boolean;
  sendNotification?: boolean;
}): Promise<ApiResponse<{ sent: number; failed: number }>> => {
  return apiPost(`/organizer-dashboard/events/${eventId}/send`, data);
};

export const getCommunicationHistory = async (filters?: {
  eventId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ messages: any[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/communications?${queryString}` : '/organizer-dashboard/communications';
  return apiGet(endpoint);
};

// ==================== Analytics ====================

export const getEventAnalytics = async (eventId: string, filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  event: any;
  summary: any;
  funnel: any;
  traffic: any;
  devices: any;
  geography: any;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/analytics/events/${eventId}?${queryString}` : `/organizer-dashboard/analytics/events/${eventId}`;
  return apiGet(endpoint);
};

export const getRevenueAnalytics = async (filters?: {
  eventId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  summary: any;
  byTicketType: any[];
  refunds: any;
  averageOrderValue: any;
  forecasting: any;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/analytics/revenue?${queryString}` : '/organizer-dashboard/analytics/revenue';
  return apiGet(endpoint);
};

export const getAttendeeInsights = async (filters?: {
  eventId?: string;
}): Promise<ApiResponse<{
  demographics: any;
  repeatAttendees: any;
  engagement: any;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/analytics/attendees?${queryString}` : '/organizer-dashboard/analytics/attendees';
  return apiGet(endpoint);
};

export const getMarketingAnalytics = async (filters?: {
  eventId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  promoPerformance: any[];
  shareAnalytics: any;
  emailCampaigns: any[];
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/analytics/marketing?${queryString}` : '/organizer-dashboard/analytics/marketing';
  return apiGet(endpoint);
};

// ==================== Advanced Promo Codes ====================

export const createPromoCodeVariant = async (promoCodeId: string, data: {
  name: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  trafficPercentage?: number;
  isControl?: boolean;
}): Promise<ApiResponse<{ variant: any }>> => {
  return apiPost(`/organizer-dashboard/promo-codes/${promoCodeId}/variants`, data);
};

export const getPromoCodeAnalytics = async (promoCodeId: string): Promise<ApiResponse<{
  promoCode: any;
  summary: any;
  redemptionsByDate: any[];
  topUsers: any[];
  variantPerformance: any[];
}>> => {
  return apiGet(`/organizer-dashboard/promo-codes/${promoCodeId}/analytics`);
};

export const getOrganizerPromoCodeAnalytics = async (filters?: {
  eventId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  promoCodes: any[];
  total: number;
  summary: any;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/promo-codes/analytics?${queryString}` : '/organizer-dashboard/promo-codes/analytics';
  return apiGet(endpoint);
};

// ==================== Financial Management ====================

export const createExpense = async (data: {
  eventId?: string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  isTaxDeductible?: boolean;
  expenseDate?: string;
}): Promise<ApiResponse<{ expense: any }>> => {
  return apiPost('/organizer-dashboard/expenses', data);
};

export const getExpenses = async (filters?: {
  page?: number;
  limit?: number;
  eventId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<ApiResponse<{
  expenses: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.status) queryParams.append('status', filters.status);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/expenses?${queryString}` : '/organizer-dashboard/expenses';
  return apiGet(endpoint);
};

export const getProfitLossStatement = async (filters?: {
  eventId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  period: any;
  revenue: any;
  expenses: any;
  profit: any;
  summary: any;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/financial/profit-loss?${queryString}` : '/organizer-dashboard/financial/profit-loss';
  return apiGet(endpoint);
};

export const createFinancialGoal = async (data: {
  name: string;
  description?: string;
  targetAmount: number;
  currency?: string;
  eventId?: string;
  startDate: string;
  endDate: string;
}): Promise<ApiResponse<{ goal: any }>> => {
  return apiPost('/organizer-dashboard/financial/goals', data);
};

export const getFinancialGoals = async (filters?: {
  eventId?: string;
  status?: string;
}): Promise<ApiResponse<{ goals: any[] }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.status) queryParams.append('status', filters.status);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/financial/goals?${queryString}` : '/organizer-dashboard/financial/goals';
  return apiGet(endpoint);
};

export const getTaxSummary = async (filters?: {
  eventId?: string;
  year?: number;
}): Promise<ApiResponse<{
  year: number;
  revenue: any;
  expenses: any;
  taxableIncome: number;
  summary: any;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.year) queryParams.append('year', filters.year.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/financial/tax-summary?${queryString}` : '/organizer-dashboard/financial/tax-summary';
  return apiGet(endpoint);
};

// ==================== Payout Management ====================

export const getPayoutPreferences = async (): Promise<ApiResponse<{ preferences: any }>> => {
  return apiGet('/organizer-dashboard/payouts/preferences');
};

export const updatePayoutPreferences = async (data: {
  primaryMethod?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  routingNumber?: string;
  paystackRecipientCode?: string;
  alternativeMethods?: any;
  autoPayoutEnabled?: boolean;
  autoPayoutThreshold?: number;
  autoPayoutSchedule?: string;
  taxId?: string;
  taxCountry?: string;
}): Promise<ApiResponse<{ preferences: any }>> => {
  return apiPut('/organizer-dashboard/payouts/preferences', data);
};

export const getPayoutHistory = async (filters?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  disbursements: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/payouts/history?${queryString}` : '/organizer-dashboard/payouts/history';
  return apiGet(endpoint);
};

export const schedulePayout = async (data: {
  eventId?: string;
  amount?: number;
  scheduledDate: string;
  notes?: string;
}): Promise<ApiResponse<{ disbursement: any }>> => {
  return apiPost('/organizer-dashboard/payouts/schedule', data);
};

export const getPayoutSummary = async (): Promise<ApiResponse<{
  pending: any;
  scheduled: any;
  totalPaid: number;
  totalDisbursements: number;
}>> => {
  return apiGet('/organizer-dashboard/payouts/summary');
};

// ==================== Event Collaboration ====================

export const inviteCollaborator = async (eventId: string, data: {
  collaboratorId: string;
  role?: string;
  canEdit?: boolean;
  canManageAttendees?: boolean;
  canManageTickets?: boolean;
  canViewAnalytics?: boolean;
  canManageStaff?: boolean;
  canPublish?: boolean;
}): Promise<ApiResponse<{ collaborator: any }>> => {
  return apiPost(`/organizer-dashboard/events/${eventId}/collaborators`, data);
};

export const acceptInvitation = async (collaborationId: string): Promise<ApiResponse<{ collaboration: any }>> => {
  return apiPost(`/organizer-dashboard/collaborations/${collaborationId}/accept`);
};

export const getEventCollaborators = async (eventId: string): Promise<ApiResponse<{ collaborators: any[] }>> => {
  return apiGet(`/organizer-dashboard/events/${eventId}/collaborators`);
};

export const updateCollaboratorPermissions = async (collaborationId: string, data: {
  role?: string;
  canEdit?: boolean;
  canManageAttendees?: boolean;
  canManageTickets?: boolean;
  canViewAnalytics?: boolean;
  canManageStaff?: boolean;
  canPublish?: boolean;
}): Promise<ApiResponse<{ collaboration: any }>> => {
  return apiPut(`/organizer-dashboard/collaborations/${collaborationId}`, data);
};

export const removeCollaborator = async (collaborationId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/collaborations/${collaborationId}`);
};

export const getEventActivityLog = async (eventId: string, filters?: {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
}): Promise<ApiResponse<{
  activities: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.action) queryParams.append('action', filters.action);
  if (filters?.userId) queryParams.append('userId', filters.userId);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/events/${eventId}/activity-log?${queryString}` : `/organizer-dashboard/events/${eventId}/activity-log`;
  return apiGet(endpoint);
};

// ==================== Phase 3: Advanced Ticket Types ====================

export const createTicketPackage = async (data: {
  eventId: string;
  name: string;
  description?: string;
  type: 'group' | 'bundle' | 'donation';
  price?: number;
  minQuantity?: number;
  maxQuantity?: number;
  bundleItems?: any[];
  isDonation?: boolean;
  minDonation?: number;
  maxDonation?: number;
  suggestedAmounts?: number[];
  hasReservedSeating?: boolean;
  seatingChart?: any;
  availableFrom?: string;
  availableUntil?: string;
  quantity?: number;
}): Promise<ApiResponse<{ package: any }>> => {
  return apiPost('/organizer-dashboard/ticket-packages', data);
};

export const getEventTicketPackages = async (eventId: string, filters?: {
  type?: string;
  isActive?: boolean;
}): Promise<ApiResponse<{ packages: any[] }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/events/${eventId}/ticket-packages?${queryString}` : `/organizer-dashboard/events/${eventId}/ticket-packages`;
  return apiGet(endpoint);
};

export const updateTicketPackage = async (packageId: string, data: {
  name?: string;
  description?: string;
  price?: number;
  minQuantity?: number;
  maxQuantity?: number;
  bundleItems?: any[];
  minDonation?: number;
  maxDonation?: number;
  suggestedAmounts?: number[];
  hasReservedSeating?: boolean;
  seatingChart?: any;
  availableFrom?: string;
  availableUntil?: string;
  quantity?: number;
  isActive?: boolean;
}): Promise<ApiResponse<{ package: any }>> => {
  return apiPut(`/organizer-dashboard/ticket-packages/${packageId}`, data);
};

export const getReservedSeating = async (eventId: string): Promise<ApiResponse<{ seating: any[] }>> => {
  return apiGet(`/organizer-dashboard/events/${eventId}/reserved-seating`);
};

export const deleteTicketPackage = async (packageId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/ticket-packages/${packageId}`);
};

// ==================== Phase 3: Dynamic Pricing ====================

export const createPricingRule = async (data: {
  eventId: string;
  name: string;
  type: 'time_based' | 'demand_based' | 'group_discount' | 'loyalty';
  startDate?: string;
  endDate?: string;
  demandThreshold?: number;
  priceMultiplier?: number;
  minGroupSize?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  loyaltyTierId?: string;
  loyaltyDiscount?: number;
  applicableTicketTypes?: string[];
  priority?: number;
}): Promise<ApiResponse<{ rule: any }>> => {
  return apiPost('/organizer-dashboard/pricing-rules', data);
};

export const getEventPricingRules = async (eventId: string, filters?: {
  type?: string;
  isActive?: boolean;
}): Promise<ApiResponse<{ rules: any[] }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/events/${eventId}/pricing-rules?${queryString}` : `/organizer-dashboard/events/${eventId}/pricing-rules`;
  return apiGet(endpoint);
};

export const calculateDynamicPrice = async (eventId: string, ticketType: string, quantity: number): Promise<ApiResponse<{
  originalPrice: number;
  finalPrice: number;
  discount?: number;
  appliedRules: string[];
}>> => {
  const queryParams = new URLSearchParams();
  queryParams.append('ticketType', ticketType);
  queryParams.append('quantity', quantity.toString());

  return apiGet(`/organizer-dashboard/events/${eventId}/calculate-price?${queryParams.toString()}`);
};

export const updatePricingRule = async (ruleId: string, data: {
  name?: string;
  startDate?: string;
  endDate?: string;
  demandThreshold?: number;
  priceMultiplier?: number;
  minGroupSize?: number;
  discountType?: string;
  discountValue?: number;
  loyaltyDiscount?: number;
  applicableTicketTypes?: string[];
  priority?: number;
  isActive?: boolean;
}): Promise<ApiResponse<{ rule: any }>> => {
  return apiPut(`/organizer-dashboard/pricing-rules/${ruleId}`, data);
};

export const deletePricingRule = async (ruleId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/pricing-rules/${ruleId}`);
};

// ==================== Phase 3: Affiliate Program ====================

export const createAffiliateProgram = async (data: {
  eventId?: string;
  name: string;
  description?: string;
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  commissionValue: number;
  minCommission?: number;
  maxCommission?: number;
  cookieDuration?: number;
}): Promise<ApiResponse<{ program: any }>> => {
  return apiPost('/organizer-dashboard/affiliate-programs', data);
};

export const getAffiliatePrograms = async (filters?: {
  eventId?: string;
  isActive?: boolean;
}): Promise<ApiResponse<{ programs: any[] }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/affiliate-programs?${queryString}` : '/organizer-dashboard/affiliate-programs';
  return apiGet(endpoint);
};

export const applyAsAffiliate = async (programId: string): Promise<ApiResponse<{ affiliate: any }>> => {
  return apiPost(`/organizer-dashboard/affiliate-programs/${programId}/apply`);
};

export const getAffiliateDashboard = async (affiliateId: string): Promise<ApiResponse<{
  affiliate: any;
  affiliateLink: string;
  summary: any;
}>> => {
  return apiGet(`/organizer-dashboard/affiliates/${affiliateId}/dashboard`);
};

export const getAffiliateConversions = async (affiliateId: string, filters?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ApiResponse<{
  conversions: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.status) queryParams.append('status', filters.status);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/affiliates/${affiliateId}/conversions?${queryString}` : `/organizer-dashboard/affiliates/${affiliateId}/conversions`;
  return apiGet(endpoint);
};

// ==================== Phase 3: Email Marketing ====================

export const createEmailCampaign = async (data: {
  eventId?: string;
  name: string;
  subject: string;
  content: string;
  plainText?: string;
  recipientType: 'all' | 'segment' | 'tag' | 'event_registrations';
  segmentId?: string;
  tagId?: string;
  scheduledAt?: string;
}): Promise<ApiResponse<{ campaign: any }>> => {
  return apiPost('/organizer-dashboard/email-campaigns', data);
};

export const getEmailCampaigns = async (filters?: {
  eventId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  campaigns: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/email-campaigns?${queryString}` : '/organizer-dashboard/email-campaigns';
  return apiGet(endpoint);
};

export const sendEmailCampaign = async (campaignId: string): Promise<ApiResponse<{
  success: boolean;
  sentCount: number;
  deliveredCount: number;
  bouncedCount: number;
}>> => {
  return apiPost(`/organizer-dashboard/email-campaigns/${campaignId}/send`);
};

export const getCampaignAnalytics = async (campaignId: string): Promise<ApiResponse<{
  campaign: any;
  metrics: any;
  rates: any;
}>> => {
  return apiGet(`/organizer-dashboard/email-campaigns/${campaignId}/analytics`);
};

// ==================== Phase 3: Social Media ====================

export const createSocialPost = async (data: {
  eventId?: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
}): Promise<ApiResponse<{ post: any }>> => {
  return apiPost('/organizer-dashboard/social-posts', data);
};

export const getSocialPosts = async (filters?: {
  eventId?: string;
  platform?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  posts: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.platform) queryParams.append('platform', filters.platform);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/social-posts?${queryString}` : '/organizer-dashboard/social-posts';
  return apiGet(endpoint);
};

export const publishSocialPost = async (postId: string): Promise<ApiResponse<{ post: any }>> => {
  return apiPost(`/organizer-dashboard/social-posts/${postId}/publish`);
};

export const getSocialMediaAnalytics = async (filters?: {
  eventId?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  byPlatform: any[];
  total: any;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.platform) queryParams.append('platform', filters.platform);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/social-media/analytics?${queryString}` : '/organizer-dashboard/social-media/analytics';
  return apiGet(endpoint);
};

// ==================== Phase 3: Advanced Team Features ====================

export const createRoleTemplate = async (data: {
  name: string;
  description?: string;
  canEdit?: boolean;
  canManageAttendees?: boolean;
  canManageTickets?: boolean;
  canViewAnalytics?: boolean;
  canManageStaff?: boolean;
  canPublish?: boolean;
  canManageCollaborators?: boolean;
}): Promise<ApiResponse<{ template: any }>> => {
  return apiPost('/organizer-dashboard/team/role-templates', data);
};

export const getRoleTemplates = async (filters?: {
  isActive?: boolean;
}): Promise<ApiResponse<{ templates: any[] }>> => {
  const queryParams = new URLSearchParams();
  if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/team/role-templates?${queryString}` : '/organizer-dashboard/team/role-templates';
  return apiGet(endpoint);
};

export const getTeamActivityFeed = async (filters?: {
  eventId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{
  activities: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.eventId) queryParams.append('eventId', filters.eventId);
  if (filters?.userId) queryParams.append('userId', filters.userId);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/team/activity-feed?${queryString}` : '/organizer-dashboard/team/activity-feed';
  return apiGet(endpoint);
};

export const getTeamPerformanceMetrics = async (filters?: {
  userId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{
  metrics: any[];
  total: number;
}>> => {
  const queryParams = new URLSearchParams();
  if (filters?.userId) queryParams.append('userId', filters.userId);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/organizer-dashboard/team/performance-metrics?${queryString}` : '/organizer-dashboard/team/performance-metrics';
  return apiGet(endpoint);
};

