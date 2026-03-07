/**
 * Organizer Dashboard API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from "./api";

// ---------------------------------------------------------------------------
// Shared utility types
// ---------------------------------------------------------------------------

type Id = string;
type Pagination = { page?: number; limit?: number };

type PaginatedList<T> = T & {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type PaginatedListWithMore<T> = PaginatedList<T> & { hasMore: boolean };

// ---------------------------------------------------------------------------
// Query-string helper — eliminates the 30+ repeated URLSearchParams blocks
// ---------------------------------------------------------------------------

function withQuery(
  base: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) qs.append(key, String(value));
  }
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

// ---------------------------------------------------------------------------
// Template domain types
// ---------------------------------------------------------------------------

export interface EventTemplatePayload {
  name: string;
  description?: string;
  eventData: Record<string, unknown>;
  isPublic?: boolean;
}

export interface EventTemplate {
  id: Id;
  name: string;
  description?: string;
  eventData: Record<string, unknown>;
  isPublic: boolean;
  organizerId: Id;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Draft domain types
// ---------------------------------------------------------------------------

export interface EventDraftPayload {
  eventId?: Id;
  name: string;
  description?: string;
  eventData: Record<string, unknown>;
}

export interface EventDraft {
  id: Id;
  eventId?: Id;
  name: string;
  description?: string;
  eventData: Record<string, unknown>;
  organizerId: Id;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Attendee segmentation types
// ---------------------------------------------------------------------------

export interface SegmentCriteria {
  [key: string]: unknown;
}

export interface SegmentPayload {
  eventId?: Id;
  name: string;
  description?: string;
  criteria: SegmentCriteria;
}

export interface AttendeeSegment {
  id: Id;
  name: string;
  description?: string;
  criteria: SegmentCriteria;
  eventId?: Id;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentMember {
  id: Id;
  userId: Id;
  segmentId: Id;
  addedAt: string;
  user: { id: Id; firstName: string; lastName: string; email: string };
}

// ---------------------------------------------------------------------------
// Tag domain types
// ---------------------------------------------------------------------------

export interface OrganizerTag {
  id: Id;
  name: string;
  description?: string;
  color?: string;
  organizerId: Id;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number };
}

export interface TaggedUser {
  id: Id;
  userId: Id;
  tagId: Id;
  eventId?: Id;
  notes?: string;
  taggedAt: string;
  user: { id: Id; firstName: string; lastName: string; email: string };
}

// ---------------------------------------------------------------------------
// Communication types
// ---------------------------------------------------------------------------

export interface CommunicationMessage {
  id: Id;
  type: string;
  subject: string;
  content: string;
  sentAt: string;
  recipientCount: number;
  status: string;
  eventId?: Id;
  recipientType?: string;
  sentCount?: number;
  failedCount?: number;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Analytics types
// ---------------------------------------------------------------------------

export interface EventSummaryInfo {
  id: Id;
  title: string;
  startDate: string;
  endDate?: string;
  status: string;
  capacity?: number;
}

export interface EventSummaryStats {
  totalRegistrations: number;
  totalRevenue: number;
  checkedIn: number;
  capacityUsed: number;
}

export interface ConversionFunnelStage {
  stage: string;
  count: number;
  rate: number;
}

export interface TrafficStats {
  pageViews: number;
  uniqueVisitors: number;
  sources: Record<string, number>;
}

export interface DeviceStats {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface GeographyStats {
  countries: Array<{ country: string; count: number }>;
  cities: Array<{ city: string; count: number }>;
}

export interface RevenueByTicketType {
  ticketType: string;
  count: number;
  revenue: number;
}

export interface RefundStats {
  count: number;
  amount: number;
}

export interface AverageOrderValue {
  value: number;
  min: number;
  max: number;
}

export interface RevenueForecast {
  projectedRevenue: number;
  projectedRegistrations: number;
  confidence: number;
}

export interface AttendeeDemographics {
  locations: Array<{ country: string; count: number }>;
  ticketTypes: Record<string, number>;
}

export interface RepeatAttendeeStats {
  totalRepeat: number;
  repeatRate: number;
}

export interface AttendeeEngagement {
  averageTimeOnPage: number;
  messageOpenRate: number;
}

export interface PromoCodePerformance {
  id: Id;
  code: string;
  redemptions: number;
  revenue: number;
  discountGiven: number;
}

export interface ShareAnalytics {
  totalShares: number;
  byPlatform: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Promo code types
// ---------------------------------------------------------------------------

export interface PromoCodeVariant {
  id: Id;
  promoCodeId: Id;
  name: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  trafficPercentage?: number;
  isControl: boolean;
  redemptionCount: number;
  createdAt: string;
}

export interface PromoCodeRedemptionDataPoint {
  date: string;
  redemptions: number;
  revenue: number;
}

export interface TopPromoCodeUser {
  userId: Id;
  name: string;
  email: string;
  redemptions: number;
}

export interface PromoCodeSummary {
  totalRedemptions: number;
  totalRevenue: number;
  totalDiscount: number;
}

export interface OrganizerPromoCodeSummary {
  totalCodes: number;
  totalRedemptions: number;
  totalRevenue: number;
}

// ---------------------------------------------------------------------------
// Financial types
// ---------------------------------------------------------------------------

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

export interface Expense {
  id: Id;
  eventId?: Id;
  category: string;
  description: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  isTaxDeductible: boolean;
  expenseDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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

export interface FinancialGoal {
  id: Id;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage?: number;
  currency: string;
  eventId?: Id;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export interface FinancialPeriod {
  startDate: string;
  endDate: string;
}

export interface FinancialTotals {
  gross: number;
  platformFees?: number;
  net: number;
  currency: string;
}

export interface ProfitLossExpenses {
  total: number;
  byCategory: Record<string, number>;
}

export interface ProfitLossSummary {
  profit: number;
  profitMargin: number;
  currency: string;
}

export interface TaxableRevenue {
  gross: number;
  platformFees?: number;
  net: number;
  currency: string;
}

export interface TaxableExpenses {
  total: number;
  deductible: number;
}

export interface TaxSummaryInfo {
  estimatedTax: number;
  taxableIncome: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Payout types
// ---------------------------------------------------------------------------

export interface AlternativePayoutMethod {
  type: string;
  details: Record<string, string>;
}

export interface PayoutPreferences {
  id?: Id;
  primaryMethod?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  routingNumber?: string;
  paystackRecipientCode?: string;
  alternativeMethods?: AlternativePayoutMethod[];
  autoPayoutEnabled: boolean;
  autoPayoutThreshold?: number;
  autoPayoutSchedule?: string;
  taxId?: string;
  taxCountry?: string;
}

export interface Disbursement {
  id: Id;
  eventId?: Id;
  amount: number;
  currency: string;
  status: string;
  scheduledDate?: string;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  disbursementNumber?: string;
  totalAmount?: number;
  paymentMethod?: string;
  completedAt?: string;
}

export interface PayoutAmountSummary {
  amount: number;
  currency: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Collaboration types
// ---------------------------------------------------------------------------

export interface CollaboratorPermissions {
  role?: string;
  canEdit?: boolean;
  canManageAttendees?: boolean;
  canManageTickets?: boolean;
  canViewAnalytics?: boolean;
  canManageStaff?: boolean;
  canPublish?: boolean;
}

export interface Collaborator extends CollaboratorPermissions {
  id: Id;
  collaboratorId: Id;
  eventId: Id;
  status: string;
  createdAt: string;
  user?: { id: Id; firstName: string; lastName: string; email: string };
  collaborator?: { id: Id; firstName?: string; lastName?: string; email: string };
  invitedAt?: string;
  acceptedAt?: string;
  isActive?: boolean;
}

export interface ActivityLogEntry {
  id: Id;
  action: string;
  userId: Id;
  eventId?: Id;
  details: Record<string, unknown>;
  createdAt: string;
  user?: { id: Id; firstName: string; lastName: string; email: string };
  description?: string;
  changes?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Pricing rule types
// ---------------------------------------------------------------------------

export type PricingRuleType =
  | "time_based"
  | "demand_based"
  | "group_discount"
  | "loyalty";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface PricingRulePayload {
  eventId: Id;
  name: string;
  type: PricingRuleType;
  priority?: number;
  startDate?: string;
  endDate?: string;
  demandThreshold?: number;
  priceMultiplier?: number;
  minGroupSize?: number;
  discountType?: DiscountType;
  discountValue?: number;
  loyaltyTierId?: string;
  loyaltyDiscount?: number;
  applicableTicketTypes?: string[];
}

export interface PricingRule {
  id: Id;
  eventId: Id;
  name: string;
  type: PricingRuleType;
  startDate?: string;
  endDate?: string;
  demandThreshold?: number;
  priceMultiplier?: number;
  minGroupSize?: number;
  discountType?: DiscountType;
  discountValue?: number;
  applicableTicketTypes?: string[];
  priority: number;
  isActive: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Ticket package types
// ---------------------------------------------------------------------------

export type TicketPackageType = "group" | "bundle" | "donation" | "complementary" | "vip" | "early_bird";

export interface BundleItem {
  ticketTypeId: Id;
  quantity: number;
}

export interface SeatingChart {
  sections?: Array<{ id: string; name: string; seats: number }>;
}

export interface TicketPackage {
  id: Id;
  eventId: Id;
  name: string;
  description?: string;
  type: TicketPackageType;
  price?: number;
  minQuantity?: number;
  maxQuantity?: number;
  bundleItems?: BundleItem[];
  isDonation: boolean;
  minDonation?: number;
  maxDonation?: number;
  suggestedAmounts?: number[];
  hasReservedSeating: boolean;
  seatingChart?: SeatingChart;
  availableFrom?: string;
  availableUntil?: string;
  quantity?: number;
  soldQuantity: number;
  isActive: boolean;
  createdAt: string;
}

export interface ReservedSeat {
  id: Id;
  seatLabel: string;
  sectionId?: string;
  rowLabel?: string;
  status: string;
  reservedBy?: string;
}

// ---------------------------------------------------------------------------
// Affiliate types
// ---------------------------------------------------------------------------

export interface AffiliateProgram {
  id: Id;
  eventId?: Id;
  name: string;
  description?: string;
  commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionValue: number;
  minCommission?: number;
  maxCommission?: number;
  cookieDuration?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Affiliate {
  id: Id;
  programId: Id;
  userId: Id;
  affiliateCode: string;
  status: string;
  createdAt: string;
  user?: { id: Id; firstName: string; lastName: string; email: string };
}

export interface AffiliateSummary {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export interface AffiliateConversion {
  id: Id;
  affiliateId: Id;
  orderId: Id;
  amount: number;
  commission: number;
  status: string;
  convertedAt: string;
}

// ---------------------------------------------------------------------------
// Email campaign types
// ---------------------------------------------------------------------------

export interface EmailCampaign {
  id: Id;
  eventId?: Id;
  name: string;
  subject: string;
  content: string;
  plainText?: string;
  recipientType: "all" | "segment" | "tag" | "event_registrations";
  segmentId?: Id;
  tagId?: Id;
  scheduledAt?: string;
  status: string;
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  createdAt: string;
}

export interface CampaignMetrics {
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
}

export interface CampaignRates {
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// ---------------------------------------------------------------------------
// Social media types
// ---------------------------------------------------------------------------

export type SocialPlatform = "facebook" | "twitter" | "instagram" | "linkedin";

export interface SocialPost {
  id: Id;
  eventId?: Id;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
  publishedAt?: string;
  status: string;
  likes?: number;
  shares?: number;
  comments?: number;
  createdAt: string;
}

export interface SocialPlatformStats {
  platform: SocialPlatform;
  posts: number;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
}

export interface SocialMediaTotals {
  posts: number;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
}

// ---------------------------------------------------------------------------
// Team types
// ---------------------------------------------------------------------------

export interface RoleTemplatePermissions {
  canEdit?: boolean;
  canManageAttendees?: boolean;
  canManageTickets?: boolean;
  canViewAnalytics?: boolean;
  canManageStaff?: boolean;
  canPublish?: boolean;
  canManageCollaborators?: boolean;
}

export interface RoleTemplate extends RoleTemplatePermissions {
  id: Id;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TeamActivity {
  id: Id;
  userId: Id;
  eventId?: Id;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  performedAt: string;
  user?: { id: Id; firstName: string; lastName: string; email: string };
}

export interface TeamPerformanceMetric {
  userId: Id;
  checkIns: number;
  registrations: number;
  messagesSent: number;
  period: string;
  user?: { id: Id; firstName: string; lastName: string; email: string };
}

// ===========================================================================
// ==================== Event Templates ======================================
// ===========================================================================

export const createEventTemplate = async (
  data: EventTemplatePayload,
): Promise<ApiResponse<{ template: EventTemplate }>> => {
  return apiPost("/organizer-dashboard/templates", data);
};

export const getOrganizerTemplates = async (
  filters?: Pagination & { isPublic?: boolean },
): Promise<ApiResponse<PaginatedList<{ templates: EventTemplate[] }>>> => {
  return apiGet(
    withQuery("/organizer-dashboard/templates", {
      page: filters?.page,
      limit: filters?.limit,
      isPublic: filters?.isPublic,
    }),
  );
};

export const getPublicTemplates = async (
  filters?: Pagination,
): Promise<ApiResponse<{ templates: EventTemplate[]; total?: number }>> => {
  return apiGet(
    withQuery("/organizer-dashboard/templates/public", {
      page: filters?.page,
      limit: filters?.limit,
    }),
  );
};

export const getTemplateById = async (
  templateId: Id,
): Promise<ApiResponse<{ template: EventTemplate }>> => {
  return apiGet(`/organizer-dashboard/templates/${templateId}`);
};

export const updateTemplate = async (
  templateId: Id,
  data: Partial<EventTemplatePayload>,
): Promise<ApiResponse<{ template: EventTemplate }>> => {
  return apiPut(`/organizer-dashboard/templates/${templateId}`, data);
};

export const createTemplateVersion = async (
  templateId: Id,
  data: Partial<EventTemplatePayload>,
): Promise<ApiResponse<{ template: EventTemplate }>> => {
  return apiPost(
    `/organizer-dashboard/templates/${templateId}/versions`,
    data,
  );
};

export const shareTemplate = async (
  templateId: Id,
): Promise<ApiResponse<{ shareToken: string; shareUrl: string }>> => {
  return apiPost(`/organizer-dashboard/templates/${templateId}/share`);
};

export const applyTemplate = async (
  templateId: Id,
): Promise<ApiResponse<{ eventData: Record<string, unknown> }>> => {
  return apiPost(`/organizer-dashboard/templates/${templateId}/use`);
};

export const deleteTemplate = async (
  templateId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/templates/${templateId}`);
};

export const createTemplateFromEvent = async (
  eventId: Id,
  data: { name: string; description?: string; isPublic?: boolean },
): Promise<ApiResponse<{ template: EventTemplate }>> => {
  return apiPost(`/organizer-dashboard/events/${eventId}/templates`, data);
};

// ===========================================================================
// ==================== Event Drafts =========================================
// ===========================================================================

export const createEventDraft = async (
  data: EventDraftPayload,
): Promise<ApiResponse<{ draft: EventDraft }>> => {
  return apiPost("/organizer-dashboard/drafts", data);
};

export const getOrganizerDrafts = async (
  filters?: Pagination & { eventId?: Id },
): Promise<ApiResponse<PaginatedList<{ drafts: EventDraft[] }>>> => {
  return apiGet(
    withQuery("/organizer-dashboard/drafts", {
      page: filters?.page,
      limit: filters?.limit,
      eventId: filters?.eventId,
    }),
  );
};

export const getDraftById = async (
  draftId: Id,
): Promise<ApiResponse<{ draft: EventDraft }>> => {
  return apiGet(`/organizer-dashboard/drafts/${draftId}`);
};

export const updateDraft = async (
  draftId: Id,
  data: Partial<EventDraftPayload>,
): Promise<ApiResponse<{ draft: EventDraft }>> => {
  return apiPut(`/organizer-dashboard/drafts/${draftId}`, data);
};

export const createDraftVersion = async (
  draftId: Id,
  data: Partial<EventDraftPayload>,
): Promise<ApiResponse<{ draft: EventDraft }>> => {
  return apiPost(`/organizer-dashboard/drafts/${draftId}/versions`, data);
};

export const scheduleDraft = async (
  draftId: Id,
  data: { scheduledDate: string },
): Promise<ApiResponse<{ draft: EventDraft }>> => {
  return apiPost(`/organizer-dashboard/drafts/${draftId}/schedule`, data);
};

export const publishDraft = async (
  draftId: Id,
): Promise<ApiResponse<{ eventData: Record<string, unknown> }>> => {
  return apiPost(`/organizer-dashboard/drafts/${draftId}/publish`);
};

export const deleteDraft = async (
  draftId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/drafts/${draftId}`);
};

// ===========================================================================
// ==================== Attendee Segmentation ================================
// ===========================================================================

export const createSegment = async (
  data: SegmentPayload,
): Promise<ApiResponse<{ segment: AttendeeSegment }>> => {
  return apiPost("/organizer-dashboard/segments", data);
};

export const getOrganizerSegments = async (filters?: {
  eventId?: Id;
}): Promise<ApiResponse<{ segments: AttendeeSegment[] }>> => {
  return apiGet(
    withQuery("/organizer-dashboard/segments", { eventId: filters?.eventId }),
  );
};

export const getSegmentById = async (
  segmentId: Id,
): Promise<
  ApiResponse<{ segment: AttendeeSegment; members: SegmentMember[] }>
> => {
  return apiGet(`/organizer-dashboard/segments/${segmentId}`);
};

export const updateSegment = async (
  segmentId: Id,
  data: Partial<SegmentPayload>,
): Promise<ApiResponse<{ segment: AttendeeSegment }>> => {
  return apiPut(`/organizer-dashboard/segments/${segmentId}`, data);
};

export const updateSegmentMembers = async (
  segmentId: Id,
): Promise<
  ApiResponse<{
    segment: AttendeeSegment;
    membersAdded: number;
    membersRemoved: number;
  }>
> => {
  return apiPost(`/organizer-dashboard/segments/${segmentId}/update-members`);
};

export const addMemberToSegment = async (
  segmentId: Id,
  userId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/organizer-dashboard/segments/${segmentId}/members`, {
    userId,
  });
};

export const removeMemberFromSegment = async (
  segmentId: Id,
  userId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(
    `/organizer-dashboard/segments/${segmentId}/members/${userId}`,
  );
};

export const deleteSegment = async (
  segmentId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/segments/${segmentId}`);
};

// ===========================================================================
// ==================== Attendee Tags ========================================
// ===========================================================================

export const createTag = async (data: {
  name: string;
  description?: string;
  color?: string;
}): Promise<ApiResponse<{ tag: OrganizerTag }>> => {
  return apiPost("/organizer-dashboard/tags", data);
};

export const getOrganizerTags = async (): Promise<
  ApiResponse<{ tags: OrganizerTag[] }>
> => {
  return apiGet("/organizer-dashboard/tags");
};

export const getTagById = async (
  tagId: Id,
): Promise<ApiResponse<{ tag: OrganizerTag; taggedUsers: TaggedUser[] }>> => {
  return apiGet(`/organizer-dashboard/tags/${tagId}`);
};

export const updateTag = async (
  tagId: Id,
  data: { name?: string; description?: string; color?: string },
): Promise<ApiResponse<{ tag: OrganizerTag }>> => {
  return apiPut(`/organizer-dashboard/tags/${tagId}`, data);
};

export const tagUser = async (
  tagId: Id,
  data: { userId: Id; eventId?: Id; notes?: string },
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiPost(`/organizer-dashboard/tags/${tagId}/users`, data);
};

export const untagUser = async (
  tagId: Id,
  userId: Id,
  eventId?: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(
    withQuery(`/organizer-dashboard/tags/${tagId}/users/${userId}`, { eventId }),
  );
};

export const getTaggedUsers = async (
  tagId: Id,
  filters?: Pagination & { eventId?: Id },
): Promise<ApiResponse<PaginatedList<{ users: TaggedUser[] }>>> => {
  return apiGet(
    withQuery(`/organizer-dashboard/tags/${tagId}/users`, {
      eventId: filters?.eventId,
      page: filters?.page,
      limit: filters?.limit,
    }),
  );
};

export const deleteTag = async (
  tagId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/tags/${tagId}`);
};

// ===========================================================================
// ==================== Attendee Communication ===============================
// ===========================================================================

interface MessagePayload {
  subject: string;
  content: string;
  sendEmail?: boolean;
  sendNotification?: boolean;
}

export const sendToSegment = async (
  segmentId: Id,
  data: MessagePayload,
): Promise<ApiResponse<{ sent: number; failed: number }>> => {
  return apiPost(
    `/organizer-dashboard/segments/${segmentId}/send`,
    data,
  );
};

export const sendToTaggedUsers = async (
  tagId: Id,
  data: MessagePayload,
): Promise<ApiResponse<{ sent: number; failed: number }>> => {
  return apiPost(`/organizer-dashboard/tags/${tagId}/send`, data);
};

export const sendToEventRegistrations = async (
  eventId: Id,
  data: MessagePayload,
): Promise<ApiResponse<{ sent: number; failed: number }>> => {
  return apiPost(`/organizer-dashboard/events/${eventId}/send`, data);
};

export const getCommunicationHistory = async (
  filters?: Pagination & { eventId?: Id },
): Promise<
  ApiResponse<PaginatedListWithMore<{ messages: CommunicationMessage[] }>>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/communications", {
      eventId: filters?.eventId,
      page: filters?.page,
      limit: filters?.limit,
    }),
  );
};

// ===========================================================================
// ==================== Analytics ============================================
// ===========================================================================

export const getEventAnalytics = async (
  eventId: Id,
  filters?: { startDate?: string; endDate?: string },
): Promise<
  ApiResponse<{
    event: EventSummaryInfo;
    summary: EventSummaryStats;
    funnel: ConversionFunnelStage[];
    traffic: TrafficStats;
    devices: DeviceStats;
    geography: GeographyStats;
  }>
> => {
  return apiGet(
    withQuery(`/organizer-dashboard/analytics/events/${eventId}`, {
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    }),
  );
};

export const getRevenueAnalytics = async (filters?: {
  eventId?: Id;
  startDate?: string;
  endDate?: string;
}): Promise<
  ApiResponse<{
    summary: FinancialTotals;
    byTicketType: RevenueByTicketType[];
    refunds: RefundStats;
    averageOrderValue: AverageOrderValue;
    forecasting: RevenueForecast;
  }>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/analytics/revenue", {
      eventId: filters?.eventId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    }),
  );
};

export const getAttendeeInsights = async (filters?: {
  eventId?: Id;
}): Promise<
  ApiResponse<{
    demographics: AttendeeDemographics;
    repeatAttendees: RepeatAttendeeStats;
    engagement: AttendeeEngagement;
  }>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/analytics/attendees", {
      eventId: filters?.eventId,
    }),
  );
};

export const getMarketingAnalytics = async (filters?: {
  eventId?: Id;
  startDate?: string;
  endDate?: string;
}): Promise<
  ApiResponse<{
    promoPerformance: PromoCodePerformance[];
    shareAnalytics: ShareAnalytics;
    emailCampaigns: EmailCampaign[];
  }>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/analytics/marketing", {
      eventId: filters?.eventId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    }),
  );
};

// ===========================================================================
// ==================== Advanced Promo Codes =================================
// ===========================================================================

export const createPromoCodeVariant = async (
  promoCodeId: Id,
  data: {
    name: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    trafficPercentage?: number;
    isControl?: boolean;
  },
): Promise<ApiResponse<{ variant: PromoCodeVariant }>> => {
  return apiPost(
    `/organizer-dashboard/promo-codes/${promoCodeId}/variants`,
    data,
  );
};

export const getPromoCodeAnalytics = async (
  promoCodeId: Id,
): Promise<
  ApiResponse<{
    promoCode: PromoCodePerformance;
    summary: PromoCodeSummary;
    redemptionsByDate: PromoCodeRedemptionDataPoint[];
    topUsers: TopPromoCodeUser[];
    variantPerformance: PromoCodeVariant[];
  }>
> => {
  return apiGet(
    `/organizer-dashboard/promo-codes/${promoCodeId}/analytics`,
  );
};

export const getOrganizerPromoCodeAnalytics = async (filters?: {
  eventId?: Id;
  startDate?: string;
  endDate?: string;
}): Promise<
  ApiResponse<{
    promoCodes: PromoCodePerformance[];
    total: number;
    summary: OrganizerPromoCodeSummary;
  }>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/promo-codes/analytics", {
      eventId: filters?.eventId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    }),
  );
};

// ===========================================================================
// ==================== Financial Management =================================
// ===========================================================================

export const createExpense = async (
  data: ExpensePayload,
): Promise<ApiResponse<{ expense: Expense }>> => {
  return apiPost("/organizer-dashboard/expenses", data);
};

export const getExpenses = async (filters?: {
  page?: number;
  limit?: number;
  eventId?: Id;
  category?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<
  ApiResponse<PaginatedListWithMore<{ expenses: Expense[] }>>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/expenses", {
      page: filters?.page,
      limit: filters?.limit,
      eventId: filters?.eventId,
      category: filters?.category,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      status: filters?.status,
    }),
  );
};

export const getProfitLossStatement = async (filters?: {
  eventId?: Id;
  startDate?: string;
  endDate?: string;
}): Promise<
  ApiResponse<{
    period: FinancialPeriod;
    revenue: FinancialTotals;
    expenses: ProfitLossExpenses;
    profit: number;
    summary: ProfitLossSummary;
  }>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/financial/profit-loss", {
      eventId: filters?.eventId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    }),
  );
};

export const createFinancialGoal = async (
  data: GoalPayload,
): Promise<ApiResponse<{ goal: FinancialGoal }>> => {
  return apiPost("/organizer-dashboard/financial/goals", data);
};

export const getFinancialGoals = async (filters?: {
  eventId?: Id;
  status?: string;
}): Promise<ApiResponse<{ goals: FinancialGoal[] }>> => {
  return apiGet(
    withQuery("/organizer-dashboard/financial/goals", {
      eventId: filters?.eventId,
      status: filters?.status,
    }),
  );
};

export const getTaxSummary = async (filters?: {
  eventId?: Id;
  year?: number;
}): Promise<
  ApiResponse<{
    year: number;
    revenue: TaxableRevenue;
    expenses: TaxableExpenses;
    taxableIncome: number;
    summary: TaxSummaryInfo;
  }>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/financial/tax-summary", {
      eventId: filters?.eventId,
      year: filters?.year,
    }),
  );
};

// ===========================================================================
// ==================== Payout Management ====================================
// ===========================================================================

export const getPayoutPreferences = async (): Promise<
  ApiResponse<{ preferences: PayoutPreferences }>
> => {
  return apiGet("/organizer-dashboard/payouts/preferences");
};

export const updatePayoutPreferences = async (
  data: Partial<PayoutPreferences>,
): Promise<ApiResponse<{ preferences: PayoutPreferences }>> => {
  return apiPut("/organizer-dashboard/payouts/preferences", data);
};

export const getPayoutHistory = async (filters?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<
  ApiResponse<PaginatedListWithMore<{ disbursements: Disbursement[] }>>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/payouts/history", {
      page: filters?.page,
      limit: filters?.limit,
      status: filters?.status,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    }),
  );
};

export const schedulePayout = async (data: {
  eventId?: Id;
  amount?: number;
  scheduledDate: string;
  notes?: string;
}): Promise<ApiResponse<{ disbursement: Disbursement }>> => {
  return apiPost("/organizer-dashboard/payouts/schedule", data);
};

export const getPayoutSummary = async (): Promise<
  ApiResponse<{
    pending: PayoutAmountSummary;
    scheduled: PayoutAmountSummary;
    totalPaid: number;
    totalDisbursements: number;
  }>
> => {
  return apiGet("/organizer-dashboard/payouts/summary");
};

// ===========================================================================
// ==================== Resale & Transfer Analytics ==========================
// ===========================================================================

export interface ResaleStats {
  totalListings: number;
  activeListings: number;
  reservedListings: number;
  soldListings: number;
  cancelledListings: number;
  expiredListings: number;
  totalResaleValue: number;
  totalPlatformFees: number;
  totalSellerPayouts: number;
}

export interface ResaleListing {
  id: string;
  status: string;
  originalPrice: number;
  resalePrice: number;
  currency: string;
  platformFee: number | null;
  sellerPayout: number | null;
  listedAt: string;
  soldAt: string | null;
  expiresAt: string | null;
  seller: { id: string; firstName: string; lastName: string; email: string };
  buyer: { id: string; firstName: string; lastName: string; email: string } | null;
  ticketType: string;
}

export interface TransferStats {
  totalTransfers: number;
  pendingTransfers: number;
  acceptedTransfers: number;
  rejectedTransfers: number;
  cancelledTransfers: number;
  expiredTransfers: number;
}

export interface TransferRecord {
  id: string;
  status: string;
  message: string | null;
  fromUser: { id: string; firstName: string; lastName: string; email: string };
  toUser: { id: string; firstName: string; lastName: string; email: string } | null;
  toEmail: string | null;
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string | null;
  ticketType: string;
}

export const getEventResaleStats = async (
  eventId: string,
): Promise<ApiResponse<ResaleStats>> => {
  return apiGet(`/organizer-dashboard/events/${eventId}/resale/stats`);
};

export const getEventResaleListings = async (
  eventId: string,
  filters?: { status?: string; page?: number; limit?: number },
): Promise<ApiResponse<{ listings: ResaleListing[]; total: number; page: number; totalPages: number }>> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return apiGet(`/organizer-dashboard/events/${eventId}/resale/listings${query ? `?${query}` : ''}`);
};

export const getEventTransferStats = async (
  eventId: string,
): Promise<ApiResponse<TransferStats>> => {
  return apiGet(`/organizer-dashboard/events/${eventId}/transfers/stats`);
};

export const getEventTransferHistory = async (
  eventId: string,
  filters?: { status?: string; page?: number; limit?: number },
): Promise<ApiResponse<{ transfers: TransferRecord[]; total: number; page: number; totalPages: number }>> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return apiGet(`/organizer-dashboard/events/${eventId}/transfers/history${query ? `?${query}` : ''}`);
};

// ===========================================================================
// ==================== Event Collaboration ==================================
// ===========================================================================

export const inviteCollaborator = async (
  eventId: Id,
  data: { collaboratorId: Id } & CollaboratorPermissions,
): Promise<ApiResponse<{ collaborator: Collaborator }>> => {
  return apiPost(
    `/organizer-dashboard/events/${eventId}/collaborators`,
    data,
  );
};

export const acceptInvitation = async (
  collaborationId: Id,
): Promise<ApiResponse<{ collaboration: Collaborator }>> => {
  return apiPost(
    `/organizer-dashboard/collaborations/${collaborationId}/accept`,
  );
};

export const getEventCollaborators = async (
  eventId: Id,
): Promise<ApiResponse<{ collaborators: Collaborator[] }>> => {
  return apiGet(`/organizer-dashboard/events/${eventId}/collaborators`);
};

export const updateCollaboratorPermissions = async (
  collaborationId: Id,
  data: CollaboratorPermissions,
): Promise<ApiResponse<{ collaboration: Collaborator }>> => {
  return apiPut(
    `/organizer-dashboard/collaborations/${collaborationId}`,
    data,
  );
};

export const removeCollaborator = async (
  collaborationId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(
    `/organizer-dashboard/collaborations/${collaborationId}`,
  );
};

export const getEventActivityLog = async (
  eventId: Id,
  filters?: { page?: number; limit?: number; action?: string; userId?: Id },
): Promise<
  ApiResponse<PaginatedListWithMore<{ activities: ActivityLogEntry[] }>>
> => {
  return apiGet(
    withQuery(`/organizer-dashboard/events/${eventId}/activity-log`, {
      page: filters?.page,
      limit: filters?.limit,
      action: filters?.action,
      userId: filters?.userId,
    }),
  );
};

// ===========================================================================
// ==================== Phase 3: Advanced Ticket Types =======================
// ===========================================================================

export const createTicketPackage = async (data: {
  eventId: Id;
  name: string;
  description?: string;
  type: TicketPackageType;
  price?: number;
  minQuantity?: number;
  maxQuantity?: number;
  bundleItems?: BundleItem[];
  isDonation?: boolean;
  minDonation?: number;
  maxDonation?: number;
  suggestedAmounts?: number[];
  hasReservedSeating?: boolean;
  seatingChart?: SeatingChart;
  availableFrom?: string;
  availableUntil?: string;
  quantity?: number;
}): Promise<ApiResponse<{ package: TicketPackage }>> => {
  return apiPost("/organizer-dashboard/ticket-packages", data);
};

export const getEventTicketPackages = async (
  eventId: Id,
  filters?: { type?: string; isActive?: boolean },
): Promise<ApiResponse<{ packages: TicketPackage[] }>> => {
  return apiGet(
    withQuery(
      `/organizer-dashboard/events/${eventId}/ticket-packages`,
      { type: filters?.type, isActive: filters?.isActive },
    ),
  );
};

export const updateTicketPackage = async (
  packageId: Id,
  data: {
    name?: string;
    description?: string;
    price?: number;
    minQuantity?: number;
    maxQuantity?: number;
    bundleItems?: BundleItem[];
    minDonation?: number;
    maxDonation?: number;
    suggestedAmounts?: number[];
    hasReservedSeating?: boolean;
    seatingChart?: SeatingChart;
    availableFrom?: string;
    availableUntil?: string;
    quantity?: number;
    isActive?: boolean;
  },
): Promise<ApiResponse<{ package: TicketPackage }>> => {
  return apiPut(
    `/organizer-dashboard/ticket-packages/${packageId}`,
    data,
  );
};

export const getReservedSeating = async (
  eventId: Id,
): Promise<ApiResponse<{ seating: ReservedSeat[] }>> => {
  return apiGet(
    `/organizer-dashboard/events/${eventId}/reserved-seating`,
  );
};

export const deleteTicketPackage = async (
  packageId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/ticket-packages/${packageId}`);
};

// ---------------------------------------------------------------------------
// Complementary ticket issuances
// ---------------------------------------------------------------------------

export interface TicketIssuance {
  id: Id;
  packageId: Id;
  email: string;
  quantity: number;
  claimToken: string;
  status: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  claimedAt?: string;
  expiresAt?: string;
  note?: string;
  createdAt: string;
}

export const issueComplementaryTickets = async (
  packageId: Id,
  data: {
    emails: string[];
    quantity?: number;
    note?: string;
    expiresAt?: string;
  },
): Promise<ApiResponse<{ issuances: TicketIssuance[] }>> => {
  return apiPost(`/organizer-dashboard/ticket-packages/${packageId}/issue`, data);
};

export const getPackageIssuances = async (
  packageId: Id,
): Promise<ApiResponse<{ issuances: TicketIssuance[] }>> => {
  return apiGet(`/organizer-dashboard/ticket-packages/${packageId}/issuances`);
};

export const cancelIssuance = async (
  issuanceId: Id,
): Promise<ApiResponse<{ issuance: TicketIssuance }>> => {
  return apiPatch(`/organizer-dashboard/ticket-issuances/${issuanceId}/cancel`, {});
};

// ===========================================================================
// ==================== Phase 3: Dynamic Pricing =============================
// ===========================================================================

export const createPricingRule = async (
  data: PricingRulePayload,
): Promise<ApiResponse<{ rule: PricingRule }>> => {
  return apiPost("/organizer-dashboard/pricing-rules", data);
};

export const getEventPricingRules = async (
  eventId: Id,
  filters?: { type?: string; isActive?: boolean },
): Promise<ApiResponse<{ rules: PricingRule[] }>> => {
  return apiGet(
    withQuery(
      `/organizer-dashboard/events/${eventId}/pricing-rules`,
      { type: filters?.type, isActive: filters?.isActive },
    ),
  );
};

export const calculateDynamicPrice = async (
  eventId: Id,
  ticketType: string,
  quantity: number,
): Promise<
  ApiResponse<{
    originalPrice: number;
    finalPrice: number;
    discount?: number;
    appliedRules: string[];
  }>
> => {
  return apiGet(
    withQuery(
      `/organizer-dashboard/events/${eventId}/calculate-price`,
      { ticketType, quantity },
    ),
  );
};

export const updatePricingRule = async (
  ruleId: Id,
  data: {
    name?: string;
    startDate?: string;
    endDate?: string;
    demandThreshold?: number;
    priceMultiplier?: number;
    minGroupSize?: number;
    discountType?: DiscountType;
    discountValue?: number;
    loyaltyDiscount?: number;
    applicableTicketTypes?: string[];
    priority?: number;
    isActive?: boolean;
  },
): Promise<ApiResponse<{ rule: PricingRule }>> => {
  return apiPut(`/organizer-dashboard/pricing-rules/${ruleId}`, data);
};

export const deletePricingRule = async (
  ruleId: Id,
): Promise<ApiResponse<{ success: boolean }>> => {
  return apiDelete(`/organizer-dashboard/pricing-rules/${ruleId}`);
};

// ===========================================================================
// ==================== Phase 3: Affiliate Program ===========================
// ===========================================================================

export const createAffiliateProgram = async (data: {
  eventId?: Id;
  name: string;
  description?: string;
  commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionValue: number;
  minCommission?: number;
  maxCommission?: number;
  cookieDuration?: number;
}): Promise<ApiResponse<{ program: AffiliateProgram }>> => {
  return apiPost("/organizer-dashboard/affiliate-programs", data);
};

export const getAffiliatePrograms = async (filters?: {
  eventId?: Id;
  isActive?: boolean;
}): Promise<ApiResponse<{ programs: AffiliateProgram[] }>> => {
  return apiGet(
    withQuery("/organizer-dashboard/affiliate-programs", {
      eventId: filters?.eventId,
      isActive: filters?.isActive,
    }),
  );
};

export const applyAsAffiliate = async (
  programId: Id,
): Promise<ApiResponse<{ affiliate: Affiliate }>> => {
  return apiPost(
    `/organizer-dashboard/affiliate-programs/${programId}/apply`,
  );
};

export const getAffiliateDashboard = async (
  affiliateId: Id,
): Promise<
  ApiResponse<{
    affiliate: Affiliate;
    affiliateLink: string;
    summary: AffiliateSummary;
  }>
> => {
  return apiGet(
    `/organizer-dashboard/affiliates/${affiliateId}/dashboard`,
  );
};

export const getAffiliateConversions = async (
  affiliateId: Id,
  filters?: Pagination & { status?: string },
): Promise<
  ApiResponse<PaginatedList<{ conversions: AffiliateConversion[] }>>
> => {
  return apiGet(
    withQuery(
      `/organizer-dashboard/affiliates/${affiliateId}/conversions`,
      {
        page: filters?.page,
        limit: filters?.limit,
        status: filters?.status,
      },
    ),
  );
};

// ===========================================================================
// ==================== Phase 3: Email Marketing =============================
// ===========================================================================

export const createEmailCampaign = async (data: {
  eventId?: Id;
  name: string;
  subject: string;
  content: string;
  plainText?: string;
  recipientType: "all" | "segment" | "tag" | "event_registrations";
  segmentId?: Id;
  tagId?: Id;
  scheduledAt?: string;
}): Promise<ApiResponse<{ campaign: EmailCampaign }>> => {
  return apiPost("/organizer-dashboard/email-campaigns", data);
};

export const getEmailCampaigns = async (filters?: {
  eventId?: Id;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<
  ApiResponse<PaginatedList<{ campaigns: EmailCampaign[] }>>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/email-campaigns", {
      eventId: filters?.eventId,
      status: filters?.status,
      page: filters?.page,
      limit: filters?.limit,
    }),
  );
};

export const sendEmailCampaign = async (
  campaignId: Id,
): Promise<
  ApiResponse<{
    success: boolean;
    sentCount: number;
    deliveredCount: number;
    bouncedCount: number;
  }>
> => {
  return apiPost(
    `/organizer-dashboard/email-campaigns/${campaignId}/send`,
  );
};

export const getCampaignAnalytics = async (
  campaignId: Id,
): Promise<
  ApiResponse<{
    campaign: EmailCampaign;
    metrics: CampaignMetrics;
    rates: CampaignRates;
  }>
> => {
  return apiGet(
    `/organizer-dashboard/email-campaigns/${campaignId}/analytics`,
  );
};

// ===========================================================================
// ==================== Phase 3: Social Media ================================
// ===========================================================================

export const createSocialPost = async (data: {
  eventId?: Id;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
}): Promise<ApiResponse<{ post: SocialPost }>> => {
  return apiPost("/organizer-dashboard/social-posts", data);
};

export const getSocialPosts = async (filters?: {
  eventId?: Id;
  platform?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedList<{ posts: SocialPost[] }>>> => {
  return apiGet(
    withQuery("/organizer-dashboard/social-posts", {
      eventId: filters?.eventId,
      platform: filters?.platform,
      status: filters?.status,
      page: filters?.page,
      limit: filters?.limit,
    }),
  );
};

export const publishSocialPost = async (
  postId: Id,
): Promise<ApiResponse<{ post: SocialPost }>> => {
  return apiPost(`/organizer-dashboard/social-posts/${postId}/publish`);
};

export const getSocialMediaAnalytics = async (filters?: {
  eventId?: Id;
  platform?: string;
  startDate?: string;
  endDate?: string;
}): Promise<
  ApiResponse<{
    byPlatform: SocialPlatformStats[];
    total: SocialMediaTotals;
  }>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/social-media/analytics", {
      eventId: filters?.eventId,
      platform: filters?.platform,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    }),
  );
};

// ===========================================================================
// ==================== Phase 3: Advanced Team Features ======================
// ===========================================================================

export const createRoleTemplate = async (
  data: { name: string; description?: string } & RoleTemplatePermissions,
): Promise<ApiResponse<{ template: RoleTemplate }>> => {
  return apiPost("/organizer-dashboard/team/role-templates", data);
};

export const getRoleTemplates = async (filters?: {
  isActive?: boolean;
}): Promise<ApiResponse<{ templates: RoleTemplate[] }>> => {
  return apiGet(
    withQuery("/organizer-dashboard/team/role-templates", {
      isActive: filters?.isActive,
    }),
  );
};

export const getTeamActivityFeed = async (
  filters?: Pagination & { eventId?: Id; userId?: Id },
): Promise<
  ApiResponse<PaginatedList<{ activities: TeamActivity[] }>>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/team/activity-feed", {
      eventId: filters?.eventId,
      userId: filters?.userId,
      page: filters?.page,
      limit: filters?.limit,
    }),
  );
};

export const getTeamPerformanceMetrics = async (filters?: {
  userId?: Id;
  startDate?: string;
  endDate?: string;
}): Promise<
  ApiResponse<{ metrics: TeamPerformanceMetric[]; total: number }>
> => {
  return apiGet(
    withQuery("/organizer-dashboard/team/performance-metrics", {
      userId: filters?.userId,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    }),
  );
};

// ===========================================================================
// ==================== My Permissions =======================================
// ===========================================================================

export const getMyPermissions = async (): Promise<
  ApiResponse<{ permissions: string[] }>
> => {
  return apiGet("/organizer-dashboard/my-permissions");
};

// ===========================================================================
// ==================== Scan & Check-In Analytics ============================
// ===========================================================================

export interface OrganizerScanConfig {
  allowReEntry: boolean;
  requireCheckOut: boolean;
  maxReEntries: number | null;
  scanSettings: Record<string, unknown> | null;
}

export interface OrganizerScanStatistics {
  totalAttendees: number;
  checkedIn: number;
  currentlyInside: number;
  checkedOut: number;
  reEntries: number;
  scansToday: number;
}

export interface OrganizerScanOverview {
  config: OrganizerScanConfig;
  statistics: OrganizerScanStatistics;
}

export interface OrganizerScanRecord {
  id: string;
  registrationId: string;
  eventId: string;
  scanType: 'CHECK_IN' | 'CHECK_OUT' | 'MANUAL_CHECK_IN' | 'MANUAL_CHECK_OUT';
  scannedAt: string;
  scannedBy: string;
  facility: string | null;
  session: string | null;
  attendeeName: string;
  ticketType: string | null;
  isReEntry: boolean;
  isValid: boolean;
  scanLocation: string | null;
}

export interface OrganizerScanAttendee {
  registrationId: string;
  visitorId: string;
  attendeeName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  ticketType: string | null;
  ticketStatus: string;
  isCurrentlyInside: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  reEntryCount: number;
  lastScanFacility: string | null;
  registeredAt: string;
}

export const getEventScanOverview = async (
  eventId: string,
): Promise<ApiResponse<OrganizerScanOverview>> => {
  return apiGet(`/organizer-dashboard/events/${eventId}/scans/overview`);
};

export const getEventScanHistory = async (
  eventId: string,
  filters?: { scanType?: string; page?: number; limit?: number },
): Promise<ApiResponse<{ scans: OrganizerScanRecord[]; total: number; pagination: { page: number; limit: number; totalPages: number } }>> => {
  const params = new URLSearchParams();
  if (filters?.scanType) params.set('scanType', filters.scanType);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return apiGet(`/organizer-dashboard/events/${eventId}/scans/history${query ? `?${query}` : ''}`);
};

export const getEventScanAttendees = async (
  eventId: string,
  filters?: { page?: number; limit?: number },
): Promise<ApiResponse<{ attendees: OrganizerScanAttendee[]; total: number; pagination: { page: number; limit: number; totalPages: number } }>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return apiGet(`/organizer-dashboard/events/${eventId}/scans/attendees${query ? `?${query}` : ''}`);
};

export const updateEventScanConfig = async (
  eventId: string,
  updates: { allowReEntry?: boolean; requireCheckOut?: boolean; maxReEntries?: number | null },
): Promise<ApiResponse<{ config: OrganizerScanConfig }>> => {
  return apiPut(`/organizer-dashboard/events/${eventId}/scans/config`, updates);
};
