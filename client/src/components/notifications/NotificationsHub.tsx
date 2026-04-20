/**
 * NotificationsHub — Shared notification center used across all dashboards.
 *
 * Based on the attendee NotificationsCenter (the most complete implementation).
 * Accepts role-specific filter options and layout config as props.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
  type NotificationFilters,
  type NotificationType,
  type NotificationPriority,
} from "@/lib/notification-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const m = Math.floor(diffInSeconds / 60);
    return `${m} minute${m !== 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const h = Math.floor(diffInSeconds / 3600);
    return `${h} hour${h !== 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 604800) {
    const d = Math.floor(diffInSeconds / 86400);
    return `${d} day${d !== 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString();
};

/** Superset of all icon mappings — covers attendee, organizer, and admin types. */
const getNotificationIcon = (type: NotificationType): string => {
  if (type.includes("REMINDER")) return "\u23F0";
  if (type.includes("PAYMENT") || type.includes("REFUND")) return "\uD83D\uDCB3";
  if (type.includes("REGISTRATION")) return "\uD83D\uDCDD";
  if (type.includes("CANCELLED") || type.includes("FAILED")) return "\u274C";
  if (type.includes("APPROVED") || type.includes("SUCCESS")) return "\u2705";
  if (type.includes("UPDATE") || type.includes("CHANGED")) return "\uD83D\uDD04";
  if (type.includes("SYSTEM") || type.includes("ANNOUNCEMENT")) return "\uD83D\uDCE2";
  if (type.includes("MARKETING") || type.includes("PROMOTION")) return "\uD83C\uDF89";
  if (type.includes("STAFF")) return "\uD83D\uDC65";
  if (type.includes("CAPACITY") || type.includes("MILESTONE")) return "\uD83D\uDCCA";
  if (type.includes("SECURITY") || type.includes("LOGIN")) return "\uD83D\uDD12";
  return "\uD83D\uDD14";
};

const getPriorityBadge = (priority: NotificationPriority) => {
  switch (priority) {
    case "URGENT":
      return <Badge variant="destructive">Urgent</Badge>;
    case "HIGH":
      return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/20">High</Badge>;
    case "MEDIUM":
      return <Badge className="bg-primary/10 text-primary border border-primary/20">Medium</Badge>;
    case "LOW":
      return <Badge variant="secondary">Low</Badge>;
    default:
      return null;
  }
};

// ─── Types ──────────────────────────────────────────────────────────────────────

import {
  type TypeFilterOption,
  ATTENDEE_TYPE_FILTERS,
  ORGANIZER_TYPE_FILTERS,
  ADMIN_TYPE_FILTERS,
} from "./notification-filters";

export type { TypeFilterOption };
export { ATTENDEE_TYPE_FILTERS, ORGANIZER_TYPE_FILTERS, ADMIN_TYPE_FILTERS };

export interface NotificationsHubProps {
  /** Filter type options shown in the "Type" dropdown. */
  typeFilters?: TypeFilterOption[];
  /** Show a back button (attendee dashboard uses this). */
  showBackButton?: boolean;
  /** Show the notification data/details section. Defaults to true. */
  showDetails?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────────

const NotificationsHub: React.FC<NotificationsHubProps> = ({
  typeFilters = ATTENDEE_TYPE_FILTERS,
  showBackButton = false,
  showDetails = true,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | "all">("all");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const filters: NotificationFilters = {
        ...(activeTab === "unread" && { isRead: false }),
        ...(activeTab === "read" && { isRead: true }),
        ...(filterType !== "all" && { type: filterType }),
        ...(filterPriority !== "all" && { priority: filterPriority }),
        limit: 50,
      };

      const [response, countResponse] = await Promise.all([
        getNotifications(filters),
        getUnreadCount(),
      ]);

      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      }
      if (countResponse.success && countResponse.data) {
        setUnreadCount(countResponse.data.count);
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterType, filterPriority, toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast({ title: "Success", description: "All notifications marked as read." });
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to mark all notifications as read.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteNotification(id);
      if (response.success) {
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (deleted && !deleted.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast({ title: "Success", description: "Notification deleted." });
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to delete notification.");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread" | "read")}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as NotificationType | "all")}
            className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="all">All Types</option>
            {typeFilters.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as NotificationPriority | "all")}
            className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Loading notifications...</p>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={
                activeTab === "unread"
                  ? "No Unread Notifications"
                  : activeTab === "read"
                  ? "No Read Notifications"
                  : "No Notifications"
              }
              description={
                activeTab === "unread"
                  ? "You're all caught up! No unread notifications at the moment."
                  : activeTab === "read"
                  ? "You haven't read any notifications yet."
                  : "You don't have any notifications yet. They'll appear here when you receive updates about events, registrations, and more."
              }
            />
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                variant={notification.isRead ? "default" : "elevated"}
                className={!notification.isRead ? "border-l-4 border-l-primary" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <CardTitle className="text-base sm:text-lg">{notification.title}</CardTitle>
                          {!notification.isRead && (
                            <Badge variant="default" className="bg-primary text-xs">
                              New
                            </Badge>
                          )}
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap text-sm">{notification.message}</p>
                  {showDetails && notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Details</p>
                      <div className="space-y-1">
                        {Object.entries(notification.data).map(([key, value]) => (
                          <div key={key} className="flex items-baseline gap-2 text-xs">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}:
                            </span>
                            <span className="text-foreground font-medium">
                              {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsHub;
