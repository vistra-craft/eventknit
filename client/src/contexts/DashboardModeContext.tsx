/**
 * Dashboard Mode Provider
 * Manages the user's current mode in the unified dashboard
 * - Attending Mode: Browse and manage events as an attendee
 * - Organizing Mode: Create and manage events as an organizer
 *
 * Persists mode preference to localStorage
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';
import {
  DashboardModeContext,
  DASHBOARD_MODE_STORAGE_KEY,
  type DashboardMode,
} from './DashboardModeContextDef';

interface DashboardModeProviderProps {
  children: ReactNode;
}

export const DashboardModeProvider = ({ children }: DashboardModeProviderProps) => {
  const { user } = useAuth();

  const canOrganize = user?.role === UserRole.ORGANIZER ||
                     user?.role === UserRole.ORGANIZER_ADMIN ||
                     user?.role === UserRole.ORGANIZER_TELLER;

  const [mode, setModeState] = useState<DashboardMode>(() => {
    const stored = localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
    if (stored === 'organizing' && canOrganize) {
      return 'organizing';
    }
    return 'attending';
  });

  const setMode = (newMode: DashboardMode) => {
    if (newMode === 'organizing' && !canOrganize) {
      console.warn('User cannot organize, staying in attending mode');
      return;
    }
    setModeState(newMode);
    localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, newMode);
  };

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
      setModeState('attending');
      localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, 'attending');
    }
  }, [canOrganize, mode]);

  return (
    <DashboardModeContext.Provider value={{ mode, setMode, canOrganize, toggleMode }}>
      {children}
    </DashboardModeContext.Provider>
  );
};
