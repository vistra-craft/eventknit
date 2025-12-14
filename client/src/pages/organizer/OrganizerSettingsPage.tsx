import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
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
  Mail,
  Camera,
  X,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import OrganizerLayout from "./OrganizerLayout";
import { useAuth } from "@/hooks/useAuth";
import * as authApi from "@/lib/auth-api";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Badge } from "@/components/ui/badge";
import { UserStatus, UserRole } from "@/types/auth";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import {
  getUserPreferences,
  updateUserPreferences,
  resetPreferences,
  type UserPreferences as UserPreferencesType,
} from "@/lib/user-preferences-api";
import { SettingsSection, ThemeSelector } from "@/components/settings";
import VerificationForm from "@/components/verification/VerificationForm";

interface OrganizerSettingsData {
  // Profile Settings
  firstName: string;
  lastName: string;
  otherName: string;
  email: string;
  phone: string;
  companyAffiliation: string;
  company: string;
  position: string;
  location: string;
  bio: string;
  avatar: string;
  // Organizer-specific
  organizationName: string;
  businessEmail: string;
  kycStatus: string | null;
  
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
  const { user, refreshProfile } = useAuth();
  const { theme: currentTheme, setTheme: setThemeContext } = useTheme();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Determine active tab from URL
  const getActiveTabFromUrl = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab) return tab;
    
    const path = location.pathname;
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/security')) return 'security';
    if (path.includes('/appearance')) return 'appearance';
    if (path.includes('/verification')) return 'verification';
    if (path.includes('/profile')) return 'profile';
    return 'profile'; // default
  }, [location.pathname, location.search]);

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  
  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [getActiveTabFromUrl]);

  // Load user preferences from API
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const response = await getUserPreferences();
        if (response.success && response.data?.preferences) {
          const prefs = response.data.preferences;
          setSettings(prev => ({
            ...prev,
            // Appearance
            theme: prefs.theme || "system",
            dashboardLayout: prefs.dashboardLayout || "spacious",
            showMetrics: prefs.showMetrics ?? true,
            showCharts: prefs.showCharts ?? true,
            // Security
            twoFactorAuth: prefs.twoFactorAuth ?? false,
            sessionTimeout: prefs.sessionTimeout || 30,
            loginAlerts: prefs.loginAlerts ?? true,
            // Notifications
            emailNotifications: prefs.eventNotifications ?? true,
            eventUpdates: prefs.eventUpdates ?? true,
            attendeeRegistrations: prefs.registrationNotifications ?? true,
            paymentNotifications: prefs.paymentNotifications ?? true,
            marketingEmails: prefs.marketingEmails ?? false,
            weeklyDigest: prefs.weeklyDigest ?? true,
          }));

          // Sync theme with ThemeContext
          if (prefs.theme && prefs.theme !== currentTheme) {
            setThemeContext(prefs.theme);
          }
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load preferences. Using default values.",
          variant: "destructive",
        });
      }
    };

    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load user profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await authApi.getProfile();
        if (response.success && response.data?.user) {
          const userData = response.data.user;
          setSettings(prev => ({
            ...prev,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            otherName: userData.otherName || "",
            email: userData.email || "",
            phone: userData.phoneNumber || "",
            companyAffiliation: "", // Not in User interface yet
            company: userData.organizationName || "",
            organizationName: userData.organizationName || "",
            businessEmail: userData.businessEmail || "",
            avatar: userData.avatar || "",
            kycStatus: userData.kycStatus || null,
            // Keep other settings as they are (notifications, appearance, etc.)
          }));
          setAccountInfo({
            role: userData.role,
            status: userData.status,
            isEmailVerified: userData.isEmailVerified || false,
            emailVerifiedAt: userData.emailVerifiedAt || null,
            lastLoginAt: userData.lastLoginAt || null,
            createdAt: userData.createdAt || "",
            updatedAt: userData.updatedAt || "",
            kycStatus: userData.kycStatus || null,
            kycSubmittedAt: null, // Not in User interface yet
            kycApprovedAt: null, // Not in User interface yet
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setSaveStatus("error");
        setSaveMessage("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);
  
  // Account info (read-only)
  const [accountInfo, setAccountInfo] = useState({
    role: "" as UserRole | "",
    status: "" as UserStatus | "",
    isEmailVerified: false,
    emailVerifiedAt: null as string | null,
    lastLoginAt: null as string | null,
    createdAt: "",
    updatedAt: "",
    kycStatus: null as string | null,
    kycSubmittedAt: null as string | null,
    kycApprovedAt: null as string | null,
  });

  // Settings state - initialized with user data
  const [settings, setSettings] = useState<OrganizerSettingsData>({
    firstName: "",
    lastName: "",
    otherName: "",
    email: "",
    phone: "",
    companyAffiliation: "",
    company: "",
    position: "",
    location: "",
    bio: "",
    avatar: "",
    organizationName: "",
    businessEmail: "",
    kycStatus: null,
    emailNotifications: true,
    eventUpdates: true,
    attendeeRegistrations: true,
    paymentNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    notificationEmail: "",
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
    { id: "verification", label: "Verification", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Key },
  ];

  // Validate password change form
  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }
    
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (passwordData.newPassword.length > 128) {
      errors.newPassword = "Password must be no more than 128 characters";
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = "Password must contain at least one letter and one number";
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) {
      setSaveStatus("error");
      setSaveMessage("Please fix the errors in the form");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");
    setSaveMessage("");

    try {
      await authApi.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      setSaveStatus("success");
      setSaveMessage("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error.message as string)
        : 'Failed to change password';
      setSaveStatus("error");
      setSaveMessage(errorMessage);
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile save
  const handleSave = async () => {
    if (activeTab === "security") {
      // Password change is handled separately
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");
    setSaveMessage("");

    try {
      if (activeTab === "profile") {
        // If avatar file is selected, use FormData; otherwise use JSON
        if (avatarFile) {
          const formData = new FormData();
          formData.append('image', avatarFile);
          formData.append('firstName', settings.firstName);
          formData.append('lastName', settings.lastName);
          if (settings.otherName) formData.append('otherName', settings.otherName);
          if (settings.phone) formData.append('phoneNumber', settings.phone);
          if (settings.companyAffiliation) formData.append('companyAffiliation', settings.companyAffiliation);
          if (settings.organizationName) formData.append('organizationName', settings.organizationName);
          if (settings.businessEmail) formData.append('businessEmail', settings.businessEmail);

          const response = await authApi.updateProfile(formData);
          
          if (response.success) {
            // Clear avatar upload state
            setAvatarFile(null);
            setAvatarPreview(null);
            if (avatarInputRef.current) {
              avatarInputRef.current.value = '';
            }
            // Refresh user profile in context
            await refreshProfile();
            setSaveStatus("success");
            setSaveMessage("Profile updated successfully");
          } else {
            throw new Error("Failed to update profile");
          }
        } else {
          // Update profile without avatar
          const profileData: Partial<authApi.RegisterData> = {
            firstName: settings.firstName,
            lastName: settings.lastName,
            otherName: settings.otherName || undefined,
            phoneNumber: settings.phone || undefined,
            companyAffiliation: settings.companyAffiliation || undefined,
            organizationName: settings.organizationName || undefined,
            businessEmail: settings.businessEmail || undefined,
          };

          const response = await authApi.updateProfile(profileData);
          
          if (response.success) {
            // Refresh user profile in context
            await refreshProfile();
            setSaveStatus("success");
            setSaveMessage("Profile updated successfully");
          } else {
            throw new Error("Failed to update profile");
          }
        }
      } else if (activeTab === "appearance" || activeTab === "security") {
        // Save appearance and security preferences
        const preferencesToUpdate: Partial<UserPreferencesType> = {};
        
        if (activeTab === "appearance") {
          preferencesToUpdate.theme = settings.theme;
          preferencesToUpdate.dashboardLayout = settings.dashboardLayout;
          preferencesToUpdate.showMetrics = settings.showMetrics;
          preferencesToUpdate.showCharts = settings.showCharts;
        } else if (activeTab === "security") {
          preferencesToUpdate.twoFactorAuth = settings.twoFactorAuth;
          preferencesToUpdate.sessionTimeout = settings.sessionTimeout;
          preferencesToUpdate.loginAlerts = settings.loginAlerts;
        }

        const response = await updateUserPreferences(preferencesToUpdate);
        
        if (response.success) {
          // Sync theme with ThemeContext if it changed
          if (preferencesToUpdate.theme && preferencesToUpdate.theme !== currentTheme) {
            setThemeContext(preferencesToUpdate.theme);
          }
          setSaveStatus("success");
          setSaveMessage("Settings saved successfully");
        } else {
          throw new Error("Failed to update preferences");
        }
      } else if (activeTab === "notifications") {
        // Save notification preferences
        const preferencesToUpdate: Partial<UserPreferencesType> = {
          eventNotifications: settings.emailNotifications,
          eventUpdates: settings.eventUpdates,
          registrationNotifications: settings.attendeeRegistrations,
          paymentNotifications: settings.paymentNotifications,
          marketingEmails: settings.marketingEmails,
          weeklyDigest: settings.weeklyDigest,
        };

        const response = await updateUserPreferences(preferencesToUpdate);
        
        if (response.success) {
          setSaveStatus("success");
          setSaveMessage("Settings saved successfully");
        } else {
          throw new Error("Failed to update preferences");
        }
      }
      
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error.message as string)
        : 'Failed to save settings';
      setSaveStatus("error");
      setSaveMessage(errorMessage);
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (activeTab === "appearance" || activeTab === "security" || activeTab === "notifications") {
      try {
        setIsSaving(true);
        const response = await resetPreferences();
        if (response.success && response.data?.preferences) {
          const prefs = response.data.preferences;
          setSettings(prev => ({
            ...prev,
            // Appearance
            theme: prefs.theme || "system",
            dashboardLayout: prefs.dashboardLayout || "spacious",
            showMetrics: prefs.showMetrics ?? true,
            showCharts: prefs.showCharts ?? true,
            // Security
            twoFactorAuth: prefs.twoFactorAuth ?? false,
            sessionTimeout: prefs.sessionTimeout || 30,
            loginAlerts: prefs.loginAlerts ?? true,
            // Notifications
            emailNotifications: prefs.eventNotifications ?? true,
            eventUpdates: prefs.eventUpdates ?? true,
            attendeeRegistrations: prefs.registrationNotifications ?? true,
            paymentNotifications: prefs.paymentNotifications ?? true,
            marketingEmails: prefs.marketingEmails ?? false,
            weeklyDigest: prefs.weeklyDigest ?? true,
          }));

          // Sync theme with ThemeContext
          if (prefs.theme && prefs.theme !== currentTheme) {
            setThemeContext(prefs.theme);
          }

          toast({
            title: "Success",
            description: "Preferences reset to defaults",
          });
        }
      } catch (error) {
        console.error("Failed to reset preferences:", error);
        toast({
          title: "Error",
          description: "Failed to reset preferences",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // Reset to default values for profile
      setSettings({
        ...settings,
        theme: "system",
        dashboardLayout: "spacious",
        showMetrics: true,
        showCharts: true,
      });
    }
  };

  const updateSetting = (key: keyof OrganizerSettingsData, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // If theme changed, update ThemeContext immediately
    if (key === "theme" && typeof value === "string") {
      setThemeContext(value as "light" | "dark" | "system");
    }
  };

  // Handle avatar file selection
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read image file",
        variant: "destructive",
      });
      setAvatarFile(null);
      setAvatarPreview(null);
    };
    reader.readAsDataURL(file);
  };

  // Remove avatar selection
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <Avatar
            src={avatarPreview || settings.avatar || undefined}
            name={`${settings.firstName} ${settings.lastName}`}
            alt="Profile"
            size="xl"
            className="h-24 w-24"
          />
          {avatarPreview && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
              aria-label="Remove selected avatar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
            id="avatar-upload"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                {avatarPreview ? 'Change Photo' : 'Upload Photo'}
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            JPG, PNG or GIF. Max size 5MB.
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
          disabled
          placeholder="Email address cannot be changed"
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Email address cannot be changed for security reasons
        </p>
      </div>

      <div>
        <Label htmlFor="otherName">Other Name (Optional)</Label>
        <Input
          id="otherName"
          value={settings.otherName}
          onChange={(e) => updateSetting("otherName", e.target.value)}
          placeholder="Middle name or other names"
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
        <Label htmlFor="companyAffiliation">Company Affiliation</Label>
        <Input
          id="companyAffiliation"
          value={settings.companyAffiliation}
          onChange={(e) => updateSetting("companyAffiliation", e.target.value)}
          placeholder="Enter company or institutional affiliation"
        />
      </div>

      {/* Organizer-Specific Information */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Organizer Information</h3>
        
        <div>
          <Label htmlFor="organizationName">Organization Name</Label>
          <Input
            id="organizationName"
            value={settings.organizationName}
            onChange={(e) => updateSetting("organizationName", e.target.value)}
            placeholder="Enter organization name"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="businessEmail">Business Email</Label>
          <Input
            id="businessEmail"
            type="email"
            value={settings.businessEmail}
            onChange={(e) => updateSetting("businessEmail", e.target.value)}
            placeholder="Enter business email address"
          />
        </div>

        <div className="mt-4">
          <Label>KYC Status</Label>
          <div className="mt-1">
            {accountInfo.kycStatus ? (
              <Badge variant={
                accountInfo.kycStatus === 'APPROVED' ? 'default' :
                accountInfo.kycStatus === 'PENDING' ? 'secondary' :
                'destructive'
              }>
                {accountInfo.kycStatus}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Not submitted</span>
            )}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Role</Label>
            <div className="mt-1">
              <Badge variant="outline" className="text-sm">
                {accountInfo.role ? (
                  ['ORGANIZER', 'ORGANIZER_STAFF', 'ORGANIZER_TELLER'].includes(accountInfo.role) 
                    ? 'Organizer' 
                    : accountInfo.role
                ) : "Loading..."}
              </Badge>
            </div>
          </div>
          <div>
            <Label>Account Status</Label>
            <div className="mt-1">
              {accountInfo.status === UserStatus.ACTIVE ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : accountInfo.status === UserStatus.SUSPENDED ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : accountInfo.status === UserStatus.DEACTIVATED ? (
                <Badge variant="secondary">Deactivated</Badge>
              ) : (
                <span className="text-sm">{accountInfo.status || "Loading..."}</span>
              )}
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Verification
            </Label>
            <div className="mt-1 flex items-center gap-2">
              {accountInfo.isEmailVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Verified</span>
                  {accountInfo.emailVerifiedAt && (
                    <span className="text-xs text-muted-foreground">
                      ({new Date(accountInfo.emailVerifiedAt).toLocaleDateString()})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Not Verified</span>
                </>
              )}
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Last Login
            </Label>
            <div className="mt-1">
              <span className="text-sm">
                {accountInfo.lastLoginAt
                  ? new Date(accountInfo.lastLoginAt).toLocaleString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>
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
      <SettingsSection title="Theme">
        <ThemeSelector
          value={settings.theme}
          onChange={(value) => updateSetting("theme", value)}
        />
      </SettingsSection>

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
              value={passwordData.currentPassword}
              onChange={(e) => {
                setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                if (passwordErrors.currentPassword) {
                  setPasswordErrors(prev => ({ ...prev, currentPassword: "" }));
                }
              }}
              disabled={isSaving}
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
          {passwordErrors.currentPassword && (
            <p className="text-sm text-destructive mt-1">{passwordErrors.currentPassword}</p>
          )}
        </div>

        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={passwordData.newPassword}
              onChange={(e) => {
                setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                if (passwordErrors.newPassword) {
                  setPasswordErrors(prev => ({ ...prev, newPassword: "" }));
                }
              }}
              disabled={isSaving}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {passwordErrors.newPassword && (
            <p className="text-sm text-destructive mt-1">{passwordErrors.newPassword}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={passwordData.confirmPassword}
              onChange={(e) => {
                setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                if (passwordErrors.confirmPassword) {
                  setPasswordErrors(prev => ({ ...prev, confirmPassword: "" }));
                }
              }}
              disabled={isSaving}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {passwordErrors.confirmPassword && (
            <p className="text-sm text-destructive mt-1">{passwordErrors.confirmPassword}</p>
          )}
        </div>

        <Button 
          variant="outline" 
          onClick={handlePasswordChange}
          disabled={isSaving}
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Key className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Changing Password..." : "Change Password"}
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

  const renderVerificationSettings = () => {
    // Check if user came from event creation page (via location state)
    const redirectPath = (location.state as { redirectAfterVerification?: string } | null)?.redirectAfterVerification;
    return <VerificationForm redirectAfterBusinessVerification={redirectPath} />;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return renderProfileSettings();
      case "verification": return renderVerificationSettings();
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
            {activeTab !== "security" && (
              <>
                <Button variant="outline" onClick={handleReset}>
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
              </>
            )}
          </div>
        </div>

        {/* Save Status */}
        {saveStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">{saveMessage || "Settings saved successfully!"}</span>
            </div>
          </div>
        )}
        
        {saveStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{saveMessage || "Failed to save settings. Please try again."}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading profile...</span>
                  </div>
                ) : (
                  renderTabContent()
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          // Update URL without navigation
                          const url = new URL(window.location.href);
                          url.searchParams.set('tab', tab.id);
                          window.history.pushState({}, '', url);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-muted-foreground hover:bg-accent-coral hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
            
            {activeTab === "profile" && <RoleSwitcher />}
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default OrganizerSettingsPage;
