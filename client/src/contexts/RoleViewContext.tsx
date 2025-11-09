/**
 * Role View Mode Context
 * Allows users to switch between different role views (e.g., ORGANIZER to ATTENDEE)
 * This is a frontend-only feature - actual permissions still depend on user's real role
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { UserRole } from '../types/auth';

interface RoleViewContextType {
  activeViewRole: UserRole | null;
  setActiveViewRole: (role: UserRole | null) => void;
  availableRoles: UserRole[];
  canSwitchToRole: (role: UserRole) => boolean;
  resetToDefaultRole: () => void;
}

const RoleViewContext = createContext<RoleViewContextType | undefined>(undefined);

interface RoleViewProviderProps {
  children: ReactNode;
  userRole: UserRole | null;
}

export const RoleViewProvider: React.FC<RoleViewProviderProps> = ({ children, userRole }) => {
  const [activeViewRoleState, setActiveViewRoleState] = useState<UserRole | null>(null);

  /**
   * Get available roles user can switch to
   */
  const getAvailableRoles = useCallback((): UserRole[] => {
    if (!userRole) return [];
    
    const roles: UserRole[] = [];
    
    // User can always view as their own role
    roles.push(userRole);
    
    // Additional roles based on current role
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(userRole);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(userRole);
    
    if (isOrganizerRole) {
      // Organizers can view as attendees
      roles.push(UserRole.ATTENDEE);
    } else if (userRole === UserRole.ATTENDEE) {
      // Attendees can view as organizers (but can't create events unless they actually are organizers)
      roles.push(UserRole.ORGANIZER);
    } else if (isAdminRole) {
      // Admins can view as any role
      roles.push(UserRole.ORGANIZER);
      roles.push(UserRole.ATTENDEE);
    }
    
    return [...new Set(roles)]; // Remove duplicates
  }, [userRole]);

  const availableRoles = getAvailableRoles();

  /**
   * Check if user can switch to a specific role
   */
  const canSwitchToRole = useCallback(
    (role: UserRole): boolean => {
      return availableRoles.includes(role);
    },
    [availableRoles]
  );

  /**
   * Set active view role
   */
  const setActiveViewRole = useCallback(
    (role: UserRole | null) => {
      if (role && !canSwitchToRole(role)) {
        console.warn(`Cannot switch to role ${role}`);
        return;
      }
      setActiveViewRoleState(role);
      // Store in localStorage for persistence
      if (role) {
        localStorage.setItem('activeViewRole', role);
      } else {
        localStorage.removeItem('activeViewRole');
      }
    },
    [canSwitchToRole]
  );

  /**
   * Reset to default role (user's actual role)
   */
  const resetToDefaultRole = useCallback(() => {
    setActiveViewRoleState(null);
    localStorage.removeItem('activeViewRole');
  }, []);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem('activeViewRole') as UserRole | null;
    if (storedRole && canSwitchToRole(storedRole)) {
      setActiveViewRoleState(storedRole);
    } else {
      // Default to user's actual role
      setActiveViewRoleState(null);
    }
  }, [userRole, canSwitchToRole]);

  // Reset to default when user role changes
  useEffect(() => {
    const storedRole = localStorage.getItem('activeViewRole') as UserRole | null;
    if (storedRole && !canSwitchToRole(storedRole)) {
      // Stored role is no longer valid, reset to default
      resetToDefaultRole();
    }
  }, [userRole, canSwitchToRole, resetToDefaultRole]);

  const value: RoleViewContextType = {
    activeViewRole: activeViewRoleState || userRole,
    setActiveViewRole,
    availableRoles,
    canSwitchToRole,
    resetToDefaultRole,
  };

  return <RoleViewContext.Provider value={value}>{children}</RoleViewContext.Provider>;
};

export const useRoleView = (): RoleViewContextType => {
  const context = useContext(RoleViewContext);
  if (!context) {
    throw new Error('useRoleView must be used within a RoleViewProvider');
  }
  return context;
};

