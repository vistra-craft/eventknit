import { apiGet, apiPost, apiPatch, type ApiResponse } from './api';

export interface PromoCodeRequest {
  id: string;
  organizerId: string;
  eventId?: string | null;
  message?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  promoCodeId?: string | null;
  createdAt: string;
  updatedAt: string;
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    organizationName?: string | null;
  };
  event?: { id: string; title: string } | null;
  reviewer?: { id: string; firstName: string; lastName: string } | null;
  promoCode?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
}

interface PaginatedRequests {
  requests: PromoCodeRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message || defaultMessage;
  }
  return defaultMessage;
};

// ── Organizer endpoints ──────────────────────────────────

export const createPromoCodeRequest = async (
  data: { eventId?: string; message?: string },
): Promise<{ success: boolean; data?: PromoCodeRequest; message?: string }> => {
  try {
    const response = await apiPost<ApiResponse<PromoCodeRequest>>(
      '/promo-codes/requests',
      data,
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to submit promo code request'),
    };
  }
};

export const getMyPromoCodeRequests = async (
  page = 1,
  limit = 20,
): Promise<{ success: boolean; data?: PaginatedRequests; message?: string }> => {
  try {
    const response = await apiGet<ApiResponse<PaginatedRequests>>(
      `/promo-codes/requests/mine?page=${page}&limit=${limit}`,
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to fetch your requests'),
    };
  }
};

// ── Admin endpoints ──────────────────────────────────────

export const getPromoCodeRequests = async (
  filters: { status?: string; page?: number; limit?: number } = {},
): Promise<{ success: boolean; data?: PaginatedRequests; message?: string }> => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const response = await apiGet<ApiResponse<PaginatedRequests>>(
      `/admin/promo-codes/requests?${params.toString()}`,
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to fetch promo code requests'),
    };
  }
};

export const getPendingRequestCount = async (): Promise<{
  success: boolean;
  data?: { count: number };
  message?: string;
}> => {
  try {
    const response = await apiGet<ApiResponse<{ count: number }>>(
      '/admin/promo-codes/requests/pending-count',
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to fetch pending count'),
    };
  }
};

export const approvePromoCodeRequest = async (
  id: string,
  promoCodeId: string,
): Promise<{ success: boolean; data?: PromoCodeRequest; message?: string }> => {
  try {
    const response = await apiPatch<ApiResponse<PromoCodeRequest>>(
      `/admin/promo-codes/requests/${id}/approve`,
      { promoCodeId },
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to approve request'),
    };
  }
};

export const rejectPromoCodeRequest = async (
  id: string,
  reason?: string,
): Promise<{ success: boolean; data?: PromoCodeRequest; message?: string }> => {
  try {
    const response = await apiPatch<ApiResponse<PromoCodeRequest>>(
      `/admin/promo-codes/requests/${id}/reject`,
      { reason },
    );
    return response;
  } catch (error: unknown) {
    return {
      success: false,
      message: getErrorMessage(error, 'Failed to reject request'),
    };
  }
};
