import { useState, useEffect } from "react";
import {
  User,
  Save,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
  Mail,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import * as authApi from "@/lib/auth-api";
import DashboardNavbar from "./DashboardNavbar";
import BackButton from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { UserStatus, UserRole } from "@/types/auth";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { updateProfile } from "@/lib/auth-api";
import { ROLE_LABELS } from "@/constants/roleLabels";

const UserProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    otherName: "",
    email: "",
    phoneNumber: "",
    companyAffiliation: "",
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
          setProfileData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            otherName: userData.otherName || "",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            companyAffiliation: "", // Not in User interface yet
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
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error.message as string)
          : "Failed to change password";
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
  const handleProfileSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setSaveMessage("");

    try {
      const updateData: Partial<authApi.RegisterData> = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        otherName: profileData.otherName || undefined,
        phoneNumber: profileData.phoneNumber || undefined,
        companyAffiliation: profileData.companyAffiliation || undefined,
      };

      const response = await authApi.updateProfile(updateData);

      if (response.success) {
        await refreshProfile();
        setSaveStatus("success");
        setSaveMessage("Profile updated successfully");
      } else {
        throw new Error("Failed to update profile");
      }

      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3000);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error.message as string)
          : "Failed to save profile";
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

  // Called by AvatarUpload after direct Cloudinary upload completes
  const handleAvatarUploadComplete = async (url: string) => {
    await updateProfile({ avatar: url });
    await refreshProfile();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar 
        user={{
          name: `${profileData.firstName} ${profileData.lastName}`,
          email: profileData.email,
          initials: `${profileData.firstName[0] || ""}${profileData.lastName[0] || ""}`.toUpperCase(),
        }}
        activeSection="profile"
      />
      <div className="max-w-4xl mx-auto p-6 pt-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton label="Back" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground mt-1">Manage your personal information</p>
            </div>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus === "success" && (
          <div className="bg-success/5 border border-success rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-success mr-2" />
              <span className="text-success">{saveMessage || "Settings saved successfully!"}</span>
            </div>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="bg-destructive/5 border border-destructive rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              <span className="text-destructive">{saveMessage || "Failed to save settings. Please try again."}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading profile...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Avatar Upload */}
                    <AvatarUpload
                      currentAvatar={user?.avatar || null}
                      onUploadComplete={handleAvatarUploadComplete}
                      onRemove={() => updateProfile({ avatar: '' }).then(() => refreshProfile())}
                    />

                    {/* Form Fields */}
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
                      <Label htmlFor="otherName">Other Name (Optional)</Label>
                      <Input
                        id="otherName"
                        value={profileData.otherName}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, otherName: e.target.value }))
                        }
                        placeholder="Middle name or other names"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        placeholder="Email address cannot be changed"
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Email address cannot be changed for security reasons
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                        }
                        placeholder="Enter phone number"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyAffiliation">Company Affiliation</Label>
                      <Input
                        id="companyAffiliation"
                        value={profileData.companyAffiliation}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, companyAffiliation: e.target.value }))
                        }
                        placeholder="Enter company or institutional affiliation"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleProfileSave} disabled={isSaving}>
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Role</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-sm">
                        {accountInfo.role ? ROLE_LABELS[accountInfo.role as UserRole] : "Loading..."}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Account Status</Label>
                    <div className="mt-1">
                      {accountInfo.status === UserStatus.ACTIVE ? (
                        <Badge className="bg-success/50">Active</Badge>
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
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-sm">Verified</span>
                          {accountInfo.emailVerifiedAt && (
                            <span className="text-xs text-muted-foreground">
                              ({new Date(accountInfo.emailVerifiedAt).toLocaleDateString()})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm">Not Verified</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
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
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Account Created
                    </Label>
                    <div className="mt-1">
                      <span className="text-sm">
                        {accountInfo.createdAt
                          ? new Date(accountInfo.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Last Updated
                    </Label>
                    <div className="mt-1">
                      <span className="text-sm">
                        {accountInfo.updatedAt
                          ? new Date(accountInfo.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }));
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors((prev) => ({ ...prev, currentPassword: "" }));
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
                  <p className="text-sm text-destructive mt-1">
                    {passwordErrors.currentPassword}
                  </p>
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
                      setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }));
                      if (passwordErrors.newPassword) {
                        setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
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
                  <p className="text-sm text-destructive mt-1">
                    {passwordErrors.newPassword}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special
                  character
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
                      setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
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
                  <p className="text-sm text-destructive mt-1">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={handlePasswordChange} disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? "Changing Password..." : "Change Password"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>


        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

