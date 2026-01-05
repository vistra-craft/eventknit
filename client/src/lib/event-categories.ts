/**
 * Event Categories
 * Centralized list of event categories used across the application
 */

export interface EventCategory {
  value: string;
  label: string;
  group?: 'general' | 'mice' | 'entertainment' | 'lifestyle';
}

/**
 * Comprehensive list of event categories including MICE (Meetings, Incentives, Conferences, Exhibitions)
 * Organized by group for better UX in dropdowns
 */
export const EVENT_CATEGORIES: EventCategory[] = [
  // MICE / Professional Events
  { value: 'conference', label: 'Conference', group: 'mice' },
  { value: 'seminar', label: 'Seminar', group: 'mice' },
  { value: 'workshop', label: 'Workshop', group: 'mice' },
  { value: 'training', label: 'Training', group: 'mice' },
  { value: 'exhibition', label: 'Exhibition / Trade Show', group: 'mice' },
  { value: 'corporate-meeting', label: 'Corporate Meeting', group: 'mice' },
  { value: 'summit', label: 'Summit', group: 'mice' },
  { value: 'symposium', label: 'Symposium', group: 'mice' },
  { value: 'product-launch', label: 'Product Launch', group: 'mice' },

  // General / Community Events
  { value: 'networking', label: 'Networking Event', group: 'general' },
  { value: 'community', label: 'Community Event', group: 'general' },
  { value: 'charity', label: 'Charity / Fundraiser', group: 'general' },
  { value: 'education', label: 'Educational Event', group: 'general' },
  { value: 'religious', label: 'Religious Event', group: 'general' },

  // Entertainment Events
  { value: 'music', label: 'Music / Concert', group: 'entertainment' },
  { value: 'arts', label: 'Arts & Culture', group: 'entertainment' },
  { value: 'entertainment', label: 'Entertainment', group: 'entertainment' },
  { value: 'sports', label: 'Sports Event', group: 'entertainment' },
  { value: 'festival', label: 'Festival', group: 'entertainment' },
  { value: 'gala', label: 'Gala / Awards', group: 'entertainment' },

  // Lifestyle Events
  { value: 'food', label: 'Food & Drink', group: 'lifestyle' },
  { value: 'health', label: 'Health & Wellness', group: 'lifestyle' },
  { value: 'travel', label: 'Travel & Outdoor', group: 'lifestyle' },
  { value: 'technology', label: 'Technology', group: 'lifestyle' },
  { value: 'business', label: 'Business', group: 'lifestyle' },

  // Other - always last
  { value: 'other', label: 'Other', group: 'general' },
];

/**
 * Get category label by value
 */
export function getCategoryLabel(value: string): string {
  const category = EVENT_CATEGORIES.find(c => c.value === value);
  return category?.label || value;
}

/**
 * Check if a value is a valid category
 */
export function isValidCategory(value: string): boolean {
  return EVENT_CATEGORIES.some(c => c.value === value) || value === 'other';
}

/**
 * Group categories by their group for organized display
 */
export function getCategoriesByGroup(): Record<string, EventCategory[]> {
  const groups: Record<string, EventCategory[]> = {
    mice: [],
    general: [],
    entertainment: [],
    lifestyle: [],
  };

  EVENT_CATEGORIES.forEach(category => {
    if (category.group && groups[category.group]) {
      groups[category.group].push(category);
    }
  });

  return groups;
}

/**
 * Get flat list of category values for simple selects
 */
export function getCategoryValues(): string[] {
  return EVENT_CATEGORIES.map(c => c.value);
}

/**
 * Get flat list of category labels for display
 */
export function getCategoryLabels(): string[] {
  return EVENT_CATEGORIES.map(c => c.label);
}
