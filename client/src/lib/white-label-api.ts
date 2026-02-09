import api from './api';
import type { ApiResponse } from './api';

export interface OrganizerInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface WhiteLabelBranding {
  id: string;
  organizerId: string;
  logoUrl?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  linkColor?: string;
  fontFamily?: string;
  headingFont?: string;
  brandName?: string;
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  websiteUrl?: string;
  emailHeaderImage?: string;
  emailFooterText?: string;
  emailSignature?: string;
  socialLinks?: Record<string, string>;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';
  isActive: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomDomain {
  id: string;
  organizerId: string;
  domain: string;
  subdomain?: string;
  isPrimary: boolean;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPENDED';
  verificationToken?: string;
  verificationCode?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  sslEnabled: boolean;
  sslCertificate?: string;
  sslKey?: string;
  sslExpiresAt?: string;
  cnameTarget?: string;
  ipAddress?: string;
  isActive: boolean;
  lastCheckedAt?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandingData {
  logoUrl?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  linkColor?: string;
  fontFamily?: string;
  headingFont?: string;
  brandName?: string;
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  websiteUrl?: string;
  emailHeaderImage?: string;
  emailFooterText?: string;
  emailSignature?: string;
  socialLinks?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface CreateCustomDomainData {
  domain: string;
  subdomain?: string;
  isPrimary?: boolean;
  cnameTarget?: string;
  ipAddress?: string;
}

export interface UpdateCustomDomainData {
  isPrimary?: boolean;
  status?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPENDED';
  sslEnabled?: boolean;
  sslCertificate?: string;
  sslKey?: string;
}

// Branding APIs
export const getBranding = async (): Promise<ApiResponse<WhiteLabelBranding>> => {
  return api.get<ApiResponse<WhiteLabelBranding>>('/organizer/branding');
};

export const upsertBranding = async (data: CreateBrandingData): Promise<ApiResponse<WhiteLabelBranding>> => {
  return api.put<ApiResponse<WhiteLabelBranding>>('/organizer/branding', data);
};

// Custom Domain APIs
export const getCustomDomains = async (): Promise<ApiResponse<CustomDomain[]>> => {
  return api.get<ApiResponse<CustomDomain[]>>('/organizer/custom-domains');
};

export const addCustomDomain = async (data: CreateCustomDomainData): Promise<ApiResponse<CustomDomain>> => {
  return api.post<ApiResponse<CustomDomain>>('/organizer/custom-domains', data);
};

export const getCustomDomainById = async (domainId: string): Promise<ApiResponse<CustomDomain>> => {
  return api.get<ApiResponse<CustomDomain>>(`/organizer/custom-domains/${domainId}`);
};

export const updateCustomDomain = async (
  domainId: string,
  data: UpdateCustomDomainData,
): Promise<ApiResponse<CustomDomain>> => {
  return api.put<ApiResponse<CustomDomain>>(`/organizer/custom-domains/${domainId}`, data);
};

export const deleteCustomDomain = async (domainId: string): Promise<void> => {
  await api.delete(`/organizer/custom-domains/${domainId}`);
};

// Admin APIs
export const getAllBrandings = async (filters?: {
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';
  isActive?: boolean;
  search?: string;
}): Promise<ApiResponse<WhiteLabelBranding[]>> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.search) params.append('search', filters.search);
  const qs = params.toString();
  return api.get<ApiResponse<WhiteLabelBranding[]>>(
    `/admin/white-label/brandings${qs ? `?${qs}` : ''}`,
  );
};

export const updateBrandingStatus = async (
  brandingId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL',
  rejectionReason?: string,
): Promise<ApiResponse<WhiteLabelBranding>> => {
  return api.put<ApiResponse<WhiteLabelBranding>>(
    `/admin/white-label/brandings/${brandingId}/status`,
    {
      status,
      rejectionReason,
    },
  );
};

export const verifyCustomDomain = async (
  domainId: string,
  status: 'VERIFIED' | 'FAILED' | 'SUSPENDED',
  failureReason?: string,
): Promise<ApiResponse<CustomDomain>> => {
  return api.put<ApiResponse<CustomDomain>>(
    `/admin/white-label/custom-domains/${domainId}/verify`,
    {
      status,
      failureReason,
    },
  );
};

// Admin: Get branding for specific organizer
export const adminGetBrandingByOrganizer = async (
  organizerId: string,
): Promise<ApiResponse<WhiteLabelBranding & { organizer?: OrganizerInfo }>> => {
  return api.get<ApiResponse<WhiteLabelBranding & { organizer?: OrganizerInfo }>>(
    `/admin/white-label/brandings/${organizerId}`,
  );
};

// Admin: Create/update branding for organizer (auto-approved)
export const adminUpsertBranding = async (
  organizerId: string,
  data: CreateBrandingData,
): Promise<ApiResponse<WhiteLabelBranding & { organizer?: OrganizerInfo }>> => {
  return api.put<ApiResponse<WhiteLabelBranding & { organizer?: OrganizerInfo }>>(
    `/admin/white-label/brandings/${organizerId}`,
    data,
  );
};

// Admin: Get all custom domains across all organizers
export const adminGetAllCustomDomains = async (filters?: {
  status?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPENDED';
  isActive?: boolean;
  search?: string;
  organizerId?: string;
}): Promise<ApiResponse<(CustomDomain & { organizer?: OrganizerInfo })[]>> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.organizerId) params.append('organizerId', filters.organizerId);
  const qs = params.toString();
  return api.get<ApiResponse<(CustomDomain & { organizer?: OrganizerInfo })[]>>(
    `/admin/white-label/custom-domains${qs ? `?${qs}` : ''}`,
  );
};

// Admin: Add custom domain for specific organizer
export const adminAddCustomDomain = async (
  organizerId: string,
  data: CreateCustomDomainData,
): Promise<ApiResponse<CustomDomain>> => {
  return api.post<ApiResponse<CustomDomain>>(
    `/admin/white-label/custom-domains/${organizerId}`,
    data,
  );
};

// Admin: Delete any custom domain
export const adminDeleteCustomDomain = async (domainId: string): Promise<void> => {
  await api.delete(`/admin/white-label/custom-domains/${domainId}`);
};

// Public APIs
export const getActiveBranding = async (organizerId: string): Promise<ApiResponse<WhiteLabelBranding>> => {
  return api.get<ApiResponse<WhiteLabelBranding>>(`/public/organizers/${organizerId}/branding`);
};

export const getActiveCustomDomain = async (organizerId: string): Promise<ApiResponse<CustomDomain>> => {
  return api.get<ApiResponse<CustomDomain>>(`/public/organizers/${organizerId}/custom-domain`);
};
