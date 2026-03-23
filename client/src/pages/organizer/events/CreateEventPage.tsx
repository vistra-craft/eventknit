import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CreateEventStepwise from "@/pages/CreateEventStepwise";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { getDashboardAccess } from "@/lib/organizer-api";

/**
 * Create Event Page
 * - If organizer has dashboard access (has created an event): Shows with dashboard layout
 * - If organizer has no dashboard access: Redirects to standalone creation page
 */
const CreateEventPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Only check for full organizers
      if (user?.role === UserRole.ORGANIZER) {
        try {
          const accessResponse = await getDashboardAccess();
          if (accessResponse.success && !accessResponse.data.hasAccess) {
            // No dashboard access - redirect to standalone creation (preserve query params e.g. ?edit=)
            navigate(`/organizer/events/create-standalone${location.search}`, { replace: true });
            return;
          }
        } catch (error) {
          console.error('Error checking dashboard access:', error);
          // On error, assume no access and redirect to standalone (preserve query params e.g. ?edit=)
          navigate(`/organizer/events/create-standalone${location.search}`, { replace: true });
          return;
        }
      }
      setIsChecking(false);
    };

    checkAccess();
  }, [user, navigate, location.search]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Organizer has dashboard access - show with layout
  return (
      <CreateEventStepwise />
  );
};

export default CreateEventPage;
