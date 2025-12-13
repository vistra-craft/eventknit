import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateEventStepwise from "../CreateEventStepwise";

/**
 * Standalone Event Creation Page
 * Used for new organizers who don't have approved events yet.
 * No dashboard layout - just the event creation form with minimal header.
 */
const StandaloneCreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EK</span>
              </div>
              <span className="text-xl font-bold text-primary">EventKnit</span>
            </button>

            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/organizer/onboarding')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Onboarding
            </Button>
          </div>
        </div>
      </header>

      {/* Event Creation Form */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create Your First Event
          </h1>
          <p className="text-muted-foreground">
            Fill out the details below to create your event. Once submitted, it will be reviewed and approved.
          </p>
        </div>
        <CreateEventStepwise />
      </main>
    </div>
  );
};

export default StandaloneCreateEventPage;

