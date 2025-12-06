import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
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

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Failed to load unread count:", error);
      // Don't show error toast for background updates
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
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
      className={`relative text-muted-foreground hover:bg-accent-coral hover:text-white transition-colors ${className}`}
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

