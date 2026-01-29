import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OrganizerLayout from "./OrganizerLayout";
import EnhancedDashboard from "./EnhancedDashboard";
import OrganizerTellerDashboard from "./OrganizerTellerDashboard";
import OrganizerStaffDashboard from "./OrganizerStaffDashboard";
import { LockedDashboard } from "@/components/organizer/LockedDashboard";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { getDashboardAccess, type DashboardAccessTier, type PendingEvent } from "@/lib/organizer-api";

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role;
  const [isLoading, setIsLoading] = useState(true);
  const [accessTier, setAccessTier] = useState<DashboardAccessTier>(0);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);

  useEffect(() => {
    const checkAccess = async () => {
      // Only check for full organizers
      if (userRole === UserRole.ORGANIZER) {
        try {
          const accessResponse = await getDashboardAccess();
          if (accessResponse.success) {
            const tier = accessResponse.data.tier;
            setAccessTier(tier);
            setPendingEvents(accessResponse.data.pendingEvents || []);

            // Tier 0: No events - redirect to event creation
            if (tier === 0) {
              navigate('/organizer/events/create-standalone', { replace: true });
              return;
            }
          }
        } catch (error) {
          console.error('Error checking dashboard access:', error);
          // On error, assume no access and redirect
          navigate('/organizer/events/create-standalone', { replace: true });
          return;
        } finally {
          setIsLoading(false);
        }
      } else {
        // Staff and teller roles don't need access check
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [userRole, navigate]);

  // Route to role-specific dashboard
  // All hooks must be called before conditional returns
  let dashboardContent;

  if (isLoading) {
    dashboardContent = (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  } else if (userRole === UserRole.ORGANIZER_TELLER) {
    dashboardContent = <OrganizerTellerDashboard />;
  } else if (userRole === UserRole.ORGANIZER_STAFF) {
    dashboardContent = <OrganizerStaffDashboard />;
  } else if (accessTier === 1) {
    // Tier 1: Pending events only - show locked dashboard with pending events
    dashboardContent = (
      <LockedDashboard
        tier={1}
        pendingEvents={pendingEvents.map(e => ({
          id: e.id,
          title: e.title,
          status: e.status,
        }))}
      />
    );
  } else {
    // Tier 2 or 3: Full dashboard access
    dashboardContent = <EnhancedDashboard tier={accessTier} />;
  }

  return (
    <OrganizerLayout>
      {dashboardContent}
    </OrganizerLayout>
  );
};

export default OrganizerDashboard;
