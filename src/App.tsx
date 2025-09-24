import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import CreateEvent from "./pages/CreateEvent";
import About from "./pages/About";
import RegisterEvent from "./pages/RegisterEvent";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import EventDetails from "./pages/EventDetails";
import PublicEventForm from "./pages/PublicEventForm";
// Organizer Dashboard imports
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import EventManagement from "./pages/organizer/EventManagement";
import AllEventsPage from "./pages/organizer/AllEventsPage";
import UpcomingEventsPage from "./pages/organizer/UpcomingEventsPage";
import PastEventsPage from "./pages/organizer/PastEventsPage";
import CreateEventPage from "./pages/organizer/CreateEventPage";
// Marketing imports
import MarketingPage from "./pages/organizer/MarketingPage";
import { CampaignsPage, SocialMediaPage, EmailMarketingPage, PromotionsPage, PartnershipsPage } from "./pages/organizer/marketing";
// Placeholder page imports
import { 
  AnalyticsOverview, 
  EventPerformance, 
  AttendeeInsights, 
  RevenueReports,
  CommunicationsPage,
  SettingsPage,
  EventTemplates,
  EventDrafts
} from "./pages/organizer/placeholder-pages";
// Team Management imports
import { 
  StaffManagementPage,
  RolesPermissionsPage,
  TeamCalendarPage,
  TeamPerformancePage
} from "./pages/organizer/team";
// Profile import
import Profile from "./pages/organizer/Profile";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/event/:id/register" element={<RegisterEvent />} />
      <Route path="/event/:id/payment" element={<Payment />} />
      <Route path="/event/:id/confirmation" element={<Confirmation />} />
      {/* Public Form Routes */}
      <Route path="/forms/:type/:templateId" element={<PublicEventForm />} />
      {/* Organizer Dashboard Routes */}
      <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer/events/upcoming" element={<UpcomingEventsPage />} />
      <Route path="/organizer/events/past" element={<PastEventsPage />} />
      <Route path="/organizer/events" element={<AllEventsPage />} />
      <Route path="/organizer/events/create" element={<CreateEventPage />} />
      <Route path="/organizer/event/:eventId" element={<EventManagement />} />
      {/* Marketing Routes */}
      <Route path="/organizer/marketing" element={<MarketingPage />} />
      <Route path="/organizer/marketing/campaigns" element={<CampaignsPage />} />
      <Route path="/organizer/marketing/social" element={<SocialMediaPage />} />
      <Route path="/organizer/marketing/email" element={<EmailMarketingPage />} />
      <Route path="/organizer/marketing/promotions" element={<PromotionsPage />} />
      <Route path="/organizer/marketing/partnerships" element={<PartnershipsPage />} />
      {/* Analytics Routes */}
      <Route path="/organizer/analytics" element={<AnalyticsOverview />} />
      <Route path="/organizer/analytics/events" element={<EventPerformance />} />
      <Route path="/organizer/analytics/attendees" element={<AttendeeInsights />} />
      <Route path="/organizer/analytics/revenue" element={<RevenueReports />} />
      {/* Communications Route */}
      <Route path="/organizer/communications" element={<CommunicationsPage />} />
      {/* Team Routes */}
      <Route path="/organizer/team/staff" element={<StaffManagementPage />} />
      <Route path="/organizer/team/roles" element={<RolesPermissionsPage />} />
      <Route path="/organizer/team/calendar" element={<TeamCalendarPage />} />
      <Route path="/organizer/team/performance" element={<TeamPerformancePage />} />
      {/* Settings Route */}
      <Route path="/organizer/settings" element={<SettingsPage />} />
      {/* Profile Route */}
      <Route path="/organizer/profile" element={<Profile />} />
      {/* Event Templates and Drafts */}
      <Route path="/organizer/events/templates" element={<EventTemplates />} />
      <Route path="/organizer/events/drafts" element={<EventDrafts />} />
    </Routes>
  </BrowserRouter>
);

export default App;