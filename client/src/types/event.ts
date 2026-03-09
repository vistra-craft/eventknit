export interface RegistrationField {
  id: string;
  name: string;
  label: string;
  type:
  | 'text'
  | 'email'
  | 'phone'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'date'
  | 'number';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface RegistrationData {
  [key: string]: string | string[] | boolean;
}

/**
 * Event Data interface matching backend Prisma schema
 */
export interface EventData {
  id: string;
  title: string;
  description: string;
  fullDescription?: string | null;
  organizerDescription?: string | null;
  category?: string | null;
  tags?: string[];

  // Dates and times
  startDate: string; // ISO date string
  endDate?: string | null; // ISO date string
  startTime?: string | null;
  endTime?: string | null;
  registrationDeadline?: string | null; // ISO date string - when registration closes

  // Location
  venue?: string | null;
  location: string; // normalized to non-null string by transformers
  address?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  isOnline?: boolean;
  onlineLink?: string | null;

  // Pricing
  isFree?: boolean;
  price?: number | null;
  /** ISO currency code used for display (e.g. 'KES', 'USD') */
  currency?: string | null;
  ticketTypes?: Array<{
    name: string;
    price: number;
    quantity?: number | null;
    features?: string[];
    originalPrice?: number | null;
    discountLabel?: string | null;
    isComplementary?: boolean;
    requiresInvitation?: boolean;
    availableFrom?: string | null;
    availableUntil?: string | null;
    earlyBirdQuantity?: number | null;
    isSoldOut?: boolean; // True when ticket quantity is exhausted
  }> | null;

  timezone?: string | null;

  // Capacity
  capacity?: number | null;
  availableSlots?: number | null;

  // Media
  image?: string | null;
  imageFocalX?: number | null; // Focal point X position (0-100)
  imageFocalY?: number | null; // Focal point Y position (0-100)
  images?: string[];

  // Event details
  type?: string; // EventType enum
  status?: string; // EventStatus enum
  requirements?: string[];
  ageRestriction?: string | null;
  duration?: string | null;

  // Additional content
  speakers?: Array<{
    id?: string;
    name: string;
    title?: string;
    bio?: string;
    image?: string;
    company?: string;
    website?: string;
    linkedin?: string;
    twitter?: string;
  }> | null;
  sponsors?: Array<{
    id?: string;
    name: string;
    level?: string;
    logo?: string;
    website?: string;
    description?: string;
  }> | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  socialLinks?: Record<string, string> | null;
  exhibitors?: Array<{
    id?: string;
    name: string;
    description?: string;
    logo?: string;
    contactEmail?: string;
    booth?: string;
    website?: string;
    category?: string;
  }> | null;
  agenda?: Array<{
    id?: string;
    title: string;
    description?: string;
    date?: string; // Optional date for multi-day events (defaults to event start date)
    startTime?: string;
    endTime?: string;
    sessionType?: string; // keynote, workshop, panel, breakout, networking, break, lunch, registration, other
    room?: string; // Room or track name
    speakerIds?: string[]; // IDs of speakers assigned to this session
    speakers?: string[]; // Legacy: speaker names (for backwards compatibility)
  }> | null;
  registrationFields?: RegistrationField[] | null;

  // Organizer info (from include)
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    organizationName?: string | null;
    businessEmail?: string | null;
    phoneNumber?: string | null;
    avatar?: string | null;
    isIdentityVerified?: boolean;
    verificationLevel?: number;
  };

  // Refund policy
  refundPolicy?: string | null; // 'no_refunds' | 'full_refund' | 'partial_refund' | 'custom'
  refundDeadlineDays?: number | null;
  refundPolicyText?: string | null;
  autoRefundEnabled?: boolean;

  // Seating
  hasSeatMap?: boolean; // Whether a seat map is configured for this event

  // Computed fields
  organizerName?: string; // Computed from organizer
  registrationCount?: number; // From _count
  attendees?: number; // Number of attendees/registrations

  // Rejection/Approval info
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;

  // Recall info
  recalledBy?: string | null;
  recalledAt?: string | null;
  recallReason?: string | null;

  // Timestamps
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string

  // Legacy / UI helper fields
  date?: string; // Formatted date string
  time?: string; // Formatted time string
  priceDisplay?: number; // Converted/display price
  rating?: number; // Placeholder
  totalSlots?: number; // Alias for capacity
  registrationDate?: string; // For user registrations
  isPrivate?: boolean; // Computed from type === 'PRIVATE'
}

export interface PaymentSummary {
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export type VenueType = 'in-person' | 'online' | 'hybrid';

/** Derive venue type from event data: hybrid = isOnline + has venue */
export function getVenueType(event: {
  isOnline?: boolean;
  venue?: string | null;
  onlineLink?: string | null;
}): VenueType {
  if (event.isOnline && event.venue) return 'hybrid';
  if (event.isOnline) return 'online';
  return 'in-person';
}

