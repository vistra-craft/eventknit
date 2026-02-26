/**
 * User (Attendee) Settings Page
 * Displays settings tabs for: Profile, Verification (KYC), Notifications, Appearance, Security
 * Similar to OrganizerSettingsPage but for attendee accounts
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  User,
  Bell,
  Palette,
  Key,
  Shield,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "@/contexts/ThemeContext";
import * as authApi from "@/lib/auth-api";
import { getVerificationStatus, type VerificationStatus } from "@/lib/verification-api";
import { getUserPreferences, updateUserPreferences } from "@/lib/user-preferences-api";
import KYCVerificationSection from "@/components/kyc/KYCVerificationSection";
import { UserStatus, UserRole } from "@/types/auth";
import { ROLE_LABELS } from "@/constants/roleLabels";

const UserSettingsPage = () => {
  const { user, logout, refreshProfile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { theme: currentTheme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification status
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    otherName: "",
    email: "",
    phoneNumber: "",
  });

  // Account info (read-only)
  const [accountInfo, setAccountInfo] = useState({
    role: "" as UserRole | "",
    status: "" as UserStatus | "",
    isEmailVerified: false,
    emailVerifiedAt: null as string | null,
    lastLoginAt: null as string | null,
    createdAt: "",
    updatedAt: "",
  });

  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Settings state
  const [settings, setSettings] = useState({
    theme: currentTheme,
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true,
    emailNotifications: true,
    eventUpdates: true,
    attendeeRegistrations: false,
    paymentNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
  });

  // Determine active tab from URL
  const getActiveTabFromUrl = useCallback(() => {
    const tab = searchParams.get('tab');
    if (tab) return tab;

    const path = location.pathname;
    if (path.includes('/verification')) return 'verification';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/appearance')) return 'appearance';
    if (path.includes('/security')) return 'security';

    return 'profile';
  }, [searchParams, location.pathname]);

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [getActiveTabFromUrl]);

  // Load user profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [profileRes, verificationRes] = await Promise.all([
          authApi.getProfile(),
          getVerificationStatus(),
        ]);

        if (profileRes.success && profileRes.data?.user) {
          const userData = profileRes.data.user;
          setProfileData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            otherName: userData.otherName || "",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
          });
          setAccountInfo({
            role: userData.role,
            status: userData.status,
            isEmailVerified: userData.isEmailVerified || false,
            emailVerifiedAt: userData.emailVerifiedAt || null,
            lastLoginAt: userData.lastLoginAt || null,
            createdAt: userData.createdAt || "",
            updatedAt: userData.updatedAt || "",
          });
        }

        if (verificationRes.success) {
          setVerificationStatus(verificationRes.data);
        }
      } catch (err: unknown) {
        console.error("Failed to load profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const response = await getUserPreferences();
        if (response.success && response.data?.preferences) {
          const prefs = response.data.preferences;
          setSettings(prev => ({
            ...prev,
            theme: currentTheme,
            twoFactorAuth: prefs.twoFactorAuth ?? false,
            sessionTimeout: prefs.sessionTimeout || 30,
            loginAlerts: prefs.loginAlerts ?? true,
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
      }
    };

    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentTheme]);

  // Handle profile save
  const handleProfileSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveStatus("idle");
    setSaveMessage("");

    try {
      await authApi.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        otherName: profileData.otherName,
        phoneNumber: profileData.phoneNumber,
      });

      setSaveStatus("success");
      setSaveMessage("Profile updated successfully!");
      refreshProfile();

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error: unknown) {
      console.error("Failed to save profile:", error);
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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
      logout();
    } catch (error: unknown) {
      console.error("Failed to change password:", error);
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true);

    try {
      await updateUserPreferences({
        twoFactorAuth: settings.twoFactorAuth,
        sessionTimeout: settings.sessionTimeout,
        loginAlerts: settings.loginAlerts,
        eventNotifications: settings.emailNotifications,
        eventUpdates: settings.eventUpdates,
        registrationNotifications: settings.attendeeRegistrations,
        paymentNotifications: settings.paymentNotifications,
        marketingEmails: settings.marketingEmails,
        weeklyDigest: settings.weeklyDigest,
      });

      setSaveStatus("success");
      setSaveMessage("Preferences saved successfully!");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error: unknown) {
      console.error("Failed to save preferences:", error);
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const renderKYCVerification = () => {
    if (!verificationStatus) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
        </div>
      );
    }

    return (
      <KYCVerificationSection
        verificationStatus={verificationStatus}
        onKYCStatusChange={() => {
          // Refetch verification status when KYC changes
          getVerificationStatus().then((res) => {
            if (res.success) {
              setVerificationStatus(res.data);
            }
          });
        }}
        isAttendeeFlow={true}
      />
    );
  };

  const renderProfileSettings = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Loading profile...</span>
        </div>
      );
    }

    return (
      <>
        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Role</Label>
                <p className="text-foreground font-medium">{accountInfo.role && ROLE_LABELS[accountInfo.role as UserRole] ? ROLE_LABELS[accountInfo.role as UserRole] : accountInfo.role}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Status</Label>
                <Badge className={accountInfo.status === 'ACTIVE' ? 'bg-success' : 'bg-amber-600'}>
                  {accountInfo.status}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Email Verified</Label>
                <div className="flex items-center gap-2">
                  {accountInfo.isEmailVerified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-success text-sm">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive text-sm">No</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Last Login</Label>
                <p className="text-foreground text-sm">
                  {accountInfo.lastLoginAt
                    ? new Date(accountInfo.lastLoginAt).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Member Since</Label>
                <p className="text-foreground text-sm">
                  {new Date(accountInfo.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    placeholder="Enter first name"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    placeholder="Enter last name"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="otherName">Other Name(s)</Label>
                <Input
                  id="otherName"
                  value={profileData.otherName}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, otherName: e.target.value }))
                  }
                  placeholder="Enter other names if applicable"
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter phone number"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <Button
                onClick={handleProfileSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderNotificationSettings = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications" className="font-medium">
                  Event Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about events you're attending
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <Label htmlFor="eventUpdates" className="font-medium">
                  Event Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Updates from organizers about event changes
                </p>
              </div>
              <Switch
                id="eventUpdates"
                checked={settings.eventUpdates}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, eventUpdates: checked }))
                }
              />
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <Label htmlFor="paymentNotifications" className="font-medium">
                  Payment Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Booking and payment confirmations
                </p>
              </div>
              <Switch
                id="paymentNotifications"
                checked={settings.paymentNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, paymentNotifications: checked }))
                }
              />
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <Label htmlFor="weeklyDigest" className="font-medium">
                  Weekly Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly summary of events matching your interests
                </p>
              </div>
              <Switch
                id="weeklyDigest"
                checked={settings.weeklyDigest}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, weeklyDigest: checked }))
                }
              />
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <Label htmlFor="marketingEmails" className="font-medium">
                  Marketing Emails
                </Label>
                <p className="text-sm text-muted-foreground">
                  Updates about new features and offers
                </p>
              </div>
              <Switch
                id="marketingEmails"
                checked={settings.marketingEmails}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, marketingEmails: checked }))
                }
              />
            </div>

            <Button
              onClick={savePreferences}
              disabled={isSaving}
              className="w-full mt-6"
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSecuritySettings = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter current password"
                  disabled={isSaving}
                  className={passwordErrors.currentPassword ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-destructive mt-1">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                  disabled={isSaving}
                  className={passwordErrors.newPassword ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive mt-1">{passwordErrors.newPassword}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                At least 8 characters, including letters and numbers
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm new password"
                  disabled={isSaving}
                  className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactor" className="font-medium">
                  Two-Factor Authentication
                </Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                id="twoFactor"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, twoFactorAuth: checked }))
                }
                disabled
              />
            </div>

            <div className="border-t pt-4">
              <Label htmlFor="sessionTimeout" className="font-medium">
                Session Timeout
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Auto-logout after inactivity (minutes)
              </p>
              <Select
                value={settings.sessionTimeout.toString()}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, sessionTimeout: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <Label htmlFor="loginAlerts" className="font-medium">
                  Login Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified of new login attempts
                </p>
              </div>
              <Switch
                id="loginAlerts"
                checked={settings.loginAlerts}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, loginAlerts: checked }))
                }
              />
            </div>

            <Button
              onClick={savePreferences}
              disabled={isSaving}
              className="w-full mt-6"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAppearanceSettings = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-4 block">Theme</Label>
            <div className="flex gap-4">
              {["light", "dark", "system"].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setTheme(theme as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentTheme === theme
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Choose how the interface looks
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileSettings();
      case "verification":
        return renderKYCVerification();
      case "notifications":
        return renderNotificationSettings();
      case "appearance":
        return renderAppearanceSettings();
      case "security":
        return renderSecuritySettings();
      default:
        return renderProfileSettings();
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "verification", label: "Verification", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Key },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account and preferences</p>

      {/* Save Status Messages */}
      {saveStatus === "success" && (
        <div className="bg-success/5 border border-success rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-success mr-2" />
            <span className="text-success">{saveMessage || "Settings saved successfully!"}</span>
          </div>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="bg-destructive/5 border border-destructive rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-destructive mr-2" />
            <span className="text-destructive">{saveMessage || "Failed to save settings. Please try again."}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettingsPage;
