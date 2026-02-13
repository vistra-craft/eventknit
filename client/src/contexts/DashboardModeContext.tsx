/**
 * Dashboard Mode Context
 * Manages the user's current mode in the unified dashboard
 * - Attending Mode: Browse and manage events as an attendee
 * - Organizing Mode: Create and manage events as an organizer
 *
 * Persists mode preference to localStorage
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';

export type DashboardMode = 'attending' | 'organizing';

interface DashboardModeContextType {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  canOrganize: boolean; // true if user has ORGANIZER role or higher
  toggleMode: () => void;
}

const DashboardModeContext = createContext<DashboardModeContextType | undefined>(undefined);

const STORAGE_KEY = 'dashboardMode';

interface DashboardModeProviderProps {
  children: ReactNode;
}

export const DashboardModeProvider = ({ children }: DashboardModeProviderProps) => {
  const { user } = useAuth();

  // Check if user can organize
  const canOrganize = user?.role === UserRole.ORGANIZER ||
                     user?.role === UserRole.ORGANIZER_STAFF ||
                     user?.role === UserRole.ORGANIZER_TELLER;

  // Initialize mode from localStorage or default to 'attending'
  const [mode, setModeState] = useState<DashboardMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'organizing' && canOrganize) {
      return 'organizing';
    }
    return 'attending';
  });

  // Update mode with localStorage persistence
  const setMode = (newMode: DashboardMode) => {
    // Only allow organizing mode if user can organize
    if (newMode === 'organizing' && !canOrganize) {
      console.warn('User cannot organize, staying in attending mode');
      return;
    }

    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  // Toggle between modes
  const toggleMode = () => {
    if (!canOrganize) {
      console.warn('User cannot organize');
      return;
    }

    const newMode = mode === 'attending' ? 'organizing' : 'attending';
    setMode(newMode);
  };

  // Reset to attending mode if user loses organizer permissions
  useEffect(() => {
    if (mode === 'organizing' && !canOrganize) {
      setMode('attending');
    }
  }, [canOrganize, mode]);

  const value: DashboardModeContextType = {
    mode,
    setMode,
    canOrganize,
    toggleMode,
  };

  return (
    <DashboardModeContext.Provider value={value}>
      {children}
    </DashboardModeContext.Provider>
  );
};

/**
 * Hook to access dashboard mode context
 * @throws Error if used outside DashboardModeProvider
 */
export const useDashboardMode = (): DashboardModeContextType => {
  const context = useContext(DashboardModeContext);
  if (!context) {
    throw new Error('useDashboardMode must be used within DashboardModeProvider');
  }
  return context;
};
