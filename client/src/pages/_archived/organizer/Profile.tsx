import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ButtonLoader } from "@/components/ui/loader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { profileUpdateSchema, type ProfileUpdateData } from "@/lib/validations/profile";

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form with React Hook Form + Zod
  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      otherName: "",
      phoneNumber: "",
      companyAffiliation: "",
      organizationName: "",
      businessEmail: "",
    },
  });

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        otherName: user.otherName || "",
        phoneNumber: user.phoneNumber || "",
        companyAffiliation: user.companyAffiliation || "",
        organizationName: user.organizationName || "",
        businessEmail: user.businessEmail || "",
      });
    }
  }, [user, form]);

  const handleCancel = () => {
    // Reset to original user data
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        otherName: user.otherName || "",
        phoneNumber: user.phoneNumber || "",
        companyAffiliation: user.companyAffiliation || "",
        organizationName: user.organizationName || "",
        businessEmail: user.businessEmail || "",
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const onSubmit = async (data: ProfileUpdateData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        otherName: data.otherName || undefined,
        phoneNumber: data.phoneNumber || undefined,
        companyAffiliation: data.companyAffiliation || undefined,
        organizationName: data.organizationName || undefined,
        businessEmail: data.businessEmail || undefined,
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
                <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
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
          <Alert className="border-success bg-success/5">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">{success}</AlertDescription>
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
                name={user ? `${user.firstName} ${user.lastName}` : undefined}
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Personal Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="otherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} placeholder="Optional" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel htmlFor="email">Email Address</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled={true}
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            disabled={!isEditing}
                            className="pl-10"
                            placeholder="+1 (555) 123-4567"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="companyAffiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company/Affiliation</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="Your company or organization"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="Your organization name (for organizers)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            disabled={!isEditing}
                            className="pl-10"
                            placeholder="business@company.com"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>

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
                <span className={`ml-2 font-medium ${user?.isEmailVerified ? 'text-success' : 'text-orange-600'}`}>
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
