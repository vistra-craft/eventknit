/**
 * Verification API Functions
 */

import { apiGet, apiPost, type ApiResponse } from './api';

export interface VerificationStatus {
  emailVerified: boolean;
  identityVerified: boolean;
  identityVerifiedAt: string | null;
  verificationLevel: number; // 1=Basic, 2=Identity Verified, 3=Full KYC
  payoutLimit: number | null;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  kycSubmittedAt: string | null;
  kycApprovedAt: string | null;
  kycDocuments: Array<{
    id: string;
    documentType: string;
    documentNumber: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
  }>;
  canCreateFreeEvents: boolean;
  canCreatePaidEvents: boolean;
  canReceivePayouts: boolean;
}

export interface IdentityVerificationData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  idDocumentUrl: string;
}

export interface BusinessVerificationData {
  businessName: string;
  businessType: 'corporation' | 'llc' | 'partnership' | 'sole-proprietorship' | 'non-profit' | 'other';
  taxId: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  businessCountry: string;
  businessLicenseUrl?: string;
  taxDocumentUrl?: string;
}

export interface VerificationStatusResponse {
  success: boolean;
  data: VerificationStatus;
}

export interface VerificationSubmitResponse {
  success: boolean;
  message: string;
  data: {
    verificationLevel: number;
    payoutLimit?: number;
  };
}

/**
 * Get verification status
 */
export const getVerificationStatus = async (): Promise<VerificationStatusResponse> => {
  return apiGet<VerificationStatusResponse>('/verification/status');
};

/**
 * Submit identity verification
 */
export const submitIdentityVerification = async (
  data: IdentityVerificationData
): Promise<VerificationSubmitResponse> => {
  return apiPost<VerificationSubmitResponse>('/verification/identity', data);
};

/**
 * Submit business verification / KYC
 */
export const submitBusinessVerification = async (
  data: BusinessVerificationData
): Promise<VerificationSubmitResponse> => {
  return apiPost<VerificationSubmitResponse>('/verification/business', data);
};

