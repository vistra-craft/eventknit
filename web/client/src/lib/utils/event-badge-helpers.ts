/**
 * Event Badge & Status Color Helpers
 * 
 * Provides reusable utilities for consistent badge styling across admin event pages.
 * Uses design system tokens instead of hardcoded colors.
 * 
 * Usage:
 * const className = getEventStatusBadgeClass('pending');
 * const className = getEventTypeBadgeClass('public');
 * const className = getPriceBadgeClass('free');
 */

/**
 * Get badge class for event status (pending, approved, declined, etc.)
 * @param status - Event status
 * @returns Tailwind class string
 */
export const getEventStatusBadgeClass = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    // Success states
    case 'active':
    case 'approved':
    case 'published':
    case 'successful':
      return 'bg-success/10 text-success border-success/20';
    
    // Warning/Pending states
    case 'pending':
    case 'reviewing':
    case 'processing':
      return 'bg-warning/10 text-warning border-warning/20';
    
    // Error/Declined states
    case 'declined':
    case 'rejected':
    case 'cancelled':
    case 'failed':
    case 'suspended':
    case 'banned':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    
    // Completed/Archived states
    case 'completed':
    case 'archived':
    case 'past':
      return 'bg-muted text-muted-foreground border-border';
    
    // Default
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

/**
 * Get badge class for event type (public, private)
 * @param type - Event type
 * @returns Tailwind class string
 */
export const getEventTypeBadgeClass = (type: string | undefined): string => {
  switch (type?.toLowerCase()) {
    case 'public':
      return 'bg-primary/10 text-primary border-primary/20';
    
    case 'private':
      return 'bg-secondary/10 text-secondary border-secondary/20';
    
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

/**
 * Get badge class for price (free, paid)
 * @param isFree - Whether event is free
 * @returns Tailwind class string
 */
export const getPriceBadgeClass = (isFree: boolean | undefined): string => {
  return isFree 
    ? 'bg-success/10 text-success border-success/20'
    : 'bg-primary/10 text-primary border-primary/20';
};

/**
 * Get badge class for approval/verification level
 * @param level - Approval or verification level (high, medium, low)
 * @returns Tailwind class string
 */
export const getApprovalLevelBadgeClass = (level: string | undefined): string => {
  switch (level?.toLowerCase()) {
    case 'high':
    case 'verified':
    case 'approved':
      return 'bg-success/10 text-success border-success/20';
    
    case 'medium':
    case 'partial':
      return 'bg-warning/10 text-warning border-warning/20';
    
    case 'low':
    case 'unverified':
    case 'pending':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

/**
 * Get badge class for attendance/participation status
 * @param status - Attendance status (attended, registered, cancelled, no-show)
 * @returns Tailwind class string
 */
export const getAttendanceStatusBadgeClass = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'attended':
    case 'present':
      return 'bg-success/10 text-success border-success/20';
    
    case 'registered':
    case 'confirmed':
      return 'bg-primary/10 text-primary border-primary/20';
    
    case 'pending':
      return 'bg-warning/10 text-warning border-warning/20';
    
    case 'cancelled':
    case 'no-show':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

/**
 * Get badge class for category or tag
 * @param category - Category name
 * @returns Tailwind class string
 */
export const getCategoryBadgeClass = (category: string | undefined): string => {
  if (!category) {
    return 'bg-muted text-muted-foreground border-border';
  }
  
  // Use primary color for all categories
  return 'bg-primary/10 text-primary border-primary/20';
};

/**
 * Get text class for event status (for use outside badges)
 * @param status - Event status
 * @returns Tailwind class string
 */
export const getEventStatusTextClass = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'published':
    case 'successful':
      return 'text-success';
    
    case 'pending':
    case 'reviewing':
    case 'processing':
      return 'text-warning';
    
    case 'declined':
    case 'rejected':
    case 'cancelled':
    case 'failed':
    case 'suspended':
    case 'banned':
      return 'text-destructive';
    
    default:
      return 'text-muted-foreground';
  }
};

/**
 * Get background class for event status (for use in cards/containers)
 * @param status - Event status
 * @returns Tailwind class string
 */
export const getEventStatusBackgroundClass = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'published':
    case 'successful':
      return 'bg-success/10';
    
    case 'pending':
    case 'reviewing':
    case 'processing':
      return 'bg-warning/5';
    
    case 'declined':
    case 'rejected':
    case 'cancelled':
    case 'failed':
    case 'suspended':
    case 'banned':
      return 'bg-destructive/5';
    
    default:
      return 'bg-muted/30';
  }
};

/**
 * Get border class for event status
 * @param status - Event status
 * @returns Tailwind class string
 */
export const getEventStatusBorderClass = (status: string | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'published':
    case 'successful':
      return 'border-success/20';
    
    case 'pending':
    case 'reviewing':
    case 'processing':
      return 'border-warning/20';
    
    case 'declined':
    case 'rejected':
    case 'cancelled':
    case 'failed':
    case 'suspended':
    case 'banned':
      return 'border-destructive/20';
    
    default:
      return 'border-border';
  }
};
