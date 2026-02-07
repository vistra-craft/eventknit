import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse } from './api';

export interface PromoCode {
  id: string;
  code: string;
  eventId?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
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
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
  };
}

export interface CreatePromoCodeData {
  code: string;
  eventId?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableTicketTypes?: string[];
  usageLimit?: number;
  maxUsesPerUser?: number;
  validFrom: string;
  validUntil: string;
}

export interface PromoCodeValidationResult {
  valid: boolean;
  discountAmount?: number;
  promoCode?: {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
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
 * Validate a promo code
 */
export const validatePromoCode = async (
  code: string,
  eventId: string,
  ticketType: string | null,
  totalAmount: number
): Promise<{ success: boolean; data?: PromoCodeValidationResult; message?: string }> => {
  try {
    const response = await apiPost<ApiResponse<PromoCodeValidationResult>>('/promo-codes/validate', {
      code,
      eventId,
      ticketType,
      totalAmount,
    });
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to validate promo code'),
    };
  }
};

/**
 * Get promo codes for organizer
 */
export const getPromoCodes = async (eventId?: string): Promise<{ success: boolean; data?: { promoCodes: PromoCode[] }; message?: string }> => {
  try {
    const endpoint = eventId ? `/promo-codes?eventId=${eventId}` : '/promo-codes';
    const response = await apiGet<ApiResponse<{ promoCodes: PromoCode[] }>>(endpoint);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to fetch promo codes'),
    };
  }
};

/**
 * Create a promo code
 */
export const createPromoCode = async (
  data: CreatePromoCodeData
): Promise<{ success: boolean; data?: { promoCode: PromoCode }; message?: string }> => {
  try {
    const response = await apiPost<ApiResponse<{ promoCode: PromoCode }>>('/promo-codes', data);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to create promo code'),
    };
  }
};

/**
 * Update a promo code
 */
export const updatePromoCode = async (
  id: string,
  data: Partial<CreatePromoCodeData & { isActive?: boolean }>
): Promise<{ success: boolean; data?: { promoCode: PromoCode }; message?: string }> => {
  try {
    const response = await apiPut<ApiResponse<{ promoCode: PromoCode }>>(`/promo-codes/${id}`, data);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to update promo code'),
    };
  }
};

/**
 * Delete a promo code
 */
export const deletePromoCode = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiDelete<ApiResponse<unknown>>(`/promo-codes/${id}`);
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to delete promo code'),
    };
  }
};

