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
  category?: string | null;
  tags?: string[];
  
  // Dates and times
  startDate: string; // ISO date string
  endDate?: string | null; // ISO date string
  startTime?: string | null;
  endTime?: string | null;
  registrationDeadline?: string | null; // ISO date string
  
  // Location
  venue?: string | null;
  location: string;
  address?: string | null;
  isOnline?: boolean;
  onlineLink?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  
  // Pricing
  isFree?: boolean;
  price?: number | string | null; // Can be Decimal from backend
  ticketTypes?: Array<{
    name: string;
    price: number;
    quantity?: number | null;
    features?: string[];
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
  registrationFields?: RegistrationField[] | null;
  
  // Organizer info (from include)
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    organizationName?: string | null;
    businessEmail?: string | null;
  };
  
  // Computed fields
  organizerName?: string; // Computed from organizer
  registrationCount?: number; // From _count
  
  // Legacy fields for compatibility
  date?: string; // Formatted date string
  time?: string; // Formatted time string
  priceDisplay?: number; // Converted price
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

