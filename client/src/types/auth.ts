/**
 * Authentication Types
 */

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN_STAFF = 'ADMIN_STAFF',
  MARKETER = 'MARKETER',
  SUPPORT = 'SUPPORT',
  TELLER = 'TELLER',
  ORGANIZER = 'ORGANIZER',
  ORGANIZER_STAFF = 'ORGANIZER_STAFF',
  ORGANIZER_TELLER = 'ORGANIZER_TELLER',
  ATTENDEE = 'ATTENDEE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
  SUSPENDED = 'SUSPENDED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  otherName?: string | null;
  phoneNumber?: string | null;
  companyAffiliation?: string | null;
  organizerEntityType?: string | null;
  organizerIndustry?: string | null;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  organizationName?: string | null;
  businessEmail?: string | null;
  kycStatus?: string | null;
  lastLoginAt?: string | null;
  onboardingCompleted?: boolean; // For organizers - tracks if onboarding is complete
  profileCompleted?: boolean; // For organizers - tracks if organizer profile setup is complete
  hasPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  phoneNumber?: string;
  companyAffiliation?: string;
  role?: UserRole;
  organizationName?: string;
  businessEmail?: string;
}

