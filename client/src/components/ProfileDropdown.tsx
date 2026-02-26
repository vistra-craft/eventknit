/**
 * User Profile Dropdown Component
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, UserStatus } from '@/types/auth';

interface ProfileDropdownProps {
  onClose?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasEvent, setHasEvent] = useState<boolean | null>(null);
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

  // Check if organizer has created an event when dropdown opens
  useEffect(() => {
    const checkHasEvent = async () => {
      if (!isOpen || !user) return;
      
      const isOrganizerRole = [
        UserRole.ORGANIZER,
        UserRole.ORGANIZER_STAFF,
        UserRole.ORGANIZER_TELLER,
      ].includes(user.role);
      
      // Only check for full organizers (not staff/teller)
      if (isOrganizerRole && user.role === UserRole.ORGANIZER) {
        try {
          const { getDashboardAccess } = await import('@/lib/organizer-api');
          const accessResponse = await getDashboardAccess();
          if (accessResponse.success) {
            setHasEvent(accessResponse.data.hasAccess);
          }
        } catch (error) {
          console.error('Error checking dashboard access:', error);
          setHasEvent(false);
        }
      } else {
        // Non-organizers or staff/teller always have access (or don't need it)
        setHasEvent(true);
      }
    };

    checkHasEvent();
  }, [isOpen, user]);

  if (!isAuthenticated || !user) return null;

  const getDashboardRoute = async () => {
    // Use user's actual role
    const roleToUse = user?.role;
    
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
    
    // For organizers, check if they have dashboard access
    if (isOrganizerRole && roleToUse === UserRole.ORGANIZER) {
      try {
        const { getDashboardAccess } = await import('@/lib/organizer-api');
        const accessResponse = await getDashboardAccess();
        if (accessResponse.success && !accessResponse.data.hasAccess) {
          // No event created - redirect to event creation
          return '/organizer/events/create-standalone';
        }
      } catch (error) {
        console.error('Error checking dashboard access:', error);
        // On error, redirect to event creation to be safe
        return '/organizer/events/create-standalone';
      }
    }

    if (isOrganizerRole) return '/user/dashboard';
    return '/user/dashboard';
  };

  const getProfileRoute = () => {
    // Use user's actual role
    const roleToUse = user?.role;
    
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
    
    // Active organizers use OrganizerLayout; pending/attendee stay in UserLayout
    if (isOrganizerRole && user?.status === UserStatus.ACTIVE) return '/organizer/settings/profile';
    if (isAdminRole) return '/admin/profile';
    return '/user/settings/profile';
  };

  const getSettingsRoute = () => {
    // Use user's actual role
    const roleToUse = user?.role;
    
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
    
    // Active organizers use OrganizerLayout; pending/attendee stay in UserLayout
    if (isOrganizerRole && user?.status === UserStatus.ACTIVE) return '/organizer/settings';
    if (isAdminRole) return '/admin/settings';
    return '/user/settings';
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
        <Avatar
          src={user.avatar || undefined}
          name={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
          alt={`${user.firstName} ${user.lastName}`}
          size="sm"
          className="h-8 w-8 border-2 border-eventknit-foreground/20"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background border border-border ring-1 ring-primary/10 z-50 animate-in fade-in-0 zoom-in-95">
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
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
            >
              <User className="w-4 h-4" />
              View Profile
            </button>

            <button
              onClick={() => handleNavigate(getSettingsRoute())}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            <div className="border-t border-border my-1" />

            <button
              onClick={async () => {
                const route = await getDashboardRoute();
                handleNavigate(route);
              }}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
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


