import { useState, useEffect } from "react";
import { Cookie, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { type CookieConsent, getSavedConsent, saveConsent } from "@/lib/cookie-consent";

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [prefs, setPrefs] = useState<CookieConsent>({
    essential: true,
    functional: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    // Only show if user hasn't consented yet
    const saved = getSavedConsent();
    if (!saved) {
      // Small delay so it doesn't flash on page load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    const consent: CookieConsent = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(consent);
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    const consent: CookieConsent = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(consent);
    setVisible(false);
  };

  const handleSaveCustom = () => {
    saveConsent(prefs);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl bg-card-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Cookie Preferences</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                We use cookies to improve your experience.{" "}
                <Link to="/cookie-policy" className="text-primary hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>
          <button
            onClick={handleRejectNonEssential}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Reject non-essential cookies"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customize panel */}
        {showCustomize && (
          <div className="px-5 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Essential</Label>
                <p className="text-xs text-muted-foreground">Always on</p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cb-functional" className="text-xs font-medium">Functional</Label>
                <p className="text-xs text-muted-foreground">Preferences & settings</p>
              </div>
              <Switch
                id="cb-functional"
                checked={prefs.functional}
                onCheckedChange={(c) => setPrefs((p) => ({ ...p, functional: c }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cb-analytics" className="text-xs font-medium">Analytics</Label>
                <p className="text-xs text-muted-foreground">Usage insights</p>
              </div>
              <Switch
                id="cb-analytics"
                checked={prefs.analytics}
                onCheckedChange={(c) => setPrefs((p) => ({ ...p, analytics: c }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cb-marketing" className="text-xs font-medium">Marketing</Label>
                <p className="text-xs text-muted-foreground">Relevant recommendations</p>
              </div>
              <Switch
                id="cb-marketing"
                checked={prefs.marketing}
                onCheckedChange={(c) => setPrefs((p) => ({ ...p, marketing: c }))}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-5 flex flex-col sm:flex-row gap-2">
          {showCustomize ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCustomize(false)}
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSaveCustom}
              >
                Save Preferences
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowCustomize(true)}
              >
                <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleRejectNonEssential}
              >
                Essential Only
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleAcceptAll}
              >
                Accept All
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
