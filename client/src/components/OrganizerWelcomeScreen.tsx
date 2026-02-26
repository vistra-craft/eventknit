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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 px-6 py-8 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close welcome screen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-2xl font-bold">You're an Organizer!</h1>
          </div>
          <p className="text-white/90">
            {state?.eventName
              ? `Your event "${state.eventName}" was approved.`
              : "Congratulations on your promotion!"}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <p className="text-gray-600 mb-6">
            Your event is live! Here's what you can do next:
          </p>

          {/* Action cards */}
          <div className="space-y-3 mb-6">
            {/* View Analytics */}
            <button
              onClick={handleViewAnalytics}
              className="w-full p-4 rounded-xl border-2 border-transparent hover:border-purple-300 bg-purple-50 hover:bg-purple-100 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-200 rounded-lg group-hover:bg-purple-300 transition-colors">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Analytics</h3>
                  <p className="text-sm text-gray-600">
                    Track ticket sales and attendee insights
                  </p>
                </div>
              </div>
            </button>

            {/* Setup Payouts */}
            <button
              onClick={handleSetupPayouts}
              className="w-full p-4 rounded-xl border-2 border-transparent hover:border-green-300 bg-green-50 hover:bg-green-100 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-200 rounded-lg group-hover:bg-green-300 transition-colors">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Set Up Payouts</h3>
                  <p className="text-sm text-gray-600">
                    Connect your bank account to receive earnings
                  </p>
                </div>
              </div>
            </button>

            {/* Explore Team Features */}
            <button
              onClick={handleExploreTeam}
              className="w-full p-4 rounded-xl border-2 border-transparent hover:border-blue-300 bg-blue-50 hover:bg-blue-100 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-200 rounded-lg group-hover:bg-blue-300 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Explore Team Features
                  </h3>
                  <p className="text-sm text-gray-600">
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
            className="w-full"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};
