import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleViewProvider } from "./contexts/RoleViewContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestRoute } from "./components/GuestRoute";
import { lazy, Suspense } from "react";
import type { ReactNode } from "react";

// Lazy load layout components
const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const UserLayout = lazy(() => import("./layouts/UserLayout"));
const OrganizerLayout = lazy(() => import("./layouts/OrganizerLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
// All routes are now defined in client/src/routes/ and rendered by layouts

// Lazy load onboarding screens
const WelcomeScreen = lazy(() => import("./pages/onboarding/WelcomeScreen"));
const InterestsScreen = lazy(() => import("./pages/onboarding/InterestsScreen"));
const EventTypesScreen = lazy(() => import("./pages/onboarding/EventTypesScreen"));
const NotificationsScreen = lazy(() => import("./pages/onboarding/NotificationsScreen"));
const CompletionScreen = lazy(() => import("./pages/onboarding/CompletionScreen"));

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

// Redirect component for organizer event routes
const OrganizerEventRedirect = () => {
  const { eventId } = useParams<{ eventId: string }>();
  return <Navigate to={`/user/manage-events/${eventId}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RoleViewWrapper>
            <Routes>
              {/* Dashboard Redirect - Unified dashboard for all non-admin users */}
              <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />

              {/* Legacy Organizer Route Redirects */}
              <Route path="/organizer/event/:eventId" element={<OrganizerEventRedirect />} />

              {/* User Routes */}
              <Route path="/user/*" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <UserLayout />
          </Suspense>
        </ProtectedRoute>
      } />
      {/* Organizer Routes */}
      <Route path="/organizer/*" element={
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <OrganizerLayout />
        </Suspense>
      } />
      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <AdminLayout />
        </Suspense>
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
      {/* Public Routes - Catch-all */}
      <Route path="/*" element={
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <PublicLayout />
        </Suspense>
      } />
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
