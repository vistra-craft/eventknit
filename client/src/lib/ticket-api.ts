/**
 * Ticket API Functions
 */

import { apiGet, apiPost, apiFetch, API_BASE_URL } from './api';
import type { ApiResponse } from './api';

export interface TicketLineItem {
  ticketType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface TicketSeatInfo {
  seatIdentifier: string;
  sectionId?: string;
  rowLabel?: string;
  seatLabel?: string;
  seatType: string;
  reservationStatus: string;
}

export interface TicketData {
  id: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketType?: string;
  ticketLineItems?: TicketLineItem[];
  currency?: string;
  qrCode?: string;
  backupCode?: string;
  seat?: TicketSeatInfo;
  createdAt: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  isCurrentlyInside?: boolean;
}

/**
 * Get ticket by registration ID (authenticated)
 */
export const getTicket = async (registrationId: string): Promise<ApiResponse<TicketData>> => {
  return apiGet<ApiResponse<TicketData>>(`/tickets/${registrationId}`);
};

/**
 * Get ticket by registration ID (public - with email verification)
 */
export const getTicketPublic = async (registrationId: string, email: string): Promise<ApiResponse<TicketData>> => {
  const response = await fetch(`${API_BASE_URL}/tickets/${registrationId}/view?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch ticket' }));
    throw new Error(error.message || 'Failed to fetch ticket');
  }

  return response.json();
};

/**
 * Download ticket as PDF
 */
export const downloadTicketPDF = async (registrationId: string): Promise<void> => {
  const response = await apiFetch(`/tickets/${registrationId}/download`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to download ticket' }));
    throw new Error(error.message || 'Failed to download ticket');
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    const html = await response.text();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${registrationId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    window.open(url, '_blank');
  } else {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${registrationId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Refund eligibility response
 */
export interface RefundEligibility {
  eligible: boolean;
  refundPercentage: number;
  refundAmount: number;
  currency: string;
  message: string;
  policyType: string;
  policyText?: string;
  daysUntilEvent: number;
  deadline?: string;
}

/**
 * Check refund eligibility for a registration
 */
export const checkRefundEligibility = async (registrationId: string): Promise<ApiResponse<RefundEligibility>> => {
  return apiGet<ApiResponse<RefundEligibility>>(`/tickets/${registrationId}/refund-eligibility`);
};

/**
 * Request a refund for a registration
 */
export const requestRefund = async (registrationId: string, refundReason: string): Promise<ApiResponse<unknown>> => {
  return apiPost<ApiResponse<unknown>>(`/tickets/${registrationId}/request-refund`, { refundReason });
};

/**
 * Resend ticket email
 */
export const resendTicketEmail = async (registrationId: string): Promise<ApiResponse<void>> => {
  return apiPost<ApiResponse<void>>(`/tickets/${registrationId}/resend`);
};












