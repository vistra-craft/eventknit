import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Shield,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminLayout from "./AdminLayout";
import {
  getUserById,
  updateUser,
  getOrganizerProfile,
  updateOrganizerProfile,
  getEmergencyContact,
  updateEmergencyContact,
  type User as ApiUser,
  type OrganizerProfile,
  type EmergencyContact
} from "@/lib/admin-api";

interface OrganizerDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  status: "verified" | "pending" | "suspended" | "rejected";
  verificationDate?: string;
  totalEvents: number;
  totalRevenue: number;
  rating: number;
  joinDate: string;
  lastActive: string;
  location: string;
  website?: string;
  description?: string;
  avatar?: string;
  businessLicense?: string;
  taxId?: string;
  bankAccount?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  supportTickets?: Array<{
    id: string;
    subject: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    priority: "low" | "medium" | "high" | "urgent";
    createdAt: string;
    updatedAt: string;
  }>;
}

const OrganizerEditPage = () => {
  const { organizerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userData, setUserData] = useState<ApiUser | null>(null);
  const [organizerProfileData, setOrganizerProfileData] = useState<OrganizerProfile | null>(null);
  const [emergencyContactData, setEmergencyContactData] = useState<EmergencyContact | null>(null);

  // Organizer data built from API response + defaults for extended fields
  const organizerData: OrganizerDetails = {
    id: userData?.id || organizerId || "",
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    email: userData?.email || "",
    phone: userData?.phoneNumber || undefined,
    company: userData?.organizationName || "N/A",
    status: userData?.status === "ACTIVE" ? "verified" : userData?.status === "SUSPENDED" ? "suspended" : "pending",
    verificationDate: userData?.isEmailVerified ? userData?.createdAt : undefined,
    totalEvents: 0, // Extended field not in API
    totalRevenue: 0, // Extended field not in API
    rating: 0, // Extended field not in API
    joinDate: userData?.createdAt || new Date().toISOString(),
    lastActive: userData?.updatedAt || new Date().toISOString(),
    location: "N/A", // Extended field not in API
    website: undefined, // Extended field not in API
    description: undefined, // Extended field not in API
    avatar: undefined, // Extended field not in API
    businessLicense: undefined, // Extended field not in API
    taxId: undefined, // Extended field not in API
    bankAccount: undefined, // Extended field not in API
    emergencyContact: undefined,
    supportTickets: []
  };

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!organizerId) {
        setError("Organizer ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getUserById(organizerId);
        if (response.success && response.data?.user) {
          setUserData(response.data.user);

          // Fetch extended profile data
          try {
            const profileResponse = await getOrganizerProfile(organizerId);
            if (profileResponse.success && profileResponse.data?.organizerProfile) {
              setOrganizerProfileData(profileResponse.data.organizerProfile);
            }
          } catch (profileErr) {
            console.log("No organizer profile found, using defaults");
          }

          try {
            const contactResponse = await getEmergencyContact(organizerId);
            if (contactResponse.success && contactResponse.data?.emergencyContact) {
              setEmergencyContactData(contactResponse.data.emergencyContact);
            }
          } catch (contactErr) {
            console.log("No emergency contact found");
          }
        } else {
          setError("Organizer not found");
        }
      } catch (err) {
        console.error("Error fetching organizer data:", err);
        setError("Failed to load organizer details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [organizerId]);

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    location: string;
    website: string;
    description: string;
    businessLicense: string;
    taxId: string;
    bankAccount: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    status: "verified" | "pending" | "suspended" | "rejected";
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    location: "",
    website: "",
    description: "",
    businessLicense: "",
    taxId: "",
    bankAccount: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    status: "pending"
  });

  // Update formData when userData and extended profiles load
  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phoneNumber || "",
        company: userData.organizationName || "",
        status: userData.status === "ACTIVE" ? "verified" : userData.status === "SUSPENDED" ? "suspended" : "pending",
        // Extended profile fields
        location: organizerProfileData?.location || "",
        website: organizerProfileData?.website || "",
        description: organizerProfileData?.description || "",
        businessLicense: organizerProfileData?.businessLicense || "",
        taxId: organizerProfileData?.taxId || "",
        bankAccount: organizerProfileData?.bankAccountLast4 || "",
        // Emergency contact fields
        emergencyContactName: emergencyContactData?.name || "",
        emergencyContactPhone: emergencyContactData?.phone || "",
        emergencyContactRelationship: emergencyContactData?.relationship || "",
      }));
    }
  }, [userData, organizerProfileData, emergencyContactData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!organizerId) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Map form status back to API status
      const apiStatus = formData.status === "verified" ? "ACTIVE" : formData.status === "suspended" ? "SUSPENDED" : "DEACTIVATED";

      // Update basic user data
      const response = await updateUser(organizerId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phone || undefined,
        organizationName: formData.company || undefined,
        status: apiStatus as "ACTIVE" | "SUSPENDED" | "DEACTIVATED",
      });

      if (!response.success) {
        throw new Error("Failed to update organizer");
      }

      // Update local userData to reflect changes
      if (response.data?.user) {
        setUserData(response.data.user);
      }

      // Update organizer profile (extended data)
      try {
        const profileResponse = await updateOrganizerProfile(organizerId, {
          location: formData.location || undefined,
          website: formData.website || undefined,
          description: formData.description || undefined,
          businessLicense: formData.businessLicense || undefined,
          taxId: formData.taxId || undefined,
          bankAccountLast4: formData.bankAccount || undefined,
        });

        if (profileResponse.success && profileResponse.data?.organizerProfile) {
          setOrganizerProfileData(profileResponse.data.organizerProfile);
        }
      } catch (profileErr) {
        console.error("Error updating organizer profile:", profileErr);
      }

      // Update emergency contact if provided
      if (formData.emergencyContactName && formData.emergencyContactPhone) {
        try {
          const contactResponse = await updateEmergencyContact(organizerId, {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship || "Other",
          });

          if (contactResponse.success && contactResponse.data?.emergencyContact) {
            setEmergencyContactData(contactResponse.data.emergencyContact);
          }
        } catch (contactErr) {
          console.error("Error updating emergency contact:", contactErr);
        }
      }

      setSuccess("Organizer updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating organizer:", err);
      setError(err instanceof Error ? err.message : "Failed to update organizer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/admin/users/organizers/${organizerId}`);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      suspended: "bg-red-100 text-red-800 border-red-200",
      rejected: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading organizer details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state (only if no userData at all)
  if (error && !userData) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizers
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizer
            </Button>
            <div>
              <h1 className="text-base font-semibold text-foreground">Edit Organizer</h1>
              <p className="text-gray-600">{organizerData.firstName} {organizerData.lastName} • {organizerData.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || loading}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Current Status */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Current Status:</span>
                <Badge className={`text-xs ${getStatusBadge(organizerData.status)}`}>
                  {organizerData.status}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="business">Business Info</TabsTrigger>
            <TabsTrigger value="contact">Emergency Contact</TabsTrigger>
            <TabsTrigger value="status">Status & Verification</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="Enter website URL"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter organizer description"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Information Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessLicense">Business License</Label>
                    <Input
                      id="businessLicense"
                      value={formData.businessLicense}
                      onChange={(e) => handleInputChange("businessLicense", e.target.value)}
                      placeholder="Enter business license number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange("taxId", e.target.value)}
                      placeholder="Enter tax ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Bank Account</Label>
                    <Input
                      id="bankAccount"
                      value={formData.bankAccount}
                      onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                      placeholder="Enter bank account (last 4 digits)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Select
                      value={formData.emergencyContactRelationship}
                      onValueChange={(value) => handleInputChange("emergencyContactRelationship", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="colleague">Colleague</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status & Verification Tab */}
          <TabsContent value="status" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Status & Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Organizer Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Status Change Notice</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Changing the organizer status will affect their ability to create and manage events. 
                        Please ensure you have a valid reason for the status change.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Join Date</Label>
                    <p className="text-sm text-gray-600 mt-1">{new Date(organizerData.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Verification Date</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {organizerData.verificationDate ? new Date(organizerData.verificationDate).toLocaleDateString() : "Not verified"}
                    </p>
                  </div>
                  <div>
                    <Label>Total Events</Label>
                    <p className="text-sm text-gray-600 mt-1">{organizerData.totalEvents}</p>
                  </div>
                  <div>
                    <Label>Total Revenue</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(organizerData.totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || loading}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrganizerEditPage;
