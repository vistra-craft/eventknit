import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleViewProvider } from "./contexts/RoleViewContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserRole } from "./types/auth";
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
import FeedbackPage from "./pages/FeedbackPage";
// User Dashboard imports
import UserDashboard from "./pages/user/UserDashboard";
import DashboardMyEvent from "./pages/user/DashboardMyEvent";
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
  StaffManagementPage
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
import AffiliateProgram from "./pages/organizer/AffiliateProgram";
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
import AdminPromoCodeFormPage from "./pages/admin/marketing/AdminPromoCodeFormPage";
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
import PlatformFeedbackPage from "./pages/admin/PlatformFeedbackPage";
// Admin Branding imports
import WhiteLabelManagementPage from "./pages/admin/WhiteLabelManagementPage";
import AdminCustomDomainsPage from "./pages/admin/AdminCustomDomainsPage";
// Admin Finance imports
// TODO: Uncomment when finance components are implemented
// import {
//   FinanceDashboard,
//   EventFinanceDashboard,
//   PaymentTransactionsPage,
//   DisbursementsPage,
//   RefundsPage,
//   ReconciliationPage,
//   ExpensesPage,
//   IncomePage,
//   WagesPage,
//   TransactionsPage,
//   EditTransactionPage,
//   EditExpensePage,
//   EditIncomePage,
//   EditWagePage,
//   IncomeStatementPage
// } from "./pages/admin/finance";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";
// Admin Service Point imports
import ServicePointEvents from "./pages/admin/service-point/ServicePointEvents";
import ServicePointEventDashboard from "./pages/admin/service-point/ServicePointEventDashboard";
import ServicePointScanner from "./pages/admin/service-point/ServicePointScanner";
import ServicePointPrint from "./pages/admin/service-point/ServicePointPrint";
import ServicePointTemplates from "./pages/admin/service-point/ServicePointTemplates";
import ServicePointHistory from "./pages/admin/service-point/ServicePointHistory";
// Auth imports
import SignIn from "./pages/auth/SignIn";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import MagicLinkVerify from "./pages/auth/MagicLinkVerify";
import CreateAccount from "./pages/auth/CreateAccount";
import OrganizerRegistration from "./pages/auth/OrganizerRegistration";
import AttendeeRegistration from "./pages/auth/AttendeeRegistration";

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
  <QueryClientProvider client={queryClient}>
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
      {/* Public Feedback Route - accessed via email link */}
      <Route path="/feedback/:token" element={<FeedbackPage />} />
      {/* User Dashboard Routes - Protected, any authenticated user */}
      <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/user/event/:id" element={<ProtectedRoute><DashboardMyEvent /></ProtectedRoute>} />
      <Route path="/user/tickets/:registrationId" element={<ProtectedRoute><TicketViewPage /></ProtectedRoute>} />
      <Route path="/user/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
      <Route path="/user/notification-preferences" element={<ProtectedRoute><NotificationPreferencesPage /></ProtectedRoute>} />
      <Route path="/exhibitors/:id" element={<ExhibitorDetails />} />
      {/* Organizer Dashboard Routes - Protected, organizer roles only */}
      <Route path="/organizer/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><OrganizerDashboard /></ProtectedRoute>} />
      <Route path="/organizer/onboarding" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER]}><OnboardingWizard /></ProtectedRoute>} />
      <Route path="/organizer/events/upcoming" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><UpcomingEventsPage /></ProtectedRoute>} />
      <Route path="/organizer/events/past" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><PastEventsPage /></ProtectedRoute>} />
      <Route path="/organizer/events/cancelled" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><CancelledEventsPage /></ProtectedRoute>} />
      <Route path="/organizer/events" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><AllEventsPage /></ProtectedRoute>} />
      <Route path="/organizer/events/create" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><CreateEventPage /></ProtectedRoute>} />
      <Route path="/organizer/events/create-standalone" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><StandaloneCreateEventPage /></ProtectedRoute>} />
      <Route path="/organizer/event/:eventId" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><EventManagementPage /></ProtectedRoute>} />
      {/* Analytics Routes */}
      <Route path="/organizer/analytics" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><AnalyticsOverview /></ProtectedRoute>} />
      <Route path="/organizer/analytics/events" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><EventPerformance /></ProtectedRoute>} />
      <Route path="/organizer/analytics/attendees" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><AttendeeInsights /></ProtectedRoute>} />
      <Route path="/organizer/analytics/revenue" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><RevenueReports /></ProtectedRoute>} />
      <Route path="/organizer/analytics/test" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><TestAnalytics /></ProtectedRoute>} />
      {/* Team Routes */}
      <Route path="/organizer/team/staff" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.SUPERADMIN]}><StaffManagementPage /></ProtectedRoute>} />
      {/* <Route path="/organizer/team/roles" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.SUPERADMIN]}><RolesPermissionsPage /></ProtectedRoute>} /> */}
      {/* <Route path="/organizer/team/calendar" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><TeamCalendarPage /></ProtectedRoute>} /> */}
      {/* Settings Routes */}
      <Route path="/organizer/settings" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><OrganizerSettingsPage /></ProtectedRoute>} />
      <Route path="/organizer/settings/profile" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><OrganizerSettingsPage /></ProtectedRoute>} />
      <Route path="/organizer/settings/notifications" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><OrganizerSettingsPage /></ProtectedRoute>} />
      <Route path="/organizer/settings/security" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><OrganizerSettingsPage /></ProtectedRoute>} />
      <Route path="/organizer/settings/appearance" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><OrganizerSettingsPage /></ProtectedRoute>} />
      <Route path="/organizer/verification" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.SUPERADMIN]}><VerificationPage /></ProtectedRoute>} />
      <Route path="/organizer/kyc" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.SUPERADMIN]}><KYCVerificationPage /></ProtectedRoute>} />
      <Route path="/organizer/subscription" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.SUPERADMIN]}><SubscriptionManagement /></ProtectedRoute>} />
      {/* Venue & Seating Routes */}
      <Route path="/organizer/venues" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><VenueManagement /></ProtectedRoute>} />
      {/* Legacy Profile Route - redirects to settings */}
      <Route path="/organizer/profile" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.ORGANIZER_TELLER, UserRole.SUPERADMIN]}><OrganizerSettingsPage /></ProtectedRoute>} />
      {/* Event Templates and Drafts */}
      <Route path="/organizer/events/templates" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><EventTemplates /></ProtectedRoute>} />
      <Route path="/organizer/events/templates-management" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><EventTemplatesManagement /></ProtectedRoute>} />
      <Route path="/organizer/events/drafts" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><EventDraftsManagement /></ProtectedRoute>} />
      {/* Attendee Management Routes */}
      <Route path="/organizer/attendees/segmentation" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><AttendeeSegmentation /></ProtectedRoute>} />
      <Route path="/organizer/attendees/tags" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><AttendeeTagsManagement /></ProtectedRoute>} />
      <Route path="/organizer/attendees/communication" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><AttendeeCommunication /></ProtectedRoute>} />
      {/* Event Collaboration Routes */}
      <Route path="/organizer/event/:eventId/collaboration" element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ORGANIZER_STAFF, UserRole.SUPERADMIN]}><EventCollaboration /></ProtectedRoute>} />
      {/* Admin Dashboard Routes - Protected, admin roles only */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER, UserRole.SUPPORT, UserRole.TELLER]}><AdminDashboard /></ProtectedRoute>} />
      {/* Admin Events Routes */}
      <Route path="/admin/events" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminAllEventsPage /></ProtectedRoute>} />
      <Route path="/admin/events/pending" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminPendingApprovalPage /></ProtectedRoute>} />
      <Route path="/admin/events/featured" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminFeaturedEventsPage /></ProtectedRoute>} />
      <Route path="/admin/events/featured/create" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><CreateFeaturedEventPage /></ProtectedRoute>} />
      <Route path="/admin/events/featured/:id/edit" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><EditFeaturedEventPage /></ProtectedRoute>} />
      <Route path="/admin/events/past" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminPastEventsPage /></ProtectedRoute>} />
      <Route path="/admin/events/upcoming" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminUpcomingEventsPage /></ProtectedRoute>} />
      <Route path="/admin/events/declined" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminDeclinedEventsPage /></ProtectedRoute>} />
      <Route path="/admin/events/create" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminCreateEventPage /></ProtectedRoute>} />
      <Route path="/admin/events/:eventId/preview" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><EventPreviewPage /></ProtectedRoute>} />
      <Route path="/admin/events/:eventId" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><EventDetailsPage /></ProtectedRoute>} />
      {/* Admin Users Routes */}
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><UsersManagementPage /></ProtectedRoute>} />
      <Route path="/admin/users/attendees" element={
        <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.SUPPORT]}>
          <AdminLayout>
            <AttendeesPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users/staff" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><AdminStaffManagementPage /></ProtectedRoute>} />
      <Route path="/admin/users/staff/:staffId" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><StaffDetailsPage /></ProtectedRoute>} />
      <Route path="/admin/users/staff/:staffId/edit" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><StaffEditPage /></ProtectedRoute>} />
      <Route path="/admin/users/organizers" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><OrganizersPage /></ProtectedRoute>} />
      <Route path="/admin/users/organizers/create" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><CreateOrganizerPage /></ProtectedRoute>} />
      <Route path="/admin/users/organizers/:organizerId/preview" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><OrganizerPreviewPage /></ProtectedRoute>} />
      <Route path="/admin/users/organizers/:organizerId" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><OrganizerDetailsPage /></ProtectedRoute>} />
      <Route path="/admin/users/organizers/:organizerId/edit" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><OrganizerEditPage /></ProtectedRoute>} />
      <Route path="/admin/users/roles" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><UserRolesPage /></ProtectedRoute>} />
      {/* Admin Staff Performance Routes */}
      <Route path="/admin/staff-performance" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><StaffPerformanceDashboard /></ProtectedRoute>} />
      <Route path="/admin/staff-performance/:staffId" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><StaffPerformanceDetail /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><AdminSettingsPage /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER, UserRole.SUPPORT, UserRole.TELLER]}><AdminProfilePage /></ProtectedRoute>} />
      {/* Admin System Routes */}
      <Route path="/admin/system" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><SystemHealthPage /></ProtectedRoute>} />
      <Route path="/admin/system/health" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><SystemHealthPage /></ProtectedRoute>} />
      <Route path="/admin/system/database" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><DatabasePage /></ProtectedRoute>} />
      <Route path="/admin/system/logs" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><LogsPage /></ProtectedRoute>} />
      <Route path="/admin/system/backups" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><BackupsPage /></ProtectedRoute>} />
      <Route path="/admin/system/maintenance" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><MaintenancePage /></ProtectedRoute>} />
      {/* Admin Moderation Route */}
      <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><ModerationPage /></ProtectedRoute>} />
      {/* Admin Communications Route */}
      <Route path="/admin/communications" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminCommunicationsPage /></ProtectedRoute>} />
      {/* Admin Notification Settings Route */}
      <Route path="/admin/notification-settings" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><AdminNotificationSettingsPage /></ProtectedRoute>} />
      {/* Admin Support Routes */}
      <Route path="/admin/support" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.SUPPORT]}><SupportPage /></ProtectedRoute>} />
      <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><PlatformFeedbackPage /></ProtectedRoute>} />
      {/* Admin Branding Routes */}
      <Route path="/admin/white-label" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><WhiteLabelManagementPage /></ProtectedRoute>} />
      <Route path="/admin/custom-domains" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminCustomDomainsPage /></ProtectedRoute>} />
      {/* Admin Finance Routes - TODO: Uncomment when finance components are implemented */}
      {/* <Route path="/admin/finance" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><FinanceDashboard /></ProtectedRoute>} />
      <Route path="/admin/finance/events" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><EventFinanceDashboard /></ProtectedRoute>} />
      <Route path="/admin/finance/payments" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><PaymentTransactionsPage /></ProtectedRoute>} />
      <Route path="/admin/finance/disbursements" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><DisbursementsPage /></ProtectedRoute>} />
      <Route path="/admin/finance/refunds" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><RefundsPage /></ProtectedRoute>} />
      <Route path="/admin/finance/reconciliation" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><ReconciliationPage /></ProtectedRoute>} />
      <Route path="/admin/finance/expenses" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><ExpensesPage /></ProtectedRoute>} />
      <Route path="/admin/finance/income" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><IncomePage /></ProtectedRoute>} />
      <Route path="/admin/finance/wages" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><WagesPage /></ProtectedRoute>} />
      <Route path="/admin/finance/transactions" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><TransactionsPage /></ProtectedRoute>} />
      <Route path="/admin/finance/income-statement" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><IncomeStatementPage /></ProtectedRoute>} /> */}
      {/* Admin Finance Edit Routes */}
      {/* <Route path="/admin/finance/transactions/edit/:id" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><EditTransactionPage /></ProtectedRoute>} />
      <Route path="/admin/finance/expenses/edit/:id" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><EditExpensePage /></ProtectedRoute>} />
      <Route path="/admin/finance/income/edit/:id" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><EditIncomePage /></ProtectedRoute>} />
      <Route path="/admin/finance/wages/edit/:id" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><EditWagePage /></ProtectedRoute>} /> */}
      {/* Admin Marketing Routes */}
      <Route path="/admin/marketing" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminMarketingPage /></ProtectedRoute>} />
      <Route path="/admin/marketing/campaigns" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminCampaignsPage /></ProtectedRoute>} />
      <Route path="/admin/marketing/social" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminSocialMediaPage /></ProtectedRoute>} />
      <Route path="/admin/marketing/email" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminEmailMarketingPage /></ProtectedRoute>} />
      <Route path="/admin/marketing/promotions" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminPromotionsPage /></ProtectedRoute>} />
      <Route path="/admin/marketing/promo-codes" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminPromotionsPage /></ProtectedRoute>} />
      <Route path="/admin/marketing/promo-codes/create" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminPromoCodeFormPage /></ProtectedRoute>} />
      <Route path="/admin/marketing/promo-codes/:id/edit" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminPromoCodeFormPage /></ProtectedRoute>} />
      <Route path="/admin/marketing/affiliate" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AffiliateProgram /></ProtectedRoute>} />
      <Route path="/admin/marketing/partnerships" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.MARKETER]}><AdminPartnershipsPage /></ProtectedRoute>} />
      {/* Admin Tickets Routes */}
      <Route path="/admin/tickets/advanced" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminAdvancedTicketTypes /></ProtectedRoute>} />
      <Route path="/admin/event/:eventId/tickets/advanced" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminAdvancedTicketTypes /></ProtectedRoute>} />
      <Route path="/admin/tickets/pricing" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminDynamicPricing /></ProtectedRoute>} />
      <Route path="/admin/event/:eventId/tickets/pricing" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminDynamicPricing /></ProtectedRoute>} />
      {/* Admin Analytics Routes */}
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminAnalyticsOverview /></ProtectedRoute>} />
      <Route path="/admin/analytics/events" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminAnalyticsOverview /></ProtectedRoute>} />
      <Route path="/admin/analytics/users" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminAnalyticsOverview /></ProtectedRoute>} />
      <Route path="/admin/analytics/revenue" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><AdminAnalyticsOverview /></ProtectedRoute>} />
      <Route path="/admin/analytics/system" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}><AdminAnalyticsOverview /></ProtectedRoute>} />
      {/* Admin Financial Management Route */}
      <Route path="/admin/financial" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><FinancialManagement /></ProtectedRoute>} />
      <Route path="/admin/financial/payouts" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><FinancialManagement /></ProtectedRoute>} />
      <Route path="/support" element={<Support />} />
      {/* Auth Routes */}
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<AttendeeRegistration />} />
      <Route path="/auth/register" element={<AttendeeRegistration />} />
      {/* Role-specific registration routes */}
      <Route path="/auth/register/organizer" element={<OrganizerRegistration />} />
      <Route path="/auth/register/attendee" element={<AttendeeRegistration />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/magic-link/verify" element={<MagicLinkVerify />} />
      <Route path="/auth/create-account" element={<CreateAccount />} />
      <Route path="*" element={<NotFound />} />
      {/* Admin Service Point Routes */}
      <Route path="/admin/service-point" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><ServicePointEvents /></ProtectedRoute>} />
      <Route path="/admin/service-point/event/:eventId" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><ServicePointEventDashboard /></ProtectedRoute>} />
      <Route path="/admin/service-point/scanner" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><ServicePointScanner /></ProtectedRoute>} />
      <Route path="/admin/service-point/print" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><ServicePointPrint /></ProtectedRoute>} />
      <Route path="/admin/service-point/templates" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF]}><ServicePointTemplates /></ProtectedRoute>} />
      <Route path="/admin/service-point/history" element={<ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN_STAFF, UserRole.TELLER]}><ServicePointHistory /></ProtectedRoute>} />
          </Routes>
        </RoleViewWrapper>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;
