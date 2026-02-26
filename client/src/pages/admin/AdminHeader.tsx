/**
 * Admin Top Navigation
 * Clean, minimal header following industry standards (GridArc, Smart Purchase, Vercel, etc.)
 * - NO page titles in header (titles go in page content)
 * - Backdrop blur effect for glassmorphism
 * - Sticky positioning
 * - Simple layout: Menu (mobile) | Spacer | Theme + Notifications + Profile
 */

import React, { useState } from "react";
import { Menu, User, ChevronDown, LogOut, Settings, Bell, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "../../components/ThemeToggle";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

  // Notifications - will be populated from real-time backend when notification system is implemented
  const notifications: { id: number; title: string; time: string; read: boolean }[] = [];
  const unreadCount = notifications.filter(n => !n.read).length;

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

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover shadow-xl animate-scale-in origin-top-right z-50">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-popover-foreground">Notifications</h3>
                <button className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex gap-3 p-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-1 h-2 w-2 rounded-full shrink-0",
                          notification.read ? "bg-muted-foreground/30" : "bg-primary"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-popover-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-sm font-medium text-white">
              {userInitial}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{userEmail}</p>
            </div>
            <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
          </button>

          {/* Profile dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover shadow-xl animate-scale-in origin-top-right z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/profile');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-popover-foreground hover:bg-secondary/50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-popover-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              </div>
              <div className="border-t border-border p-2">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/admin/dashboard');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-popover-foreground hover:bg-secondary/50 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
              </div>
              <div className="border-t border-border p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isNotificationsOpen || isProfileOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setIsNotificationsOpen(false);
            setIsProfileOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default AdminHeader;

