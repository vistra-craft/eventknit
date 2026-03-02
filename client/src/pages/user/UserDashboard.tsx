import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DashboardNavbar from "./DashboardNavbar";
import DashboardHome from "./DashboardHome";
import DashboardAgenda from "./DashboardAgenda";
import DashboardMyEvent from "./DashboardMyEvent";
import DashboardMyBadge from "./DashboardMyBadge";
import DashboardAttendees from "./DashboardAttendees";
import AttendeeDiscovery from "./AttendeeDiscovery";
import NotificationsCenter from "./NotificationsCenter";
import PersonalAnalytics from "./PersonalAnalytics";
import PersonalizedRecommendations from "./PersonalizedRecommendations";
import TicketTransfer from "./TicketTransfer";
import EventCollections from "./EventCollections";
import InterestManagement from "./InterestManagement";
import AdvancedSearch from "./AdvancedSearch";
import DirectMessaging from "./DirectMessaging";
import SocialNetworking from "./SocialNetworking";
import TicketResale from "./TicketResale";
import DigitalWallet from "./DigitalWallet";
import EventCalendarIntegration from "./EventCalendarIntegration";
import PersonalEventFeed from "./PersonalEventFeed";
import EventUpdatesSubscription from "./EventUpdatesSubscription";
import PaymentPlans from "./PaymentPlans";
import Invoices from "./Invoices";
import MyTickets from "./MyTickets";
import SavedEvents from "./SavedEvents";

const UserDashboard = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeSection = searchParams.get("section") ?? "home";
  const { user: authUser } = useAuth();

  const user = authUser
    ? {
        name: `${authUser.firstName ?? ''} ${authUser.lastName ?? ''}`.trim() || authUser.email || 'User',
        email: authUser.email ?? '',
        initials: authUser.firstName && authUser.lastName
          ? `${authUser.firstName[0]}${authUser.lastName[0]}`.toUpperCase()
          : (authUser.email ? authUser.email[0].toUpperCase() : 'U'),
      }
    : { name: 'User', email: '', initials: 'U' };

  // location.state originates from React Router navigation and is typed as unknown.
  // Components that consume these values are responsible for narrowing them safely.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const registration = location.state?.registration;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const eventData = location.state?.eventData;
  const successMessage = typeof location.state?.message === 'string'
    ? (location.state.message as string)
    : undefined;

  const renderSection = () => {
    switch (activeSection) {
      case "my-events":
        return <DashboardMyEvent />;
      case "tickets":
        return <MyTickets />;
      case "saved":
        return <SavedEvents />;
      // speakers, exhibitors, sponsors are now inside EventAttendeeView (DashboardMyEvent)
      // Redirect legacy URLs to my-events so context is preserved
      case "speakers":
      case "exhibitors":
      case "sponsors":
        return <Navigate to="/user/dashboard?section=my-events" replace />;
      case "attendees":
        return <DashboardAttendees />;
      case "agenda":
        return <DashboardAgenda eventData={eventData} user={user} />;
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
      case "recommendations":
        return <PersonalizedRecommendations />;
      case "ticket-transfer":
        return <TicketTransfer />;
      case "collections":
        return <EventCollections />;
      case "interests":
        return <InterestManagement />;
      case "search":
        return <AdvancedSearch />;
      case "messages":
        return <DirectMessaging />;
      case "social":
        return <SocialNetworking />;
      case "ticket-resale":
        return <TicketResale />;
      case "wallet":
        return <DigitalWallet />;
      case "calendar":
        return <EventCalendarIntegration />;
      case "feed":
        return <PersonalEventFeed />;
      case "subscriptions":
        return <EventUpdatesSubscription />;
      case "payment-plans":
        return <PaymentPlans />;
      case "invoices":
        return <Invoices />;
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
        eventTitle={
          eventData != null && typeof eventData === 'object' && 'title' in eventData
            ? String((eventData as { title: unknown }).title ?? '')
            : undefined
        }
      />
      <main className="pt-16 flex-1">
        {successMessage && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl">
            <div className="bg-success-light border border-success/20 rounded-lg p-4 mb-6">
              <div className="text-success">{successMessage}</div>
            </div>
          </div>
        )}
        {renderSection()}
      </main>
    </div>
  );
};

export default UserDashboard;
