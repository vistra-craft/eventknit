import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import EmptyState from "../../components/EmptyState";
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
} from "../../lib/notification-api";
import { useToast } from "../../hooks/use-toast";
// Helper function to format time distance
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface NotificationsCenterProps {
  eventData?: EventData;
}

const NotificationsCenter: React.FC<NotificationsCenterProps> = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | "all">("all");
  const { toast } = useToast();

  // Load notifications
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

      // Load unread count
      const countResponse = await getUnreadCount();
      if (countResponse.success && countResponse.data) {
        setUnreadCount(countResponse.data.count);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterType, filterPriority]);

  // Mark notification as read
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
      console.error("Failed to mark notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast({
          title: "Success",
          description: "All notifications marked as read.",
        });
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      });
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteNotification(id);
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // Update unread count if deleted notification was unread
        const deleted = notifications.find((n) => n.id === id);
        if (deleted && !deleted.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast({
          title: "Success",
          description: "Notification deleted.",
        });
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive">Urgent</Badge>;
      case "HIGH":
        return <Badge variant="default" className="bg-orange-500">High</Badge>;
      case "MEDIUM":
        return <Badge variant="default" className="bg-blue-500">Medium</Badge>;
      case "LOW":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return null;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    if (type.includes("EVENT_REMINDER") || type.includes("REMINDER")) {
      return "⏰";
    } else if (type.includes("PAYMENT") || type.includes("REFUND")) {
      return "💳";
    } else if (type.includes("REGISTRATION")) {
      return "📝";
    } else if (type.includes("CANCELLED") || type.includes("FAILED")) {
      return "❌";
    } else if (type.includes("APPROVED") || type.includes("SUCCESS")) {
      return "✅";
    } else if (type.includes("UPDATE") || type.includes("CHANGED")) {
      return "🔄";
    } else if (type.includes("SYSTEM") || type.includes("ANNOUNCEMENT")) {
      return "📢";
    } else if (type.includes("MARKETING") || type.includes("PROMOTION")) {
      return "🎉";
    } else {
      return "🔔";
    }
  };

  // Format notification time
  const formatTime = (dateString: string) => {
    try {
      const distance = formatDistanceToNow(new Date(dateString));
      return distance ? `${distance} ago` : "Recently";
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="flex gap-4 mb-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as NotificationType | "all")}
            className="px-3 py-2 border rounded-md bg-background text-foreground"
          >
            <option value="all">All Types</option>
            <option value="EVENT_REMINDER_24H">Event Reminders</option>
            <option value="EVENT_UPDATE">Event Updates</option>
            <option value="REGISTRATION_CONFIRMED">Registrations</option>
            <option value="PAYMENT_SUCCESS">Payments</option>
            <option value="SYSTEM_ANNOUNCEMENT">System</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as NotificationPriority | "all")}
            className="px-3 py-2 border rounded-md bg-background text-foreground"
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
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          {!notification.isRead && (
                            <Badge variant="default" className="bg-primary">
                              New
                            </Badge>
                          )}
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
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
                  <p className="text-foreground whitespace-pre-wrap">{notification.message}</p>
                  {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Additional Details:</p>
                      <pre className="text-xs text-foreground overflow-auto">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
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

export default NotificationsCenter;
