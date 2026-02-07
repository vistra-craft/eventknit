import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Shield, Building2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  getRoleSwitchOptions,
  becomeOrganizer,
  becomeAttendee,
  type RoleSwitchOptions,
} from "@/lib/user-dashboard-api";

interface RoleSwitcherProps {
  className?: string;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ className }) => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [options, setOptions] = useState<RoleSwitchOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState<string | null>(null);

  // Organizer form
  const [organizationName, setOrganizationName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");

  // Fetch role switch options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRoleSwitchOptions();
        if (response.success && response.data) {
          setOptions(response.data);
        } else {
          setError(response.message || "Failed to load role options");
        }
      } catch (err) {
        setError("Failed to load role options");
        console.error("Error fetching role options:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOptions();
    }
  }, [user]);

  // Pre-fill with existing data if available
  useEffect(() => {
    if (user && options?.hasOrganizerHistory) {
      setOrganizationName((user as { organizationName?: string }).organizationName || "");
      setBusinessEmail((user as { businessEmail?: string }).businessEmail || user.email || "");
    }
  }, [user, options]);

  const getRoleIcon = (role: string) => {
    if (role === UserRole.ATTENDEE) return <Users className="h-4 w-4" />;
    if (role === UserRole.ORGANIZER) return <Building2 className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getRoleLabel = (role: string): string => {
    if (role === UserRole.ATTENDEE) return "Attendee";
    if (role === UserRole.ORGANIZER) return "Organizer";
    return role;
  };

  const handleBecomeOrganizer = async () => {
    if (!organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    try {
      setSwitching(true);
      setError(null);

      const response = await becomeOrganizer({
        organizationName: organizationName.trim(),
        businessEmail: businessEmail.trim() || undefined,
      });

      if (response.success) {
        setSwitchSuccess("You are now an Organizer! Redirecting to organizer onboarding...");
        setShowOrganizerModal(false);

        // Refresh user profile to get updated role
        await refreshProfile();

        // Redirect to organizer onboarding after a short delay
        setTimeout(() => {
          navigate("/organizer/onboarding");
        }, 1500);
      } else {
        setError(response.message || "Failed to switch role");
      }
    } catch (err) {
      setError("Failed to switch role. Please try again.");
      console.error("Error switching to organizer:", err);
    } finally {
      setSwitching(false);
    }
  };

  const handleBecomeAttendee = async () => {
    try {
      setSwitching(true);
      setError(null);

      const response = await becomeAttendee();

      if (response.success) {
        setSwitchSuccess("You are now an Attendee! Redirecting to dashboard...");
        setShowAttendeeModal(false);

        // Refresh user profile to get updated role
        await refreshProfile();

        // Redirect to user dashboard after a short delay
        setTimeout(() => {
          navigate("/user/dashboard");
        }, 1500);
      } else {
        setError(response.message || "Failed to switch role");
      }
    } catch (err) {
      setError("Failed to switch role. Please try again.");
      console.error("Error switching to attendee:", err);
    } finally {
      setSwitching(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if role switching is not available for this user
  if (!options || (!options.canBecomeOrganizer && !options.canBecomeAttendee)) {
    // Still show blocked reason if any
    if (options?.blockedReason) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Switch Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{options.blockedReason}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Switch Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Success Message */}
          {switchSuccess && (
            <Alert className="border-success bg-success/5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">{switchSuccess}</AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Role */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Role:</span>
            <Badge className="flex items-center gap-1">
              {getRoleIcon(options.currentRole)}
              {getRoleLabel(options.currentRole)}
            </Badge>
          </div>

          {/* Role Switch Options */}
          <div className="space-y-3 pt-2">
            {options.canBecomeOrganizer && (
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowOrganizerModal(true)}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Become an Organizer
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            {options.canBecomeAttendee && (
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowAttendeeModal(true)}
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Switch to Attendee
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground pt-2">
            {options.canBecomeOrganizer && "Start hosting and managing your own events as an Organizer."}
            {options.canBecomeAttendee && "Switch back to attendee mode to browse and attend events."}
          </p>
        </CardContent>
      </Card>

      {/* Become Organizer Modal */}
      <Dialog open={showOrganizerModal} onOpenChange={setShowOrganizerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Become an Organizer</DialogTitle>
            <DialogDescription>
              Set up your organization to start creating and managing events.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                placeholder="Your company or organization name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email (optional)</Label>
              <Input
                id="businessEmail"
                type="email"
                placeholder="business@example.com"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If different from your account email
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOrganizerModal(false)}
              disabled={switching}
            >
              Cancel
            </Button>
            <Button onClick={handleBecomeOrganizer} disabled={switching}>
              {switching ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Switching...
                </>
              ) : (
                "Become Organizer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Become Attendee Modal */}
      <Dialog open={showAttendeeModal} onOpenChange={setShowAttendeeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to Attendee</DialogTitle>
            <DialogDescription>
              Are you sure you want to switch to Attendee mode?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You will lose access to your organizer dashboard. Your organization data will be preserved if you decide to switch back later.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAttendeeModal(false)}
              disabled={switching}
            >
              Cancel
            </Button>
            <Button onClick={handleBecomeAttendee} disabled={switching}>
              {switching ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Switching...
                </>
              ) : (
                "Switch to Attendee"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoleSwitcher;
