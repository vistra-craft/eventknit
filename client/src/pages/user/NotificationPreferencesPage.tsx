import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
  type UpdateNotificationPreferencesData,
} from "@/lib/notification-api";
import DashboardNavbar from "./DashboardNavbar";

const NotificationPreferencesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [formData, setFormData] = useState<UpdateNotificationPreferencesData>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    eventReminders: true,
    eventUpdates: true,
    eventCancellations: true,
    paymentNotifications: true,
    marketingEmails: true,
    systemAnnouncements: true,
    registrationUpdates: true,
    staffNotifications: false,
    reminderFrequency: "all",
  });

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const response = await getNotificationPreferences();
        if (response.success && response.data?.preferences) {
          const prefs = response.data.preferences;
          setPreferences(prefs);
          setFormData({
            emailEnabled: prefs.emailEnabled,
            smsEnabled: prefs.smsEnabled,
            pushEnabled: prefs.pushEnabled,
            inAppEnabled: prefs.inAppEnabled,
            eventReminders: prefs.eventReminders,
            eventUpdates: prefs.eventUpdates,
            eventCancellations: prefs.eventCancellations,
            paymentNotifications: prefs.paymentNotifications,
            marketingEmails: prefs.marketingEmails,
            systemAnnouncements: prefs.systemAnnouncements,
            registrationUpdates: prefs.registrationUpdates,
            staffNotifications: prefs.staffNotifications || false,
            reminderFrequency: prefs.reminderFrequency,
          });
        }
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load notification preferences. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [toast]);

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus("idle");
      setSaveMessage("");

      const response = await updateNotificationPreferences(formData);
      if (response.success && response.data?.preferences) {
        setPreferences(response.data.preferences);
        setSaveStatus("success");
        setSaveMessage("Notification preferences saved successfully!");
        toast({
          title: "Success",
          description: "Your notification preferences have been saved.",
        });
      }
    } catch (error: unknown) {
      console.error("Failed to save notification preferences:", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error.message as string)
          : "Failed to save notification preferences. Please try again.";
      setSaveStatus("error");
      setSaveMessage(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (preferences) {
      setFormData({
        emailEnabled: preferences.emailEnabled,
        smsEnabled: preferences.smsEnabled,
        pushEnabled: preferences.pushEnabled,
        inAppEnabled: preferences.inAppEnabled,
        eventReminders: preferences.eventReminders,
        eventUpdates: preferences.eventUpdates,
        eventCancellations: preferences.eventCancellations,
        paymentNotifications: preferences.paymentNotifications,
        marketingEmails: preferences.marketingEmails,
        systemAnnouncements: preferences.systemAnnouncements,
        registrationUpdates: preferences.registrationUpdates,
        staffNotifications: preferences.staffNotifications || false,
        reminderFrequency: preferences.reminderFrequency,
      });
      setSaveStatus("idle");
      setSaveMessage("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {user && <DashboardNavbar user={{
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
        }} activeSection="notifications" />}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading notification preferences...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {user && <DashboardNavbar user={{
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
      }} activeSection="notifications" />}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/user/dashboard?section=notifications")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notification Preferences
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage how and when you receive notifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus === "success" && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">{saveMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {saveStatus === "error" && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{saveMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Channel Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Delivery Channels
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="email-enabled" className="cursor-pointer">
                    Email Notifications
                  </Label>
                </div>
                <Switch
                  id="email-enabled"
                  checked={formData.emailEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, emailEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="sms-enabled" className="cursor-pointer">
                    SMS Notifications
                  </Label>
                </div>
                <Switch
                  id="sms-enabled"
                  checked={formData.smsEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, smsEnabled: checked })
                  }
                  disabled={!formData.smsEnabled && !preferences?.smsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="push-enabled" className="cursor-pointer">
                    Push Notifications
                  </Label>
                </div>
                <Switch
                  id="push-enabled"
                  checked={formData.pushEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, pushEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="inapp-enabled" className="cursor-pointer">
                    In-App Notifications
                  </Label>
                </div>
                <Switch
                  id="inapp-enabled"
                  checked={formData.inAppEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, inAppEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Categories
              </CardTitle>
              <CardDescription>
                Select which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="event-reminders" className="cursor-pointer">
                  Event Reminders
                </Label>
                <Switch
                  id="event-reminders"
                  checked={formData.eventReminders}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, eventReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="event-updates" className="cursor-pointer">
                  Event Updates
                </Label>
                <Switch
                  id="event-updates"
                  checked={formData.eventUpdates}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, eventUpdates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="event-cancellations" className="cursor-pointer">
                  Event Cancellations
                </Label>
                <Switch
                  id="event-cancellations"
                  checked={formData.eventCancellations}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, eventCancellations: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="payment-notifications" className="cursor-pointer">
                  Payment Notifications
                </Label>
                <Switch
                  id="payment-notifications"
                  checked={formData.paymentNotifications}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, paymentNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="marketing-emails" className="cursor-pointer">
                  Marketing Emails
                </Label>
                <Switch
                  id="marketing-emails"
                  checked={formData.marketingEmails}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, marketingEmails: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="system-announcements" className="cursor-pointer">
                  System Announcements
                </Label>
                <Switch
                  id="system-announcements"
                  checked={formData.systemAnnouncements}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, systemAnnouncements: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="registration-updates" className="cursor-pointer">
                  Registration Updates
                </Label>
                <Switch
                  id="registration-updates"
                  checked={formData.registrationUpdates}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, registrationUpdates: checked })
                  }
                />
              </div>

              {formData.staffNotifications !== undefined && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="staff-notifications" className="cursor-pointer">
                    Staff Notifications
                  </Label>
                  <Switch
                    id="staff-notifications"
                    checked={formData.staffNotifications}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, staffNotifications: checked })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Frequency Preferences */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Frequency Settings
              </CardTitle>
              <CardDescription>
                Control how often you receive notification reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="reminder-frequency">Reminder Frequency</Label>
                <Select
                  value={formData.reminderFrequency}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      reminderFrequency: value as "all" | "daily_digest" | "weekly_digest" | "none",
                    })
                  }
                >
                  <SelectTrigger id="reminder-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All notifications (real-time)</SelectItem>
                    <SelectItem value="daily_digest">Daily digest</SelectItem>
                    <SelectItem value="weekly_digest">Weekly digest</SelectItem>
                    <SelectItem value="none">No reminders</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formData.reminderFrequency === "all" &&
                    "You'll receive notifications immediately as they occur."}
                  {formData.reminderFrequency === "daily_digest" &&
                    "You'll receive a summary of all notifications once per day."}
                  {formData.reminderFrequency === "weekly_digest" &&
                    "You'll receive a summary of all notifications once per week."}
                  {formData.reminderFrequency === "none" &&
                    "You won't receive reminder notifications, but you'll still get important updates."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;





