import api from './api';

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
export const getBranding = async (): Promise<WhiteLabelBranding> => {
  const response = await api.get('/organizer/branding');
  return response.data;
};

export const upsertBranding = async (data: CreateBrandingData): Promise<WhiteLabelBranding> => {
  const response = await api.put('/organizer/branding', data);
  return response.data;
};

// Custom Domain APIs
export const getCustomDomains = async (): Promise<CustomDomain[]> => {
  const response = await api.get('/organizer/custom-domains');
  return response.data;
};

export const addCustomDomain = async (data: CreateCustomDomainData): Promise<CustomDomain> => {
  const response = await api.post('/organizer/custom-domains', data);
  return response.data;
};

export const getCustomDomainById = async (domainId: string): Promise<CustomDomain> => {
  const response = await api.get(`/organizer/custom-domains/${domainId}`);
  return response.data;
};

export const updateCustomDomain = async (
  domainId: string,
  data: UpdateCustomDomainData,
): Promise<CustomDomain> => {
  const response = await api.put(`/organizer/custom-domains/${domainId}`, data);
  return response.data;
};

export const deleteCustomDomain = async (domainId: string): Promise<void> => {
  await api.delete(`/organizer/custom-domains/${domainId}`);
};

// Admin APIs
export const getAllBrandings = async (filters?: {
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';
  isActive?: boolean;
  search?: string;
}): Promise<WhiteLabelBranding[]> => {
  const response = await api.get('/admin/white-label/brandings', { params: filters });
  return response.data;
};

export const updateBrandingStatus = async (
  brandingId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL',
  rejectionReason?: string,
): Promise<WhiteLabelBranding> => {
  const response = await api.put(`/admin/white-label/brandings/${brandingId}/status`, {
    status,
    rejectionReason,
  });
  return response.data;
};

export const verifyCustomDomain = async (
  domainId: string,
  status: 'VERIFIED' | 'FAILED' | 'SUSPENDED',
  failureReason?: string,
): Promise<CustomDomain> => {
  const response = await api.put(`/admin/white-label/custom-domains/${domainId}/verify`, {
    status,
    failureReason,
  });
  return response.data;
};

// Public APIs
export const getActiveBranding = async (organizerId: string): Promise<WhiteLabelBranding> => {
  const response = await api.get(`/public/organizers/${organizerId}/branding`);
  return response.data;
};

export const getActiveCustomDomain = async (organizerId: string): Promise<CustomDomain> => {
  const response = await api.get(`/public/organizers/${organizerId}/custom-domain`);
  return response.data;
};
