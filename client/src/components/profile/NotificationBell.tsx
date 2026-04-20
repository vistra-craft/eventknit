import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
  type NotificationType,
} from '@/lib/notification-api';
import { useAuth } from '@/hooks/useAuth';
import { useRoleView } from '@/contexts/RoleViewContext';
import { UserRole } from '@/types/auth';

interface NotificationBellProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const m = Math.floor(diffInSeconds / 60);
    return `${m}m ago`;
  }
  if (diffInSeconds < 86400) {
    const h = Math.floor(diffInSeconds / 3600);
    return `${h}h ago`;
  }
  if (diffInSeconds < 604800) {
    const d = Math.floor(diffInSeconds / 86400);
    return `${d}d ago`;
  }
  return date.toLocaleDateString();
};

const getNotificationIcon = (type: NotificationType): string => {
  if (type.includes("REMINDER")) return "⏰";
  if (type.includes("PAYMENT") || type.includes("REFUND")) return "💳";
  if (type.includes("REGISTRATION")) return "📝";
  if (type.includes("CANCELLED") || type.includes("FAILED")) return "❌";
  if (type.includes("APPROVED") || type.includes("SUCCESS")) return "✅";
  if (type.includes("UPDATE") || type.includes("CHANGED")) return "🔄";
  if (type.includes("SYSTEM") || type.includes("ANNOUNCEMENT")) return "📢";
  if (type.includes("MARKETING") || type.includes("PROMOTION")) return "🎉";
  if (type.includes("STAFF")) return "👥";
  if (type.includes("SECURITY") || type.includes("LOGIN")) return "🔒";
  return "🔔";
};

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "",
  size = "md",
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeViewRole } = useRoleView();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const loadRecentNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const response = await getNotifications({ limit: 8 });
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      }
    } catch {
      // Silent
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    void loadUnreadCount();

    const token = localStorage.getItem("accessToken");
    if (token) {
      const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
      const socket = io(socketURL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join:notifications");
      });

      socket.on("notification:new", () => {
        setUnreadCount((prev) => prev + 1);
        // If dropdown is open, refresh notifications
        if (isOpen) {
          void loadRecentNotifications();
        }
      });

      socket.on("unread:count", (data: { count: number }) => {
        setUnreadCount(data.count);
      });
    }

    const interval = setInterval(() => void loadUnreadCount(), 60_000);

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getNotificationsPath = () => {
    const roleToUse = activeViewRole || user?.role;
    if (!roleToUse) return "/user/notifications";

    const isAdminRole = [
      UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT, UserRole.TELLER,
    ].includes(roleToUse);
    const isOrganizerRole = [
      UserRole.ORGANIZER, UserRole.ORGANIZER_ADMIN, UserRole.ORGANIZER_TELLER,
    ].includes(roleToUse);

    if (isAdminRole) return "/admin/notifications";
    if (isOrganizerRole) return "/organizer/notifications";
    return "/user/notifications";
  };

  const handleBellClick = () => {
    if (!isOpen) {
      void loadRecentNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const response = await markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silent
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // Silent
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate(getNotificationsPath());
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      void markAsRead(notification.id).then((res) => {
        if (res.success) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      });
    }
    setIsOpen(false);
    navigate(getNotificationsPath());
  };

  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const badgeSize = size === "sm" ? "h-3 w-3 text-[10px]" : size === "lg" ? "h-5 w-5 text-xs" : "h-4 w-4 text-xs";

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBellClick}
        className={`relative text-muted-foreground hover:bg-muted transition-colors ${className}`}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className={iconSize} />
        {!loading && unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 ${badgeSize} bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-card border border-border/40 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="default" className="bg-primary text-xs px-1.5 py-0">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {loadingNotifications ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  You&apos;ll see updates about events, registrations, and more here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!notification.isRead ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt))}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/40 px-4 py-2.5">
            <button
              onClick={handleViewAll}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-1"
            >
              View all notifications
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
