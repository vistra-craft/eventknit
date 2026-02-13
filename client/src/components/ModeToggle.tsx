/**
 * Mode Toggle Component
 * Visual toggle for switching between Attending and Organizing modes
 * Shows current mode with icon and smooth transition animations
 */

import { Users, Calendar } from 'lucide-react';
import { useDashboardMode } from '../contexts/DashboardModeContext';
import { MODE_LABELS } from '../constants/navigationLabels';
import { cn } from '../lib/utils';

interface ModeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ModeToggle = ({ className, showLabels = true }: ModeToggleProps) => {
  const { mode, canOrganize, toggleMode } = useDashboardMode();

  // Don't show toggle if user can't organize
  if (!canOrganize) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={toggleMode}
        className="relative inline-flex h-8 items-center rounded-full bg-muted p-1 transition-all duration-300 hover:bg-muted/80 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
        aria-label={mode === 'attending' ? MODE_LABELS.SWITCH_TO_ORGANIZING : MODE_LABELS.SWITCH_TO_ATTENDING}
        role="switch"
        aria-checked={mode === 'organizing'}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMode();
          }
        }}
      >
        {/* Background slider */}
        <span
          className={cn(
            'absolute inset-y-1 w-14 rounded-full bg-primary shadow-sm transition-all duration-300 ease-in-out',
            mode === 'organizing' ? 'translate-x-14 scale-105' : 'translate-x-0 scale-100'
          )}
          aria-hidden="true"
        />

        {/* Attending option */}
        <span
          className={cn(
            'relative z-10 flex h-6 w-14 items-center justify-center gap-1 rounded-full transition-all duration-300',
            mode === 'attending' ? 'text-primary-foreground scale-105' : 'text-muted-foreground scale-100'
          )}
        >
          <Users className={cn('h-3.5 w-3.5 transition-transform duration-300', mode === 'attending' && 'scale-110')} />
          {showLabels && <span className="text-xs font-medium">Attend</span>}
        </span>

        {/* Organizing option */}
        <span
          className={cn(
            'relative z-10 flex h-6 w-14 items-center justify-center gap-1 rounded-full transition-all duration-300',
            mode === 'organizing' ? 'text-primary-foreground scale-105' : 'text-muted-foreground scale-100'
          )}
        >
          <Calendar className={cn('h-3.5 w-3.5 transition-transform duration-300', mode === 'organizing' && 'scale-110')} />
          {showLabels && <span className="text-xs font-medium">Host</span>}
        </span>
      </button>

      {/* Current mode label (optional) */}
      {showLabels && (
        <span className="text-sm text-muted-foreground">
          {mode === 'attending' ? MODE_LABELS.ATTENDING_SHORT : MODE_LABELS.ORGANIZING_SHORT}
        </span>
      )}
    </div>
  );
};

/**
 * Compact version of mode toggle (icon only)
 */
export const ModeToggleCompact = ({ className }: { className?: string }) => {
  return <ModeToggle className={className} showLabels={false} />;
};
