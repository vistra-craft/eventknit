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
import { lazy, Suspense } from "react";

// Lazy load layout components
const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const UserLayout = lazy(() => import("./layouts/UserLayout"));
const OrganizerLayout = lazy(() => import("./layouts/OrganizerLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
// Public page imports - REMOVED: Now using PublicLayout with lazy-loaded routes
// Public pages are now defined in client/src/routes/publicRoutes.tsx
// User Dashboard imports - REMOVED: Now using UserLayout with lazy-loaded routes
// User pages are now defined in client/src/routes/userRoutes.tsx
// Organizer Dashboard imports - REMOVED: Now using OrganizerLayout with lazy-loaded routes
// Organizer pages are now defined in client/src/routes/organizerRoutes.tsx
// Admin Dashboard imports - REMOVED: Now using AdminLayout with lazy-loaded routes
// Admin pages are now defined in client/src/routes/adminRoutes.tsx

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
      {/* Public Routes - Migrated to PublicLayout (Phase 3) */}
      {/* Homepage, events, info pages, support - see client/src/routes/publicRoutes.tsx */}
      {/* User Routes - Migrated to UserLayout (Phase 4) */}
      <Route path="/user/*" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <UserLayout />
          </Suspense>
        </ProtectedRoute>
      } />
      {/* Organizer Routes - Migrated to OrganizerLayout (Phase 5) */}
      <Route path="/organizer/*" element={
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <OrganizerLayout />
        </Suspense>
      } />
      {/* Admin Routes - Migrated to AdminLayout (Phase 6) */}
      <Route path="/admin/*" element={
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <AdminLayout />
        </Suspense>
      } />
      {/* Auth Routes - Migrated to AuthLayout (Phase 2) */}
      <Route path="/auth/*" element={
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <AuthLayout />
        </Suspense>
      } />
      {/* Public Routes - Catch-all for homepage, events, info pages, support, 404 (Phase 3) */}
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
