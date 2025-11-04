/**
 * User Profile Dropdown Component
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

interface ProfileDropdownProps {
  onClose?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
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

  if (!user) return null;

  const getInitials = () => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || user.email[0].toUpperCase();
  };

  const getDashboardRoute = () => {
    switch (user.role) {
      case UserRole.ADMIN:
      case UserRole.STAFF:
        return '/admin/dashboard';
      case UserRole.ORGANIZER:
        return '/organizer/dashboard';
      case UserRole.ATTENDEE:
      default:
        return '/user/dashboard';
    }
  };

  const getProfileRoute = () => {
    switch (user.role) {
      case UserRole.ORGANIZER:
        return '/organizer/profile';
      case UserRole.ADMIN:
      case UserRole.STAFF:
        return '/admin/settings';
      default:
        return '/user/dashboard';
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
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


