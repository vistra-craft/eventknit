import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { getUnreadCount } from "../lib/notification-api";
import { useAuth } from "../hooks/useAuth";
import { useRoleView } from "../contexts/RoleViewContext";
import { UserRole } from "../types/auth";

interface NotificationBellProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "",
  size = "md"
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeViewRole } = useRoleView();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // Load unread count from API
  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch {
      // Silent — background update
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    void loadUnreadCount();

    // Connect to WebSocket for real-time updates
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
        // Join the personal notifications room
        socket.emit("join:notifications");
      });

      // Instantly increment count when a new notification arrives
      socket.on("notification:new", () => {
        setUnreadCount((prev) => prev + 1);
      });

      // Server can also push the authoritative unread count
      socket.on("unread:count", (data: { count: number }) => {
        setUnreadCount(data.count);
      });
    }

    // Fallback poll every 60s (reduced since WebSocket handles real-time)
    const interval = setInterval(() => void loadUnreadCount(), 60_000);

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleClick = () => {
    // Navigate to notifications based on user role
    const roleToUse = activeViewRole || user?.role;
    
    if (!roleToUse) {
      navigate("/user/dashboard?section=notifications");
      return;
    }
    
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
    
    if (isAdminRole) {
      navigate("/admin/communications");
    } else if (isOrganizerRole) {
      navigate("/organizer/dashboard?section=notifications");
    } else {
      navigate("/user/dashboard?section=notifications");
    }
  };

  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const badgeSize = size === "sm" ? "h-3 w-3 text-[10px]" : size === "lg" ? "h-5 w-5 text-xs" : "h-4 w-4 text-xs";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
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
  );
};

export default NotificationBell;

