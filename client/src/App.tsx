import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleViewProvider } from "./contexts/RoleViewContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GuestRoute } from '@/components/auth/GuestRoute';
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";
import type { ComponentType, ReactNode } from "react";

// Wraps lazy() so a stale-chunk 404 after deploy triggers a full reload instead of a blank screen
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise<{ default: T }>(() => {});
    })
  );
}

// Lazy load layout components
const AuthLayout = lazyWithReload(() => import("./layouts/AuthLayout"));
const PublicLayout = lazyWithReload(() => import("./layouts/PublicLayout"));
const UserLayout = lazyWithReload(() => import("./layouts/UserLayout"));
const OrganizerLayout = lazyWithReload(() => import("./layouts/OrganizerLayout"));
const AdminLayout = lazyWithReload(() => import("./layouts/AdminLayout"));
// All routes are now defined in client/src/routes/ and rendered by layouts

const GetStarted = lazyWithReload(() => import("./pages/GetStarted"));
const OrganizerOnboarding = lazyWithReload(() => import("./pages/organizer/OnboardingWizard"));

// Lazy load onboarding screens
const WelcomeScreen = lazyWithReload(() => import("./pages/onboarding/WelcomeScreen"));
const InterestsScreen = lazyWithReload(() => import("./pages/onboarding/InterestsScreen"));
const EventTypesScreen = lazyWithReload(() => import("./pages/onboarding/EventTypesScreen"));
const NotificationsScreen = lazyWithReload(() => import("./pages/onboarding/NotificationsScreen"));
const CompletionScreen = lazyWithReload(() => import("./pages/onboarding/CompletionScreen"));

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
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <RoleViewWrapper>
            <Routes>
              {/* Dashboard Redirect - Unified dashboard for all non-admin users */}
              <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />

              {/* User Routes */}
              <Route path="/user/*" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <UserLayout />
          </Suspense>
        </ProtectedRoute>
      } />
      {/* Organizer Onboarding — standalone (no sidebar) */}
      <Route path="/organizer/onboarding" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <OrganizerOnboarding />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* Organizer Routes */}
      <Route path="/organizer/*" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <OrganizerLayout />
          </Suspense>
        </ProtectedRoute>
      } />
      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <AdminLayout />
          </Suspense>
        </ProtectedRoute>
      } />
      {/* Auth Routes - Guest only (redirects authenticated users to dashboard) */}
      <Route path="/auth/*" element={
        <GuestRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <AuthLayout />
          </Suspense>
        </GuestRoute>
      } />
      {/* Onboarding Routes - Protected */}
      <Route path="/onboarding/welcome" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <WelcomeScreen />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/onboarding/interests" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <InterestsScreen />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/onboarding/event-types" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <EventTypesScreen />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/onboarding/notifications" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <NotificationsScreen />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/onboarding/complete" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <CompletionScreen />
          </Suspense>
        </ProtectedRoute>
      } />
      {/* Get Started — role selection (guest only) */}
      <Route path="/get-started" element={
        <GuestRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <GetStarted />
          </Suspense>
        </GuestRoute>
      } />

      {/* Public Routes - Catch-all */}
      <Route path="/*" element={
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <PublicLayout />
        </Suspense>
      } />
          </Routes>
        </RoleViewWrapper>
        <Toaster />
        <CookieConsentBanner />
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
