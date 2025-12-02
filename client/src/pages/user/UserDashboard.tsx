import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DashboardNavbar from "./DashboardNavbar";
import DashboardHome from "./DashboardHome";
import DashboardSpeakers from "./DashboardSpeakers";
import DashboardExhibitors from "./DashboardExhibitors";
import DashboardAgenda from "./DashboardAgenda";
import DashboardMyEvent from "./DashboardMyEvent";
import DashboardMyBadge from "./DashboardMyBadge";
import DashboardAbstracts from "./DashboardAbstracts";
import DashboardAttendees from "./DashboardAttendees";
import AttendeeDiscovery from "./AttendeeDiscovery";
import NotificationsCenter from "./NotificationsCenter";
import PersonalAnalytics from "./PersonalAnalytics";
import Footer from "../../components/Footer";

const UserDashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeSection = searchParams.get("section") || "home";
  const { user: authUser } = useAuth();

  // Get user data from auth context
  const user = authUser ? {
    name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email || 'User',
    email: authUser.email || '',
    initials: authUser.firstName && authUser.lastName 
      ? `${authUser.firstName[0]}${authUser.lastName[0]}`.toUpperCase()
      : (authUser.email ? authUser.email[0].toUpperCase() : 'U'),
  } : {
    name: 'User',
    email: '',
    initials: 'U',
  };

  // Get event data from navigation state (for specific event views)
  const registration = location.state?.registration;
  const eventData = location.state?.eventData;

  // Show success message if available
  const successMessage = location.state?.message;

  // Check if we should show navigation buttons (only on specific sections)
  const shouldShowNavigationButtons = ['speakers', 'exhibitors', 'attendees', 'agenda', 'my-badge', 'abstracts'].includes(activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case "speakers":
        return <DashboardSpeakers eventData={eventData} />;
      case "exhibitors":
        return <DashboardExhibitors eventData={eventData} />;
      case "attendees":
        return <DashboardAttendees />;
      case "agenda":
        return <DashboardAgenda eventData={eventData} user={user} />;
      case "my-event":
        return (
          <DashboardMyEvent eventData={eventData} registration={registration} user={user} />
        );
      case "my-badge":
        return (
          <DashboardMyBadge
            eventData={eventData}
            user={user}
            registration={registration}
          />
        );
      case "networking":
        return <AttendeeDiscovery eventData={eventData} />;
      case "notifications":
        return <NotificationsCenter eventData={eventData} />;
      case "analytics":
        return <PersonalAnalytics eventData={eventData} user={user} />;
      case "abstracts":
        return <DashboardAbstracts eventData={eventData} user={user} registration={registration} />;
      default:
        return (
          <DashboardHome
            eventData={eventData}
            user={user}
            registration={registration}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNavbar 
        user={user} 
        activeSection={activeSection}
        eventTitle={eventData?.title}
      />
      <main className={`${shouldShowNavigationButtons ? 'pt-36' : 'pt-24'} flex-1`}>
        {/* Success Message */}
        {successMessage && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-accent-neon/10 border border-accent-neon/20 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="text-accent-neon">{successMessage}</div>
              </div>
            </div>
          </div>
        )}
        {renderSection()}
      </main>
      <Footer />
    </div>
  );
};

export default UserDashboard;
