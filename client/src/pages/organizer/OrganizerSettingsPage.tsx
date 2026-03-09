import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import * as authApi from "@/lib/auth-api";
import { Badge } from "@/components/ui/badge";
import { UserStatus, UserRole } from "@/types/auth";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import {
  getUserPreferences,
  updateUserPreferences,
  resetPreferences,
  type UserPreferences as UserPreferencesType,
} from "@/lib/user-preferences-api";
import { SettingsSection, ThemeSelector } from "@/components/settings";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { getMyOrganizerProfile, updateMyOrganizerProfile } from "@/lib/organizer-profile-api";

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
];

const getTextLength = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length;
};

interface OrganizerSettingsData {
  // Profile Settings
  firstName: string;
  lastName: string;
  otherName: string;
  email: string;
  phone: string;
  companyAffiliation: string;
  avatar: string;
  // Organizer-specific
  organizationName: string;
  businessEmail: string;
  kycStatus: string | null;
  // Extended organizer profile
  description: string;
  website: string;
  location: string;
  socialLinks: Record<string, string>;
  
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
  
  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

const OrganizerSettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshProfile, logout } = useAuth();

  const isOrganizerUser = user ? [
    UserRole.ORGANIZER,
    UserRole.ORGANIZER_STAFF,
    UserRole.ORGANIZER_TELLER,
  ].includes(user.role) : false;
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
            // Appearance — use current ThemeContext value, not API value.
            // ThemeContext (backed by localStorage) is the active source of truth.
            // Only explicit user actions (ThemeSelector) should change the theme.
            theme: currentTheme,
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
            companyAffiliation: userData.companyAffiliation || "",
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

  // Load organizer profile (description, website, socialLinks)
  useEffect(() => {
    const loadOrganizerProfile = async () => {
      try {
        const response = await getMyOrganizerProfile();
        if (response.success && response.data?.organizerProfile) {
          const profile = response.data.organizerProfile;
          setSettings(prev => ({
            ...prev,
            description: profile.description || '',
            website: profile.website || '',
            location: profile.location || '',
            socialLinks: (profile.socialLinks as Record<string, string>) || {},
          }));
        }
      } catch (error) {
        console.error('Failed to load organizer profile:', error);
      }
    };
    if (user && isOrganizerUser) loadOrganizerProfile();
  }, [user, isOrganizerUser]);

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
    avatar: "",
    organizationName: "",
    businessEmail: "",
    kycStatus: null,
    description: "",
    website: "",
    location: "",
    socialLinks: {},
    emailNotifications: true,
    eventUpdates: true,
    attendeeRegistrations: true,
    paymentNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    notificationEmail: "",
    theme: "system",
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true,
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    ...(isOrganizerUser ? [{ id: "verification", label: "Verification", icon: Shield }] : []),
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
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      toast({
        title: "Password changed",
        description: "Signing you out — please log back in with your new password.",
      });
      // Force re-login so the user can confirm the new password works
      // and all sessions are cleanly terminated (server already revoked refresh tokens)
      setTimeout(() => {
        logout();
      }, 2000);
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
        // 1. Save user profile (auth fields)
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

        if (!response.success) {
          throw new Error("Failed to update profile");
        }

        // 2. Save organizer profile (description, website, location, socialLinks) — organizer only
        if (isOrganizerUser) {
          const filteredSocialLinks = Object.fromEntries(
            Object.entries(settings.socialLinks).filter(([, v]) => v && v.trim())
          );
          await updateMyOrganizerProfile({
            description: settings.description || undefined,
            website: settings.website || undefined,
            location: settings.location || undefined,
            socialLinks: Object.keys(filteredSocialLinks).length > 0 ? filteredSocialLinks : undefined,
          });
        }

        // 3. Refresh auth context
        await refreshProfile();
        setSaveStatus("success");
        setSaveMessage("Profile updated successfully");
        toast({
          title: "Success",
          description: "Your profile has been updated successfully.",
        });
      } else if (activeTab === "appearance" || activeTab === "security") {
        // Save appearance and security preferences
        const preferencesToUpdate: Partial<UserPreferencesType> = {};
        
        if (activeTab === "appearance") {
          preferencesToUpdate.theme = settings.theme;
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
          toast({
            title: "Success",
            description: activeTab === "appearance" ? "Appearance settings saved." : "Security settings saved.",
          });
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
          toast({
            title: "Success",
            description: "Notification preferences saved successfully.",
          });
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
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
    }
  };

  const updateSetting = (key: keyof OrganizerSettingsData, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // If theme changed, update ThemeContext immediately
    if (key === "theme" && typeof value === "string") {
      setThemeContext(value as "light" | "dark" | "system");
    }
  };

  // Called by AvatarUpload after direct Cloudinary upload
  const handleAvatarUploadComplete = async (url: string) => {
    await authApi.updateProfile({ avatar: url });
    await refreshProfile();
  };

  const renderProfileSettings = () => {
    const entityType = user?.organizerEntityType;
    const isIndividual = !entityType || entityType === 'INDIVIDUAL';

    const formatEntityType = (type: string) =>
      type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
    <div className="space-y-6">
      {/* Avatar / Logo Upload */}
      <AvatarUpload
        currentAvatar={settings.avatar || null}
        onUploadComplete={handleAvatarUploadComplete}
        onRemove={() => authApi.updateProfile({ avatar: '' }).then(() => refreshProfile())}
        isLogo={!isIndividual}
        label={isIndividual ? "Profile Photo" : "Company / Organization Logo"}
        hint={
          isIndividual
            ? "Your photo will be displayed on your profile and in event communications."
            : "Your logo will appear on all your event pages and public profile. Square format recommended."
        }
      />

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

      {isIndividual && (
        <div>
          <Label htmlFor="companyAffiliation">Company Affiliation <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
          <Input
            id="companyAffiliation"
            value={settings.companyAffiliation}
            onChange={(e) => updateSetting("companyAffiliation", e.target.value)}
            placeholder="Your employer or institutional affiliation"
          />
          <p className="text-xs text-muted-foreground mt-1">Your day-job employer or affiliated institution, if different from your organizer name.</p>
        </div>
      )}

      {/* Organizer Identity, Public Profile, KYC Status — organizer roles only */}
      {isOrganizerUser && <><div className="border-t pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-section-header">Organizer Identity</h3>
          {entityType && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {formatEntityType(entityType)}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor="organizationName">
            {isIndividual ? "Organizer / Brand Name" : "Legal / Registered Name"}
          </Label>
          <Input
            id="organizationName"
            value={settings.organizationName}
            onChange={(e) => updateSetting("organizationName", e.target.value)}
            placeholder={isIndividual ? "Your organizer or brand name" : "Your organization's registered name"}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isIndividual
              ? "This is how attendees will identify you on event pages."
              : "Must match your KYC documents. This is your organization's official registered name."}
          </p>
        </div>

        <div className="mt-4">
          <Label htmlFor="businessEmail">Business Email <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
          <Input
            id="businessEmail"
            type="email"
            value={settings.businessEmail}
            onChange={(e) => updateSetting("businessEmail", e.target.value)}
            placeholder="contact@yourorganization.com"
          />
          <p className="text-xs text-muted-foreground mt-1">Public-facing contact email for attendees. Defaults to your login email if left blank.</p>
        </div>

        <div className="mt-4">
          <Label htmlFor="location">Location <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
          <Input
            id="location"
            value={settings.location}
            onChange={(e) => updateSetting("location", e.target.value)}
            placeholder="Nairobi, Kenya"
          />
        </div>
      </div>

      {/* Public Profile */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-section-header mb-4">Public Profile</h3>

        <div>
          <Label htmlFor="description">About Your Organization</Label>
          <div className="mt-1">
            <RichTextEditor
              content={settings.description}
              onChange={(value) => updateSetting("description", value)}
              placeholder="Tell attendees about your organization, what events you host, and what makes them special..."
              minHeight="120px"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getTextLength(settings.description)}/2000 characters. This will appear on your event pages.
          </p>
        </div>

        <div className="mt-4">
          <Label htmlFor="website">Website</Label>
          <div className="relative mt-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="website"
              type="url"
              value={settings.website}
              onChange={(e) => updateSetting("website", e.target.value)}
              placeholder="https://yourwebsite.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="mb-3 block">Social Media Links</Label>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map(platform => (
              <div key={platform.key} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24 shrink-0">{platform.label}</span>
                <Input
                  value={settings.socialLinks[platform.key] || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    socialLinks: {
                      ...prev.socialLinks,
                      [platform.key]: e.target.value,
                      },
                    }))}
                    placeholder={platform.placeholder}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* KYC Status */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-section-header mb-4">Verification</h3>
        <div>
          <Label>KYC Status</Label>
          <div className="mt-1 flex items-center justify-between">
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
            {!accountInfo.kycStatus && (
              <Button 
                size="sm"
                onClick={() => {
                  setActiveTab('verification');
                  // Update URL without navigation
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'verification');
                  window.history.pushState({}, '', url);
                }}
              >
                Submit KYC
              </Button>
            )}
          </div>
        </div>
      </div></>}

      {/* Account Information */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-section-header mb-4">Account Information</h3>
        
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
                <Badge className="bg-success-light text-success">Active</Badge>
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
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Verified</span>
                  {accountInfo.emailVerifiedAt && (
                    <span className="text-xs text-muted-foreground">
                      ({new Date(accountInfo.emailVerifiedAt).toLocaleDateString()})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
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

      {/* Save Button at Bottom */}
      <div className="border-t pt-6 mt-6 flex justify-end">
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
  );
  };

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-section-header">Email Notifications</h3>
        
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
        <p className="text-sm text-muted-foreground mt-2">
          Choose your preferred color theme. System theme will match your device settings.
        </p>
      </SettingsSection>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-section-header">Account Security</h3>
        
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
        <h3 className="text-section-header">Password</h3>
        
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
            Must be at least 8 characters with at least one letter and one number
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
          className="bg-foreground text-background hover:bg-foreground/90"
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
        <h3 className="text-section-header">Session Settings</h3>
        
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

  // Handle verification tab navigation with useEffect (not during render to avoid navigation conflicts with back button)
  useEffect(() => {
    if (activeTab === 'verification') {
      const redirectPath = (location.state as { redirectAfterVerification?: string } | null)?.redirectAfterVerification;
      navigate('/organizer/verification', {
        state: { redirectAfterVerification: redirectPath || '/organizer/settings?tab=verification' },
        replace: false
      });
    }
  }, [activeTab, navigate, location.state]);

  const renderVerificationSettings = () => {
    // Return loading state while useEffect handles navigation
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Redirecting to verification...</p>
        </div>
      </div>
    );
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Settings</h1>
            <p className="text-page-subtitle">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {activeTab === "security" && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Save Status */}
        {saveStatus === "success" && (
          <div className="bg-success-light border border-success/20 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-success mr-2" />
              <span className="text-success">{saveMessage || "Settings saved successfully!"}</span>
            </div>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              <span className="text-destructive">{saveMessage || "Failed to save settings. Please try again."}</span>
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
                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
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
          </div>
        </div>
      </div>
  );
};

export default OrganizerSettingsPage;
