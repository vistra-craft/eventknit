import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ButtonLoader } from "@/components/ui/loader";
import OrganizerLayout from "./OrganizerLayout";
import {
  User,
  Mail,
  Phone,
  Building2,
  Camera,
  Save,
  Edit3,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/auth-api";

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    otherName: "",
    email: "",
    phone: "",
    company: "",
    organizationName: "",
    businessEmail: "",
  });

  // Load user data on mount and when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        otherName: user.otherName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        company: user.companyAffiliation || "",
        organizationName: user.organizationName || "",
        businessEmail: user.businessEmail || "",
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    // Reset to original user data
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        otherName: user.otherName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        company: user.companyAffiliation || "",
        organizationName: user.organizationName || "",
        businessEmail: user.businessEmail || "",
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        otherName: profileData.otherName || undefined,
        phoneNumber: profileData.phone || undefined,
        companyAffiliation: profileData.company || undefined,
        organizationName: profileData.organizationName || undefined,
        businessEmail: profileData.businessEmail || undefined,
      });

      if (response.success) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        // Refresh user data in auth context
        if (refreshProfile) {
          await refreshProfile();
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await updateProfile(formData);

      if (response.success) {
        setSuccess("Profile picture updated!");
        if (refreshProfile) {
          await refreshProfile();
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error("Failed to update profile picture");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile picture");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrganizerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-page-title">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <ButtonLoader />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Avatar
                src={user?.avatar || undefined}
                name={profileData.firstName && profileData.lastName ? `${profileData.firstName} ${profileData.lastName}` : undefined}
                alt="Profile"
                size="xl"
                className="h-24 w-24"
              />
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? (
                    <ButtonLoader />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Change Photo
                </Button>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherName">Other Name</Label>
                <Input
                  id="otherName"
                  value={profileData.otherName}
                  onChange={(e) => handleInputChange('otherName', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled={true}
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company">Company/Affiliation</Label>
              <Input
                id="company"
                value={profileData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                disabled={!isEditing}
                placeholder="Your company or organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                value={profileData.organizationName}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                disabled={!isEditing}
                placeholder="Your organization name (for organizers)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="businessEmail"
                  type="email"
                  value={profileData.businessEmail}
                  onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="business@company.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Role:</span>
                <span className="ml-2 font-medium capitalize">{user?.role?.toLowerCase().replace('_', ' ') || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-medium capitalize">{user?.status?.toLowerCase() || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email Verified:</span>
                <span className={`ml-2 font-medium ${user?.isEmailVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {user?.isEmailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Member Since:</span>
                <span className="ml-2 font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  );
};

export default Profile;
