import React, { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react";
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
  if (type.includes("CAPACITY") || type.includes("MILESTONE")) return "📊";
  return "🔔";
};

const getPriorityBadge = (priority: NotificationPriority) => {
  switch (priority) {
    case "URGENT":
      return <Badge variant="destructive">Urgent</Badge>;
    case "HIGH":
      return <Badge variant="default" className="bg-orange-500">High</Badge>;
    case "MEDIUM":
      return <Badge variant="default" className="bg-primary/50">Medium</Badge>;
    case "LOW":
      return <Badge variant="secondary">Low</Badge>;
    default:
      return null;
  }
};

const OrganizerNotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | "all">("all");
  const { toast } = useToast();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const filters: NotificationFilters = {
        ...(activeTab === "unread" && { isRead: false }),
        ...(activeTab === "read" && { isRead: true }),
        ...(filterType !== "all" && { type: filterType }),
        ...(filterPriority !== "all" && { priority: filterPriority }),
        limit: 50,
      };

      const response = await getNotifications(filters);
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      }

      const countResponse = await getUnreadCount();
      if (countResponse.success && countResponse.data) {
        setUnreadCount(countResponse.data.count);
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterType, filterPriority]);

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
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

        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as NotificationType | "all")}
            className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
          >
            <option value="all">All Types</option>
            <option value="EVENT_REMINDER_24H">Event Reminders</option>
            <option value="EVENT_UPDATE">Event Updates</option>
            <option value="EVENT_APPROVED">Event Approved</option>
            <option value="EVENT_REJECTED">Event Rejected</option>
            <option value="REGISTRATION_CONFIRMED">Registrations</option>
            <option value="REGISTRATION_MILESTONE_50">Registration Milestones</option>
            <option value="CAPACITY_REACHED">Capacity Alerts</option>
            <option value="PAYMENT_RECEIVED">Payments</option>
            <option value="REFUND_PROCESSED">Refunds</option>
            <option value="SYSTEM_ANNOUNCEMENT">System Announcements</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as NotificationPriority | "all")}
            className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <TabsContent value={activeTab} className="space-y-3">
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
                  : "No notifications yet. You'll receive updates about event approvals, registrations, payments, and more here."
              }
            />
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all ${!notification.isRead ? "border-l-4 border-l-primary bg-primary/5" : "border-border/40"}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          {!notification.isRead && (
                            <Badge variant="default" className="bg-primary text-xs">New</Badge>
                          )}
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{notification.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizerNotificationsCenter;
