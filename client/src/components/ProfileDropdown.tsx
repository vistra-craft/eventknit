/**
 * User Profile Dropdown Component
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, LayoutDashboard, Users, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useRoleView } from '@/contexts/RoleViewContext';
import { UserRole } from '@/types/auth';

interface ProfileDropdownProps {
  onClose?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { activeViewRole, setActiveViewRole, availableRoles, resetToDefaultRole } = useRoleView();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close dropdown if user logs out
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsOpen(false);
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) return null;

  const getInitials = () => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || user.email[0].toUpperCase();
  };

  const getDashboardRoute = () => {
    // Use active view role if set, otherwise use user's actual role
    const roleToUse = activeViewRole || user?.role;
    
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(roleToUse);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(roleToUse);
    
    if (isAdminRole) return '/admin/dashboard';
    if (isOrganizerRole) return '/organizer/dashboard';
    return '/user/dashboard';
  };

  const getProfileRoute = () => {
    // Use active view role if set, otherwise use user's actual role
    const roleToUse = activeViewRole || user?.role;
    
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(roleToUse);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(roleToUse);
    
    if (isOrganizerRole) return '/organizer/settings';
    if (isAdminRole) return '/admin/profile';
    return '/user/profile';
  };

  const getRoleLabel = (role: UserRole): string => {
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(role);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(role);
    
    if (isAdminRole) return 'Admin';
    if (isOrganizerRole) return 'Organizer';
    if (role === UserRole.ATTENDEE) return 'Attendee';
    return role;
  };

  const handleRoleSwitch = (role: UserRole) => {
    if (role === user?.role) {
      resetToDefaultRole();
    } else {
      setActiveViewRole(role);
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleLogout = () => {
    setIsOpen(false);
    // Logout is now synchronous - no need to await
    logout();
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
    onClose?.();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-eventknit focus:ring-offset-2 transition-transform hover:scale-105"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <Avatar className="h-8 w-8 border-2 border-eventknit-foreground/20">
          <AvatarImage src={undefined} alt={`${user.firstName} ${user.lastName}`} />
          <AvatarFallback className="bg-eventknit text-eventknit-foreground text-xs font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background border border-border ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in-0 zoom-in-95">
          <div className="py-1">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Menu Items */}
            <button
              onClick={() => handleNavigate(getProfileRoute())}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>

            <button
              onClick={() => handleNavigate(getDashboardRoute())}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            {/* Role Switcher - Only show if multiple roles available */}
            {availableRoles.length > 1 && (
              <>
                <div className="border-t border-border my-1" />
                <div className="px-4 py-2">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Switch View</p>
                  <div className="space-y-1">
                    {availableRoles.map((role) => {
                      const isActive = activeViewRole === role || (!activeViewRole && role === user?.role);
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2 ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          <Users className="w-3 h-3" />
                          {getRoleLabel(role)}
                          {isActive && <span className="ml-auto text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {activeViewRole && activeViewRole !== user?.role && (
                    <button
                      onClick={() => {
                        resetToDefaultRole();
                        setIsOpen(false);
                        onClose?.();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md mt-1 flex items-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset to {getRoleLabel(user?.role || UserRole.ATTENDEE)}
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() => handleNavigate(getProfileRoute())}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            <div className="border-t border-border my-1" />

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


