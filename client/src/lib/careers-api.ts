import { apiGet, apiPatch } from './api';

// Types
export interface CareerInquiry {
  id: string;
  email: string;
  firstName: string | null;
  status: CareerInquiryStatus;
  emailSentAt: string;
  respondedAt: string | null;
  notes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  source: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CareerInquiryStatus = 'PENDING' | 'CONTACTED' | 'RESPONDED' | 'REVIEWING' | 'REJECTED' | 'HIRED';

export interface GetCareerInquiriesResponse {
  success: boolean;
  data: {
    inquiries: CareerInquiry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UpdateCareerInquiryResponse {
  success: boolean;
  message: string;
  data: CareerInquiry;
}

export const getCareerInquiries = async (filters?: {
  status?: CareerInquiryStatus;
  page?: number;
  limit?: number;
}): Promise<GetCareerInquiriesResponse> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  const qs = params.toString();
  return apiGet<GetCareerInquiriesResponse>(`/careers${qs ? `?${qs}` : ''}`);
};

export const updateCareerInquiry = async (
  id: string,
  data: { status: CareerInquiryStatus; notes?: string },
): Promise<UpdateCareerInquiryResponse> => {
  return apiPatch<UpdateCareerInquiryResponse>(`/careers/${id}`, data);
};
