/**
 * Export utility functions
 */

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: any[], headers: string[], filename: string): void {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export event data to CSV
 */
export function exportEventData(event: {
  id: string;
  title: string;
  date?: string;
  location?: string;
  attendees?: number;
  revenue?: number;
  views?: number;
  status?: string;
  category?: string;
}): void {
  const data = [{
    'Event ID': event.id,
    'Title': event.title,
    'Date': event.date || 'N/A',
    'Location': event.location || 'N/A',
    'Attendees': event.attendees || 0,
    'Revenue': event.revenue || 0,
    'Views': event.views || 0,
    'Status': event.status || 'N/A',
    'Category': event.category || 'N/A',
  }];

  const headers = ['Event ID', 'Title', 'Date', 'Location', 'Attendees', 'Revenue', 'Views', 'Status', 'Category'];
  downloadCSV(data, headers, `event-${event.id}-${Date.now()}`);
}

/**
 * Export user data to CSV
 */
export function exportUserData(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  status?: string;
  createdAt?: string;
  organizationName?: string;
}): void {
  const data = [{
    'User ID': user.id,
    'First Name': user.firstName,
    'Last Name': user.lastName,
    'Email': user.email,
    'Role': user.role || 'N/A',
    'Status': user.status || 'N/A',
    'Created At': user.createdAt || 'N/A',
    'Organization': user.organizationName || 'N/A',
  }];

  const headers = ['User ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Created At', 'Organization'];
  downloadCSV(data, headers, `user-${user.id}-${Date.now()}`);
}

/**
 * Export attendees data to CSV
 */
export function exportAttendeeData(attendee: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: string;
  registrations?: Array<{
    eventTitle?: string;
    registeredAt?: string;
    totalAmount?: number;
    ticketType?: string;
  }>;
}): void {
  const baseData = {
    'Attendee ID': attendee.id,
    'First Name': attendee.firstName,
    'Last Name': attendee.lastName,
    'Email': attendee.email,
    'Status': attendee.status || 'N/A',
  };

  if (attendee.registrations && attendee.registrations.length > 0) {
    // Export with registration details
    const data = attendee.registrations.map(reg => ({
      ...baseData,
      'Event': reg.eventTitle || 'N/A',
      'Registered At': reg.registeredAt || 'N/A',
      'Amount': reg.totalAmount || 0,
      'Ticket Type': reg.ticketType || 'N/A',
    }));

    const headers = ['Attendee ID', 'First Name', 'Last Name', 'Email', 'Status', 'Event', 'Registered At', 'Amount', 'Ticket Type'];
    downloadCSV(data, headers, `attendee-${attendee.id}-${Date.now()}`);
  } else {
    // Export basic attendee data
    const data = [baseData];
    const headers = ['Attendee ID', 'First Name', 'Last Name', 'Email', 'Status'];
    downloadCSV(data, headers, `attendee-${attendee.id}-${Date.now()}`);
  }
}


