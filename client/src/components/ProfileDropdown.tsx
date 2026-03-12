/**
 * User Profile Dropdown Component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, UserStatus } from '@/types/auth';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface ProfileDropdownProps {
  onClose?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);


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
    logout();
    onClose?.();
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
    onClose?.();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-eventknit focus:ring-offset-2 transition-transform hover:scale-105"
          aria-label="User menu"
        >
          <Avatar
            src={user.avatar || undefined}
            name={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
            alt={`${user.firstName} ${user.lastName}`}
            size="sm"
            className="h-8 w-8 border-2 border-eventknit-foreground/20"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User Info */}
        <DropdownMenuLabel className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* View Profile */}
        <DropdownMenuItem onClick={() => handleNavigate(getProfileRoute())}>
          <User className="w-4 h-4 mr-2" />
          <span>View Profile</span>
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem onClick={() => handleNavigate(getSettingsRoute())}>
          <Settings className="w-4 h-4 mr-2" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Dashboard */}
        <DropdownMenuItem
          onClick={async () => {
            const route = await getDashboardRoute();
            handleNavigate(route);
          }}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          <span>Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
};


