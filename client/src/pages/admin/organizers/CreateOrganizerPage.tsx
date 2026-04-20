import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { createUser, type CreateUserData, type UserRole } from "@/lib/admin-api";
import { showErrorToast } from "@/lib/utils/error";

const CreateOrganizerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "ORGANIZER" as UserRole,
    organizationName: "",
    businessEmail: "",
    status: "ACTIVE",
  });

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.organizationName || !formData.businessEmail) {
      toast({
        title: "Validation Error",
        description: "Organization name and business email are required for organizers",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await createUser(formData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Organizer created successfully",
        });
        // Reset form
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phoneNumber: "",
          role: "ORGANIZER" as UserRole,
          organizationName: "",
          businessEmail: "",
          status: "ACTIVE",
        });
        // Navigate back to organizers list
        navigate("/admin/users/organizers");
      }
    } catch (error: unknown) {
      console.error("Error creating organizer:", error);
      showErrorToast(toast, error, "Create failed", "Failed to create organizer");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/users/organizers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Create New Organizer</h1>
            <p className="text-sm text-muted-foreground">
              Create a new organizer account. The organizer will be able to create and manage events.
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Organizer Information</CardTitle>
            <CardDescription>
              Fill in the details to create a new organizer account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber || ""}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName || ""}
                  onChange={(e) => handleInputChange("organizationName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email *</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={formData.businessEmail || ""}
                  onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/users/organizers")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Organizer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  );
};

export default CreateOrganizerPage;



