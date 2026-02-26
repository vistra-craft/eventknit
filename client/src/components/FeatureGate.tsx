import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  featureName: string;
  description?: string;
}

export const FeatureGate = ({
  featureName = "Feature",
  description = "This feature is available to event organizers only.",
}: FeatureGateProps) => {
  const navigate = useNavigate();

  const handleCreateEvent = () => {
    navigate("/user/create-event");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Organizer Feature
          </h2>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* Feature name */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="text-sm text-blue-900 font-medium">
            "{featureName}" is only available to event organizers
          </p>
        </div>

        {/* Call to action */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg px-4 py-4">
            <p className="text-sm text-gray-700 mb-3">
              Ready to unlock organizer features? Create your first event to get started!
            </p>
            <Button
              onClick={handleCreateEvent}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Create Your First Event
            </Button>
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-500">
            Once your event is approved, you'll be promoted to an organizer and get access to all these features.
          </p>
        </div>
      </div>
    </div>
  );
};
