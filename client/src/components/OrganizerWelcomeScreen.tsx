import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Sparkles, BarChart3, Wallet, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeState {
  promoted?: boolean;
  eventName?: string;
}

export const OrganizerWelcomeScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  const state = location.state as WelcomeState | null;

  useEffect(() => {
    // Check if user was promoted (location.state.promoted === true)
    if (state?.promoted) {
      setShowWelcome(true);
    }
  }, [state]);

  const handleClose = () => {
    setShowWelcome(false);
    // Clear the location state
    navigate(location.pathname, { replace: true });
  };

  const handleViewAnalytics = () => {
    setShowWelcome(false);
    navigate("/organizer/dashboard?tab=analytics");
  };

  const handleSetupPayouts = () => {
    setShowWelcome(false);
    navigate("/organizer/settings?section=payouts");
  };

  const handleExploreTeam = () => {
    setShowWelcome(false);
    navigate("/organizer/team");
  };

  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with subtle blue accent */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-8 border-b border-border relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close welcome screen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">You're an Organizer!</h1>
          </div>
          <p className="text-muted-foreground">
            {state?.eventName
              ? `Your event "${state.eventName}" was approved.`
              : "Congratulations on your promotion!"}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <p className="text-muted-foreground mb-6">
            Your event is live! Here's what you can do next:
          </p>

          {/* Action cards */}
          <div className="space-y-3 mb-6">
            {/* View Analytics */}
            <button
              onClick={handleViewAnalytics}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                  <BarChart3 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">View Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Track ticket sales and attendee insights
                  </p>
                </div>
              </div>
            </button>

            {/* Setup Payouts */}
            <button
              onClick={handleSetupPayouts}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                  <Wallet className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Set Up Payouts</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your bank account to receive earnings
                  </p>
                </div>
              </div>
            </button>

            {/* Explore Team Features */}
            <button
              onClick={handleExploreTeam}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                  <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Explore Team Features
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Invite team members to help manage events
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Close button */}
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};
