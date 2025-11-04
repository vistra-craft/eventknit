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
 * Transform backend event to frontend EventData format
 */
export const transformEventData = (backendEvent: any): EventData => {
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
    totalSlots: backendEvent.capacity,
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
        ? backendEvent.registrationFields
        : null
      : null,
    // Registration count from _count
    registrationCount: backendEvent._count?.registrations || 0,
  };
};

/**
 * Transform array of events
 */
export const transformEventsData = (backendEvents: any[]): EventData[] => {
  return backendEvents.map(transformEventData);
};

