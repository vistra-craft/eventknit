/**
 * Admin Top Navigation
 * Clean, minimal header following industry standards (GridArc, Smart Purchase, Vercel, etc.)
 * - NO page titles in header (titles go in page content)
 * - Backdrop blur effect for glassmorphism
 * - Sticky positioning
 * - Simple layout: Menu (mobile) | Spacer | Theme + Notifications + Profile
 */

import React, { useState, useEffect, useRef } from "react";
import { Menu, User, ChevronDown, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import NotificationBell from '@/components/profile/NotificationBell';

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Format user data
  const userName = authUser
    ? `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || "Admin"
    : "Admin";
  const userEmail = authUser?.email || "";
  const userInitial = authUser?.firstName?.[0]?.toUpperCase() || "A";

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Left: Mobile menu button */}
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications - shared component with dropdown */}
        <NotificationBell />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-sm font-medium text-white shrink-0">
              {userInitial}
            </div>
            <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{userName}</span>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Profile dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-border bg-popover shadow-xl animate-scale-in origin-top-right z-50">
              {/* Identity block */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-sm font-medium text-white shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-popover-foreground truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-popover-foreground hover:bg-secondary/50 transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-popover-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/dashboard');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-popover-foreground hover:bg-secondary/50 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  <span>Dashboard</span>
                </button>
              </div>
              <div className="border-t border-border p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
