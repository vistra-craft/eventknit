import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Mail,
  Globe,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import OrganizerLayout from "./OrganizerLayout";

interface OrganizerSettingsData {
  // Profile Settings
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  bio: string;
  avatar: string;
  
  // Notification Settings
  emailNotifications: boolean;
  eventUpdates: boolean;
  attendeeRegistrations: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  notificationEmail: string;
  
  // Appearance Settings
  theme: "light" | "dark" | "system";
  dashboardLayout: "compact" | "spacious";
  showMetrics: boolean;
  showCharts: boolean;
  
  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

const OrganizerSettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPassword, setShowPassword] = useState(false);
  
  // Determine active tab from URL
  const getActiveTabFromUrl = () => {
    const path = location.pathname;
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/security')) return 'security';
    if (path.includes('/appearance')) return 'appearance';
    if (path.includes('/profile')) return 'profile';
    return 'profile'; // default
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  
  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location.pathname]);

  // Handle tab navigation
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/organizer/settings/${tabId}`);
  };
  
  // Mock settings data - in a real app, this would come from your API
  const [settings, setSettings] = useState<OrganizerSettingsData>({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    company: "EventKnit Solutions",
    position: "Event Manager",
    location: "San Francisco, CA",
    bio: "Experienced event manager with 5+ years in the industry, specializing in tech conferences and corporate events.",
    avatar: "/api/placeholder/96/96",
    emailNotifications: true,
    eventUpdates: true,
    attendeeRegistrations: true,
    paymentNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    notificationEmail: "john.doe@example.com",
    theme: "system",
    dashboardLayout: "spacious",
    showMetrics: true,
    showCharts: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true,
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      ...settings,
      theme: "system",
      dashboardLayout: "spacious",
      showMetrics: true,
      showCharts: true,
    });
  };

  const updateSetting = (key: keyof OrganizerSettingsData, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getInitials = () => {
    return `${settings.firstName[0]}${settings.lastName[0]}`.toUpperCase();
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center space-x-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={settings.avatar} alt="Profile" />
          <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Button variant="outline" size="sm">
            Change Photo
          </Button>
          <p className="text-sm text-muted-foreground">
            JPG, PNG or GIF. Max size 2MB.
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={settings.firstName}
            onChange={(e) => updateSetting("firstName", e.target.value)}
            placeholder="Enter first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={settings.lastName}
            onChange={(e) => updateSetting("lastName", e.target.value)}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={settings.email}
          onChange={(e) => updateSetting("email", e.target.value)}
          placeholder="Enter email address"
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={settings.phone}
          onChange={(e) => updateSetting("phone", e.target.value)}
          placeholder="Enter phone number"
        />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={settings.location}
          onChange={(e) => updateSetting("location", e.target.value)}
          placeholder="Enter location"
        />
      </div>

      {/* Professional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={settings.company}
            onChange={(e) => updateSetting("company", e.target.value)}
            placeholder="Enter company name"
          />
        </div>
        <div>
          <Label htmlFor="position">Position/Title</Label>
          <Input
            id="position"
            value={settings.position}
            onChange={(e) => updateSetting("position", e.target.value)}
            placeholder="Enter position"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={settings.bio}
          onChange={(e) => updateSetting("bio", e.target.value)}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Notifications</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email notifications</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="eventUpdates">Event Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about event changes</p>
            </div>
            <Switch
              id="eventUpdates"
              checked={settings.eventUpdates}
              onCheckedChange={(checked) => updateSetting("eventUpdates", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="attendeeRegistrations">Attendee Registrations</Label>
              <p className="text-sm text-muted-foreground">Get notified when someone registers</p>
            </div>
            <Switch
              id="attendeeRegistrations"
              checked={settings.attendeeRegistrations}
              onCheckedChange={(checked) => updateSetting("attendeeRegistrations", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="paymentNotifications">Payment Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified about payments</p>
            </div>
            <Switch
              id="paymentNotifications"
              checked={settings.paymentNotifications}
              onCheckedChange={(checked) => updateSetting("paymentNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">Receive marketing and promotional emails</p>
            </div>
            <Switch
              id="marketingEmails"
              checked={settings.marketingEmails}
              onCheckedChange={(checked) => updateSetting("marketingEmails", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weeklyDigest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">Receive weekly summary emails</p>
            </div>
            <Switch
              id="weeklyDigest"
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) => updateSetting("weeklyDigest", checked)}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="notificationEmail">Notification Email</Label>
        <Input
          id="notificationEmail"
          type="email"
          value={settings.notificationEmail}
          onChange={(e) => updateSetting("notificationEmail", e.target.value)}
          placeholder="Enter notification email"
        />
        <p className="text-sm text-muted-foreground mt-1">
          This email will receive all notifications
        </p>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Theme</h3>
        
        <div>
          <Label htmlFor="theme">Color Theme</Label>
          <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center">
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center">
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center">
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dashboard Layout</h3>
        
        <div>
          <Label htmlFor="dashboardLayout">Layout Style</Label>
          <Select value={settings.dashboardLayout} onValueChange={(value) => updateSetting("dashboardLayout", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showMetrics">Show Metrics Cards</Label>
              <p className="text-sm text-muted-foreground">Display metric cards on dashboard</p>
            </div>
            <Switch
              id="showMetrics"
              checked={settings.showMetrics}
              onCheckedChange={(checked) => updateSetting("showMetrics", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showCharts">Show Charts</Label>
              <p className="text-sm text-muted-foreground">Display charts and graphs</p>
            </div>
            <Switch
              id="showCharts"
              checked={settings.showCharts}
              onCheckedChange={(checked) => updateSetting("showCharts", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Account Security</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
          </div>
          <Switch
            id="twoFactorAuth"
            checked={settings.twoFactorAuth}
            onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="loginAlerts">Login Alerts</Label>
            <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
          </div>
          <Switch
            id="loginAlerts"
            checked={settings.loginAlerts}
            onCheckedChange={(checked) => updateSetting("loginAlerts", checked)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Password</h3>
        
        <div>
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter current password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
          />
        </div>

        <Button variant="outline">
          <Key className="h-4 w-4 mr-2" />
          Change Password
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Session Settings</h3>
        
        <div>
          <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
          <Select value={settings.sessionTimeout.toString()} onValueChange={(value) => updateSetting("sessionTimeout", parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select timeout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="480">8 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return renderProfileSettings();
      case "notifications": return renderNotificationSettings();
      case "appearance": return renderAppearanceSettings();
      case "security": return renderSecuritySettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">Settings saved successfully!</span>
            </div>
          </div>
        )}
        
        {saveStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">Failed to save settings. Please try again.</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {(() => {
                    const activeTabData = tabs.find(tab => tab.id === activeTab);
                    const Icon = activeTabData?.icon;
                    return Icon ? <Icon className="h-5 w-5 mr-2" /> : null;
                  })()}
                  {tabs.find(tab => tab.id === activeTab)?.label} Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderTabContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default OrganizerSettingsPage;
