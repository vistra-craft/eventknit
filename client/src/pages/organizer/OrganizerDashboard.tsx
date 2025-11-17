import OrganizerLayout from "./OrganizerLayout";
import EnhancedDashboard from "./EnhancedDashboard";
import OrganizerTellerDashboard from "./OrganizerTellerDashboard";
import OrganizerStaffDashboard from "./OrganizerStaffDashboard";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  // Route to role-specific dashboard
  // All hooks must be called before conditional returns
  let dashboardContent;
  
  if (userRole === UserRole.ORGANIZER_TELLER) {
    dashboardContent = <OrganizerTellerDashboard />;
  } else if (userRole === UserRole.ORGANIZER_STAFF) {
    dashboardContent = <OrganizerStaffDashboard />;
  } else {
    // For full organizer, show full dashboard
    dashboardContent = <EnhancedDashboard />;
  }

  return (
    <OrganizerLayout>
      {dashboardContent}
    </OrganizerLayout>
  );
};

export default OrganizerDashboard;



