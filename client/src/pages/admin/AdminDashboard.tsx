import AdminEnhancedDashboard from "./AdminEnhancedDashboard";
import TellerDashboard from "./TellerDashboard";
import MarketerDashboard from "./MarketerDashboard";
import SupportDashboard from "./SupportDashboard";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";

const AdminDashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  // Route to role-specific dashboard
  // All hooks must be called before conditional returns
  let dashboardContent;

  if (userRole === UserRole.TELLER) {
    dashboardContent = <TellerDashboard />;
  } else if (userRole === UserRole.MARKETER) {
    dashboardContent = <MarketerDashboard />;
  } else if (userRole === UserRole.SUPPORT) {
    dashboardContent = <SupportDashboard />;
  } else {
    // For ADMIN_STAFF and SUPERADMIN, show full admin dashboard
    dashboardContent = <AdminEnhancedDashboard />;
  }

  return dashboardContent;
};

export default AdminDashboard;

