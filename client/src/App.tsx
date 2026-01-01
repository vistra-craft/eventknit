import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleViewProvider } from "./contexts/RoleViewContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";
import type { ReactNode } from "react";
import Index from "./pages/index";
import CreateEvent from "./pages/CreateEvent";
import CreateEventStepwise from "./pages/CreateEventStepwise";
import AuthDemo from "./pages/AuthDemo";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import RegisterEvent from "./pages/RegisterEvent";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import RegistrationConfirmation from "./pages/RegistrationConfirmation";
import EventDetails from "./pages/EventDetails";
import PublicEventForm from "./pages/PublicEventForm";
// User Dashboard imports
import UserDashboard from "./pages/user/UserDashboard";
import ExhibitorDetails from "./pages/user/ExhibitorDetails";
import UserProfilePage from "./pages/user/UserProfilePage";
import NotificationPreferencesPage from "./pages/user/NotificationPreferencesPage";
import TicketViewPage from "./pages/user/TicketViewPage";
// Organizer Dashboard imports
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import EventManagementPage from "./pages/organizer/EventManagementPage";
import AllEventsPage from "./pages/organizer/AllEventsPage";
import UpcomingEventsPage from "./pages/organizer/UpcomingEventsPage";
import PastEventsPage from "./pages/organizer/PastEventsPage";
import CancelledEventsPage from "./pages/organizer/CancelledEventsPage";
import VerificationPage from "./pages/organizer/VerificationPage";
import KYCVerificationPage from "./pages/organizer/KYCVerificationPage";
import CreateEventPage from "./pages/organizer/CreateEventPage";
import StandaloneCreateEventPage from "./pages/organizer/StandaloneCreateEventPage";
import OnboardingWizard from "./pages/organizer/OnboardingWizard";
import OrganizerSettingsPage from "./pages/organizer/OrganizerSettingsPage";
import SubscriptionManagement from "./pages/organizer/SubscriptionManagement";
import WhiteLabelBranding from "./pages/organizer/WhiteLabelBranding";
import CustomDomains from "./pages/organizer/CustomDomains";
import VenueManagement from "./pages/organizer/VenueManagement";
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
} from "./pages/organizer/team";
// Event Templates import
import EventTemplates from "./pages/organizer/EventTemplates";
import EventTemplatesManagement from "./pages/organizer/EventTemplatesManagement";
import EventDraftsManagement from "./pages/organizer/EventDraftsManagement";
import AttendeeSegmentation from "./pages/organizer/AttendeeSegmentation";
import AttendeeTagsManagement from "./pages/organizer/AttendeeTagsManagement";
import AttendeeCommunication from "./pages/organizer/AttendeeCommunication";
import FinancialManagement from "./pages/organizer/FinancialManagement";
import EventCollaboration from "./pages/organizer/EventCollaboration";
import EmailMarketing from "./pages/organizer/EmailMarketing";
import AdvancedTicketTypes from "./pages/organizer/AdvancedTicketTypes";
import DynamicPricing from "./pages/organizer/DynamicPricing";
import AffiliateProgram from "./pages/organizer/AffiliateProgram";
import SocialMedia from "./pages/organizer/SocialMedia";
// Marketing imports
import PromoCodeManager from "./pages/organizer/marketing/PromoCodeManager";
// Admin Dashboard imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMarketingPage from "./pages/admin/AdminMarketingPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import { 
  AdminCampaignsPage,
  AdminSocialMediaPage,
  AdminEmailMarketingPage,
  AdminPromotionsPage,
  AdminPartnershipsPage
} from "./pages/admin/marketing";
import AdminAdvancedTicketTypes from "./pages/admin/tickets/AdminAdvancedTicketTypes";
import AdminDynamicPricing from "./pages/admin/tickets/AdminDynamicPricing";
// Admin Events imports
import AdminAllEventsPage from "./pages/admin/events/AllEventsPage";
import AdminPendingApprovalPage from "./pages/admin/events/PendingApprovalPage";
import AdminFeaturedEventsPage from "./pages/admin/events/FeaturedEventsPage";
import CreateFeaturedEventPage from "./pages/admin/events/featured/CreateFeaturedEventPage";
import EditFeaturedEventPage from "./pages/admin/events/featured/EditFeaturedEventPage";
import AdminPastEventsPage from "./pages/admin/events/PastEventsPage";
import AdminUpcomingEventsPage from "./pages/admin/events/UpcomingEventsPage";
import AdminDeclinedEventsPage from "./pages/admin/events/DeclinedEventsPage";
import AdminCreateEventPage from "./pages/admin/AdminCreateEventPage";
import EventPreviewPage from "./pages/admin/events/EventPreviewPage";
import EventDetailsPage from "./pages/admin/events/EventDetailsPage";
import AdminStaffManagementPage from "./pages/admin/StaffManagementPage";
import OrganizersPage from "./pages/admin/OrganizersPage";
import CreateOrganizerPage from "./pages/admin/organizers/CreateOrganizerPage";
import OrganizerPreviewPage from "./pages/admin/organizers/OrganizerPreviewPage";
import OrganizerDetailsPage from "./pages/admin/OrganizerDetailsPage";
import OrganizerEditPage from "./pages/admin/OrganizerEditPage";
import StaffDetailsPage from "./pages/admin/StaffDetailsPage";
import StaffEditPage from "./pages/admin/StaffEditPage";
import StaffPerformanceDashboard from "./pages/admin/StaffPerformanceDashboard";
import StaffPerformanceDetail from "./pages/admin/StaffPerformanceDetail";
import UserRolesPage from "./pages/admin/UserRolesPage";
import UsersManagementPage from "./pages/admin/UsersManagementPage";
import AttendeesPage from "./pages/admin/AttendeesPage";
import AdminLayout from "./pages/admin/AdminLayout";
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
import AdminNotificationSettingsPage from "./pages/admin/AdminNotificationSettingsPage";
// Admin Analytics imports
import { AdminAnalyticsOverview } from "./pages/admin/analytics";
// Admin Support import
import SupportPage from "./pages/admin/SupportPage";
// Admin Financial import
import AdminFinancialManagement from "./pages/admin/AdminFinancialManagement";
// Admin Finance imports
import { 
  FinanceDashboard,
  EventFinanceDashboard,
  PaymentTransactionsPage,
  DisbursementsPage,
  RefundsPage,
  ReconciliationPage,
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
// Auth imports
import SignIn from "./pages/auth/SignIn";
// import SignUp from "./pages/auth/SignUp";
import SimpleRegistration from "./pages/auth/SimpleRegistration";
// import EmailEntry from "./pages/auth/EmailEntry";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import MagicLinkVerify from "./pages/auth/MagicLinkVerify";
import CreateAccount from "./pages/auth/CreateAccount";
// import UserTypeSelection from "./pages/auth/UserTypeSelection";
// import OrganizerRegistration from "./pages/auth/OrganizerRegistration";
// import AttendeeRegistration from "./pages/auth/AttendeeRegistration";

// Wrapper component to provide role view context with user role
// This needs to be inside BrowserRouter and AuthProvider
const RoleViewWrapper = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  return (
    <RoleViewProvider userRole={user?.role || null}>
      {children}
    </RoleViewProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <RoleViewWrapper>
          <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/create-event-stepwise" element={<CreateEventStepwise />} />
      <Route path="/auth-demo" element={<AuthDemo />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/event/:id/register" element={<RegisterEvent />} />
      <Route path="/event/:id/payment" element={<Payment />} />
      <Route path="/event/:id/confirmation" element={<Confirmation />} />
      <Route path="/event/:id/registration-confirmation" element={<RegistrationConfirmation />} />
      {/* Public Form Routes */}
      <Route path="/forms/:type/:templateId" element={<PublicEventForm />} />
      {/* User Dashboard Routes */}
      <Route path="/user/dashboard" element={<UserDashboard />} />
      <Route path="/user/tickets/:registrationId" element={<TicketViewPage />} />
      <Route path="/user/profile" element={<UserProfilePage />} />
      <Route path="/user/notification-preferences" element={<NotificationPreferencesPage />} />
      <Route path="/exhibitors/:id" element={<ExhibitorDetails />} />
      {/* Organizer Dashboard Routes */}
      <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer/onboarding" element={<OnboardingWizard />} />
      <Route path="/organizer/events/upcoming" element={<UpcomingEventsPage />} />
      <Route path="/organizer/events/past" element={<PastEventsPage />} />
      <Route path="/organizer/events/cancelled" element={<CancelledEventsPage />} />
      <Route path="/organizer/events" element={<AllEventsPage />} />
      <Route path="/organizer/events/create" element={<CreateEventPage />} />
      <Route path="/organizer/events/create-standalone" element={<StandaloneCreateEventPage />} />
      <Route path="/organizer/event/:eventId" element={<EventManagementPage />} />
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
      {/* Settings Routes */}
      <Route path="/organizer/settings" element={<OrganizerSettingsPage />} />
      <Route path="/organizer/settings/profile" element={<OrganizerSettingsPage />} />
      <Route path="/organizer/settings/notifications" element={<OrganizerSettingsPage />} />
      <Route path="/organizer/settings/security" element={<OrganizerSettingsPage />} />
      <Route path="/organizer/settings/appearance" element={<OrganizerSettingsPage />} />
      <Route path="/organizer/verification" element={<VerificationPage />} />
      <Route path="/organizer/kyc" element={<KYCVerificationPage />} />
      <Route path="/organizer/subscription" element={<SubscriptionManagement />} />
      {/* White-Label Routes */}
      <Route path="/organizer/branding" element={<WhiteLabelBranding />} />
      <Route path="/organizer/custom-domains" element={<CustomDomains />} />
      {/* Venue & Seating Routes */}
      <Route path="/organizer/venues" element={<VenueManagement />} />
      {/* Legacy Profile Route - redirects to settings */}
      <Route path="/organizer/profile" element={<OrganizerSettingsPage />} />
      {/* Event Templates and Drafts */}
      <Route path="/organizer/events/templates" element={<EventTemplates />} />
      <Route path="/organizer/events/templates-management" element={<EventTemplatesManagement />} />
      <Route path="/organizer/events/drafts" element={<EventDraftsManagement />} />
      {/* Attendee Management Routes */}
      <Route path="/organizer/attendees/segmentation" element={<AttendeeSegmentation />} />
      <Route path="/organizer/attendees/tags" element={<AttendeeTagsManagement />} />
      <Route path="/organizer/attendees/communication" element={<AttendeeCommunication />} />
      {/* Event Collaboration Routes */}
      <Route path="/organizer/event/:eventId/collaboration" element={<EventCollaboration />} />
      {/* Admin Dashboard Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      {/* Admin Events Routes */}
      <Route path="/admin/events" element={<AdminAllEventsPage />} />
      <Route path="/admin/events/pending" element={<AdminPendingApprovalPage />} />
      <Route path="/admin/events/featured" element={<AdminFeaturedEventsPage />} />
      <Route path="/admin/events/featured/create" element={<CreateFeaturedEventPage />} />
      <Route path="/admin/events/featured/:id/edit" element={<EditFeaturedEventPage />} />
      <Route path="/admin/events/past" element={<AdminPastEventsPage />} />
      <Route path="/admin/events/upcoming" element={<AdminUpcomingEventsPage />} />
      <Route path="/admin/events/declined" element={<AdminDeclinedEventsPage />} />
      <Route path="/admin/events/create" element={<AdminCreateEventPage />} />
      <Route path="/admin/events/:eventId/preview" element={<EventPreviewPage />} />
      <Route path="/admin/events/:eventId" element={<EventDetailsPage />} />
      {/* Admin Users Routes */}
      <Route path="/admin/users" element={<UsersManagementPage />} />
      <Route path="/admin/users/attendees" element={
        <AdminLayout>
          <AttendeesPage />
        </AdminLayout>
      } />
      <Route path="/admin/users/staff" element={<AdminStaffManagementPage />} />
      <Route path="/admin/users/staff/:staffId" element={<StaffDetailsPage />} />
      <Route path="/admin/users/staff/:staffId/edit" element={<StaffEditPage />} />
      <Route path="/admin/users/organizers" element={<OrganizersPage />} />
      <Route path="/admin/users/organizers/create" element={<CreateOrganizerPage />} />
      <Route path="/admin/users/organizers/:organizerId/preview" element={<OrganizerPreviewPage />} />
      <Route path="/admin/users/organizers/:organizerId" element={<OrganizerDetailsPage />} />
      <Route path="/admin/users/organizers/:organizerId/edit" element={<OrganizerEditPage />} />
      <Route path="/admin/users/roles" element={<UserRolesPage />} />
      {/* Admin Staff Performance Routes */}
      <Route path="/admin/staff-performance" element={<StaffPerformanceDashboard />} />
      <Route path="/admin/staff-performance/:staffId" element={<StaffPerformanceDetail />} />
      <Route path="/admin/settings" element={<AdminSettingsPage />} />
      <Route path="/admin/profile" element={<AdminProfilePage />} />
      {/* Admin System Routes */}
      <Route path="/admin/system" element={<SystemHealthPage />} />
      <Route path="/admin/system/health" element={<SystemHealthPage />} />
      <Route path="/admin/system/database" element={<DatabasePage />} />
      <Route path="/admin/system/logs" element={<LogsPage />} />
      <Route path="/admin/system/backups" element={<BackupsPage />} />
      <Route path="/admin/system/maintenance" element={<MaintenancePage />} />
      {/* Admin Moderation Route */}
      <Route path="/admin/moderation" element={<ModerationPage />} />
      {/* Admin Communications Route */}
      <Route path="/admin/communications" element={<AdminCommunicationsPage />} />
      {/* Admin Notification Settings Route */}
      <Route path="/admin/notification-settings" element={<AdminNotificationSettingsPage />} />
      {/* Admin Support Route */}
      <Route path="/admin/support" element={<SupportPage />} />
      {/* Admin Finance Routes */}
      <Route path="/admin/finance" element={<FinanceDashboard />} />
      <Route path="/admin/finance/events" element={<EventFinanceDashboard />} />
      <Route path="/admin/finance/payments" element={<PaymentTransactionsPage />} />
      <Route path="/admin/finance/disbursements" element={<DisbursementsPage />} />
      <Route path="/admin/finance/refunds" element={<RefundsPage />} />
      <Route path="/admin/finance/reconciliation" element={<ReconciliationPage />} />
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
      <Route path="/admin/marketing/promo-codes" element={<PromoCodeManager />} />
      <Route path="/admin/marketing/affiliate" element={<AffiliateProgram />} />
      <Route path="/admin/marketing/partnerships" element={<AdminPartnershipsPage />} />
      {/* Admin Tickets Routes */}
      <Route path="/admin/tickets/advanced" element={<AdminAdvancedTicketTypes />} />
      <Route path="/admin/event/:eventId/tickets/advanced" element={<AdminAdvancedTicketTypes />} />
      <Route path="/admin/tickets/pricing" element={<AdminDynamicPricing />} />
      <Route path="/admin/event/:eventId/tickets/pricing" element={<AdminDynamicPricing />} />
      {/* Admin Analytics Routes */}
      <Route path="/admin/analytics" element={<AdminAnalyticsOverview />} />
      <Route path="/admin/analytics/events" element={<AdminAnalyticsOverview />} />
      <Route path="/admin/analytics/users" element={<AdminAnalyticsOverview />} />
      <Route path="/admin/analytics/revenue" element={<AdminAnalyticsOverview />} />
      <Route path="/admin/analytics/system" element={<AdminAnalyticsOverview />} />
      {/* Admin Financial Management Route */}
      <Route path="/admin/financial" element={<FinancialManagement />} />
      <Route path="/admin/financial/payouts" element={<FinancialManagement />} />
      <Route path="/support" element={<Support />} />
      {/* Auth Routes */}
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SimpleRegistration />} />
      <Route path="/auth/register" element={<SimpleRegistration />} />
      {/* Legacy registration routes - redirect to simple registration */}
      <Route path="/auth/email-entry" element={<SimpleRegistration />} />
      <Route path="/auth/user-type" element={<SimpleRegistration />} />
      <Route path="/auth/register/organizer" element={<SimpleRegistration />} />
      <Route path="/auth/register/attendee" element={<SimpleRegistration />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/magic-link/verify" element={<MagicLinkVerify />} />
      <Route path="/auth/create-account" element={<CreateAccount />} />
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
      </RoleViewWrapper>
      <Toaster />
    </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;

export default App;