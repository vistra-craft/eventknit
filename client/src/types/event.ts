export interface RegistrationField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'radio' | 'checkbox' | 'textarea';
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

  // Location
  venue?: string | null;
  location: string; // normalized to non-null string by transformers
  coordinates?: { lat: number; lng: number } | null;
  isOnline?: boolean;

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
  }> | null;

  // Capacity
  capacity?: number | null;
  availableSlots?: number | null;

  // Media
  image?: string | null;
  images?: string[];

  // Event details
  type?: string; // EventType enum
  status?: string; // EventStatus enum
  requirements?: string[];
  ageRestriction?: string | null;
  duration?: string | null;

  // Additional content
  speakers?: Array<{ name: string; title: string; bio: string; image?: string }> | null;
  sponsors?: Array<{ name: string; level: string; logo: string }> | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  socialLinks?: Record<string, string> | null;
  exhibitors?: Array<{ name: string; description?: string; logo?: string; contactEmail?: string; booth?: string }> | null;
  agenda?: Array<{
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    speakers?: string[]; // IDs of speakers
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
  };

  // Computed fields
  organizerName?: string; // Computed from organizer
  registrationCount?: number; // From _count
  attendees?: number; // Number of attendees/registrations

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

