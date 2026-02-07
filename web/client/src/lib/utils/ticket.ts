/**
 * Ticket download utility functions
 */

/**
 * Generate ticket data for download
 */
export interface TicketData {
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketType?: string;
  ticketId?: string;
  qrCode?: string;
}

/**
 * Generate ticket as text/plain content
 */
export function generateTicketText(ticket: TicketData): string {
  return `
═══════════════════════════════════════
         EVENT TICKET
═══════════════════════════════════════

Event: ${ticket.eventTitle}
Date: ${ticket.eventDate || 'TBD'}
Location: ${ticket.eventLocation || 'TBD'}

Attendee: ${ticket.attendeeName}
Email: ${ticket.attendeeEmail}
Ticket Type: ${ticket.ticketType || 'Standard'}
Ticket ID: ${ticket.ticketId || 'N/A'}

═══════════════════════════════════════
Please present this ticket at the event.
═══════════════════════════════════════
  `.trim();
}

/**
 * Download ticket as text file
 */
export function downloadTicket(ticket: TicketData): void {
  const content = generateTicketText(ticket);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `ticket-${ticket.ticketId || Date.now()}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}




