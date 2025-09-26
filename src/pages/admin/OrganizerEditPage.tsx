import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  CreditCard,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "./AdminLayout";

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

  // Mock organizer data - in real app, this would be fetched from API
  const [organizerData, setOrganizerData] = useState<OrganizerDetails>({
    id: organizerId || "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@techevents.com",
    phone: "+1 (555) 123-4567",
    company: "Tech Events Inc.",
    status: "verified",
    verificationDate: "2023-01-15",
    totalEvents: 45,
    totalRevenue: 125000,
    rating: 4.8,
    joinDate: "2022-11-20",
    lastActive: "2024-02-15T10:30:00Z",
    location: "San Francisco, CA",
    website: "https://techevents.com",
    description: "Leading technology event organizer with 10+ years of experience in hosting conferences, workshops, and networking events.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    businessLicense: "BL-2023-001234",
    taxId: "12-3456789",
    bankAccount: "****1234",
    emergencyContact: {
      name: "John Johnson",
      phone: "+1 (555) 987-6543",
      relationship: "Spouse"
    },
    supportTickets: [
      {
        id: "TICKET-001",
        subject: "Payment processing issue",
        status: "resolved",
        priority: "high",
        createdAt: "2024-02-10T09:00:00Z",
        updatedAt: "2024-02-12T14:30:00Z"
      },
      {
        id: "TICKET-002",
        subject: "Event promotion assistance",
        status: "in_progress",
        priority: "medium",
        createdAt: "2024-02-14T11:15:00Z",
        updatedAt: "2024-02-15T08:20:00Z"
      }
    ]
  });

  const [formData, setFormData] = useState({
    firstName: organizerData.firstName,
    lastName: organizerData.lastName,
    email: organizerData.email,
    phone: organizerData.phone || "",
    company: organizerData.company,
    location: organizerData.location,
    website: organizerData.website || "",
    description: organizerData.description || "",
    businessLicense: organizerData.businessLicense || "",
    taxId: organizerData.taxId || "",
    bankAccount: organizerData.bankAccount || "",
    emergencyContactName: organizerData.emergencyContact?.name || "",
    emergencyContactPhone: organizerData.emergencyContact?.phone || "",
    emergencyContactRelationship: organizerData.emergencyContact?.relationship || "",
    status: organizerData.status
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the organizer data
      setOrganizerData(prev => ({
        ...prev,
        ...formData,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        }
      }));

      console.log("Organizer updated:", formData);
      // TODO: Show success message
    } catch (error) {
      console.error("Error updating organizer:", error);
      // TODO: Show error message
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizer
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Organizer</h1>
              <p className="text-gray-600">{organizerData.firstName} {organizerData.lastName} • {organizerData.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
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
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrganizerEditPage;
