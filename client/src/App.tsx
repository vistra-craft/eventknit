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
import { lazy, Suspense } from "react";
import type { ReactNode } from "react";

// Lazy load layout components
const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const UserLayout = lazy(() => import("./layouts/UserLayout"));
const OrganizerLayout = lazy(() => import("./layouts/OrganizerLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
// All routes are now defined in client/src/routes/ and rendered by layouts

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
      {/* Auth Routes */}
      <Route path="/auth/*" element={
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <AuthLayout />
        </Suspense>
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
