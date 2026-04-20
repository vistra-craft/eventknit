import UnifiedOrganizerDashboard from "./UnifiedOrganizerDashboard";
import OrganizerTellerDashboard from "./OrganizerTellerDashboard";
import OrganizerStaffDashboard from "./OrganizerStaffDashboard";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  if (userRole === UserRole.ORGANIZER_TELLER) {
    return <OrganizerTellerDashboard />;
  }

  if (userRole === UserRole.ORGANIZER_STAFF) {
    return <OrganizerStaffDashboard />;
  }

  return <UnifiedOrganizerDashboard />;
};

export default OrganizerDashboard;
