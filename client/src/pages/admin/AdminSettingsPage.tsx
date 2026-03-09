import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Database,
  Key,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { getSettings, setSettings, type SystemSetting } from "@/lib/system-settings-api";
import { SettingsSection, SettingsField, ThemeSelector, LanguageSelector, TimezoneSelector, DateFormatSelector } from "@/components/settings";
import { showErrorToast } from "@/lib/utils/error";

interface SettingsData {
  // General Settings
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  
  // User Settings
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  defaultUserRole: string;
  sessionTimeout: number;
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationEmail: string;
  
  // Security Settings
  passwordMinLength: number;
  requireSpecialChars: boolean;
  sessionSecurity: boolean;
  twoFactorAuth: boolean;
  loginAttempts: number;
  
  // Appearance Settings
  theme: string;
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  
  // Email Settings
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  
  // API Settings
  apiRateLimit: number;
  apiKeyExpiry: number;
  webhookUrl: string;
  
  // Maintenance Settings
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  
  // Default settings data
  const [settings, setSettingsState] = useState<SettingsData>({
    siteName: "EventKnit",
    siteDescription: "Professional Event Management Platform",
    siteUrl: "https://eventknit.com",
    timezone: "America/New_York",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    allowRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: "support_staff",
    sessionTimeout: 30,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationEmail: "admin@eventknit.com",
    passwordMinLength: 8,
    requireSpecialChars: true,
    sessionSecurity: true,
    twoFactorAuth: false,
    loginAttempts: 5,
    theme: "light",
    primaryColor: "#3b82f6",
    logoUrl: "/logo.png",
    faviconUrl: "/favicon.ico",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpSecure: false,
    fromEmail: "noreply@eventknit.com",
    fromName: "EventKnit",
    apiRateLimit: 1000,
    apiKeyExpiry: 30,
    webhookUrl: "",
    maintenanceMode: false,
    maintenanceMessage: "We're currently performing maintenance. Please check back later."
  });

  // Mapping between frontend keys and backend setting keys
  const settingKeyMap: Record<keyof SettingsData, { key: string; category: SystemSetting['category']; type: SystemSetting['type']; isEncrypted?: boolean }> = {
    // General
    siteName: { key: 'site.name', category: 'general', type: 'string' },
    siteDescription: { key: 'site.description', category: 'general', type: 'string' },
    siteUrl: { key: 'site.url', category: 'general', type: 'string' },
    timezone: { key: 'site.timezone', category: 'general', type: 'string' },
    language: { key: 'site.language', category: 'general', type: 'string' },
    dateFormat: { key: 'site.dateFormat', category: 'general', type: 'string' },
    timeFormat: { key: 'site.timeFormat', category: 'general', type: 'string' },
    
    // Users
    allowRegistration: { key: 'users.allowRegistration', category: 'users', type: 'boolean' },
    requireEmailVerification: { key: 'users.requireEmailVerification', category: 'users', type: 'boolean' },
    defaultUserRole: { key: 'users.defaultRole', category: 'users', type: 'string' },
    sessionTimeout: { key: 'users.sessionTimeout', category: 'users', type: 'number' },
    
    // Notifications
    emailNotifications: { key: 'notifications.email.enabled', category: 'notifications', type: 'boolean' },
    smsNotifications: { key: 'notifications.sms.enabled', category: 'notifications', type: 'boolean' },
    pushNotifications: { key: 'notifications.push.enabled', category: 'notifications', type: 'boolean' },
    notificationEmail: { key: 'notifications.email.address', category: 'notifications', type: 'string' },
    
    // Security
    passwordMinLength: { key: 'security.password.minLength', category: 'security', type: 'number' },
    requireSpecialChars: { key: 'security.password.requireSpecialChars', category: 'security', type: 'boolean' },
    sessionSecurity: { key: 'security.session.enabled', category: 'security', type: 'boolean' },
    twoFactorAuth: { key: 'security.twoFactorAuth.required', category: 'security', type: 'boolean' },
    loginAttempts: { key: 'security.login.maxAttempts', category: 'security', type: 'number' },
    
    // Appearance
    theme: { key: 'appearance.theme', category: 'appearance', type: 'string' },
    primaryColor: { key: 'appearance.primaryColor', category: 'appearance', type: 'string' },
    logoUrl: { key: 'appearance.logoUrl', category: 'appearance', type: 'string' },
    faviconUrl: { key: 'appearance.faviconUrl', category: 'appearance', type: 'string' },
    
    // Email
    smtpHost: { key: 'email.smtp.host', category: 'email', type: 'string' },
    smtpPort: { key: 'email.smtp.port', category: 'email', type: 'number' },
    smtpUsername: { key: 'email.smtp.username', category: 'email', type: 'string' },
    smtpPassword: { key: 'email.smtp.password', category: 'email', type: 'string', isEncrypted: true },
    smtpSecure: { key: 'email.smtp.secure', category: 'email', type: 'boolean' },
    fromEmail: { key: 'email.from.address', category: 'email', type: 'string' },
    fromName: { key: 'email.from.name', category: 'email', type: 'string' },
    
    // API
    apiRateLimit: { key: 'api.rateLimit', category: 'api', type: 'number' },
    apiKeyExpiry: { key: 'api.keyExpiry', category: 'api', type: 'number' },
    webhookUrl: { key: 'api.webhookUrl', category: 'api', type: 'string' },
    
    // Maintenance
    maintenanceMode: { key: 'maintenance.enabled', category: 'maintenance', type: 'boolean' },
    maintenanceMessage: { key: 'maintenance.message', category: 'maintenance', type: 'string' },
  };

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const response = await getSettings();
        if (response.success && response.data?.settings) {
          const backendSettings = response.data.settings;
          
          // Convert backend settings to frontend format
          const frontendSettings: Partial<SettingsData> = {};
          
          // Create reverse mapping
          const keyToFrontendKey: Record<string, keyof SettingsData> = {};
          Object.entries(settingKeyMap).forEach(([frontendKey, backendConfig]) => {
            keyToFrontendKey[backendConfig.key] = frontendKey as keyof SettingsData;
          });
          
          // Map backend settings to frontend
          backendSettings.forEach((setting) => {
            const frontendKey = keyToFrontendKey[setting.key];
            if (frontendKey) {
              frontendSettings[frontendKey] = setting.value as never;
            }
          });
          
          setSettingsState(prev => ({ ...prev, ...frontendSettings }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        showErrorToast(toast, error, 'Load failed', 'Failed to load settings. Using default values.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "users", label: "Users", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "email", label: "Email", icon: Mail },
    { id: "api", label: "API", icon: Key },
    { id: "maintenance", label: "Maintenance", icon: Database }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    
    try {
      // Convert frontend settings to backend format
      const backendSettings = Object.entries(settingKeyMap).map(([frontendKey, backendConfig]) => {
        const value = settings[frontendKey as keyof SettingsData];
        return {
          key: backendConfig.key,
          value: value as string | number | boolean,
          type: backendConfig.type,
          category: backendConfig.category,
          isEncrypted: backendConfig.isEncrypted || false,
        };
      });
      
      const response = await setSettings(backendSettings, 'Updated via admin settings page');
      
      if (response.success) {
        setSaveStatus("success");
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        });
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus("error");
      showErrorToast(toast, error, 'Save failed', 'Failed to save settings. Please try again.');
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      // Reload settings from API
      const response = await getSettings();
      if (response.success && response.data?.settings) {
        const backendSettings = response.data.settings;
        const frontendSettings: Partial<SettingsData> = {};
        
        const keyToFrontendKey: Record<string, keyof SettingsData> = {};
        Object.entries(settingKeyMap).forEach(([frontendKey, backendConfig]) => {
          keyToFrontendKey[backendConfig.key] = frontendKey as keyof SettingsData;
        });
        
        backendSettings.forEach((setting) => {
          const frontendKey = keyToFrontendKey[setting.key];
          if (frontendKey) {
            frontendSettings[frontendKey] = setting.value as never;
          }
        });
        
        setSettingsState(prev => ({ ...prev, ...frontendSettings }));
        toast({
          title: 'Success',
          description: 'Settings reset to saved values',
        });
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showErrorToast(toast, error, 'Reset failed', 'Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: string | number | boolean) => {
    setSettingsState(prev => ({ ...prev, [key]: value }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <SettingsSection title="Site Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField label="Site Name" htmlFor="siteName">
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => updateSetting("siteName", e.target.value)}
              placeholder="Enter site name"
            />
          </SettingsField>
          <SettingsField label="Site URL" htmlFor="siteUrl">
            <Input
              id="siteUrl"
              value={settings.siteUrl}
              onChange={(e) => updateSetting("siteUrl", e.target.value)}
              placeholder="https://yoursite.com"
            />
          </SettingsField>
        </div>
        
        <SettingsField label="Site Description" htmlFor="siteDescription">
          <Textarea
            id="siteDescription"
            value={settings.siteDescription}
            onChange={(e) => updateSetting("siteDescription", e.target.value)}
            placeholder="Enter site description"
            rows={3}
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection title="Localization">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TimezoneSelector
            value={settings.timezone}
            onChange={(value) => updateSetting("timezone", value)}
          />
          <LanguageSelector
            value={settings.language}
            onChange={(value) => updateSetting("language", value)}
          />
          <DateFormatSelector
            value={settings.dateFormat}
            onChange={(value) => updateSetting("dateFormat", value)}
          />
        </div>
      </SettingsSection>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="allowRegistration">Allow User Registration</Label>
            <p className="text-sm text-muted-foreground">Allow new users to register accounts</p>
          </div>
          <Switch
            id="allowRegistration"
            checked={settings.allowRegistration}
            onCheckedChange={(checked) => updateSetting("allowRegistration", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
            <p className="text-sm text-muted-foreground">Users must verify their email before accessing the platform</p>
          </div>
          <Switch
            id="requireEmailVerification"
            checked={settings.requireEmailVerification}
            onCheckedChange={(checked) => updateSetting("requireEmailVerification", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="sessionSecurity">Session Security</Label>
            <p className="text-sm text-muted-foreground">Enable secure session management</p>
          </div>
          <Switch
            id="sessionSecurity"
            checked={settings.sessionSecurity}
            onCheckedChange={(checked) => updateSetting("sessionSecurity", checked)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="defaultUserRole">Default User Role</Label>
          <Select value={settings.defaultUserRole} onValueChange={(value) => updateSetting("defaultUserRole", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="support_staff">Support Staff</SelectItem>
              <SelectItem value="event_manager">Event Manager</SelectItem>
              <SelectItem value="content_moderator">Content Moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value))}
            min="5"
            max="1440"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Send notifications via email</p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="smsNotifications">SMS Notifications</Label>
            <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
          </div>
          <Switch
            id="smsNotifications"
            checked={settings.smsNotifications}
            onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="pushNotifications">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">Send browser push notifications</p>
          </div>
          <Switch
            id="pushNotifications"
            checked={settings.pushNotifications}
            onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="notificationEmail">Notification Email</Label>
        <Input
          id="notificationEmail"
          type="email"
          value={settings.notificationEmail}
          onChange={(e) => updateSetting("notificationEmail", e.target.value)}
          placeholder="admin@eventknit.com"
        />
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
          </div>
          <Switch
            id="twoFactorAuth"
            checked={settings.twoFactorAuth}
            onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
            <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
          </div>
          <Switch
            id="requireSpecialChars"
            checked={settings.requireSpecialChars}
            onCheckedChange={(checked) => updateSetting("requireSpecialChars", checked)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
          <Input
            id="passwordMinLength"
            type="number"
            value={settings.passwordMinLength}
            onChange={(e) => updateSetting("passwordMinLength", parseInt(e.target.value))}
            min="6"
            max="32"
          />
        </div>
        <div>
          <Label htmlFor="loginAttempts">Max Login Attempts</Label>
          <Input
            id="loginAttempts"
            type="number"
            value={settings.loginAttempts}
            onChange={(e) => updateSetting("loginAttempts", parseInt(e.target.value))}
            min="3"
            max="10"
          />
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <SettingsSection title="Theme">
        <ThemeSelector
          value={settings.theme as "light" | "dark" | "system"}
          onChange={(value) => updateSetting("theme", value)}
        />
      </SettingsSection>

      <SettingsSection title="Branding">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField label="Primary Color" htmlFor="primaryColor">
            <div className="flex items-center space-x-2">
              <Input
                id="primaryColor"
                type="color"
                value={settings.primaryColor}
                onChange={(e) => updateSetting("primaryColor", e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => updateSetting("primaryColor", e.target.value)}
                placeholder="#3b82f6"
              />
            </div>
          </SettingsField>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField label="Logo URL" htmlFor="logoUrl">
            <Input
              id="logoUrl"
              value={settings.logoUrl}
              onChange={(e) => updateSetting("logoUrl", e.target.value)}
              placeholder="/logo.png"
            />
          </SettingsField>
          <SettingsField label="Favicon URL" htmlFor="faviconUrl">
            <Input
              id="faviconUrl"
              value={settings.faviconUrl}
              onChange={(e) => updateSetting("faviconUrl", e.target.value)}
              placeholder="/favicon.ico"
            />
          </SettingsField>
        </div>
      </SettingsSection>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="smtpHost">SMTP Host</Label>
          <Input
            id="smtpHost"
            value={settings.smtpHost}
            onChange={(e) => updateSetting("smtpHost", e.target.value)}
            placeholder="smtp.gmail.com"
          />
        </div>
        <div>
          <Label htmlFor="smtpPort">SMTP Port</Label>
          <Input
            id="smtpPort"
            type="number"
            value={settings.smtpPort}
            onChange={(e) => updateSetting("smtpPort", parseInt(e.target.value))}
            placeholder="587"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="smtpUsername">SMTP Username</Label>
          <Input
            id="smtpUsername"
            value={settings.smtpUsername}
            onChange={(e) => updateSetting("smtpUsername", e.target.value)}
            placeholder="your-email@gmail.com"
          />
        </div>
        <div>
          <Label htmlFor="smtpPassword">SMTP Password</Label>
          <Input
            id="smtpPassword"
            type="password"
            value={settings.smtpPassword}
            onChange={(e) => updateSetting("smtpPassword", e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
          <p className="text-sm text-muted-foreground">Enable secure connection</p>
        </div>
        <Switch
          id="smtpSecure"
          checked={settings.smtpSecure}
          onCheckedChange={(checked) => updateSetting("smtpSecure", checked)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fromEmail">From Email</Label>
          <Input
            id="fromEmail"
            type="email"
            value={settings.fromEmail}
            onChange={(e) => updateSetting("fromEmail", e.target.value)}
            placeholder="noreply@eventknit.com"
          />
        </div>
        <div>
          <Label htmlFor="fromName">From Name</Label>
          <Input
            id="fromName"
            value={settings.fromName}
            onChange={(e) => updateSetting("fromName", e.target.value)}
            placeholder="EventKnit"
          />
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
          <Input
            id="apiRateLimit"
            type="number"
            value={settings.apiRateLimit}
            onChange={(e) => updateSetting("apiRateLimit", parseInt(e.target.value))}
            min="100"
            max="10000"
          />
        </div>
        <div>
          <Label htmlFor="apiKeyExpiry">API Key Expiry (days)</Label>
          <Input
            id="apiKeyExpiry"
            type="number"
            value={settings.apiKeyExpiry}
            onChange={(e) => updateSetting("apiKeyExpiry", parseInt(e.target.value))}
            min="1"
            max="365"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="webhookUrl">Webhook URL</Label>
        <Input
          id="webhookUrl"
          value={settings.webhookUrl}
          onChange={(e) => updateSetting("webhookUrl", e.target.value)}
          placeholder="https://your-webhook-url.com"
        />
      </div>
    </div>
  );

  const renderMaintenanceSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
          <p className="text-sm text-muted-foreground">Enable maintenance mode to restrict access</p>
        </div>
        <Switch
          id="maintenanceMode"
          checked={settings.maintenanceMode}
          onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
        />
      </div>
      
      <div>
        <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
        <Textarea
          id="maintenanceMessage"
          value={settings.maintenanceMessage}
          onChange={(e) => updateSetting("maintenanceMessage", e.target.value)}
          placeholder="We're currently performing maintenance. Please check back later."
          rows={4}
        />
      </div>
      
      {settings.maintenanceMode && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-warning mr-2" />
            <div>
              <h4 className="font-medium text-warning">Maintenance Mode Active</h4>
              <p className="text-sm text-warning/80">Users will see the maintenance message when accessing the site.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general": return renderGeneralSettings();
      case "users": return renderUserSettings();
      case "notifications": return renderNotificationSettings();
      case "security": return renderSecuritySettings();
      case "appearance": return renderAppearanceSettings();
      case "email": return renderEmailSettings();
      case "api": return renderApiSettings();
      case "maintenance": return renderMaintenanceSettings();
      default: return renderGeneralSettings();
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Configure platform settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleReset} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
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
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-success mr-2" />
              <span className="text-success">Settings saved successfully!</span>
            </div>
          </div>
        )}
        
        {saveStatus === "error" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              <span className="text-destructive">Failed to save settings. Please try again.</span>
            </div>
          </div>
        )}

        {/* Settings Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
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
  );
};

export default AdminSettingsPage;
