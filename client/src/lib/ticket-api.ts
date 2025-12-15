/**
 * Ticket API Functions
 */

import { API_BASE_URL, getAccessToken } from './api';
import type { ApiResponse } from './api';

export interface TicketData {
  id: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketType?: string;
  qrCode?: string;
  backupCode?: string;
  createdAt: string;
}

/**
 * Get ticket by registration ID (authenticated)
 */
export const getTicket = async (registrationId: string): Promise<ApiResponse<TicketData>> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${registrationId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
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
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${registrationId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to download ticket' }));
    throw new Error(error.message || 'Failed to download ticket');
  }

  // Get content type
  const contentType = response.headers.get('content-type') || '';
  
  // Check if it's HTML (fallback when puppeteer not available)
  if (contentType.includes('text/html')) {
    // Get HTML content
    const html = await response.text();
    
    // Create a blob and download it, or open in new window for printing
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${registrationId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Also open in new window for better printing
    window.open(url, '_blank');
  } else {
    // It's a PDF
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
 * Resend ticket email
 */
export const resendTicketEmail = async (registrationId: string): Promise<ApiResponse<void>> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${registrationId}/resend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to resend ticket email' }));
    throw new Error(error.message || 'Failed to resend ticket email');
  }

  return response.json();
};


