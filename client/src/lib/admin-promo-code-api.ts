import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from './api';

export type PromoCodeScope = 'PLATFORM' | 'ORGANIZER' | 'EVENT' | 'MULTI_EVENT';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface DiscountTier {
  minUsage: number;
  maxUsage: number | null;  // null means unlimited
  discountValue: number;
  discountType: DiscountType;
}

export interface AdminPromoCode {
  id: string;
  code: string;
  scope: PromoCodeScope;
  eventId?: string;
  eventIds: string[];
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableTicketTypes: string[];
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  maxUsesPerUser?: number;
  validFrom: string;
  validUntil: string;
  firstTimeOnly: boolean;
  isStackable: boolean;
  isReferral: boolean;
  referrerUserId?: string;
  campaignName?: string;
  campaignSource?: string;
  isTiered: boolean;
  discountTiers?: DiscountTier[];
  codePrefix?: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  event?: {
    id: string;
    title: string;
  };
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  referrer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    redemptions: number;
  };
  redemptions?: Array<{
    id: string;
    discountAmount: number;
    originalAmount: number;
    finalAmount: number;
    redeemedAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    registration: {
      id: string;
      event: {
        id: string;
        title: string;
      };
    };
  }>;
}

export interface CreateAdminPromoCodeData {
  code: string;
  scope: PromoCodeScope;
  eventId?: string;
  eventIds?: string[];
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableTicketTypes?: string[];
  usageLimit?: number;
  maxUsesPerUser?: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
  firstTimeOnly?: boolean;
  isStackable?: boolean;
  isReferral?: boolean;
  referrerUserId?: string;
  campaignName?: string;
  campaignSource?: string;
  isTiered?: boolean;
  discountTiers?: DiscountTier[];
}

export interface BulkGenerateData {
  count: number;
  prefix: string;
  scope: PromoCodeScope;
  eventId?: string;
  eventIds?: string[];
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  maxUsesPerUser?: number;
  validFrom: string;
  validUntil: string;
  firstTimeOnly?: boolean;
  isReferral?: boolean;
  referrerUserId?: string;
  campaignName?: string;
  campaignSource?: string;
  isTiered?: boolean;
  discountTiers?: DiscountTier[];
}

export interface PromoCodeStats {
  totalCodes: number;
  activeCodes: number;
  inactiveCodes: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  byScope: {
    platform: number;
    organizer: number;
    event: number;
    multiEvent: number;
  };
}

export interface PromoCodeListResponse {
  promoCodes: AdminPromoCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Extract error message from unknown error
 */
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message || defaultMessage;
  }
  return defaultMessage;
};

/**
 * Get all promo codes (admin)
 */
export const getAdminPromoCodes = async (options?: {
  scope?: PromoCodeScope;
  eventId?: string;
  isActive?: boolean;
  batchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data?: PromoCodeListResponse; message?: string }> => {
  try {
    const params = new URLSearchParams();
    if (options?.scope) params.append('scope', options.scope);
    if (options?.eventId) params.append('eventId', options.eventId);
    if (options?.isActive !== undefined) params.append('isActive', String(options.isActive));
    if (options?.batchId) params.append('batchId', options.batchId);
    if (options?.search) params.append('search', options.search);
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));

    const queryString = params.toString();
    const endpoint = `/admin/promo-codes${queryString ? `?${queryString}` : ''}`;
    const response = await apiGet<ApiResponse<PromoCodeListResponse>>(endpoint);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to fetch promo codes'),
    };
  }
};

/**
 * Get promo code statistics (admin)
 */
export const getPromoCodeStats = async (): Promise<{ success: boolean; data?: PromoCodeStats; message?: string }> => {
  try {
    const response = await apiGet<ApiResponse<PromoCodeStats>>('/admin/promo-codes/stats');
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to fetch promo code stats'),
    };
  }
};

/**
 * Get a single promo code by ID (admin)
 */
export const getAdminPromoCodeById = async (
  id: string
): Promise<{ success: boolean; data?: AdminPromoCode; message?: string }> => {
  try {
    const response = await apiGet<ApiResponse<AdminPromoCode>>(`/admin/promo-codes/${id}`);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to fetch promo code'),
    };
  }
};

/**
 * Create a promo code (admin)
 */
export const createAdminPromoCode = async (
  data: CreateAdminPromoCodeData
): Promise<{ success: boolean; data?: AdminPromoCode; message?: string }> => {
  try {
    const response = await apiPost<ApiResponse<AdminPromoCode>>('/admin/promo-codes', data);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to create promo code'),
    };
  }
};

/**
 * Update a promo code (admin)
 */
export const updateAdminPromoCode = async (
  id: string,
  data: Partial<CreateAdminPromoCodeData>
): Promise<{ success: boolean; data?: AdminPromoCode; message?: string }> => {
  try {
    const response = await apiPut<ApiResponse<AdminPromoCode>>(`/admin/promo-codes/${id}`, data);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to update promo code'),
    };
  }
};

/**
 * Toggle promo code active status (admin)
 */
export const toggleAdminPromoCode = async (
  id: string
): Promise<{ success: boolean; data?: AdminPromoCode; message?: string }> => {
  try {
    const response = await apiPost<ApiResponse<AdminPromoCode>>(`/admin/promo-codes/${id}/toggle`, {});
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to toggle promo code'),
    };
  }
};

/**
 * Delete a promo code (admin)
 */
export const deleteAdminPromoCode = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiDelete<ApiResponse<unknown>>(`/admin/promo-codes/${id}`);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to delete promo code'),
    };
  }
};

/**
 * Bulk generate promo codes (admin)
 */
export const bulkGeneratePromoCodes = async (
  data: BulkGenerateData
): Promise<{ success: boolean; data?: { codes: string[]; count: number; batchId: string }; message?: string }> => {
  try {
    const response = await apiPost<ApiResponse<{ codes: string[]; count: number; batchId: string }>>(
      '/admin/promo-codes/bulk-generate',
      data
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to generate promo codes'),
    };
  }
};

/**
 * Get codes by batch ID (admin)
 */
export const getCodesByBatch = async (
  batchId: string
): Promise<{ success: boolean; data?: { codes: AdminPromoCode[]; count: number }; message?: string }> => {
  try {
    const response = await apiGet<ApiResponse<{ codes: AdminPromoCode[]; count: number }>>(
      `/admin/promo-codes/batch/${batchId}`
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to fetch batch codes'),
    };
  }
};

/**
 * Delete a batch of promo codes (admin)
 */
export const deleteBatch = async (
  batchId: string
): Promise<{ success: boolean; data?: { deleted: number }; message?: string }> => {
  try {
    const response = await apiDelete<ApiResponse<{ deleted: number }>>(
      `/admin/promo-codes/batch/${batchId}`
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to delete batch'),
    };
  }
};

/**
 * Get scope display label
 */
export const getScopeLabel = (scope: PromoCodeScope): string => {
  switch (scope) {
    case 'PLATFORM':
      return 'Platform-wide';
    case 'ORGANIZER':
      return 'Organizer-wide';
    case 'EVENT':
      return 'Single Event';
    case 'MULTI_EVENT':
      return 'Multiple Events';
    default:
      return scope;
  }
};

/**
 * Get scope badge color class
 */
export const getScopeBadgeClass = (scope: PromoCodeScope): string => {
  switch (scope) {
    case 'PLATFORM':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ORGANIZER':
      return 'bg-primary/10 text-primary border-primary';
    case 'EVENT':
      return 'bg-success/10 text-success border-success';
    case 'MULTI_EVENT':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-muted text-foreground border-border';
  }
};
