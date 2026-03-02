/**
 * Shared types for the event creation wizard step components.
 * These are form-specific types distinct from the API/DB EventData in types/event.ts.
 */

import type { RegistrationField } from '@/types/event';

// Re-export for convenience
export type { RegistrationField };

// Session types for agenda items (string allows custom values)
export type SessionType = string;

export const SESSION_TYPES: { value: string; label: string }[] = [
  // Content sessions
  { value: 'keynote', label: 'Keynote' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'panel', label: 'Panel Discussion' },
  { value: 'breakout', label: 'Breakout Session' },
  { value: 'fireside-chat', label: 'Fireside Chat' },
  { value: 'lightning-talk', label: 'Lightning Talk' },
  { value: 'demo', label: 'Demo / Product Demo' },
  { value: 'qa', label: 'Q&A Session' },
  { value: 'roundtable', label: 'Roundtable' },
  { value: 'tutorial', label: 'Tutorial' },
  // Ceremonies & social
  { value: 'opening-ceremony', label: 'Opening Ceremony' },
  { value: 'closing-ceremony', label: 'Closing Ceremony' },
  { value: 'awards', label: 'Awards Ceremony' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'social', label: 'Social Event' },
  { value: 'networking', label: 'Networking' },
  // Logistics
  { value: 'break', label: 'Break' },
  { value: 'lunch', label: 'Lunch/Refreshments' },
  { value: 'registration', label: 'Registration' },
  { value: 'other', label: 'Other' },
];

// Sponsorship levels
export const SPONSORSHIP_LEVELS: { value: string; label: string }[] = [
  { value: 'title', label: 'Title Sponsor' },
  { value: 'presenting', label: 'Presenting Sponsor' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'partner', label: 'Community Partner' },
  { value: 'media', label: 'Media Partner' },
  { value: 'technology', label: 'Technology Partner' },
];

export interface AgendaItem {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  sessionType?: SessionType;
  room?: string; // Room/Track name
  speakerIds?: string[]; // Link to speaker IDs
  speakers?: string[]; // Legacy: speaker names (for backwards compatibility)
}

export interface SpeakerItem {
  id?: string;
  name: string;
  title?: string;
  bio?: string;
  image?: string;
  company?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
}

export interface ExhibitorItem {
  id?: string;
  name: string;
  description?: string;
  logo?: string;
  contactEmail?: string;
  booth?: string;
  website?: string;
  category?: string;
}

export interface SponsorItem {
  id?: string;
  name: string;
  level?: 'gold' | 'silver' | 'bronze' | 'platinum' | 'title' | 'presenting' | 'partner' | string;
  logo?: string;
  website?: string;
  description?: string;
}

export interface TicketType {
  id: number;
  name: string;
  description?: string; // Ticket description/benefits
  type: 'free' | 'paid';
  price: string;
  originalPrice?: string;
  discountLabel?: string;
  quantity: string;
  maxPerPerson?: number; // Per-person purchase limit
  minPerOrder?: number; // Minimum tickets per order
  isComplementary?: boolean;
  requiresInvitation?: boolean;
  availableFrom?: string;
  availableUntil?: string;
  earlyBirdQuantity?: string; // Max tickets at early bird price
  salesChannel?: 'online' | 'door' | 'both'; // Where ticket can be sold
  isHidden?: boolean; // Hidden ticket (only via promo code or direct link)
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // Percentage (0-100) or fixed amount
  maxUses?: number; // Total usage limit
  maxUsesPerUser?: number; // Limit per customer
  usedCount?: number;
  validFrom?: string;
  validUntil?: string;
  applicableTicketIds?: number[]; // Empty = applies to all
  minPurchaseAmount?: number;
  minTickets?: number; // Minimum tickets for code to apply
  isActive?: boolean;
}

export type FormFieldType = 'text' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'date' | 'number';

/** Local form state interface — distinct from shared EventData which matches the DB */
export interface EventFormData {
  title: string;
  organizer: string;
  description: string;
  organizerDescription?: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  registrationDeadline: string;
  registrationDeadlineTime: string;
  location: string;
  venue: string;
  address: string;
  onlineLink: string;
  price: string;
  totalSlots: number;
  image: string;
  imageFocalX: number;
  imageFocalY: number;
  requirements: string;
  ageRestriction: string;
  isOnline: boolean;
  capacity: string;
  category?: string;
  timezone?: string;
  socialLinks?: Record<string, string>;
  exhibitors?: ExhibitorItem[];
  sponsors?: SponsorItem[];
  agenda?: AgendaItem[];
  speakers?: SpeakerItem[];
  currency: string;
  // Ticketing configuration
  promoCodes?: PromoCode[];
  serviceFeeType?: 'percentage' | 'fixed' | 'none';
  serviceFeeValue?: number;
  serviceFeePassToAttendee?: boolean; // Absorb or pass to attendee
  refundPolicy?: 'no_refunds' | 'full_refund' | 'partial_refund' | 'custom';
  refundDeadlineDays?: number; // Days before event for refund eligibility
  refundPolicyText?: string; // Custom refund policy text
  // Seating configuration
  hasSeatingMap?: boolean;
  seatingType?: 'CUSTOMER_SELECTS' | 'ORGANIZER_ASSIGNS' | 'HYBRID' | '';
  seatMapRequired?: boolean;
}

/** Common props shared by all step components */
export interface StepComponentProps {
  eventData: EventFormData;
  onInputChange: (field: string, value: string | boolean | number) => void;
  validationErrors: Record<string, string>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

/** Currency option */
export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES' },
  { code: 'USD', name: 'US Dollar (USD)', symbol: '$' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (GBP)', symbol: '£' },
  { code: 'UGX', name: 'Ugandan Shilling (UGX)', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling (TZS)', symbol: 'TSh' },
];

export const DEFAULT_CURRENCY = 'KES';

/** Get the user's current timezone */
export const getCurrentTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

/** Get a friendly label for a timezone */
export const getTimezoneLabel = (tz: string): string => {
  const found = TIMEZONES.find(t => t.value === tz);
  if (found) return found.label;
  // For unknown timezones, format nicely
  return tz.replace(/_/g, ' ').replace(/\//g, ' / ');
};

/** Common timezones */
export const TIMEZONES = [
  // Africa
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'America/Toronto', label: 'Toronto (ET)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  // Asia
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
];
