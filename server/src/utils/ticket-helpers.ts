/**
 * Check if a ticket type is currently available based on availability dates
 */
export const isTicketTypeAvailable = (
  ticketType: {
    availableFrom?: string;
    availableUntil?: string;
  },
  currentDate: Date = new Date(),
): { available: boolean; reason?: string } => {
  const now = currentDate;

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
 * Check if a ticket is complementary
 */
export const isComplementaryTicket = (ticketType: {
  isComplementary?: boolean;
  price: number;
}): boolean => {
  return ticketType.isComplementary === true || ticketType.price === 0;
};

/**
 * Check if a ticket requires an invitation
 */
export const requiresInvitation = (ticketType: {
  requiresInvitation?: boolean;
  isComplementary?: boolean;
}): boolean => {
  return ticketType.requiresInvitation === true || ticketType.isComplementary === true;
};

