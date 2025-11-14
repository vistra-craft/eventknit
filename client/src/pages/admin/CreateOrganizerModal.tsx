import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createUser, type CreateUserData, type UserRole } from "@/lib/admin-api";

interface CreateOrganizerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateOrganizerModal = ({ open, onOpenChange, onSuccess }: CreateOrganizerModalProps) => {
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(false);
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
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error: unknown) {
      console.error("Error creating organizer:", error);
      const message = error instanceof Error ? error.message : "Failed to create organizer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      // The Dialog component will handle the confirmation
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} hasUnsavedChanges={hasUnsavedChanges}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Organizer</DialogTitle>
          <DialogDescription>
            Create a new organizer account. The organizer will be able to create and manage events.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <p className="text-xs text-gray-500">Minimum 8 characters</p>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Organizer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrganizerModal;



