import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import CreateEvent from "./pages/CreateEvent";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import RegisterEvent from "./pages/RegisterEvent";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import EventDetails from "./pages/EventDetails";
import PublicEventForm from "./pages/PublicEventForm";
// User Dashboard imports
import UserDashboard from "./pages/user/UserDashboard";
import ExhibitorDetails from "./pages/user/ExhibitorDetails";
// Organizer Dashboard imports
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import EventManagement from "./pages/organizer/EventManagement";
import AllEventsPage from "./pages/organizer/AllEventsPage";
import UpcomingEventsPage from "./pages/organizer/UpcomingEventsPage";
import PastEventsPage from "./pages/organizer/PastEventsPage";
import CreateEventPage from "./pages/organizer/CreateEventPage";
// Analytics imports
import { 
  AnalyticsOverview, 
  EventPerformance, 
  AttendeeInsights, 
  RevenueReports,
  TestAnalytics
} from "./pages/organizer/analytics";
// Team Management imports
import { 
  StaffManagementPage,
  RolesPermissionsPage,
  TeamCalendarPage,
  TeamPerformancePage
} from "./pages/organizer/team";
// Profile import
import Profile from "./pages/organizer/Profile";
// Event Templates import
import EventTemplates from "./pages/organizer/EventTemplates";
// Admin Dashboard imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMarketingPage from "./pages/admin/AdminMarketingPage";
import { 
  AdminCampaignsPage,
  AdminSocialMediaPage,
  AdminEmailMarketingPage,
  AdminPromotionsPage,
  AdminPartnershipsPage
} from "./pages/admin/marketing";
// Admin Events imports
import AdminAllEventsPage from "./pages/admin/events/AllEventsPage";
import AdminPendingApprovalPage from "./pages/admin/events/PendingApprovalPage";
import AdminFeaturedEventsPage from "./pages/admin/events/FeaturedEventsPage";
import AdminPastEventsPage from "./pages/admin/events/PastEventsPage";
import AdminUpcomingEventsPage from "./pages/admin/events/UpcomingEventsPage";
import AdminDeclinedEventsPage from "./pages/admin/events/DeclinedEventsPage";
import EventDetailsPage from "./pages/admin/events/EventDetailsPage";
import AdminStaffManagementPage from "./pages/admin/StaffManagementPage";
import OrganizersPage from "./pages/admin/OrganizersPage";
import OrganizerDetailsPage from "./pages/admin/OrganizerDetailsPage";
import OrganizerEditPage from "./pages/admin/OrganizerEditPage";
import StaffDetailsPage from "./pages/admin/StaffDetailsPage";
import StaffEditPage from "./pages/admin/StaffEditPage";
import UserRolesPage from "./pages/admin/UserRolesPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
// Admin System imports
import { 
  SystemHealthPage,
  DatabasePage,
  LogsPage,
  BackupsPage,
  MaintenancePage
} from "./pages/admin/system";
// Admin Moderation import
import ModerationPage from "./pages/admin/ModerationPage";
// Admin Communications import
import AdminCommunicationsPage from "./pages/admin/CommunicationsPage";
// Admin Analytics imports
import { AdminAnalyticsOverview } from "./pages/admin/analytics";
// Admin Support import
import SupportPage from "./pages/admin/SupportPage";
// Admin Finance imports
import { 
  FinanceDashboard,
  ExpensesPage,
  IncomePage,
  WagesPage,
  TransactionsPage,
  EditTransactionPage,
  EditExpensePage,
  EditIncomePage,
  EditWagePage,
  IncomeStatementPage
} from "./pages/admin/finance";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";
// Admin Workstation imports
import WorkstationOverview from "./pages/admin/workstation/WorkstationOverview";
import WorkstationEvents from "./pages/admin/workstation/WorkstationEvents";
import WorkstationEventDashboard from "./pages/admin/workstation/WorkstationEventDashboard";
import WorkstationScanner from "./pages/admin/workstation/WorkstationScanner";
import WorkstationPrint from "./pages/admin/workstation/WorkstationPrint";
import WorkstationTemplates from "./pages/admin/workstation/WorkstationTemplates";
import WorkstationHistory from "./pages/admin/workstation/WorkstationHistory";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/event/:id/register" element={<RegisterEvent />} />
      <Route path="/event/:id/payment" element={<Payment />} />
      <Route path="/event/:id/confirmation" element={<Confirmation />} />
      {/* Public Form Routes */}
      <Route path="/forms/:type/:templateId" element={<PublicEventForm />} />
      {/* User Dashboard Routes */}
      <Route path="/user/dashboard" element={<UserDashboard />} />
      <Route path="/exhibitors/:id" element={<ExhibitorDetails />} />
      {/* Organizer Dashboard Routes */}
      <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer/events/upcoming" element={<UpcomingEventsPage />} />
      <Route path="/organizer/events/past" element={<PastEventsPage />} />
      <Route path="/organizer/events" element={<AllEventsPage />} />
      <Route path="/organizer/events/create" element={<CreateEventPage />} />
      <Route path="/organizer/event/:eventId" element={<EventManagement />} />
      {/* Analytics Routes */}
      <Route path="/organizer/analytics" element={<AnalyticsOverview />} />
      <Route path="/organizer/analytics/events" element={<EventPerformance />} />
      <Route path="/organizer/analytics/attendees" element={<AttendeeInsights />} />
      <Route path="/organizer/analytics/revenue" element={<RevenueReports />} />
      <Route path="/organizer/analytics/test" element={<TestAnalytics />} />
      {/* Team Routes */}
      <Route path="/organizer/team/staff" element={<StaffManagementPage />} />
      <Route path="/organizer/team/roles" element={<RolesPermissionsPage />} />
      <Route path="/organizer/team/calendar" element={<TeamCalendarPage />} />
      <Route path="/organizer/team/performance" element={<TeamPerformancePage />} />
      {/* Profile Route */}
      <Route path="/organizer/profile" element={<Profile />} />
      {/* Event Templates and Drafts */}
      <Route path="/organizer/events/templates" element={<EventTemplates />} />
      {/* Admin Dashboard Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      {/* Admin Events Routes */}
      <Route path="/admin/events" element={<AdminAllEventsPage />} />
      <Route path="/admin/events/pending" element={<AdminPendingApprovalPage />} />
      <Route path="/admin/events/featured" element={<AdminFeaturedEventsPage />} />
      <Route path="/admin/events/past" element={<AdminPastEventsPage />} />
      <Route path="/admin/events/upcoming" element={<AdminUpcomingEventsPage />} />
      <Route path="/admin/events/declined" element={<AdminDeclinedEventsPage />} />
      <Route path="/admin/events/:eventId" element={<EventDetailsPage />} />
      {/* Admin Users Routes */}
      <Route path="/admin/users/staff" element={<AdminStaffManagementPage />} />
      <Route path="/admin/users/staff/:staffId" element={<StaffDetailsPage />} />
      <Route path="/admin/users/staff/:staffId/edit" element={<StaffEditPage />} />
      <Route path="/admin/users/organizers" element={<OrganizersPage />} />
      <Route path="/admin/users/organizers/:organizerId" element={<OrganizerDetailsPage />} />
      <Route path="/admin/users/organizers/:organizerId/edit" element={<OrganizerEditPage />} />
      <Route path="/admin/users/roles" element={<UserRolesPage />} />
      <Route path="/admin/settings" element={<AdminSettingsPage />} />
      {/* Admin System Routes */}
      <Route path="/admin/system/health" element={<SystemHealthPage />} />
      <Route path="/admin/system/database" element={<DatabasePage />} />
      <Route path="/admin/system/logs" element={<LogsPage />} />
      <Route path="/admin/system/backups" element={<BackupsPage />} />
      <Route path="/admin/system/maintenance" element={<MaintenancePage />} />
      {/* Admin Moderation Route */}
      <Route path="/admin/moderation" element={<ModerationPage />} />
      {/* Admin Communications Route */}
      <Route path="/admin/communications" element={<AdminCommunicationsPage />} />
      {/* Admin Support Route */}
      <Route path="/admin/support" element={<SupportPage />} />
      {/* Admin Finance Routes */}
      <Route path="/admin/finance" element={<FinanceDashboard />} />
      <Route path="/admin/finance/expenses" element={<ExpensesPage />} />
      <Route path="/admin/finance/income" element={<IncomePage />} />
      <Route path="/admin/finance/wages" element={<WagesPage />} />
      <Route path="/admin/finance/transactions" element={<TransactionsPage />} />
      <Route path="/admin/finance/income-statement" element={<IncomeStatementPage />} />
      {/* Admin Finance Edit Routes */}
      <Route path="/admin/finance/transactions/edit/:id" element={<EditTransactionPage />} />
      <Route path="/admin/finance/expenses/edit/:id" element={<EditExpensePage />} />
      <Route path="/admin/finance/income/edit/:id" element={<EditIncomePage />} />
      <Route path="/admin/finance/wages/edit/:id" element={<EditWagePage />} />
      {/* Admin Marketing Routes */}
      <Route path="/admin/marketing" element={<AdminMarketingPage />} />
      <Route path="/admin/marketing/campaigns" element={<AdminCampaignsPage />} />
      <Route path="/admin/marketing/social" element={<AdminSocialMediaPage />} />
      <Route path="/admin/marketing/email" element={<AdminEmailMarketingPage />} />
      <Route path="/admin/marketing/promotions" element={<AdminPromotionsPage />} />
      <Route path="/admin/marketing/partnerships" element={<AdminPartnershipsPage />} />
      {/* Admin Analytics Routes */}
      <Route path="/admin/analytics" element={<AdminAnalyticsOverview />} />
      <Route path="/admin/analytics/events" element={<AdminAnalyticsOverview />} />
      <Route path="/admin/analytics/users" element={<AdminAnalyticsOverview />} />
      <Route path="/admin/analytics/revenue" element={<AdminAnalyticsOverview />} />
      <Route path="/admin/analytics/system" element={<AdminAnalyticsOverview />} />
      <Route path="/support" element={<Support />} />
      <Route path="*" element={<NotFound />} />
      {/* Admin Workstation Routes */}
      <Route path="/admin/workstation" element={<WorkstationOverview />} />
      <Route path="/admin/workstation/events" element={<WorkstationEvents />} />
      <Route path="/admin/workstation/event/:eventId" element={<WorkstationEventDashboard />} />
      <Route path="/admin/workstation/scanner" element={<WorkstationScanner />} />
      <Route path="/admin/workstation/print" element={<WorkstationPrint />} />
      <Route path="/admin/workstation/templates" element={<WorkstationTemplates />} />
      <Route path="/admin/workstation/history" element={<WorkstationHistory />} />
    </Routes>
  </BrowserRouter>
);

export default App;