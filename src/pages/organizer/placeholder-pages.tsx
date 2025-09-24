import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrganizerLayout from "./OrganizerLayout";
import { 
  BarChart3, 
  MessageCircle, 
  Users, 
  Settings,
  Calendar,
  FileText,
  Plus
} from "lucide-react";

// Import the new analytics components
import { 
  AnalyticsOverview, 
  EventPerformance, 
  AttendeeInsights, 
  RevenueReports 
} from "./analytics";

// Re-export the analytics components
export { AnalyticsOverview, EventPerformance, AttendeeInsights, RevenueReports };

// Communications Page
export const CommunicationsPage = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Communications</h1>
        <p className="text-muted-foreground mt-1">Manage your communications and messaging</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Communications Center</h3>
          <p className="text-muted-foreground mb-4">Communication tools and messaging features coming soon</p>
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Manage Communications
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

// Team Pages
export const StaffManagement = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
        <p className="text-muted-foreground mt-1">Manage your team and staff members</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Team Management</h3>
          <p className="text-muted-foreground mb-4">Staff management tools coming soon</p>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Staff
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const RolesPermissions = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-1">Configure user roles and permissions</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Role Management</h3>
          <p className="text-muted-foreground mb-4">Role and permission management coming soon</p>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Roles
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const TeamCalendar = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Calendar</h1>
        <p className="text-muted-foreground mt-1">Manage team schedules and availability</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Team Scheduling</h3>
          <p className="text-muted-foreground mb-4">Team calendar and scheduling tools coming soon</p>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const TeamPerformance = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Performance</h1>
        <p className="text-muted-foreground mt-1">Track team performance and productivity</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Performance Analytics</h3>
          <p className="text-muted-foreground mb-4">Team performance tracking coming soon</p>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Performance
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

// Settings Page
export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    // Account Security
    twoFactorEnabled: false,
    sessionTimeout: 30,
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    
    // Preferences
    timezone: "America/Los_Angeles",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    language: "en",
    
    // Privacy
    profileVisibility: "private",
    dataSharing: false,
    analyticsTracking: true
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <OrganizerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your account security and preferences</p>
        </div>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button 
                variant={settings.twoFactorEnabled ? "default" : "outline"}
                onClick={() => handleToggle('twoFactorEnabled')}
              >
                {settings.twoFactorEnabled ? "Enabled" : "Enable"}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Session Timeout</label>
              <select 
                value={settings.sessionTimeout}
                onChange={(e) => handleSelectChange('sessionTimeout', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>

            <div className="pt-4 border-t border-border">
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Button 
                variant={settings.emailNotifications ? "default" : "outline"}
                onClick={() => handleToggle('emailNotifications')}
              >
                {settings.emailNotifications ? "On" : "Off"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">SMS Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive updates via text message</p>
              </div>
              <Button 
                variant={settings.smsNotifications ? "default" : "outline"}
                onClick={() => handleToggle('smsNotifications')}
              >
                {settings.smsNotifications ? "On" : "Off"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive browser notifications</p>
              </div>
              <Button 
                variant={settings.pushNotifications ? "default" : "outline"}
                onClick={() => handleToggle('pushNotifications')}
              >
                {settings.pushNotifications ? "On" : "Off"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Marketing Emails</h3>
                <p className="text-sm text-muted-foreground">Receive promotional content and tips</p>
              </div>
              <Button 
                variant={settings.marketingEmails ? "default" : "outline"}
                onClick={() => handleToggle('marketingEmails')}
              >
                {settings.marketingEmails ? "On" : "Off"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Timezone</label>
                <select 
                  value={settings.timezone}
                  onChange={(e) => handleSelectChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
                >
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date Format</label>
                <select 
                  value={settings.dateFormat}
                  onChange={(e) => handleSelectChange('dateFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Currency</label>
                <select 
                  value={settings.currency}
                  onChange={(e) => handleSelectChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Language</label>
                <select 
                  value={settings.language}
                  onChange={(e) => handleSelectChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Profile Visibility</label>
              <select 
                value={settings.profileVisibility}
                onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="team">Team Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Data Sharing</h3>
                <p className="text-sm text-muted-foreground">Allow sharing of anonymized data for product improvement</p>
              </div>
              <Button 
                variant={settings.dataSharing ? "default" : "outline"}
                onClick={() => handleToggle('dataSharing')}
              >
                {settings.dataSharing ? "On" : "Off"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Analytics Tracking</h3>
                <p className="text-sm text-muted-foreground">Help us improve the platform with usage analytics</p>
              </div>
              <Button 
                variant={settings.analyticsTracking ? "default" : "outline"}
                onClick={() => handleToggle('analyticsTracking')}
              >
                {settings.analyticsTracking ? "On" : "Off"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg">
            Save Settings
          </Button>
        </div>
      </div>
    </OrganizerLayout>
  );
};

// Event Templates and Drafts
export const EventTemplates = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Event Templates</h1>
        <p className="text-muted-foreground mt-1">Create and manage event templates</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Template Library</h3>
          <p className="text-muted-foreground mb-4">Event templates and reusable designs coming soon</p>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const EventDrafts = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Event Drafts</h1>
        <p className="text-muted-foreground mt-1">Manage your draft events</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Draft Events</h3>
          <p className="text-muted-foreground mb-4">Event drafts and work-in-progress events coming soon</p>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Draft
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);