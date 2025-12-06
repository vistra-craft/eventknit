import { useState, useEffect } from "react";
import {
  Bell,
  Settings,
  FileText,
  BarChart3,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  Smartphone,
  AppWindow,
  Clock,
  Database,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdminLayout from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import {
  getDefaultPreferences,
  updateDefaultPreferences,
  getSystemConfig,
  updateSystemConfig,
  getTemplates,
  getTemplate,
  saveTemplate,
  deleteTemplate,
  getAnalytics,
  type DefaultNotificationPreferences,
  type SystemNotificationConfig,
  type NotificationTemplate,
  type NotificationAnalytics,
} from "@/lib/admin-notification-settings-api";

const AdminNotificationSettingsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("defaults");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Default Preferences State
  const [defaultPreferences, setDefaultPreferences] = useState<DefaultNotificationPreferences | null>(null);

  // System Config State
  const [systemConfig, setSystemConfig] = useState<SystemNotificationConfig | null>(null);

  // Templates State
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    type: "",
    subject: "",
    body: "",
    variables: [] as string[],
  });

  // Analytics State
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"day" | "week" | "month">("week");

  // Load data based on active tab
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, analyticsPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "defaults": {
          const prefsResponse = await getDefaultPreferences();
          if (prefsResponse.success && prefsResponse.data) {
            setDefaultPreferences(prefsResponse.data.preferences);
          }
          break;
        }
        case "system": {
          const configResponse = await getSystemConfig();
          if (configResponse.success && configResponse.data) {
            setSystemConfig(configResponse.data.config);
          }
          break;
        }
        case "templates": {
          const templatesResponse = await getTemplates();
          if (templatesResponse.success && templatesResponse.data) {
            setTemplates(templatesResponse.data.templates);
          }
          break;
        }
        case "analytics": {
          const analyticsResponse = await getAnalytics(analyticsPeriod);
          if (analyticsResponse.success && analyticsResponse.data) {
            setAnalytics(analyticsResponse.data.analytics);
          }
          break;
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefaults = async () => {
    if (!defaultPreferences) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const response = await updateDefaultPreferences(defaultPreferences);
      if (response.success) {
        setSaveStatus("success");
        toast({
          title: "Success",
          description: "Default notification preferences updated successfully.",
        });
      } else {
        setSaveStatus("error");
        toast({
          title: "Error",
          description: response.message || "Failed to update preferences.",
          variant: "destructive",
        });
      }
             } catch (error: unknown) {
      setSaveStatus("error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleSaveSystemConfig = async () => {
    if (!systemConfig) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const response = await updateSystemConfig(systemConfig);
      if (response.success) {
        setSaveStatus("success");
        toast({
          title: "Success",
          description: "System notification configuration updated successfully.",
        });
      } else {
        setSaveStatus("error");
        toast({
          title: "Error",
          description: response.message || "Failed to update configuration.",
          variant: "destructive",
        });
      }
             } catch (error: unknown) {
      setSaveStatus("error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.type || !templateForm.subject || !templateForm.body) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await saveTemplate(templateForm.type, {
        subject: templateForm.subject,
        body: templateForm.body,
        variables: templateForm.variables,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Template saved successfully.",
        });
        setShowTemplateDialog(false);
        loadData();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save template.",
          variant: "destructive",
        });
      }
             } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (type: string) => {
    if (!window.confirm(`Are you sure you want to delete the template "${type}"?`)) {
      return;
    }

    try {
      const response = await deleteTemplate(type);
      if (response.success) {
        toast({
          title: "Success",
          description: "Template deleted successfully.",
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete template.",
          variant: "destructive",
        });
      }
             } catch (error: unknown) {
      toast({
        title: "Error",
                 description: error instanceof Error ? error.message : "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = async (type: string) => {
    try {
      const response = await getTemplate(type);
      if (response.success && response.data) {
        setSelectedTemplate(response.data.template);
        setTemplateForm({
          type: response.data.template.type,
          subject: response.data.template.subject,
          body: response.data.template.body,
          variables: response.data.template.variables || [],
        });
        setShowTemplateDialog(true);
      }
             } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load template.",
        variant: "destructive",
      });
    }
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({
      type: "",
      subject: "",
      body: "",
      variables: [],
    });
    setShowTemplateDialog(true);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Notification Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system-wide notification preferences, templates, and analytics
            </p>
          </div>
        </div>

        {saveStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">Settings saved successfully!</span>
            </div>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">Failed to save settings. Please try again.</span>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="defaults">
              <Settings className="h-4 w-4 mr-2" />
              Default Preferences
            </TabsTrigger>
            <TabsTrigger value="system">
              <Bell className="h-4 w-4 mr-2" />
              System Config
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Default Preferences Tab */}
          <TabsContent value="defaults" className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading default preferences...</p>
                </CardContent>
              </Card>
            ) : defaultPreferences ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Default Notification Preferences</CardTitle>
                    <CardDescription>
                      These preferences will be applied to all new users. Existing users can override these in their personal settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Channel Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Channel Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-email" className="flex items-center gap-2 cursor-pointer">
                            <Mail className="h-4 w-4" /> Email Notifications
                          </Label>
                          <Switch
                            id="default-email"
                            checked={defaultPreferences.emailEnabled}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, emailEnabled: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-sms" className="flex items-center gap-2 cursor-pointer">
                            <MessageSquare className="h-4 w-4" /> SMS Notifications
                          </Label>
                          <Switch
                            id="default-sms"
                            checked={defaultPreferences.smsEnabled}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, smsEnabled: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-push" className="flex items-center gap-2 cursor-pointer">
                            <Smartphone className="h-4 w-4" /> Push Notifications
                          </Label>
                          <Switch
                            id="default-push"
                            checked={defaultPreferences.pushEnabled}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, pushEnabled: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-inapp" className="flex items-center gap-2 cursor-pointer">
                            <AppWindow className="h-4 w-4" /> In-App Notifications
                          </Label>
                          <Switch
                            id="default-inapp"
                            checked={defaultPreferences.inAppEnabled}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, inAppEnabled: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Category Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-event-reminders" className="cursor-pointer">
                            Event Reminders
                          </Label>
                          <Switch
                            id="default-event-reminders"
                            checked={defaultPreferences.eventReminders}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, eventReminders: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-event-updates" className="cursor-pointer">
                            Event Updates
                          </Label>
                          <Switch
                            id="default-event-updates"
                            checked={defaultPreferences.eventUpdates}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, eventUpdates: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-event-cancellations" className="cursor-pointer">
                            Event Cancellations
                          </Label>
                          <Switch
                            id="default-event-cancellations"
                            checked={defaultPreferences.eventCancellations}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, eventCancellations: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-payment-notifications" className="cursor-pointer">
                            Payment Notifications
                          </Label>
                          <Switch
                            id="default-payment-notifications"
                            checked={defaultPreferences.paymentNotifications}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, paymentNotifications: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-marketing-emails" className="cursor-pointer">
                            Marketing Emails
                          </Label>
                          <Switch
                            id="default-marketing-emails"
                            checked={defaultPreferences.marketingEmails}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, marketingEmails: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-system-announcements" className="cursor-pointer">
                            System Announcements
                          </Label>
                          <Switch
                            id="default-system-announcements"
                            checked={defaultPreferences.systemAnnouncements}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, systemAnnouncements: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-registration-updates" className="cursor-pointer">
                            Registration Updates
                          </Label>
                          <Switch
                            id="default-registration-updates"
                            checked={defaultPreferences.registrationUpdates}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, registrationUpdates: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="default-staff-notifications" className="cursor-pointer">
                            Staff Notifications
                          </Label>
                          <Switch
                            id="default-staff-notifications"
                            checked={defaultPreferences.staffNotifications}
                            onCheckedChange={(checked) =>
                              setDefaultPreferences({ ...defaultPreferences, staffNotifications: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Frequency Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Frequency Preferences</h3>
                      <div className="space-y-2">
                        <Label htmlFor="default-reminder-frequency">Reminder Frequency</Label>
                        <Select
                          value={defaultPreferences.reminderFrequency}
                          onValueChange={(value: "all" | "daily_digest" | "weekly_digest" | "none") =>
                            setDefaultPreferences({ ...defaultPreferences, reminderFrequency: value })
                          }
                        >
                          <SelectTrigger id="default-reminder-frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All (real-time)</SelectItem>
                            <SelectItem value="daily_digest">Daily Digest</SelectItem>
                            <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveDefaults} disabled={saving}>
                        {saving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? "Saving..." : "Save Default Preferences"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-destructive">
                  Failed to load default preferences. Please try again.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* System Configuration Tab */}
          <TabsContent value="system" className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading system configuration...</p>
                </CardContent>
              </Card>
            ) : systemConfig ? (
              <Card>
                <CardHeader>
                  <CardTitle>System-Wide Notification Configuration</CardTitle>
                  <CardDescription>
                    Configure global notification system settings that affect all users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Channel Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Channel Configuration</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="system-email" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="h-4 w-4" /> Email Enabled
                        </Label>
                        <Switch
                          id="system-email"
                          checked={systemConfig.emailEnabled}
                          onCheckedChange={(checked) =>
                            setSystemConfig({ ...systemConfig, emailEnabled: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="system-sms" className="flex items-center gap-2 cursor-pointer">
                          <MessageSquare className="h-4 w-4" /> SMS Enabled
                        </Label>
                        <Switch
                          id="system-sms"
                          checked={systemConfig.smsEnabled}
                          onCheckedChange={(checked) =>
                            setSystemConfig({ ...systemConfig, smsEnabled: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="system-push" className="flex items-center gap-2 cursor-pointer">
                          <Smartphone className="h-4 w-4" /> Push Enabled
                        </Label>
                        <Switch
                          id="system-push"
                          checked={systemConfig.pushEnabled}
                          onCheckedChange={(checked) =>
                            setSystemConfig({ ...systemConfig, pushEnabled: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="system-inapp" className="flex items-center gap-2 cursor-pointer">
                          <AppWindow className="h-4 w-4" /> In-App Enabled
                        </Label>
                        <Switch
                          id="system-inapp"
                          checked={systemConfig.inAppEnabled}
                          onCheckedChange={(checked) =>
                            setSystemConfig({ ...systemConfig, inAppEnabled: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timing Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Timing Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="default-reminder-time" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Default Reminder Time (hours)
                        </Label>
                        <Input
                          id="default-reminder-time"
                          type="number"
                          min="0"
                          value={systemConfig.defaultReminderTime}
                          onChange={(e) =>
                            setSystemConfig({
                              ...systemConfig,
                              defaultReminderTime: parseInt(e.target.value) || 24,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Hours before event to send reminder (default: 24)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="default-deadline-reminder-time" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Default Deadline Reminder Time (hours)
                        </Label>
                        <Input
                          id="default-deadline-reminder-time"
                          type="number"
                          min="0"
                          value={systemConfig.defaultDeadlineReminderTime}
                          onChange={(e) =>
                            setSystemConfig({
                              ...systemConfig,
                              defaultDeadlineReminderTime: parseInt(e.target.value) || 24,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Hours before registration deadline to send reminder (default: 24)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Storage Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Storage Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-notifications" className="flex items-center gap-2">
                          <Database className="h-4 w-4" /> Max Notifications Per User
                        </Label>
                        <Input
                          id="max-notifications"
                          type="number"
                          min="1"
                          value={systemConfig.maxNotificationsPerUser}
                          onChange={(e) =>
                            setSystemConfig({
                              ...systemConfig,
                              maxNotificationsPerUser: parseInt(e.target.value) || 1000,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum number of notifications to keep per user (default: 1000)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="retention-days" className="flex items-center gap-2">
                          <Database className="h-4 w-4" /> Notification Retention (days)
                        </Label>
                        <Input
                          id="retention-days"
                          type="number"
                          min="1"
                          value={systemConfig.notificationRetentionDays}
                          onChange={(e) =>
                            setSystemConfig({
                              ...systemConfig,
                              notificationRetentionDays: parseInt(e.target.value) || 90,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Days to keep notifications before cleanup (default: 90)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSystemConfig} disabled={saving}>
                      {saving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saving ? "Saving..." : "Save System Configuration"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-destructive">
                  Failed to load system configuration. Please try again.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading templates...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Notification Templates</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage notification templates for different notification types
                    </p>
                  </div>
                  <Button onClick={handleNewTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>

                {templates.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No templates found. Create your first template to get started.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{template.type}</h3>
                                <Badge variant="secondary">{template.variables.length} variables</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>Subject:</strong> {template.subject}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                <strong>Body:</strong> {template.body.substring(0, 100)}...
                              </p>
                              {template.variables.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {template.variables.map((variable) => (
                                    <Badge key={variable} variant="outline" className="text-xs">
                                      {variable}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTemplate(template.type)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.type)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading analytics...</p>
                </CardContent>
              </Card>
            ) : analytics ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Notification Analytics</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Track notification performance and delivery rates
                    </p>
                  </div>
                  <Select value={analyticsPeriod} onValueChange={(value: "day" | "week" | "month") => setAnalyticsPeriod(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Last 24 Hours</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Sent</p>
                          <p className="font-semibold text-primary">{analytics.totalSent.toLocaleString()}</p>
                        </div>
                        <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Delivered</p>
                          <p className="font-semibold text-green-600">{analytics.totalDelivered.toLocaleString()}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Failed</p>
                          <p className="font-semibold text-red-600">{analytics.totalFailed.toLocaleString()}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Delivery Rate</p>
                          <p className="font-semibold text-primary">{analytics.deliveryRate.toFixed(1)}%</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Channel Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Channel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.byChannel).map(([channel, stats]) => (
                        <div key={channel} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold capitalize">{channel}</h4>
                              <Badge variant="secondary">{stats.sent} sent</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">✓ {stats.delivered} delivered</span>
                              {stats.failed > 0 && <span className="text-red-600">✗ {stats.failed} failed</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Success Rate</p>
                            <p className="text-lg font-semibold">
                              {stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : 0}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance by Type */}
                {Object.keys(analytics.byType).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance by Notification Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.byType).map(([type, stats]) => (
                          <div key={type} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <p className="font-medium">{type.replace(/_/g, " ")}</p>
                              <p className="text-sm text-muted-foreground">
                                {stats.sent} sent • {stats.delivered} delivered • {stats.failed} failed
                              </p>
                            </div>
                            <Badge variant={stats.failed > 0 ? "destructive" : "default"}>
                              {stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : 0}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-destructive">
                  Failed to load analytics. Please try again.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? "Edit Template" : "New Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-type">Notification Type</Label>
                <Input
                  id="template-type"
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                  placeholder="e.g., EVENT_REMINDER_24H"
                  disabled={!!selectedTemplate}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTemplate ? "Type cannot be changed" : "Enter the notification type identifier"}
                </p>
              </div>
              <div>
                <Label htmlFor="template-subject">Subject</Label>
                <Input
                  id="template-subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="Notification subject line"
                />
              </div>
              <div>
                <Label htmlFor="template-body">Body</Label>
                <Textarea
                  id="template-body"
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  placeholder="Notification body content (supports HTML and template variables like {{event_title}})"
                  rows={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use template variables like {"{{event_title}}"}, {"{{user_name}}"}, etc.
                </p>
              </div>
              <div>
                <Label htmlFor="template-variables">Available Variables (comma-separated)</Label>
                <Input
                  id="template-variables"
                  value={templateForm.variables.join(", ")}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      variables: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
                    })
                  }
                  placeholder="event_title, user_name, event_date"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={saving}>
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationSettingsPage;

