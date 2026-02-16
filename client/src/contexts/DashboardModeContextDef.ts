import { createContext } from 'react';

export type DashboardMode = 'attending' | 'organizing';

export interface DashboardModeContextType {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  canOrganize: boolean;
  toggleMode: () => void;
}

export const DASHBOARD_MODE_STORAGE_KEY = 'dashboardMode';

export const DashboardModeContext = createContext<DashboardModeContextType | undefined>(undefined);
