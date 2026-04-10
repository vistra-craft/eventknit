import { useState } from "react";
import {
  Download,
  Trash2,
  Shield,
  AlertTriangle,
  RefreshCw,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import * as gdprApi from "@/lib/gdpr-api";
import { extractErrorMessage } from "@/lib/utils/error";

interface PrivacyDataSettingsProps {
  cookiePreferences?: {
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  onCookiePreferencesChange?: (prefs: {
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  }) => void;
}

const PrivacyDataSettings = ({
  cookiePreferences,
  onCookiePreferencesChange,
}: PrivacyDataSettingsProps) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Data export
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingEmail, setIsExportingEmail] = useState(false);

  // Account deletion
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Cookie preferences (local state fallback)
  const [localCookiePrefs, setLocalCookiePrefs] = useState({
    functional: true,
    analytics: true,
    marketing: false,
  });

  const cookies = cookiePreferences ?? localCookiePrefs;
  const setCookies = onCookiePreferencesChange ?? ((prefs: typeof localCookiePrefs) => {
    setLocalCookiePrefs(prefs);
    try {
      localStorage.setItem("ek_cookie_consent", JSON.stringify({ ...prefs, essential: true }));
    } catch { /* localStorage unavailable */ }
  });

  // Download data as JSON file
  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      const response = await gdprApi.getDataExport();
      if (response.success && response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `eventknit-data-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: "Data exported",
          description: "Your data has been downloaded successfully.",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Export failed",
        description: extractErrorMessage(err, "Failed to export data. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Request export via email
  const handleEmailExport = async () => {
    setIsExportingEmail(true);
    try {
      const response = await gdprApi.requestDataExport();
      if (response.success) {
        toast({
          title: "Export requested",
          description: "A download link has been sent to your email address.",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Export failed",
        description: extractErrorMessage(err, "Failed to request export. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsExportingEmail(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setDeleteError("");

    if (!deleteConfirmEmail.trim()) {
      setDeleteError("Please enter your email address to confirm.");
      return;
    }

    if (deleteConfirmEmail.trim().toLowerCase() !== user?.email?.toLowerCase()) {
      setDeleteError("Email address does not match your account email.");
      return;
    }

    setIsDeleting(true);
    try {
      await gdprApi.deleteAccount(deleteConfirmEmail.trim(), deleteReason.trim() || undefined);
      toast({
        title: "Account deleted",
        description: "Your account has been deleted. You will be signed out now.",
      });
      setShowDeleteDialog(false);
      // Give user a moment to see the toast
      setTimeout(() => logout(), 1500);
    } catch (err: unknown) {
      setDeleteError(extractErrorMessage(err, "Failed to delete account. Please try again."));
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Your Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download a copy of your personal data in JSON format. This includes your profile
            information, registrations, payments, notifications, and preferences.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadData}
              disabled={isExporting}
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? "Downloading..." : "Download Now"}
            </Button>
            <Button
              variant="outline"
              onClick={handleEmailExport}
              disabled={isExportingEmail}
            >
              {isExportingEmail ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isExportingEmail ? "Sending..." : "Send to Email"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Cookie Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage which types of cookies you allow. Essential cookies are always enabled
            as they are required for the platform to function.
          </p>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Essential Cookies</Label>
              <p className="text-sm text-muted-foreground">
                Authentication, security, and core functionality
              </p>
            </div>
            <Switch checked disabled />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <Label htmlFor="cookie-functional" className="font-medium">
                Functional Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                Remember your preferences like theme and language
              </p>
            </div>
            <Switch
              id="cookie-functional"
              checked={cookies.functional}
              onCheckedChange={(checked) =>
                setCookies({ ...cookies, functional: checked })
              }
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <Label htmlFor="cookie-analytics" className="font-medium">
                Analytics Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                Help us understand how you use the platform
              </p>
            </div>
            <Switch
              id="cookie-analytics"
              checked={cookies.analytics}
              onCheckedChange={(checked) =>
                setCookies({ ...cookies, analytics: checked })
              }
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <Label htmlFor="cookie-marketing" className="font-medium">
                Marketing Cookies
              </Label>
              <p className="text-sm text-muted-foreground">
                Used to show you relevant event recommendations
              </p>
            </div>
            <Switch
              id="cookie-marketing"
              checked={cookies.marketing}
              onCheckedChange={(checked) =>
                setCookies({ ...cookies, marketing: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
              Your personal data will be anonymized within 30 days. Transaction records may be
              retained for up to 7 years for legal compliance.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteConfirmEmail("");
              setDeleteReason("");
              setDeleteError("");
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setShowDeleteDialog(open);
            if (!open) {
              setDeleteError("");
            }
          }
        }}
        title="Delete Your Account?"
        description="This will permanently anonymize your personal data. Pending registrations will be cancelled and you will lose access to your account."
        variant="danger"
        confirmText={isDeleting ? "Deleting..." : "Delete My Account"}
        onConfirm={handleDeleteAccount}
        loading={isDeleting}
        icon={AlertTriangle}
      >
        <div className="space-y-4 text-left">
          <div>
            <Label htmlFor="delete-confirm-email" className="text-sm font-medium">
              Type your email to confirm
            </Label>
            <Input
              id="delete-confirm-email"
              type="email"
              placeholder={user?.email ?? "your@email.com"}
              value={deleteConfirmEmail}
              onChange={(e) => {
                setDeleteConfirmEmail(e.target.value);
                setDeleteError("");
              }}
              disabled={isDeleting}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="delete-reason" className="text-sm font-medium">
              Reason for leaving (optional)
            </Label>
            <Input
              id="delete-reason"
              placeholder="Help us improve..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              disabled={isDeleting}
              className="mt-1"
            />
          </div>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default PrivacyDataSettings;
