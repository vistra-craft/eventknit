import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Save,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Shield,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import * as authApi from "@/lib/auth-api";
import AdminLayout from "./AdminLayout";
import RoleSwitcher from "@/components/RoleSwitcher";
import { UserRole, UserStatus } from "@/types/auth";

const AdminProfilePage = () => {
  const navigate = useNavigate();
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

  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

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
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(passwordData.newPassword)
    ) {
      errors.newPassword =
        "Password must contain uppercase, lowercase, number, and special character";
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


  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return <Badge className="bg-green-500">Active</Badge>;
      case UserStatus.SUSPENDED:
        return <Badge variant="destructive">Suspended</Badge>;
      case UserStatus.DEACTIVATED:
        return <Badge variant="secondary">Deactivated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      [UserRole.SUPERADMIN]: "Super Admin",
      [UserRole.ADMIN_STAFF]: "Admin Staff",
      [UserRole.MARKETER]: "Marketer",
      [UserRole.SUPPORT]: "Support",
      [UserRole.TELLER]: "Teller",
      [UserRole.ORGANIZER]: "Organizer",
      [UserRole.ORGANIZER_STAFF]: "Organizer Staff",
      [UserRole.ORGANIZER_TELLER]: "Organizer Teller",
      [UserRole.ATTENDEE]: "Attendee",
    };
    return roleLabels[role] || role;
  };

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-base font-semibold text-foreground">Profile</h1>
              <p className="text-muted-foreground mt-1">Manage your personal information and account settings</p>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
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
                    {/* Profile Picture */}
                    <div className="flex items-center space-x-6">
                      <Avatar
                        src="/api/placeholder/96/96"
                        name={profileData.firstName && profileData.lastName ? `${profileData.firstName} ${profileData.lastName}` : undefined}
                        alt="Profile"
                        size="xl"
                        className="h-24 w-24"
                      />
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" disabled>
                          Change Photo
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG or GIF. Max size 2MB. (Coming soon)
                        </p>
                      </div>
                    </div>

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
                        {accountInfo.role ? getRoleLabel(accountInfo.role) : "Loading..."}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Account Status</Label>
                    <div className="mt-1">
                      {accountInfo.status ? getStatusBadge(accountInfo.status) : "Loading..."}
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
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Verified</span>
                          {accountInfo.emailVerifiedAt && (
                            <span className="text-xs text-muted-foreground">
                              ({new Date(accountInfo.emailVerifiedAt).toLocaleDateString()})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
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

          {/* Sidebar */}
          <div className="space-y-6">
            <RoleSwitcher />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfilePage;

