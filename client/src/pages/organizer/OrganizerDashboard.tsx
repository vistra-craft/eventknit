import UnifiedOrganizerDashboard from "./UnifiedOrganizerDashboard";
import OrganizerTellerDashboard from "./OrganizerTellerDashboard";
import OrganizerStaffDashboard from "./OrganizerStaffDashboard";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { Navigate } from "react-router-dom";

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  // Redirect ATTENDEE role users to attendee dashboard
  if (userRole === UserRole.ATTENDEE) {
    return <Navigate to="/user/dashboard" replace />;
  }

  if (userRole === UserRole.ORGANIZER_TELLER) {
    return <OrganizerTellerDashboard />;
  }

  if (userRole === UserRole.ORGANIZER_ADMIN) {
    return <OrganizerStaffDashboard />;
  }

  return <UnifiedOrganizerDashboard />;
};

export default OrganizerDashboard;
