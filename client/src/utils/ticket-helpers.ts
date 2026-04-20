import { Crown } from 'lucide-react';

/**
 * Check if a ticket name indicates it's a VIP ticket
 */
export const isVIPTicket = (ticketName: string): boolean => {
  if (!ticketName) return false;
  const vipKeywords = ['vip', 'premium', 'platinum', 'gold', 'exclusive'];
  return vipKeywords.some((keyword) =>
    ticketName.toLowerCase().includes(keyword)
  );
};

/**
 * Get VIP badge configuration for a ticket
 */
export const getVIPTicketBadge = (ticketName: string) => {
  if (isVIPTicket(ticketName)) {
    return {
      label: 'VIP',
      className: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
      icon: Crown,
    };
  }
  return null;
};

/**
 * Check if a ticket type is currently available based on availability dates and capacity
 */
export const isTicketTypeAvailable = (
  ticketType: {
    availableFrom?: string;
    availableUntil?: string;
    isSoldOut?: boolean;
  },
  currentDate: Date = new Date()
): { available: boolean; reason?: string; isSoldOut?: boolean } => {
  const now = currentDate;

  // Check sold-out status first (highest priority)
  if (ticketType.isSoldOut) {
    return {
      available: false,
      isSoldOut: true,
      reason: 'SOLD OUT',
    };
  }

  if (ticketType.availableFrom) {
    const fromDate = new Date(ticketType.availableFrom);
    if (now < fromDate) {
      return {
        available: false,
        reason: `Ticket available from ${fromDate.toLocaleDateString()}`,
      };
    }
  }

  if (ticketType.availableUntil) {
    const untilDate = new Date(ticketType.availableUntil);
    if (now > untilDate) {
      return {
        available: false,
        reason: `Ticket sale ended on ${untilDate.toLocaleDateString()}`,
      };
    }
  }

  return { available: true };
};

/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (
  originalPrice: number | string,
  currentPrice: number | string
): number => {
  const orig = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
  const curr = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
  
  if (!orig || orig === 0) return 0;
  if (!curr || curr < 0) return 0;
  
  return Math.round(((orig - curr) / orig) * 100);
};

/**
 * Calculate discount amount
 */
export const calculateDiscountAmount = (
  originalPrice: number | string,
  currentPrice: number | string
): number => {
  const orig = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
  const curr = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
  
  if (!orig || !curr) return 0;
  
  return Math.max(0, orig - curr);
};

/**
 * Check if a ticket has a discount
 */
export const hasDiscount = (ticketType: {
  originalPrice?: number;
  price: number;
}): boolean => {
  if (!ticketType.originalPrice) return false;
  return ticketType.originalPrice > ticketType.price;
};

/**
 * Calculate time remaining until a date
 */
export const calculateTimeRemaining = (untilDate: string): string => {
  const now = new Date();
  const until = new Date(untilDate);
  const diff = until.getTime() - now.getTime();

  if (diff <= 0) return 'Sale ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

