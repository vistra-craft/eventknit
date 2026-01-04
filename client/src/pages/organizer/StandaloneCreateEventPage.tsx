import React from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import CreateEventStepwise from "../CreateEventStepwise";

/**
 * Standalone Event Creation Page
 * Used for new organizers who don't have approved events yet.
 * No dashboard layout - just the event creation form with minimal header.
 */
const StandaloneCreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Logo to="/" onClick={() => navigate('/')} />
            
            {/* Profile Dropdown */}
            {isAuthenticated && <ProfileDropdown />}
          </div>
        </div>
      </header>

      {/* Event Creation Form */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create Your First Event
            </h1>
            <p className="text-muted-foreground">
              Fill out the details below to create your event. Once submitted, it will be reviewed and approved.
            </p>
          </div>
          <BackButton to="/organizer/onboarding" label="Back to Onboarding" />
        </div>
        <CreateEventStepwise />
      </main>
    </div>
  );
};

export default StandaloneCreateEventPage;

