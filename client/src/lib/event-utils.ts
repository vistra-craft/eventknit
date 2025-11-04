/**
 * Event Utility Functions
 * Transform backend event data to match frontend EventData interface
 */

import type { EventData } from '../types/event';

/**
 * Format date from ISO string to readable format
 */
export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time range
 */
export const formatEventTime = (startTime?: string | null, endTime?: string | null): string => {
  if (!startTime) return '';
  if (endTime) return `${startTime} - ${endTime}`;
  return startTime;
};

/**
 * Format date range
 */
export const formatEventDateRange = (
  startDate: string,
  endDate?: string | null
): string => {
  const start = formatEventDate(startDate);
  if (endDate) {
    const end = formatEventDate(endDate);
    return `${start} - ${end}`;
  }
  return start;
};

/**
 * Backend event structure (from API response)
 */
interface BackendEvent {
  id: string;
  title: string;
  description: string;
  fullDescription?: string | null;
  category?: string | null;
  tags?: string[];
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  registrationDeadline?: string | null;
  venue?: string | null;
  location: string;
  address?: string | null;
  isOnline?: boolean;
  onlineLink?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  isFree?: boolean;
  price?: number | string | null;
  ticketTypes?: Array<{
    name: string;
    price: number;
    quantity?: number | null;
    features?: string[];
  }> | null;
  capacity?: number | null;
  availableSlots?: number | null;
  image?: string | null;
  images?: string[];
  type?: string;
  status?: string;
  requirements?: string[];
  ageRestriction?: string | null;
  duration?: string | null;
  speakers?: Array<{ name: string; title: string; bio: string; image?: string }> | null;
  sponsors?: Array<{ name: string; level: string; logo: string }> | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  registrationFields?: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
  }> | null;
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    organizationName?: string | null;
    businessEmail?: string | null;
  };
  _count?: {
    registrations?: number;
  };
}

/**
 * Transform backend event to frontend EventData format
 */
export const transformEventData = (backendEvent: BackendEvent): EventData => {
  // Extract organizer name
  const organizerName = backendEvent.organizer
    ? backendEvent.organizer.organizationName ||
      `${backendEvent.organizer.firstName} ${backendEvent.organizer.lastName}`
    : 'Unknown Organizer';

  // Convert price
  let priceDisplay: number | undefined;
  if (backendEvent.price) {
    priceDisplay =
      typeof backendEvent.price === 'string'
        ? parseFloat(backendEvent.price)
        : backendEvent.price;
  }

  // Format dates
  const date = formatEventDateRange(backendEvent.startDate, backendEvent.endDate);
  const time = formatEventTime(backendEvent.startTime, backendEvent.endTime);

  return {
    ...backendEvent,
    // Legacy compatibility fields
    date,
    time,
    priceDisplay,
    organizerName,
    totalSlots: backendEvent.capacity ?? undefined,
    isPrivate: backendEvent.type === 'PRIVATE',
    // Ensure arrays are arrays
    tags: backendEvent.tags || [],
    requirements: backendEvent.requirements || [],
    images: backendEvent.images || [],
    // Ensure optional fields are properly typed
    fullDescription: backendEvent.fullDescription || null,
    category: backendEvent.category || null,
    venue: backendEvent.venue || null,
    address: backendEvent.address || null,
    registrationDeadline: backendEvent.registrationDeadline || null,
    ageRestriction: backendEvent.ageRestriction || null,
    duration: backendEvent.duration || null,
    onlineLink: backendEvent.onlineLink || null,
    coordinates: backendEvent.coordinates || null,
    // Convert ticket types if needed
    ticketTypes: backendEvent.ticketTypes
      ? Array.isArray(backendEvent.ticketTypes)
        ? backendEvent.ticketTypes
        : []
      : null,
    // Convert other JSON fields
    speakers: backendEvent.speakers
      ? Array.isArray(backendEvent.speakers)
        ? backendEvent.speakers
        : null
      : null,
    sponsors: backendEvent.sponsors
      ? Array.isArray(backendEvent.sponsors)
        ? backendEvent.sponsors
        : null
      : null,
    faqs: backendEvent.faqs
      ? Array.isArray(backendEvent.faqs)
        ? backendEvent.faqs
        : null
      : null,
    registrationFields: backendEvent.registrationFields
      ? Array.isArray(backendEvent.registrationFields)
        ? (backendEvent.registrationFields as Array<{
            id: string;
            name: string;
            label: string;
            type: 'text' | 'email' | 'tel' | 'select' | 'radio' | 'checkbox' | 'textarea';
            required: boolean;
            placeholder?: string;
            options?: string[];
          }>)
        : null
      : null,
    // Registration count from _count
    registrationCount: backendEvent._count?.registrations || 0,
  };
};

/**
 * Transform array of events
 */
export const transformEventsData = (backendEvents: BackendEvent[]): EventData[] => {
  return backendEvents.map((event) => transformEventData(event));
};

