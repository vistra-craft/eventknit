import { useContext } from 'react';
import { DashboardModeContext } from '../contexts/DashboardModeContextDef';
import type { DashboardModeContextType } from '../contexts/DashboardModeContextDef';

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
